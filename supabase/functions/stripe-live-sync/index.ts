// Stripe ↔ DB Live-Sync (Customer-getrieben)
// Strategie: Für jeden Onboarding mit pending/failed Bestellungen pullen wir
// die Subscriptions + PaymentIntents dieses Stripe-Customers und gleichen ab.
// Findet auch Subscriptions, die NACH dem ursprünglichen Fehlversuch erstellt wurden.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const VERSION = "live-sync-v2-customer-driven";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function stripeGet(stripeKey: string, path: string): Promise<any> {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`stripe ${path} → ${r.status} ${text}`);
  return JSON.parse(text);
}

type Unmatched = {
  kind: string;
  stripe_id: string;
  customer_id: string | null;
  onboarding_id: string | null;
  amount: number | null;
  reason: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // hours: optionales Zeitfenster für die DB-Vorauswahl. 0 = "alle in_progress Onboardings".
    let hours = 48;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        const h = Number(body?.hours);
        if (Number.isFinite(h) && h >= 0 && h <= 720) hours = Math.round(h);
      } catch (_) { /* default */ }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Produkt-Mapping ---
    const { data: produkte, error: prodErr } = await supabase
      .schema("thermocheck")
      .from("contractor_produkte")
      .select("produkt_key, stripe_price_id, preis_brutto");
    if (prodErr) throw new Error(`load contractor_produkte: ${prodErr.message}`);
    const priceToKey = new Map<string, string>();
    const amountToKey = new Map<number, string>();
    for (const p of produkte ?? []) {
      if (p.stripe_price_id) priceToKey.set(p.stripe_price_id, p.produkt_key);
      if (p.preis_brutto != null) {
        const cents = Math.round(Number(p.preis_brutto) * 100);
        if (!amountToKey.has(cents)) amountToKey.set(cents, p.produkt_key);
      }
    }

    // --- DB: alle pending/failed Bestellungen aus in_progress Onboardings ---
    // hours=0 → keine Zeitschranke; sonst nur Bestellungen jünger als <hours>h.
    let q = supabase
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .select("id, onboarding_id, produkt_key, stripe_customer_id, stripe_subscription_id, stripe_payment_intent_id, stripe_payment_status, created_at, contractor_onboarding!inner(id, onboarding_status, profile_id)")
      .in("stripe_payment_status", ["pending", "failed"])
      .eq("contractor_onboarding.onboarding_status", "in_progress")
      .not("stripe_customer_id", "is", null);

    if (hours > 0) {
      const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      q = q.gte("created_at", cutoff);
    }

    const { data: candidates, error: candErr } = await q;
    if (candErr) throw new Error(`load candidates: ${candErr.message}`);

    // Gruppieren per stripe_customer_id
    const byCustomer = new Map<string, Array<typeof candidates[number]>>();
    for (const c of candidates ?? []) {
      const cid = c.stripe_customer_id!;
      if (!byCustomer.has(cid)) byCustomer.set(cid, []);
      byCustomer.get(cid)!.push(c);
    }

    console.log(`[${VERSION}] hours=${hours} candidates=${candidates?.length ?? 0} customers=${byCustomer.size}`);

    let updated = 0, inserted = 0, skipped = 0;
    const unmatched: Unmatched[] = [];
    const errors: Array<{ stripe_id: string; error: string }> = [];
    const matched_details: Array<{ customer_id: string; produkt_key: string; action: string; onboarding_id: string }> = [];

    for (const [customerId, orders] of byCustomer.entries()) {
      const onboardingId = orders[0].onboarding_id;
      const failedKeys = new Set(orders.map((o) => o.produkt_key));

      try {
        // 1) Subscriptions des Customers (alle Stati, expand latest_invoice)
        const subsResp = await stripeGet(
          stripeKey,
          `subscriptions?customer=${customerId}&status=all&limit=100&expand[]=data.latest_invoice`,
        );
        const subs: any[] = Array.isArray(subsResp.data) ? subsResp.data : [];

        for (const sub of subs) {
          const inv = sub.latest_invoice;
          const isPaid = inv && typeof inv === "object" && (inv.status === "paid" || Number(inv.amount_paid ?? 0) > 0);
          if (!isPaid) continue;

          const priceId: string | null = sub.items?.data?.[0]?.price?.id ?? null;
          const produktKey = priceId ? priceToKey.get(priceId) ?? null : null;
          if (!produktKey) {
            unmatched.push({
              kind: "subscription", stripe_id: sub.id, customer_id: customerId,
              onboarding_id: onboardingId, amount: Number(inv.amount_paid ?? 0) / 100,
              reason: `unknown price_id ${priceId}`,
            });
            continue;
          }
          // Nur abgleichen wenn dieses Produkt für den Customer offen ist
          if (!failedKeys.has(produktKey)) continue;

          const piId: string | null = typeof inv.payment_intent === "string"
            ? inv.payment_intent
            : (inv.payment_intent?.id ?? null);
          const amount = Number(inv.amount_paid ?? 0) / 100;
          const paidAt = inv.status_transitions?.paid_at
            ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
            : new Date().toISOString();

          const { data: rpcResult, error: rpcErr } = await supabase
            .schema("thermocheck")
            .rpc("sync_stripe_payment_from_live", {
              p_onboarding_id: onboardingId,
              p_produkt_key: produktKey,
              p_stripe_customer_id: customerId,
              p_stripe_subscription_id: sub.id,
              p_stripe_payment_intent_id: piId,
              p_betrag_brutto: amount,
              p_paid_at: paidAt,
            });
          if (rpcErr) { errors.push({ stripe_id: sub.id, error: rpcErr.message }); continue; }
          const action = (rpcResult as any)?.action;
          if (action === "inserted") inserted++;
          else if (action === "updated") updated++;
          else skipped++;
          matched_details.push({ customer_id: customerId, produkt_key: produktKey, action, onboarding_id: onboardingId });
          console.log(`[${VERSION}] cust ${customerId} sub ${sub.id} → ${action} (${produktKey})`);
        }

        // 2) PaymentIntents des Customers (succeeded, ohne invoice = Einmal-Käufe)
        const pisResp = await stripeGet(
          stripeKey,
          `payment_intents?customer=${customerId}&limit=50`,
        );
        const pis: any[] = Array.isArray(pisResp.data) ? pisResp.data : [];

        for (const pi of pis) {
          if (pi.status !== "succeeded") continue;
          if (pi.invoice) continue; // gehört zu Subscription
          const amountCents = Number(pi.amount_received ?? pi.amount ?? 0);
          if (amountCents <= 0) continue;

          let produktKey: string | null = pi.metadata?.produkt_key ?? null;
          if (!produktKey) produktKey = amountToKey.get(amountCents) ?? null;
          if (!produktKey) {
            unmatched.push({
              kind: "payment_intent", stripe_id: pi.id, customer_id: customerId,
              onboarding_id: onboardingId, amount: amountCents / 100,
              reason: "unknown product (no metadata + no amount match)",
            });
            continue;
          }
          if (!failedKeys.has(produktKey)) continue;

          const paidAt = pi.created ? new Date(pi.created * 1000).toISOString() : new Date().toISOString();

          const { data: rpcResult, error: rpcErr } = await supabase
            .schema("thermocheck")
            .rpc("sync_stripe_payment_from_live", {
              p_onboarding_id: onboardingId,
              p_produkt_key: produktKey,
              p_stripe_customer_id: customerId,
              p_stripe_subscription_id: null,
              p_stripe_payment_intent_id: pi.id,
              p_betrag_brutto: amountCents / 100,
              p_paid_at: paidAt,
            });
          if (rpcErr) { errors.push({ stripe_id: pi.id, error: rpcErr.message }); continue; }
          const action = (rpcResult as any)?.action;
          if (action === "inserted") inserted++;
          else if (action === "updated") updated++;
          else skipped++;
          matched_details.push({ customer_id: customerId, produkt_key: produktKey, action, onboarding_id: onboardingId });
          console.log(`[${VERSION}] cust ${customerId} pi ${pi.id} → ${action} (${produktKey})`);
        }
      } catch (e) {
        errors.push({ stripe_id: customerId, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({
      version: VERSION, hours,
      customers_checked: byCustomer.size,
      candidates_in_db: candidates?.length ?? 0,
      updated, inserted, skipped,
      matched_details, unmatched, errors,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error(`[${VERSION}] fatal:`, err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
