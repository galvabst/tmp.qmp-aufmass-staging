import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const RECONCILER_VERSION = "2026-05-07-v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PendingOrder {
  id: string;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  produkt_key: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look back 30 days
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: pendingOrders, error: fetchErr } = await supabase
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .select("id, stripe_session_id, stripe_subscription_id, created_at, produkt_key")
      .eq("stripe_payment_status", "pending")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(200);

    if (fetchErr) {
      console.error("[reconciler] fetch error:", fetchErr);
      return new Response(
        JSON.stringify({ error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orders = (pendingOrders ?? []) as PendingOrder[];
    console.log(`[reconciler] v${RECONCILER_VERSION} — checking ${orders.length} pending orders`);

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

        // Try checkout session first
        if (order.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
          paymentIntentId = (session.payment_intent as string) || null;
          subscriptionId = (session.subscription as string) || subscriptionId;
          customerId = (session.customer as string) || null;

          if (session.payment_status === "paid") {
            isPaid = true;
          } else if (session.status === "expired") {
            isExpired = true;
          } else if (session.subscription) {
            // For subscriptions, also check the subscription's latest invoice
            try {
              const sub = await stripe.subscriptions.retrieve(session.subscription as string, {
                expand: ["latest_invoice"],
              });
              const latestInvoice = sub.latest_invoice as Stripe.Invoice | null;
              if (latestInvoice && latestInvoice.status === "paid") {
                isPaid = true;
              }
            } catch (subErr) {
              console.error(`[reconciler] sub retrieve failed for ${order.id}:`, subErr);
            }
          }
        } else if (order.stripe_subscription_id) {
          // No session id but subscription known
          const sub = await stripe.subscriptions.retrieve(order.stripe_subscription_id, {
            expand: ["latest_invoice"],
          });
          subscriptionId = sub.id;
          customerId = sub.customer as string;
          const latestInvoice = sub.latest_invoice as Stripe.Invoice | null;
          if (latestInvoice && latestInvoice.status === "paid") {
            isPaid = true;
            paymentIntentId = (latestInvoice.payment_intent as string) || null;
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
            .eq("stripe_payment_status", "pending"); // safety: only update if still pending

          if (updErr) {
            errors.push({ order_id: order.id, error: updErr.message });
            console.error(`[reconciler] update paid failed for ${order.id}:`, updErr);
          } else {
            updatedToPaid++;
            updatedIds.push(order.id);
            console.log(`[reconciler] ${order.id} (${order.produkt_key}) → paid`);

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
              console.log(`[reconciler] ${order.id} → failed (expired)`);
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
        console.error(`[reconciler] error processing ${order.id}:`, msg);
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

    console.log(`[reconciler] DONE:`, JSON.stringify(report));

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[reconciler] fatal:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: error instanceof Error ? error.message : String(error),
        version: RECONCILER_VERSION,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
