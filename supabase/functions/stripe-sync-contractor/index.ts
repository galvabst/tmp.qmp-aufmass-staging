// Live-Sync eines einzelnen Technikers gegen Stripe.
// Zieht alle Customer-Records (per gespeicherter ID + E-Mail-Search),
// alle Subscriptions (status=all) und die letzten Invoices pro Sub.
// Upsert in contractor_subscriptions + contractor_bestellungen.
//
// Innendienst-only via JWT/Claims-Check.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const VERSION = "2026-06-04-v2-price-lookup";

// In-memory price→produkt_key map, loaded lazily once per request
let PRICE_TO_KEY: Map<string, string> | null = null;

async function loadPriceToKeyMap(supabase: any): Promise<Map<string, string>> {
  if (PRICE_TO_KEY) return PRICE_TO_KEY;
  const map = new Map<string, string>();
  const { data, error } = await supabase
    .schema("thermocheck")
    .from("contractor_produkte")
    .select("produkt_key, stripe_price_id, stripe_test_price_id");
  if (error) {
    console.warn("[stripe-sync] price map load failed:", error.message);
    return map;
  }
  for (const row of data ?? []) {
    if (row.stripe_price_id) map.set(row.stripe_price_id, row.produkt_key);
    if (row.stripe_test_price_id) map.set(row.stripe_test_price_id, row.produkt_key);
  }
  PRICE_TO_KEY = map;
  return map;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function stripeGet(stripeKey: string, path: string): Promise<any> {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`stripe ${path} → ${r.status} ${text}`);
  return JSON.parse(text);
}

interface SyncSummary {
  onboarding_id: string;
  customer_ids: string[];
  customer_ids_via_email: string[];
  subscriptions_found: number;
  subscriptions_upserted: number;
  subscriptions_new: number;
  invoices_upserted: number;
  invoices_new: number;
  warnings: string[];
}

async function syncOneContractor(
  supabase: any,
  stripeKey: string,
  onboarding_id: string,
): Promise<SyncSummary> {
  const summary: SyncSummary = {
    onboarding_id,
    customer_ids: [],
    customer_ids_via_email: [],
    subscriptions_found: 0,
    subscriptions_upserted: 0,
    subscriptions_new: 0,
    invoices_upserted: 0,
    invoices_new: 0,
    warnings: [],
  };

  // 1) Onboarding + Profil-Mail laden
  const { data: onb, error: onbErr } = await supabase
    .schema("thermocheck")
    .from("contractor_onboarding")
    .select("id, profile_id, stripe_customer_ids, ag_domain_email")
    .eq("id", onboarding_id)
    .maybeSingle();
  if (onbErr || !onb) throw new Error(`onboarding not found: ${onbErr?.message ?? "missing"}`);

  const emails = new Set<string>();
  if (onb.ag_domain_email) emails.add(String(onb.ag_domain_email).toLowerCase());

  if (onb.profile_id) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", onb.profile_id)
      .maybeSingle();
    if (prof?.email) emails.add(String(prof.email).toLowerCase());
  }

  // 2) Bekannte Customer-IDs aus DB sammeln
  const knownCustomers = new Set<string>(onb.stripe_customer_ids ?? []);

  const { data: subRows } = await supabase
    .schema("thermocheck")
    .from("contractor_subscriptions")
    .select("stripe_customer_id")
    .eq("onboarding_id", onboarding_id)
    .not("stripe_customer_id", "is", null);
  for (const r of subRows ?? []) if (r.stripe_customer_id) knownCustomers.add(r.stripe_customer_id);

  const { data: bestRows } = await supabase
    .schema("thermocheck")
    .from("contractor_bestellungen")
    .select("stripe_customer_id")
    .eq("onboarding_id", onboarding_id)
    .not("stripe_customer_id", "is", null);
  for (const r of bestRows ?? []) if (r.stripe_customer_id) knownCustomers.add(r.stripe_customer_id);

  // 3) E-Mail-Search → zusätzliche Customer
  for (const email of emails) {
    try {
      const q = encodeURIComponent(`email:"${email}"`);
      const res = await stripeGet(stripeKey, `customers/search?query=${q}&limit=20`);
      for (const c of res.data ?? []) {
        // Cross-mapping-Schutz: wenn metadata.onboarding_id existiert, muss sie matchen
        const metaOnb = c.metadata?.onboarding_id;
        if (metaOnb && metaOnb !== onboarding_id) {
          summary.warnings.push(`customer ${c.id} mapped to other onboarding_id (${metaOnb}) – skipped`);
          continue;
        }
        if (!knownCustomers.has(c.id)) {
          knownCustomers.add(c.id);
          summary.customer_ids_via_email.push(c.id);
        }
      }
    } catch (e) {
      summary.warnings.push(`email-search "${email}" failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  summary.customer_ids = Array.from(knownCustomers);

  // 4) stripe_customer_ids auf Onboarding pinnen
  if (summary.customer_ids.length > 0) {
    await supabase
      .schema("thermocheck")
      .from("contractor_onboarding")
      .update({ stripe_customer_ids: summary.customer_ids })
      .eq("id", onboarding_id);
  }

  // 5) Pro Customer alle Subs ziehen
  for (const customerId of summary.customer_ids) {
    let starting_after: string | null = null;
    do {
      const path = `subscriptions?customer=${customerId}&status=all&limit=100&expand[]=data.latest_invoice` +
        (starting_after ? `&starting_after=${starting_after}` : "");
      let page: any;
      try {
        page = await stripeGet(stripeKey, path);
      } catch (e) {
        summary.warnings.push(`subscriptions list for ${customerId} failed: ${e instanceof Error ? e.message : String(e)}`);
        break;
      }

      for (const sub of page.data ?? []) {
        summary.subscriptions_found++;

        // produkt_key aus metadata oder bestehender Row ableiten
        let produkt_key: string | null = sub.metadata?.produkt_key ?? null;
        if (!produkt_key) {
          const { data: existing } = await supabase
            .schema("thermocheck")
            .from("contractor_subscriptions")
            .select("produkt_key")
            .eq("stripe_subscription_id", sub.id)
            .maybeSingle();
          produkt_key = existing?.produkt_key ?? null;
        }
        if (!produkt_key) {
          // Letzte Notbremse: aus Price/Product-Name raten (überspringen wenn unmöglich)
          const priceNick = sub.items?.data?.[0]?.price?.nickname?.toLowerCase() ?? "";
          if (priceNick.includes("scanner")) produkt_key = "scanner-lizenz";
          else if (priceNick.includes("workspace") || priceNick.includes("google")) produkt_key = "google-workspace";
        }
        if (!produkt_key) {
          summary.warnings.push(`sub ${sub.id} ohne produkt_key – skipped upsert`);
          continue;
        }

        const latestInv = sub.latest_invoice;
        const latestInvId = typeof latestInv === "object" ? latestInv?.id : (latestInv ?? null);
        const latestInvStatus = typeof latestInv === "object" ? latestInv?.status ?? null : null;

        const { data: before } = await supabase
          .schema("thermocheck")
          .from("contractor_subscriptions")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        const { error: upErr } = await supabase
          .schema("thermocheck")
          .from("contractor_subscriptions")
          .upsert({
            stripe_subscription_id: sub.id,
            onboarding_id,
            stripe_customer_id: customerId,
            produkt_key,
            status: sub.status,
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: !!sub.cancel_at_period_end,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            latest_invoice_id: latestInvId,
            latest_invoice_status: latestInvStatus,
          }, { onConflict: "stripe_subscription_id" });

        if (upErr) {
          summary.warnings.push(`upsert sub ${sub.id} failed: ${upErr.message}`);
          continue;
        }
        summary.subscriptions_upserted++;
        if (!before) summary.subscriptions_new++;

        // Letzte 3 Invoices der Sub
        try {
          const inv = await stripeGet(stripeKey, `invoices?subscription=${sub.id}&limit=3`);
          for (const i of inv.data ?? []) {
            const piId: string | null = typeof i.payment_intent === "string" ? i.payment_intent : (i.payment_intent?.id ?? null);
            const paymentStatus = i.status === "paid" ? "paid" : (i.status === "open" ? "pending" : (i.status === "void" ? "failed" : "pending"));
            const paidAt = i.status_transitions?.paid_at
              ? new Date(i.status_transitions.paid_at * 1000).toISOString()
              : null;

            const idempotency_key = `invoice:${i.id}`;

            const { data: existing } = await supabase
              .schema("thermocheck")
              .from("contractor_bestellungen")
              .select("id")
              .eq("idempotency_key", idempotency_key)
              .maybeSingle();

            const payload: Record<string, unknown> = {
              onboarding_id,
              produkt_typ: "subscription",
              produkt_key,
              stripe_subscription_id: sub.id,
              stripe_customer_id: customerId,
              stripe_payment_intent_id: piId,
              stripe_payment_status: paymentStatus,
              paid_at: paidAt,
              betrag_netto: typeof i.subtotal === "number" ? i.subtotal / 100 : null,
              betrag_brutto: typeof i.total === "number" ? i.total / 100 : null,
              webhook_received_at: new Date().toISOString(),
              idempotency_key,
            };

            if (existing) {
              const { error: updErr } = await supabase
                .schema("thermocheck")
                .from("contractor_bestellungen")
                .update(payload)
                .eq("id", existing.id);
              if (!updErr) summary.invoices_upserted++;
              else summary.warnings.push(`update invoice ${i.id} failed: ${updErr.message}`);
            } else {
              const { error: insErr } = await supabase
                .schema("thermocheck")
                .from("contractor_bestellungen")
                .insert(payload);
              if (!insErr) { summary.invoices_upserted++; summary.invoices_new++; }
              else summary.warnings.push(`insert invoice ${i.id} failed: ${insErr.message}`);
            }
          }
        } catch (e) {
          summary.warnings.push(`invoices for sub ${sub.id} failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      starting_after = page.has_more && page.data?.length > 0 ? page.data[page.data.length - 1].id : null;
    } while (starting_after);
  }

  // 6) Audit-Log
  try {
    await supabase
      .schema("thermocheck")
      .from("contractor_audit_log")
      .insert({
        action_type: "stripe_sync_contractor",
        onboarding_id,
        payload: summary as any,
      });
  } catch (_) { /* audit-log optional */ }

  return summary;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth-Check: Innendienst
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isInner, error: inErr } = await userClient
      .schema("thermocheck")
      .rpc("is_innendienst");
    if (inErr || !isInner) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const ids: string[] = Array.isArray(body?.onboarding_ids)
      ? body.onboarding_ids
      : (typeof body?.onboarding_id === "string" ? [body.onboarding_id] : []);

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: "onboarding_id or onboarding_ids required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const results: SyncSummary[] = [];
    const errors: Array<{ onboarding_id: string; error: string }> = [];

    // Sequenziell, weil Stripe API-Limits / 100 req/s default
    for (const id of ids) {
      try {
        results.push(await syncOneContractor(admin, stripeKey, id));
      } catch (e) {
        errors.push({ onboarding_id: id, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({ version: VERSION, results, errors }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
