import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const WEBHOOK_VERSION = "2026-06-05-v7-unpaid-link-fix";

// ---------------------------------------------------------------
// Subscription-Tracker Helpers
// ---------------------------------------------------------------
type SubStatus =
  | "active" | "past_due" | "unpaid" | "canceled"
  | "incomplete" | "incomplete_expired" | "paused" | "trialing";

function mapStripeStatus(s: string | undefined | null): SubStatus {
  const allowed: SubStatus[] = [
    "active","past_due","unpaid","canceled",
    "incomplete","incomplete_expired","paused","trialing",
  ];
  return (allowed as string[]).includes(s as string) ? (s as SubStatus) : "incomplete";
}

async function resolveOnboardingIdForSubscription(
  supabase: ReturnType<typeof createClient>,
  subscriptionId: string,
  customerId?: string | null,
): Promise<string | null> {
  // 1) Previously seen bestellung for this subscription
  const { data: byOrder } = await supabase
    .schema("thermocheck")
    .from("contractor_bestellungen")
    .select("onboarding_id")
    .eq("stripe_subscription_id", subscriptionId)
    .not("onboarding_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if ((byOrder as any)?.onboarding_id) return (byOrder as any).onboarding_id;

  // 2) Existing subscription row (e.g. created earlier with onboarding_id resolved)
  const { data: bySub } = await supabase
    .schema("thermocheck")
    .from("contractor_subscriptions")
    .select("onboarding_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if ((bySub as any)?.onboarding_id) return (bySub as any).onboarding_id;

  if (!customerId) return null;

  // 3) Any other subscription/bestellung on the same Stripe customer
  const { data: byCustSub } = await supabase
    .schema("thermocheck")
    .from("contractor_subscriptions")
    .select("onboarding_id")
    .eq("stripe_customer_id", customerId)
    .not("onboarding_id", "is", null)
    .limit(1)
    .maybeSingle();
  if ((byCustSub as any)?.onboarding_id) return (byCustSub as any).onboarding_id;

  const { data: byCustOrder } = await supabase
    .schema("thermocheck")
    .from("contractor_bestellungen")
    .select("onboarding_id")
    .eq("stripe_customer_id", customerId)
    .not("onboarding_id", "is", null)
    .limit(1)
    .maybeSingle();
  if ((byCustOrder as any)?.onboarding_id) return (byCustOrder as any).onboarding_id;

  // 4) Customer pinned on onboarding (stripe_customer_ids array)
  const { data: byPin } = await supabase
    .schema("thermocheck")
    .from("contractor_onboarding")
    .select("id")
    .contains("stripe_customer_ids", [customerId])
    .limit(1)
    .maybeSingle();
  if ((byPin as any)?.id) return (byPin as any).id;

  return null;
}

async function resolveProduktKeyForSubscription(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const metaKey = (sub.metadata as any)?.produkt_key as string | undefined;
  if (metaKey) return metaKey;
  const lookupKey = sub.items?.data?.[0]?.price?.lookup_key as string | undefined;
  if (lookupKey) return lookupKey;
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  if (priceId) {
    const { data } = await supabase
      .schema("thermocheck")
      .from("contractor_produkte")
      .select("produkt_key")
      .or(`stripe_price_id.eq.${priceId},stripe_test_price_id.eq.${priceId}`)
      .limit(1)
      .maybeSingle();
    if ((data as any)?.produkt_key) return (data as any).produkt_key;
  }
  return null;
}

async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const onboardingId = await resolveOnboardingIdForSubscription(supabase, sub.id, customerId);
  if (!onboardingId) {
    console.warn(`[stripe-webhook] No onboarding_id resolvable for subscription ${sub.id} (customer ${customerId})`);
    return null;
  }

  const produktKey = await resolveProduktKeyForSubscription(supabase, sub);


  const payload = {
    onboarding_id: onboardingId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    produkt_key: produktKey,
    status: mapStripeStatus(sub.status),
    current_period_start: sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString() : null,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString() : null,
    latest_invoice_id: typeof sub.latest_invoice === "string"
      ? sub.latest_invoice
      : (sub.latest_invoice as any)?.id ?? null,
  };

  const { data, error } = await supabase
    .schema("thermocheck")
    .from("contractor_subscriptions")
    .upsert(payload, { onConflict: "stripe_subscription_id" })
    .select("id")
    .single();

  if (error) {
    console.error(`[stripe-webhook] upsertSubscription error for ${sub.id}:`, error);
    return null;
  }
  return (data as any)?.id ?? null;
}

async function findOrCreateSubscriptionRowByInvoice(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<string | null> {
  const subId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : (invoice.subscription as any)?.id ?? null;
  if (!subId) return null;

  const { data: existing } = await supabase
    .schema("thermocheck")
    .from("contractor_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();
  if ((existing as any)?.id) return (existing as any).id;

  try {
    const sub = await stripe.subscriptions.retrieve(subId);
    return await upsertSubscription(supabase, sub);
  } catch (e) {
    console.error(`[stripe-webhook] retrieve subscription ${subId} failed:`, e);
    return null;
  }
}

async function recordSubscriptionEvent(
  supabase: ReturnType<typeof createClient>,
  params: {
    subscription_row_id: string;
    stripe_event_id: string;
    event_type: string;
    invoice_id?: string | null;
    invoice_status?: string | null;
    amount_brutto?: number | null;
    failure_reason?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    raw_payload?: unknown;
  },
) {
  const { error } = await supabase
    .schema("thermocheck")
    .from("contractor_subscription_events")
    .insert({
      subscription_id: params.subscription_row_id,
      stripe_event_id: params.stripe_event_id,
      event_type: params.event_type,
      invoice_id: params.invoice_id ?? null,
      invoice_status: params.invoice_status ?? null,
      amount_brutto: params.amount_brutto ?? null,
      failure_reason: params.failure_reason ?? null,
      period_start: params.period_start ?? null,
      period_end: params.period_end ?? null,
      raw_payload: params.raw_payload ?? null,
    });
  if (error && !String(error.message).includes("duplicate")) {
    console.error("[stripe-webhook] recordSubscriptionEvent error:", error);
  }
}

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
        console.log(`[stripe-webhook] checkout.session.completed: ${session.id}, payment_status: ${session.payment_status}`);
        console.log(`[stripe-webhook] Metadata: ${JSON.stringify(session.metadata)}`);

        // CRITICAL: For subscriptions, Stripe sends checkout.session.completed even when
        // the initial payment fails (payment_status = "unpaid"). Only mark as "paid"
        // if Stripe confirms the payment actually succeeded.
        if (session.payment_status !== "paid") {
          console.warn(`[stripe-webhook] Payment NOT successful (status: ${session.payment_status}), NOT marking as paid`);
          actionType = "checkout_completed_unpaid";

          // Still link session_id + subscription/customer/PI to orders so a later
          // invoice.paid / payment_intent.succeeded event can find this row.
          const unpaidResult = await findOrdersForSession(supabase, session);
          if (unpaidResult.orders.length > 0) {
            for (const order of unpaidResult.orders) {
              await supabase
                .schema("thermocheck")
                .from("contractor_bestellungen")
                .update({
                  stripe_session_id: session.id,
                  stripe_subscription_id: (session.subscription as string) || null,
                  stripe_customer_id: (session.customer as string) || null,
                  stripe_payment_intent_id: (session.payment_intent as string) || null,
                  webhook_received_at: new Date().toISOString(),
                })
                .eq("id", order.id);
              orderIds.push(order.id);
            }
          }
          lookupMethod = unpaidResult.lookupMethod;
          break;
        }

        actionType = "checkout_completed";

        // Sync custom_fields name to Stripe customer
        try {
          const customFields = (session as any).custom_fields;
          const rechnungsname = customFields?.find((f: any) => f.key === 'rechnungsname')?.text?.value;
          if (rechnungsname && session.customer) {
            await stripe.customers.update(session.customer as string, { name: rechnungsname });
            console.log(`[stripe-webhook] Updated customer name to: ${rechnungsname}`);
          }
        } catch (nameErr) {
          console.error("[stripe-webhook] Error updating customer name:", nameErr);
        }

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

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] invoice.paid: ${invoice.id}, subscription: ${invoice.subscription}`);
        actionType = "subscription_renewed";
        lookupMethod = "subscription_id";

        if (invoice.subscription) {
          // Update legacy contractor_bestellungen
          let { data: bestellungen } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .select("id, stripe_payment_status")
            .eq("stripe_subscription_id", invoice.subscription as string);

          // Fallback: link by customer_id when subscription_id was never persisted
          // (e.g. row was created via unpaid checkout before v7 fix shipped)
          if ((!bestellungen || bestellungen.length === 0) && invoice.customer) {
            const { data: byCustomer } = await supabase
              .schema("thermocheck")
              .from("contractor_bestellungen")
              .select("id, stripe_payment_status")
              .eq("stripe_customer_id", invoice.customer as string)
              .in("stripe_payment_status", ["pending", "failed"]);
            if (byCustomer && byCustomer.length > 0) {
              // Backfill subscription_id for the future
              for (const o of byCustomer) {
                await supabase
                  .schema("thermocheck")
                  .from("contractor_bestellungen")
                  .update({ stripe_subscription_id: invoice.subscription as string })
                  .eq("id", o.id);
              }
              bestellungen = byCustomer;
            }
          }

          if (bestellungen && bestellungen.length > 0) {
            for (const bestellung of bestellungen) {
              if (bestellung.stripe_payment_status !== "paid") {
                await supabase
                  .schema("thermocheck")
                  .from("contractor_bestellungen")
                  .update({
                    stripe_payment_status: "paid",
                    paid_at: new Date().toISOString(),
                    webhook_received_at: new Date().toISOString(),
                    idempotency_key: event.id,
                  })
                  .eq("id", bestellung.id);
              }
              ordersUpdated++;
              orderIds.push(bestellung.id);
            }
          }

          // New: subscription tracker
          const subRowId = await findOrCreateSubscriptionRowByInvoice(supabase, stripe, invoice);
          if (subRowId) {
            await recordSubscriptionEvent(supabase, {
              subscription_row_id: subRowId,
              stripe_event_id: event.id,
              event_type: "invoice.paid",
              invoice_id: invoice.id,
              invoice_status: "paid",
              amount_brutto: invoice.amount_paid ? invoice.amount_paid / 100 : null,
              period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
              period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
              raw_payload: invoice,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] invoice.payment_failed: ${invoice.id}, subscription: ${invoice.subscription}`);
        actionType = "payment_failed";
        lookupMethod = "subscription_id";

        if (invoice.subscription) {
          const { data: bestellungen } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .select("id, stripe_payment_status")
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (bestellungen && bestellungen.length > 0) {
            for (const bestellung of bestellungen) {
              if (bestellung.stripe_payment_status === "pending") {
                await supabase
                  .schema("thermocheck")
                  .from("contractor_bestellungen")
                  .update({
                    stripe_payment_status: "failed",
                    webhook_received_at: new Date().toISOString(),
                    idempotency_key: event.id,
                  })
                  .eq("id", bestellung.id);
              }
              ordersUpdated++;
              orderIds.push(bestellung.id);
            }
          }

          // New: subscription tracker
          const subRowId = await findOrCreateSubscriptionRowByInvoice(supabase, stripe, invoice);
          if (subRowId) {
            const failureReason = (invoice as any).last_finalization_error?.message
              ?? (invoice as any).billing_reason
              ?? null;
            await recordSubscriptionEvent(supabase, {
              subscription_row_id: subRowId,
              stripe_event_id: event.id,
              event_type: "invoice.payment_failed",
              invoice_id: invoice.id,
              invoice_status: invoice.status ?? "open",
              amount_brutto: invoice.amount_due ? invoice.amount_due / 100 : null,
              failure_reason: failureReason,
              period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
              period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
              raw_payload: invoice,
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] ${event.type}: ${sub.id}, status=${sub.status}`);
        actionType = event.type.replace(/\./g, "_");
        lookupMethod = "subscription_id";

        const subRowId = await upsertSubscription(supabase, sub);
        if (subRowId) {
          await recordSubscriptionEvent(supabase, {
            subscription_row_id: subRowId,
            stripe_event_id: event.id,
            event_type: event.type,
            raw_payload: sub,
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[stripe-webhook] payment_intent.succeeded: ${pi.id}, customer: ${pi.customer}`);
        actionType = "payment_intent_succeeded";
        lookupMethod = "payment_intent_id";

        // Match either by PI directly or via customer for one-time orders that
        // stayed pending because checkout.session.completed didn't arrive paid.
        let { data: matched } = await supabase
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("id, stripe_payment_status")
          .eq("stripe_payment_intent_id", pi.id);

        if ((!matched || matched.length === 0) && pi.customer) {
          const { data: byCustomer } = await supabase
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .select("id, stripe_payment_status")
            .eq("stripe_customer_id", pi.customer as string)
            .in("stripe_payment_status", ["pending", "failed"]);
          matched = byCustomer ?? [];
          lookupMethod = "customer_id_fallback";
        }

        if (matched && matched.length > 0) {
          for (const order of matched) {
            if (order.stripe_payment_status !== "paid") {
              await supabase
                .schema("thermocheck")
                .from("contractor_bestellungen")
                .update({
                  stripe_payment_status: "paid",
                  paid_at: new Date().toISOString(),
                  stripe_payment_intent_id: pi.id,
                  webhook_received_at: new Date().toISOString(),
                  idempotency_key: event.id,
                })
                .eq("id", order.id);
              ordersUpdated++;
              orderIds.push(order.id);
            }
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
