import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RECONCILER_VERSION = "2026-05-26-v5-subscriptions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PendingOrder {
  id: string;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_payment_status: string;
  paid_at: string | null;
  created_at: string;
  produkt_key: string;
  betrag_brutto: number | null;
}

async function stripeGet(stripeKey: string, path: string): Promise<any> {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`stripe ${path} → ${r.status} ${text}`);
  }
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body for mode/options (POST only). GET = recent default.
    let mode: "recent" | "backfill" | "single" = "recent";
    let backfillDays = 7;
    let singleOrderId: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.mode === "backfill") {
          mode = "backfill";
          backfillDays = Math.min(Math.max(Number(body?.days ?? 90), 1), 365);
        } else if (body?.mode === "single" && typeof body?.order_id === "string") {
          mode = "single";
          singleOrderId = body.order_id;
        }
      } catch (_) { /* no body / not json → recent */ }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const windowDays = mode === "backfill" ? backfillDays : 7;
    const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .select("id, stripe_session_id, stripe_subscription_id, stripe_customer_id, stripe_payment_intent_id, stripe_payment_status, paid_at, created_at, produkt_key, betrag_brutto");

    if (mode === "single" && singleOrderId) {
      query = query.eq("id", singleOrderId);
    } else {
      // recent + backfill: alle nicht-paid + alle inkonsistenten (paid_at gesetzt aber status != paid, oder PI gesetzt aber status != paid)
      query = query
        .or("stripe_payment_status.in.(pending,failed),and(stripe_payment_status.neq.paid,paid_at.not.is.null)")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(mode === "backfill" ? 1000 : 200);
    }

    const { data: pendingOrders, error: fetchErr } = await query;

    if (fetchErr) {
      console.error("[reconciler-v3] fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orders = (pendingOrders ?? []) as PendingOrder[];
    console.log(`[reconciler-v3] mode=${mode} window=${windowDays}d → checking ${orders.length} orders`);

    let updatedToPaid = 0;
    let updatedToFailed = 0;
    let stillPending = 0;
    const errors: Array<{ order_id: string; error: string }> = [];
    const updatedIds: string[] = [];

    for (const order of orders) {
      try {
        let isPaid = false;
        let isExpired = false;
        let paymentIntentId: string | null = order.stripe_payment_intent_id;
        let subscriptionId: string | null = order.stripe_subscription_id;
        let customerId: string | null = order.stripe_customer_id;
        let matchedReason: string | null = null;

        // Wenn die Order bereits paid_at oder PI hat, aber Status falsch → Trigger macht's, hier nur sicherstellen.
        if (order.paid_at || order.stripe_payment_intent_id) {
          // Verifiziere mit Stripe wenn möglich
          if (order.stripe_payment_intent_id) {
            try {
              const pi = await stripeGet(stripeKey, `payment_intents/${order.stripe_payment_intent_id}`);
              if (pi.status === "succeeded") {
                isPaid = true;
                matchedReason = "existing_pi_verified";
                customerId = customerId || (typeof pi.customer === "string" ? pi.customer : null);
              }
            } catch (e) {
              console.warn(`[reconciler-v3] PI lookup failed for ${order.id}:`, e);
            }
          }
          if (!isPaid && order.paid_at) {
            // paid_at ohne verifizierbare PI → vertrauen wir der Spalte (war ja schon mal paid)
            isPaid = true;
            matchedReason = matchedReason || "trusted_paid_at";
          }
        }

        if (!isPaid && order.stripe_session_id) {
          const session = await stripeGet(
            stripeKey,
            `checkout/sessions/${order.stripe_session_id}?expand[]=subscription&expand[]=subscription.latest_invoice&expand[]=payment_intent`,
          );

          const sessPi = session.payment_intent;
          if (sessPi && typeof sessPi === "object") {
            paymentIntentId = paymentIntentId ?? sessPi.id;
            if (sessPi.status === "succeeded") {
              isPaid = true;
              matchedReason = matchedReason || "session_payment_intent_succeeded";
            }
          } else if (typeof sessPi === "string") {
            paymentIntentId = paymentIntentId ?? sessPi;
          }
          customerId = customerId ?? (typeof session.customer === "string" ? session.customer : null);

          const sub = session.subscription;
          if (sub && typeof sub === "object") {
            subscriptionId = sub.id || subscriptionId;
            const inv = sub.latest_invoice;
            if (inv && typeof inv === "object" && inv.status === "paid") {
              isPaid = true;
              matchedReason = matchedReason || "subscription_invoice_paid";
              if (!paymentIntentId && typeof inv.payment_intent === "string") {
                paymentIntentId = inv.payment_intent;
              }
            }
          } else if (typeof sub === "string") {
            subscriptionId = sub;
          }

          if (!isPaid && session.payment_status === "paid") {
            isPaid = true;
            matchedReason = matchedReason || "session_paid";
          } else if (!isPaid && session.status === "expired") {
            isExpired = true;
          }

          if (!isPaid && !isExpired && paymentIntentId) {
            try {
              const pi = await stripeGet(stripeKey, `payment_intents/${paymentIntentId}`);
              if (pi.status === "succeeded") {
                isPaid = true;
                matchedReason = matchedReason || "session_pi_lookup_succeeded";
                customerId = customerId || (typeof pi.customer === "string" ? pi.customer : null);
              }
            } catch (e) {
              console.warn(`[reconciler-v4] session PI lookup failed for ${order.id}:`, e);
            }
          }
        } else if (!isPaid && order.stripe_subscription_id) {
          const sub = await stripeGet(
            stripeKey,
            `subscriptions/${order.stripe_subscription_id}?expand[]=latest_invoice`,
          );
          subscriptionId = sub.id;
          customerId = customerId ?? (typeof sub.customer === "string" ? sub.customer : null);
          const inv = sub.latest_invoice;
          if (inv && typeof inv === "object" && inv.status === "paid") {
            isPaid = true;
            matchedReason = matchedReason || "subscription_invoice_paid";
            if (typeof inv.payment_intent === "string") paymentIntentId = inv.payment_intent;
          }
        }

        // Customer-PI-Fallback: Suche succeeded PI desselben Customers mit gleichem Betrag (±24h Window in backfill).
        if (!isPaid && !isExpired) {
          const cust = customerId || order.stripe_customer_id;
          const expectedAmount = order.betrag_brutto != null ? Math.round(Number(order.betrag_brutto) * 100) : null;
          if (cust && expectedAmount) {
            const toleranceSec = mode === "backfill" ? 86400 : 300;
            const orderTs = Math.floor(new Date(order.created_at).getTime() / 1000) - toleranceSec;
            const pis = await stripeGet(
              stripeKey,
              `payment_intents?customer=${cust}&limit=50&created[gte]=${orderTs}`,
            );
            const list: any[] = Array.isArray(pis.data) ? pis.data : [];
            // Tax-tolerant: erlaube exakten Match ODER bis zu +30% (für automatic_tax / VAT / Shipping).
            const minAmount = expectedAmount;
            const maxAmount = Math.round(expectedAmount * 1.3) + 50; // +30% + 50ct Puffer
            const match = list.find(
              (pi) => pi.status === "succeeded" && pi.amount >= minAmount && pi.amount <= maxAmount,
            );
            if (match) {
              isPaid = true;
              paymentIntentId = match.id;
              customerId = cust;
              matchedReason = "customer_pi_amount_match";
              console.log(
                `[reconciler-v3] ${order.id} matched via customer PI ${match.id} (${expectedAmount} cent)`,
              );
            }
          }
        }

        if (isPaid) {
          const { error: updErr } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_payment_status: "paid",
              paid_at: order.paid_at ?? new Date().toISOString(),
              stripe_payment_intent_id: paymentIntentId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              webhook_received_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          if (updErr) {
            errors.push({ order_id: order.id, error: updErr.message });
            console.error(`[reconciler-v3] update paid failed for ${order.id}:`, updErr);
          } else {
            updatedToPaid++;
            updatedIds.push(order.id);
            console.log(`[reconciler-v3] ${order.id} (${order.produkt_key}) → paid (${matchedReason})`);

            await supabase
              .schema("thermocheck")
              .from("contractor_audit_log")
              .insert({
                action_type: "reconciled_paid",
                object_type: "contractor_bestellung",
                object_id: order.id,
                payload: {
                  session_id: order.stripe_session_id,
                  subscription_id: subscriptionId,
                  payment_intent_id: paymentIntentId,
                  matched_reason: matchedReason,
                  previous_status: order.stripe_payment_status,
                  mode,
                  reconciler_version: RECONCILER_VERSION,
                },
                actor_type: "system",
                actor_name: "reconciler",
              });
          }
        } else if (isExpired) {
          const ageMs = Date.now() - new Date(order.created_at).getTime();
          if (ageMs > 24 * 60 * 60 * 1000) {
            const { data: updRows, error: updErr } = await supabase
              .schema("thermocheck")
              .from("contractor_bestellungen")
              .update({
                stripe_payment_status: "failed",
                webhook_received_at: new Date().toISOString(),
              })
              .eq("id", order.id)
              .eq("stripe_payment_status", "pending")
              .select("id");

            if (updErr) {
              errors.push({ order_id: order.id, error: updErr.message });
            } else if (updRows && updRows.length > 0) {
              updatedToFailed++;
              console.log(`[reconciler-v4] ${order.id} → failed (expired)`);
              await supabase
                .schema("thermocheck")
                .from("contractor_audit_log")
                .insert({
                  action_type: "reconciled_failed",
                  object_type: "contractor_bestellung",
                  object_id: order.id,
                  payload: {
                    session_id: order.stripe_session_id,
                    reason: "session_expired",
                    reconciler_version: RECONCILER_VERSION,
                  },
                  actor_type: "system",
                  actor_name: "reconciler",
                });
            }
          } else {
            stillPending++;
          }
        } else {
          stillPending++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ order_id: order.id, error: msg });
        console.error(`[reconciler-v3] error processing ${order.id}:`, msg);
      }
    }

    const report = {
      version: RECONCILER_VERSION,
      mode,
      window_days: windowDays,
      checked: orders.length,
      updated_to_paid: updatedToPaid,
      updated_to_failed: updatedToFailed,
      still_pending: stillPending,
      errors,
      updated_order_ids: updatedIds,
    };

    console.log(`[reconciler-v3] DONE:`, JSON.stringify(report));

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[reconciler-v3] fatal:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: error instanceof Error ? error.message : String(error),
        version: RECONCILER_VERSION,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
