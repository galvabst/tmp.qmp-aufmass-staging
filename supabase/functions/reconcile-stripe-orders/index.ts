import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RECONCILER_VERSION = "2026-05-07-v2-fetch";

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: pendingOrders, error: fetchErr } = await supabase
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .select("id, stripe_session_id, stripe_subscription_id, stripe_customer_id, created_at, produkt_key, betrag_brutto")
      .eq("stripe_payment_status", "pending")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(200);

    if (fetchErr) {
      console.error("[reconciler-v2] fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orders = (pendingOrders ?? []) as PendingOrder[];
    console.log(`[reconciler-v2] checking ${orders.length} pending orders`);

    let updatedToPaid = 0;
    let updatedToFailed = 0;
    let stillPending = 0;
    const errors: Array<{ order_id: string; error: string }> = [];
    const updatedIds: string[] = [];

    for (const order of orders) {
      try {
        let isPaid = false;
        let isExpired = false;
        let paymentIntentId: string | null = null;
        let subscriptionId: string | null = order.stripe_subscription_id;
        let customerId: string | null = null;

        if (order.stripe_session_id) {
          const session = await stripeGet(
            stripeKey,
            `checkout/sessions/${order.stripe_session_id}?expand[]=subscription&expand[]=subscription.latest_invoice`,
          );

          paymentIntentId =
            typeof session.payment_intent === "string" ? session.payment_intent : null;
          customerId = typeof session.customer === "string" ? session.customer : null;

          const sub = session.subscription;
          if (sub && typeof sub === "object") {
            subscriptionId = sub.id || subscriptionId;
            const inv = sub.latest_invoice;
            if (inv && typeof inv === "object" && inv.status === "paid") {
              isPaid = true;
              if (!paymentIntentId && typeof inv.payment_intent === "string") {
                paymentIntentId = inv.payment_intent;
              }
            }
          } else if (typeof sub === "string") {
            subscriptionId = sub;
          }

          if (session.payment_status === "paid") {
            isPaid = true;
          } else if (session.status === "expired") {
            isExpired = true;
          }
        } else if (order.stripe_subscription_id) {
          const sub = await stripeGet(
            stripeKey,
            `subscriptions/${order.stripe_subscription_id}?expand[]=latest_invoice`,
          );
          subscriptionId = sub.id;
          customerId = typeof sub.customer === "string" ? sub.customer : null;
          const inv = sub.latest_invoice;
          if (inv && typeof inv === "object" && inv.status === "paid") {
            isPaid = true;
            if (typeof inv.payment_intent === "string") paymentIntentId = inv.payment_intent;
          }
        } else {
          stillPending++;
          continue;
        }

        if (isPaid) {
          const { error: updErr } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_payment_status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: paymentIntentId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              webhook_received_at: new Date().toISOString(),
            })
            .eq("id", order.id)
            .eq("stripe_payment_status", "pending");

          if (updErr) {
            errors.push({ order_id: order.id, error: updErr.message });
            console.error(`[reconciler-v2] update paid failed for ${order.id}:`, updErr);
          } else {
            updatedToPaid++;
            updatedIds.push(order.id);
            console.log(`[reconciler-v2] ${order.id} (${order.produkt_key}) → paid`);

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
                  reconciler_version: RECONCILER_VERSION,
                },
                actor_type: "system",
                actor_name: "reconciler",
              });
          }
        } else if (isExpired) {
          const ageMs = Date.now() - new Date(order.created_at).getTime();
          if (ageMs > 24 * 60 * 60 * 1000) {
            const { error: updErr } = await supabase
              .schema("thermocheck")
              .from("contractor_bestellungen")
              .update({
                stripe_payment_status: "failed",
                webhook_received_at: new Date().toISOString(),
              })
              .eq("id", order.id)
              .eq("stripe_payment_status", "pending");

            if (updErr) {
              errors.push({ order_id: order.id, error: updErr.message });
            } else {
              updatedToFailed++;
              console.log(`[reconciler-v2] ${order.id} → failed (expired)`);
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
        console.error(`[reconciler-v2] error processing ${order.id}:`, msg);
      }
    }

    const report = {
      version: RECONCILER_VERSION,
      checked: orders.length,
      updated_to_paid: updatedToPaid,
      updated_to_failed: updatedToFailed,
      still_pending: stillPending,
      errors,
      updated_order_ids: updatedIds,
    };

    console.log(`[reconciler-v2] DONE:`, JSON.stringify(report));

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[reconciler-v2] fatal:", error);
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
