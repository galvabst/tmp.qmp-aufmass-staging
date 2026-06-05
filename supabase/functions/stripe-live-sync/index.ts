// Stripe → DB Live-Sync (Fallback für ausgefallene Webhooks)
// Pullt Subscriptions + PaymentIntents der letzten N Stunden aus Stripe
// und ordnet sie über stripe_customer_id / email passenden Onboardings zu.
// Schreibt via SECURITY DEFINER RPC `thermocheck.sync_stripe_payment_from_live`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const VERSION = "live-sync-v1";

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

async function stripeList(stripeKey: string, basePath: string, maxPages = 5): Promise<any[]> {
  const out: any[] = [];
  let starting_after: string | null = null;
  for (let i = 0; i < maxPages; i++) {
    const sep = basePath.includes("?") ? "&" : "?";
    const url = `${basePath}${sep}limit=100${starting_after ? `&starting_after=${starting_after}` : ""}`;
    const page = await stripeGet(stripeKey, url);
    const data: any[] = Array.isArray(page.data) ? page.data : [];
    out.push(...data);
    if (!page.has_more || data.length === 0) break;
    starting_after = data[data.length - 1].id;
  }
  return out;
}

type Unmatched = {
  kind: "subscription" | "payment_intent";
  stripe_id: string;
  customer_id: string | null;
  customer_email: string | null;
  amount: number | null;
  reason: string;
  produkt_key: string | null;
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

    let hours = 24;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        const h = Number(body?.hours);
        if (Number.isFinite(h) && h > 0 && h <= 168) hours = Math.round(h);
      } catch (_) { /* default */ }
    }

    const cutoff = Math.floor(Date.now() / 1000) - hours * 3600;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Produkt-Mapping aus DB (Stripe Price-ID → produkt_key) ---
    const { data: produkte, error: prodErr } = await supabase
      .schema("thermocheck")
      .from("contractor_produkte")
      .select("produkt_key, stripe_price_id, preis_brutto");
    if (prodErr) throw new Error(`load contractor_produkte: ${prodErr.message}`);
    const priceToKey = new Map<string, string>();
    const amountToKey = new Map<number, string>(); // cents brutto → key (Fallback)
    for (const p of produkte ?? []) {
      if (p.stripe_price_id) priceToKey.set(p.stripe_price_id, p.produkt_key);
      if (p.preis_brutto != null) {
        const cents = Math.round(Number(p.preis_brutto) * 100);
        if (!amountToKey.has(cents)) amountToKey.set(cents, p.produkt_key);
      }
    }

    // --- Stripe pull ---
    const subs = await stripeList(stripeKey, `subscriptions?created[gte]=${cutoff}&expand[]=data.latest_invoice`);
    const pis = await stripeList(stripeKey, `payment_intents?created[gte]=${cutoff}`);

    console.log(`[${VERSION}] hours=${hours} cutoff=${cutoff} subs=${subs.length} pis=${pis.length}`);

    let updated = 0, inserted = 0, skipped = 0;
    const unmatched: Unmatched[] = [];
    const errors: Array<{ stripe_id: string; error: string }> = [];

    // Helper: customer → onboarding_id
    async function findOnboarding(customerId: string | null, email: string | null): Promise<string | null> {
      if (customerId) {
        const { data } = await supabase
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("onboarding_id, created_at")
          .eq("stripe_customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (data && data[0]?.onboarding_id) return data[0].onboarding_id;
      }
      if (email) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .limit(1);
        const profileId = prof?.[0]?.id;
        if (profileId) {
          const { data: ob } = await supabase
            .schema("thermocheck")
            .from("contractor_onboarding")
            .select("id, erstellt_am")
            .eq("profile_id", profileId)
            .order("erstellt_am", { ascending: false })
            .limit(1);
          if (ob && ob[0]?.id) return ob[0].id;
        }
      }
      return null;
    }

    async function fetchCustomerEmail(customerId: string | null): Promise<string | null> {
      if (!customerId) return null;
      try {
        const cust = await stripeGet(stripeKey, `customers/${customerId}`);
        return typeof cust.email === "string" ? cust.email : null;
      } catch {
        return null;
      }
    }

    // ---- Subscriptions ----
    for (const sub of subs) {
      const subId = sub.id as string;
      try {
        const inv = sub.latest_invoice;
        const isPaid = inv && typeof inv === "object" && (inv.status === "paid" || inv.amount_paid > 0);
        if (!isPaid) { skipped++; continue; }

        const customerId: string | null = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
        const priceId: string | null = sub.items?.data?.[0]?.price?.id ?? null;
        const produktKey = priceId ? priceToKey.get(priceId) ?? null : null;
        const piId: string | null = typeof inv.payment_intent === "string" ? inv.payment_intent : (inv.payment_intent?.id ?? null);
        const amountCents: number = Number(inv.amount_paid ?? 0);
        const betragBrutto = amountCents > 0 ? amountCents / 100 : null;
        const paidAt = inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString();

        const email = await fetchCustomerEmail(customerId);
        const onboardingId = await findOnboarding(customerId, email);

        if (!onboardingId) {
          unmatched.push({
            kind: "subscription", stripe_id: subId, customer_id: customerId, customer_email: email,
            amount: betragBrutto, reason: "no matching onboarding", produkt_key: produktKey,
          });
          continue;
        }
        if (!produktKey) {
          unmatched.push({
            kind: "subscription", stripe_id: subId, customer_id: customerId, customer_email: email,
            amount: betragBrutto, reason: `unknown price_id ${priceId}`, produkt_key: null,
          });
          continue;
        }

        const { data: rpcResult, error: rpcErr } = await supabase
          .schema("thermocheck")
          .rpc("sync_stripe_payment_from_live", {
            p_onboarding_id: onboardingId,
            p_produkt_key: produktKey,
            p_stripe_customer_id: customerId,
            p_stripe_subscription_id: subId,
            p_stripe_payment_intent_id: piId,
            p_betrag_brutto: betragBrutto,
            p_paid_at: paidAt,
          });
        if (rpcErr) { errors.push({ stripe_id: subId, error: rpcErr.message }); continue; }
        const action = (rpcResult as any)?.action;
        if (action === "inserted") inserted++;
        else if (action === "updated") updated++;
        else skipped++;
        console.log(`[${VERSION}] sub ${subId} → ${action} (${produktKey}, onb ${onboardingId})`);
      } catch (e) {
        errors.push({ stripe_id: subId, error: e instanceof Error ? e.message : String(e) });
      }
    }

    // ---- Einmal-PaymentIntents ----
    // Skip PIs die zu einer der oben verarbeiteten Subscription-Invoices gehören.
    const subInvoicePis = new Set<string>();
    for (const sub of subs) {
      const inv = sub.latest_invoice;
      const piId = inv && typeof inv === "object" && typeof inv.payment_intent === "string" ? inv.payment_intent : null;
      if (piId) subInvoicePis.add(piId);
    }

    for (const pi of pis) {
      const piId = pi.id as string;
      try {
        if (pi.status !== "succeeded") { skipped++; continue; }
        if (subInvoicePis.has(piId)) { skipped++; continue; }
        if (pi.invoice) { skipped++; continue; } // gehört zu Subscription, separat behandelt

        const customerId: string | null = typeof pi.customer === "string" ? pi.customer : null;
        const amountCents: number = Number(pi.amount_received ?? pi.amount ?? 0);
        const betragBrutto = amountCents > 0 ? amountCents / 100 : null;
        const paidAt = pi.created ? new Date(pi.created * 1000).toISOString() : new Date().toISOString();

        // Produkt-Key: zuerst aus metadata, sonst über Betrag
        let produktKey: string | null = pi.metadata?.produkt_key ?? null;
        if (!produktKey && amountCents > 0) produktKey = amountToKey.get(amountCents) ?? null;

        const email = await fetchCustomerEmail(customerId);
        const onboardingId = await findOnboarding(customerId, email);

        if (!onboardingId) {
          unmatched.push({
            kind: "payment_intent", stripe_id: piId, customer_id: customerId, customer_email: email,
            amount: betragBrutto, reason: "no matching onboarding", produkt_key: produktKey,
          });
          continue;
        }
        if (!produktKey) {
          unmatched.push({
            kind: "payment_intent", stripe_id: piId, customer_id: customerId, customer_email: email,
            amount: betragBrutto, reason: "unknown product (no metadata + no amount match)", produkt_key: null,
          });
          continue;
        }

        const { data: rpcResult, error: rpcErr } = await supabase
          .schema("thermocheck")
          .rpc("sync_stripe_payment_from_live", {
            p_onboarding_id: onboardingId,
            p_produkt_key: produktKey,
            p_stripe_customer_id: customerId,
            p_stripe_subscription_id: null,
            p_stripe_payment_intent_id: piId,
            p_betrag_brutto: betragBrutto,
            p_paid_at: paidAt,
          });
        if (rpcErr) { errors.push({ stripe_id: piId, error: rpcErr.message }); continue; }
        const action = (rpcResult as any)?.action;
        if (action === "inserted") inserted++;
        else if (action === "updated") updated++;
        else skipped++;
        console.log(`[${VERSION}] pi ${piId} → ${action} (${produktKey}, onb ${onboardingId})`);
      } catch (e) {
        errors.push({ stripe_id: piId, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({
      version: VERSION, hours,
      checked_subscriptions: subs.length,
      checked_payment_intents: pis.length,
      updated, inserted, skipped,
      unmatched, errors,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error(`[${VERSION}] fatal:`, err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
