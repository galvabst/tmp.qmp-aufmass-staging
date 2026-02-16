import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const WEBHOOK_VERSION = "2026-02-16-v4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Multi-order lookup: finds ALL orders matching a Stripe session.
 * Returns array of orders (can be multiple for Sammel-Checkout).
 */
async function findOrdersForSession(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
): Promise<{ orders: Array<{ id: string; stripe_payment_status: string }>; lookupMethod: string }> {
  // Step A: Search by stripe_session_id (returns ALL matching rows)
  const { data: bySessionId, error: err1 } = await supabase
    .schema("thermocheck")
    .from("contractor_bestellungen")
    .select("id, stripe_payment_status")
    .eq("stripe_session_id", session.id);

  if (err1) console.error("[stripe-webhook] Lookup A error:", err1);
  if (bySessionId && bySessionId.length > 0) {
    return { orders: bySessionId, lookupMethod: "session_id" };
  }

  // Step B: Fallback via metadata (onboarding_id + produkt_keys)
  const metadata = session.metadata || {};
  const onboardingId = metadata.onboarding_id;
  const produktKeysStr = metadata.produkt_keys || metadata.produkt_key;

  if (onboardingId && produktKeysStr) {
    const produktKeys = produktKeysStr.split(",").map((k: string) => k.trim()).filter(Boolean);
    
    const { data: byMetadata, error: err2 } = await supabase
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .select("id, stripe_payment_status")
      .eq("onboarding_id", onboardingId)
      .in("produkt_key", produktKeys)
      .eq("stripe_payment_status", "pending")
      .order("created_at", { ascending: false });

    if (err2) console.error("[stripe-webhook] Lookup B error:", err2);
    if (byMetadata && byMetadata.length > 0) {
      return { orders: byMetadata, lookupMethod: "metadata_fallback" };
    }
  }

  return { orders: [], lookupMethod: "not_found" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("[stripe-webhook] Missing secrets");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe-webhook] Signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[stripe-webhook] v${WEBHOOK_VERSION} | Event: ${event.type}, ID: ${event.id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency check
    const { data: existingAudit } = await supabase
      .schema("thermocheck")
      .from("contractor_audit_log")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingAudit) {
      console.log(`[stripe-webhook] Duplicate event ${event.id}, skipping`);
      return new Response(
        JSON.stringify({ received: true, status: "duplicate", version: WEBHOOK_VERSION }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let orderIds: string[] = [];
    let actionType = "webhook_received";
    let ordersUpdated = 0;
    let lookupMethod = "none";

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[stripe-webhook] checkout.session.completed: ${session.id}`);
        console.log(`[stripe-webhook] Metadata: ${JSON.stringify(session.metadata)}`);
        actionType = "checkout_completed";

        // Multi-order lookup
        let result = await findOrdersForSession(supabase, session);

        // Retry after 2s if not found (race condition)
        if (result.orders.length === 0) {
          console.log("[stripe-webhook] No orders found, retrying after 2s...");
          await sleep(2000);
          result = await findOrdersForSession(supabase, session);
          if (result.orders.length > 0) {
            result.lookupMethod = `retry_${result.lookupMethod}`;
          }
        }

        lookupMethod = result.lookupMethod;

        if (result.orders.length > 0) {
          // Update ALL matched orders to paid
          for (const order of result.orders) {
            const { error: updateError } = await supabase
              .schema("thermocheck")
              .from("contractor_bestellungen")
              .update({
                stripe_payment_status: "paid",
                stripe_session_id: session.id,
                paid_at: new Date().toISOString(),
                stripe_payment_intent_id: session.payment_intent as string || null,
                stripe_subscription_id: session.subscription as string || null,
                stripe_customer_id: session.customer as string || null,
                webhook_received_at: new Date().toISOString(),
                idempotency_key: event.id,
              })
              .eq("id", order.id);

            if (updateError) {
              console.error(`[stripe-webhook] Error updating order ${order.id}:`, updateError);
            } else {
              ordersUpdated++;
              orderIds.push(order.id);
              console.log(`[stripe-webhook] Updated order ${order.id} to paid`);
            }
          }
        } else {
          // Last resort: create from metadata
          lookupMethod = "created_from_metadata";
          console.warn("[stripe-webhook] No orders found after retry, creating from metadata");
          const metadata = session.metadata || {};
          const onboardingId = metadata.onboarding_id;
          const produktKeysStr = metadata.produkt_keys || metadata.produkt_key;

          if (onboardingId && produktKeysStr) {
            const keys = produktKeysStr.split(",").map((k: string) => k.trim()).filter(Boolean);
            
            for (const produktKey of keys) {
              const { data: produkt } = await supabase
                .schema("thermocheck")
                .from("contractor_produkte")
                .select("produkt_typ, preis_netto, preis_brutto")
                .eq("produkt_key", produktKey)
                .maybeSingle();

              if (produkt) {
                const groesse = metadata.groesse || null;
                const { data: newOrder, error: insertError } = await supabase
                  .schema("thermocheck")
                  .from("contractor_bestellungen")
                  .insert({
                    onboarding_id: onboardingId,
                    produkt_typ: produkt.produkt_typ,
                    produkt_key: produktKey,
                    stripe_session_id: session.id,
                    stripe_payment_status: "paid",
                    stripe_payment_intent_id: session.payment_intent as string || null,
                    stripe_subscription_id: session.subscription as string || null,
                    stripe_customer_id: session.customer as string || null,
                    betrag_netto: produkt.preis_netto,
                    betrag_brutto: produkt.preis_brutto,
                    groesse,
                    paid_at: new Date().toISOString(),
                    webhook_received_at: new Date().toISOString(),
                    idempotency_key: event.id,
                  })
                  .select("id")
                  .single();

                if (insertError) {
                  console.error(`[stripe-webhook] Error creating order for ${produktKey}:`, insertError);
                } else {
                  ordersUpdated++;
                  if (newOrder) orderIds.push(newOrder.id);
                  console.log(`[stripe-webhook] Created order for ${produktKey}: ${newOrder?.id}`);
                }
              }
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[stripe-webhook] checkout.session.expired: ${session.id}`);
        actionType = "checkout_expired";
        lookupMethod = "session_id";

        // Update ALL orders with this session to failed
        const { data: expiredOrders } = await supabase
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("id")
          .eq("stripe_session_id", session.id);

        if (expiredOrders && expiredOrders.length > 0) {
          for (const order of expiredOrders) {
            await supabase
              .schema("thermocheck")
              .from("contractor_bestellungen")
              .update({
                stripe_payment_status: "failed",
                webhook_received_at: new Date().toISOString(),
                idempotency_key: event.id,
              })
              .eq("id", order.id);
            ordersUpdated++;
            orderIds.push(order.id);
          }
          console.log(`[stripe-webhook] Marked ${expiredOrders.length} orders as failed (expired)`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] invoice.paid: ${invoice.id}`);
        actionType = "subscription_renewed";
        lookupMethod = "subscription_id";

        if (invoice.subscription) {
          const { data: bestellung } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .maybeSingle();

          if (bestellung) {
            orderIds.push(bestellung.id);
            ordersUpdated = 1;
            console.log(`[stripe-webhook] Subscription renewal for: ${bestellung.id}`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] invoice.payment_failed: ${invoice.id}`);
        actionType = "payment_failed";
        lookupMethod = "subscription_id";

        if (invoice.subscription) {
          const { data: bestellung } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .maybeSingle();

          if (bestellung) {
            orderIds.push(bestellung.id);
            console.log(`[stripe-webhook] Payment failed for: ${bestellung.id}`);
          }
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event: ${event.type}`);
    }

    // Audit log
    const { error: auditError } = await supabase
      .schema("thermocheck")
      .from("contractor_audit_log")
      .insert({
        action_type: actionType,
        object_type: "contractor_bestellung",
        object_id: orderIds[0] || null,
        payload: { ...event.data.object, _all_order_ids: orderIds },
        actor_type: "system",
        actor_name: "stripe-webhook",
        stripe_event_id: event.id,
      });

    if (auditError) console.error("[stripe-webhook] Audit log error:", auditError);

    return new Response(
      JSON.stringify({
        received: true,
        event_type: event.type,
        version: WEBHOOK_VERSION,
        orders_updated: ordersUpdated,
        lookup_method: lookupMethod,
        order_ids: orderIds,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[stripe-webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", version: WEBHOOK_VERSION }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
