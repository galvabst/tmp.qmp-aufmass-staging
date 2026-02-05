import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

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

    console.log(`[stripe-webhook] Received event: ${event.type}, ID: ${event.id}`);

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
        JSON.stringify({ received: true, status: "duplicate" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Process event based on type
    let bestellungId: string | null = null;
    let auditEventType: string = "admin_action";

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[stripe-webhook] Processing checkout.session.completed: ${session.id}`);
        
        auditEventType = "checkout_completed";
        
        // Find the order by stripe_session_id
        const { data: bestellung, error: findError } = await supabase
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("id, stripe_payment_status")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (findError) {
          console.error("[stripe-webhook] Error finding order:", findError);
        }

        if (bestellung) {
          bestellungId = bestellung.id;
          
          // Update order to paid
          const { error: updateError } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_payment_status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string || null,
              stripe_subscription_id: session.subscription as string || null,
              stripe_customer_id: session.customer as string || null,
              webhook_received_at: new Date().toISOString(),
              idempotency_key: event.id,
            })
            .eq("id", bestellung.id);

          if (updateError) {
            console.error("[stripe-webhook] Error updating order:", updateError);
          } else {
            console.log(`[stripe-webhook] Updated order ${bestellung.id} to paid`);
          }
        } else {
          // Order not found - create it from metadata
          console.log("[stripe-webhook] Order not found, creating from metadata");
          
          const metadata = session.metadata || {};
          const onboardingId = metadata.onboarding_id;
          const produktKey = metadata.produkt_key;
          const groesse = metadata.groesse || null;

          if (onboardingId && produktKey) {
            // Get product details
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
        
        auditEventType = "checkout_expired";
        
        // Find and update the order
        const { data: bestellung } = await supabase
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (bestellung) {
          bestellungId = bestellung.id;
          
          // Update to failed (expired)
          await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_payment_status: "failed",
              webhook_received_at: new Date().toISOString(),
              idempotency_key: event.id,
            })
            .eq("id", bestellung.id);
            
          console.log(`[stripe-webhook] Marked order ${bestellung.id} as failed (expired)`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] Processing invoice.paid: ${invoice.id}`);
        
        auditEventType = "subscription_renewed";
        
        // This is for subscription renewals
        if (invoice.subscription) {
          const { data: bestellung } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .maybeSingle();

          if (bestellung) {
            bestellungId = bestellung.id;
            console.log(`[stripe-webhook] Subscription renewal for order: ${bestellung.id}`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] Processing invoice.payment_failed: ${invoice.id}`);
        
        auditEventType = "payment_failed";
        
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

    // 7. Write to audit log (ALWAYS, for all processed events)
    const { error: auditError } = await supabase
      .schema("thermocheck")
      .from("contractor_audit_log")
      .insert({
        bestellung_id: bestellungId,
        action_type: auditEventType,
        object_type: "stripe_event",
        object_id: bestellungId,
        payload: event.data.object,
        actor_type: "system",
      });

    if (auditError) {
      console.error("[stripe-webhook] Failed to write audit log:", auditError);
      // Don't fail the webhook - Stripe will retry
    } else {
      console.log(`[stripe-webhook] Wrote audit log for event: ${event.id}`);
    }

    // 8. Return success (Stripe expects 200)
    return new Response(
      JSON.stringify({ received: true, event_type: event.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[stripe-webhook] Unexpected error:", error);
    // Return 500 so Stripe will retry
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
