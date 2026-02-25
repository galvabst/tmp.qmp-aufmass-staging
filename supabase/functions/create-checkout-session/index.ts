import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckoutItem {
  produkt_key: string;
  groesse?: string;
  menge?: number;
}

interface CheckoutRequestLegacy {
  produkt_key: string;
  groesse?: string;
  menge?: number;
}

interface CheckoutRequestMulti {
  items: CheckoutItem[];
}

function parseItems(body: CheckoutRequestLegacy & CheckoutRequestMulti): CheckoutItem[] {
  // Multi-Item Format
  if (Array.isArray(body.items) && body.items.length > 0) {
    return body.items.map((item) => ({
      produkt_key: item.produkt_key,
      groesse: item.groesse || undefined,
      menge: Math.max(1, Math.min(10, Math.floor(item.menge || 1))),
    }));
  }
  // Legacy single-item format
  if (body.produkt_key) {
    return [{
      produkt_key: body.produkt_key,
      groesse: body.groesse || undefined,
      menge: Math.max(1, Math.min(10, Math.floor(body.menge || 1))),
    }];
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    console.log(`[create-checkout-session] User: ${userId}`);

    // 2. Parse items
    const body = await req.json();
    const items = parseItems(body);

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (items.length > 5) {
      return new Response(
        JSON.stringify({ error: "Max 5 items per checkout" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Get onboarding record
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .schema("thermocheck")
      .from("contractor_onboarding")
      .select("id, profile_id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (onboardingError || !onboarding) {
      console.error("[create-checkout-session] Onboarding not found:", onboardingError);
      return new Response(
        JSON.stringify({ error: "Onboarding not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Load all products for the items
    const produktKeys = items.map((i) => i.produkt_key);
    const { data: produkte, error: produkteError } = await supabaseAdmin
      .schema("thermocheck")
      .from("contractor_produkte")
      .select("*")
      .in("produkt_key", produktKeys)
      .eq("ist_aktiv", true);

    if (produkteError || !produkte || produkte.length === 0) {
      console.error("[create-checkout-session] Products not found:", produkteError);
      return new Response(
        JSON.stringify({ error: "Products not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all requested products exist
    const produktMap = new Map(produkte.map((p: any) => [p.produkt_key, p]));
    for (const item of items) {
      const produkt = produktMap.get(item.produkt_key);
      if (!produkt) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.produkt_key}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!produkt.stripe_price_id) {
        return new Response(
          JSON.stringify({ error: `Product not configured for payment: ${item.produkt_key}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if ((item.menge || 1) > 1 && !produkt.erlaubt_mehrfach) {
        return new Response(
          JSON.stringify({ error: `${item.produkt_key} kann nur einzeln bestellt werden` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 5. Validate no mixed modes (payment vs subscription)
    const modes = new Set(produkte.map((p: any) => p.produkt_typ === "lizenz" ? "subscription" : "payment"));
    if (modes.size > 1) {
      return new Response(
        JSON.stringify({ error: "Einmalzahlungen und Abos können nicht zusammen bestellt werden" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const isSubscription = modes.has("subscription");
    const mode = isSubscription ? "subscription" : "payment";

    console.log(`[create-checkout-session] ${items.length} items, mode: ${mode}`);

    // 6. Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // 7. Customer
    let customerId: string | undefined;
    if (userEmail) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: userEmail,
          metadata: { user_id: userId, onboarding_id: onboarding.id },
        });
        customerId = newCustomer.id;
      }
    }

    // 8. Build line_items
    const line_items = items.map((item) => {
      const produkt = produktMap.get(item.produkt_key)!;
      return {
        price: produkt.stripe_price_id,
        quantity: item.menge || 1,
      };
    });

    // 9. URLs
    const origin = req.headers.get("origin") || "https://quick-measure-pro.lovable.app";
    const successUrl = `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?payment=cancelled`;

    // 10. Create session
    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      customer_email: !customerId ? userEmail : undefined,
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        onboarding_id: onboarding.id,
        produkt_keys: produktKeys.join(","),
        // Legacy single-item fields for backwards compat
        produkt_key: produktKeys[0],
        groesse: items[0].groesse || "",
        menge: String(items[0].menge || 1),
      },
      locale: "de",
    });

    console.log(`[create-checkout-session] Session: ${session.id}, items: ${produktKeys.join(",")}`);

    // 11. Create DB orders (one per item, same session_id)
    for (const item of items) {
      const produkt = produktMap.get(item.produkt_key)!;
      const menge = item.menge || 1;

      if (produkt.erlaubt_mehrfach) {
        // Check if a pending order already exists for this product
        const { data: existingMulti } = await supabaseAdmin
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("id")
          .eq("onboarding_id", onboarding.id)
          .eq("produkt_key", item.produkt_key)
          .eq("stripe_payment_status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingMulti) {
          // Update existing pending row instead of creating a new one
          const { error: updateError } = await supabaseAdmin
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_session_id: session.id,
              stripe_customer_id: customerId,
              groesse: item.groesse || null,
              menge,
            })
            .eq("id", existingMulti.id);
          if (updateError) console.error("[create-checkout-session] Update error:", updateError);
          else console.log(`[create-checkout-session] Updated existing pending order: ${item.produkt_key} x${menge}`);
        } else {
          const { error: insertError } = await supabaseAdmin
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .insert({
              onboarding_id: onboarding.id,
              produkt_typ: produkt.produkt_typ,
              produkt_key: item.produkt_key,
              stripe_session_id: session.id,
              stripe_payment_status: "pending",
              stripe_customer_id: customerId,
              betrag_netto: produkt.preis_netto,
              betrag_brutto: produkt.preis_brutto,
              groesse: item.groesse || null,
              menge,
            });
          if (insertError) console.error("[create-checkout-session] Insert error:", insertError);
          else console.log(`[create-checkout-session] Order created: ${item.produkt_key} x${menge}`);
        }
      } else {
        // Single-order: upsert existing pending
        const { data: existing } = await supabaseAdmin
          .schema("thermocheck")
          .from("contractor_bestellungen")
          .select("id")
          .eq("onboarding_id", onboarding.id)
          .eq("produkt_key", item.produkt_key)
          .eq("stripe_payment_status", "pending")
          .maybeSingle();

        if (existing) {
          await supabaseAdmin
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .update({
              stripe_session_id: session.id,
              stripe_customer_id: customerId,
              groesse: item.groesse || null,
              menge: 1,
            })
            .eq("id", existing.id);
        } else {
          await supabaseAdmin
            .schema("thermocheck")
            .from("contractor_bestellungen")
            .insert({
              onboarding_id: onboarding.id,
              produkt_typ: produkt.produkt_typ,
              produkt_key: item.produkt_key,
              stripe_session_id: session.id,
              stripe_payment_status: "pending",
              stripe_customer_id: customerId,
              betrag_netto: produkt.preis_netto,
              betrag_brutto: produkt.preis_brutto,
              groesse: item.groesse || null,
              menge: 1,
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ checkout_url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[create-checkout-session] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
