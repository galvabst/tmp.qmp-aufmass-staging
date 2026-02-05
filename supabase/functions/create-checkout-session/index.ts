import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckoutRequest {
  produkt_key: string;
  groesse?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[create-checkout-session] Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 3. Validate JWT with getUser()
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      console.error("[create-checkout-session] JWT validation failed:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    console.log(`[create-checkout-session] User authenticated: ${userId}`);

    // 4. Parse request body
    const body: CheckoutRequest = await req.json();
    const { produkt_key, groesse } = body;

    if (!produkt_key) {
      return new Response(
        JSON.stringify({ error: "produkt_key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Use service role client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 6. Get user's onboarding record
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .schema("thermocheck")
      .from("contractor_onboarding")
      .select("id, user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (onboardingError) {
      console.error("[create-checkout-session] Failed to fetch onboarding:", onboardingError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch onboarding data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!onboarding) {
      console.error("[create-checkout-session] No onboarding found for user:", userId);
      return new Response(
        JSON.stringify({ error: "Onboarding not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Get product from contractor_produkte
    const { data: produkt, error: produktError } = await supabaseAdmin
      .schema("thermocheck")
      .from("contractor_produkte")
      .select("*")
      .eq("produkt_key", produkt_key)
      .eq("ist_aktiv", true)
      .maybeSingle();

    if (produktError || !produkt) {
      console.error("[create-checkout-session] Product not found:", produkt_key, produktError);
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!produkt.stripe_price_id) {
      console.error("[create-checkout-session] Product has no stripe_price_id:", produkt_key);
      return new Response(
        JSON.stringify({ error: "Product not configured for payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-checkout-session] Creating checkout for product: ${produkt_key}, price: ${produkt.stripe_price_id}`);

    // 8. Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("[create-checkout-session] STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // 9. Create or retrieve Stripe customer
    let customerId: string | undefined;
    
    if (userEmail) {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        console.log(`[create-checkout-session] Found existing customer: ${customerId}`);
      } else {
        const newCustomer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            user_id: userId,
            onboarding_id: onboarding.id,
          },
        });
        customerId = newCustomer.id;
        console.log(`[create-checkout-session] Created new customer: ${customerId}`);
      }
    }

    // 10. Determine checkout mode based on product type
    const isSubscription = produkt.produkt_typ === "lizenz";
    const mode = isSubscription ? "subscription" : "payment";

    // 11. Build success/cancel URLs
    const origin = req.headers.get("origin") || "https://quick-measure-pro.lovable.app";
    const successUrl = `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?payment=cancelled`;

    // 12. Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer: customerId,
      customer_email: !customerId ? userEmail : undefined,
      line_items: [
        {
          price: produkt.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        onboarding_id: onboarding.id,
        produkt_key,
        groesse: groesse || "",
      },
      locale: "de",
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log(`[create-checkout-session] Created session: ${session.id}`);

    // 13. Create pending order in contractor_bestellungen
    const { error: insertError } = await supabaseAdmin
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .insert({
        onboarding_id: onboarding.id,
        produkt_typ: produkt.produkt_typ,
        produkt_key: produkt_key,
        stripe_session_id: session.id,
        stripe_payment_status: "pending",
        stripe_customer_id: customerId,
        betrag_netto: produkt.preis_netto,
        betrag_brutto: produkt.preis_brutto,
        groesse: groesse || null,
      });

    if (insertError) {
      console.error("[create-checkout-session] Failed to create order:", insertError);
      // Don't fail - the webhook will handle it as a fallback
    } else {
      console.log(`[create-checkout-session] Created pending order for session: ${session.id}`);
    }

    // 14. Return checkout URL
    return new Response(
      JSON.stringify({ 
        checkout_url: session.url,
        session_id: session.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[create-checkout-session] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
