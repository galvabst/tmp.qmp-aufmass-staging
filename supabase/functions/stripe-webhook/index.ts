import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const WEBHOOK_VERSION = "2026-02-06-v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

/** Helper: sleep for ms */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Multi-step lookup for an order matching a Stripe checkout session.
 * Returns { order, lookupMethod } or null if not found.
 */
async function findOrderForSession(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
): Promise<{ order: { id: string; stripe_payment_status: string }; lookupMethod: string } | null> {
  // Step A: Search by stripe_session_id
  const { data: bySessionId, error: err1 } = await supabase
    .schema("thermocheck")
    .from("contractor_bestellungen")
    .select("id, stripe_payment_status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (err1) console.error("[stripe-webhook] Lookup A error:", err1);
  if (bySessionId) return { order: bySessionId, lookupMethod: "session_id" };

  // Step B: Fallback via metadata (onboarding_id + produkt_key + pending)
  const metadata = session.metadata || {};
  const onboardingId = metadata.onboarding_id;
  const produktKey = metadata.produkt_key;

  if (onboardingId && produktKey) {
    const { data: byMetadata, error: err2 } = await supabase
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .select("id, stripe_payment_status")
      .eq("onboarding_id", onboardingId)
      .eq("produkt_key", produktKey)
      .eq("stripe_payment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (err2) console.error("[stripe-webhook] Lookup B error:", err2);
    if (byMetadata) return { order: byMetadata, lookupMethod: "metadata_fallback" };
  }

  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Get required environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeSecretKey || !webhookSecret) {
      console.error("[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get raw body and signature BEFORE parsing
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[stripe-webhook] Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Initialize Stripe and verify webhook signature
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("[stripe-webhook] Signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[stripe-webhook] v${WEBHOOK_VERSION} | Event: ${event.type}, ID: ${event.id}`);

    // 4. Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Idempotency check - has this event been processed?
    const { data: existingAudit } = await supabase
      .schema("thermocheck")
      .from("contractor_audit_log")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingAudit) {
      console.log(`[stripe-webhook] Event ${event.id} already processed, skipping`);
      return new Response(
        JSON.stringify({ received: true, status: "duplicate", version: WEBHOOK_VERSION }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Process event based on type
    let bestellungId: string | null = null;
    let actionType = "webhook_received";
    let orderUpdated = false;
    let lookupMethod = "none";

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[stripe-webhook] Processing checkout.session.completed: ${session.id}`);
        console.log(`[stripe-webhook] Session metadata: ${JSON.stringify(session.metadata)}`);
        
        actionType = "checkout_completed";
        
        // Multi-step lookup: session_id -> metadata fallback -> retry -> create
        let result = await findOrderForSession(supabase, session);

        // Step C: Retry after 2s delay (race condition with create-checkout-session)
        if (!result) {
          console.log("[stripe-webhook] Order not found, retrying after 2s delay...");
          await sleep(2000);
          result = await findOrderForSession(supabase, session);
          if (result) {
            result.lookupMethod = `retry_${result.lookupMethod}`;
          }
        }

        if (result) {
          bestellungId = result.order.id;
          lookupMethod = result.lookupMethod;
          
          // Update order to paid + correct session_id
          const { error: updateError } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_payment_status: "paid",
              stripe_session_id: session.id, // Always set correct session_id
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string || null,
              stripe_subscription_id: session.subscription as string || null,
              stripe_customer_id: session.customer as string || null,
              webhook_received_at: new Date().toISOString(),
              idempotency_key: event.id,
            })
            .eq("id", result.order.id);

          if (updateError) {
            console.error("[stripe-webhook] Error updating order:", updateError);
          } else {
            orderUpdated = true;
            console.log(`[stripe-webhook] Updated order ${result.order.id} to paid (lookup: ${lookupMethod})`);
          }
        } else {
          // Step D: Create from metadata (last resort)
          lookupMethod = "created_from_metadata";
          console.warn("[stripe-webhook] Order NOT FOUND after retry, creating from metadata");
          const metadata = session.metadata || {};
          const onboardingId = metadata.onboarding_id;
          const produktKey = metadata.produkt_key;
          const groesse = metadata.groesse || null;

          if (onboardingId && produktKey) {
            const { data: produkt } = await supabase
              .schema("thermocheck")
              .from("contractor_produkte")
              .select("produkt_typ, preis_netto, preis_brutto")
              .eq("produkt_key", produktKey)
              .maybeSingle();

            if (produkt) {
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
                console.error("[stripe-webhook] Error creating order:", insertError);
              } else {
                bestellungId = newOrder?.id || null;
                orderUpdated = true;
                console.log(`[stripe-webhook] Created new order: ${bestellungId}`);
              }
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[stripe-webhook] Processing checkout.session.expired: ${session.id}`);
        
        actionType = "checkout_expired";
        lookupMethod = "session_id";
        
        const { data: bestellung } = await supabase
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (bestellung) {
          bestellungId = bestellung.id;
          
          await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_payment_status: "failed",
              webhook_received_at: new Date().toISOString(),
              idempotency_key: event.id,
            })
            .eq("id", bestellung.id);
            
          orderUpdated = true;
          console.log(`[stripe-webhook] Marked order ${bestellung.id} as failed (expired)`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] Processing invoice.paid: ${invoice.id}`);
        
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
            bestellungId = bestellung.id;
            orderUpdated = true;
            console.log(`[stripe-webhook] Subscription renewal for order: ${bestellung.id}`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] Processing invoice.payment_failed: ${invoice.id}`);
        
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
            bestellungId = bestellung.id;
            console.log(`[stripe-webhook] Payment failed for subscription order: ${bestellung.id}`);
          }
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    // 7. Write to audit log
    const { error: auditError } = await supabase
      .schema("thermocheck")
      .from("contractor_audit_log")
      .insert({
        action_type: actionType,
        object_type: "contractor_bestellung",
        object_id: bestellungId,
        payload: event.data.object,
        actor_type: "system",
        actor_name: "stripe-webhook",
        stripe_event_id: event.id,
      });

    if (auditError) {
      console.error("[stripe-webhook] Failed to write audit log:", auditError);
    }

    // 8. Return success with enhanced logging
    return new Response(
      JSON.stringify({
        received: true,
        event_type: event.type,
        version: WEBHOOK_VERSION,
        order_updated: orderUpdated,
        lookup_method: lookupMethod,
        order_id: bestellungId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[stripe-webhook] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", version: WEBHOOK_VERSION }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
