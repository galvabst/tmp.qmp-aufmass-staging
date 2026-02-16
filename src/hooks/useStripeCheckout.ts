import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutResult {
  checkout_url: string;
  session_id: string;
}

interface CheckoutItem {
  produktKey: string;
  groesse?: string;
  menge?: number;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Legacy single-item checkout (backwards compatible)
  const startCheckout = useCallback(async (produktKey: string, groesse?: string, menge?: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useStripeCheckout] Single checkout: ${produktKey}, groesse: ${groesse}, menge: ${menge || 1}`);

      const { data, error: invokeError } = await supabase.functions.invoke<CheckoutResult>(
        "create-checkout-session",
        {
          body: { 
            produkt_key: produktKey, 
            groesse: groesse || undefined,
            menge: menge || 1,
          },
        }
      );

      if (invokeError) {
        console.error("[useStripeCheckout] Error:", invokeError);
        const errorMessage = invokeError.message || "Fehler beim Erstellen der Checkout-Session";
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }

      if (!data?.checkout_url) {
        setError("Keine Checkout-URL erhalten");
        toast.error("Fehler beim Starten der Zahlung");
        return false;
      }

      console.log(`[useStripeCheckout] Redirecting: ${data.checkout_url}`);
      window.location.href = data.checkout_url;
      return true;

    } catch (err) {
      console.error("[useStripeCheckout] Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(errorMessage);
      toast.error("Fehler beim Starten der Zahlung");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Multi-item checkout (Sammel-Checkout)
  const startMultiCheckout = useCallback(async (items: CheckoutItem[]): Promise<boolean> => {
    if (items.length === 0) {
      toast.error("Keine Produkte ausgewählt");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useStripeCheckout] Multi checkout: ${items.map(i => i.produktKey).join(", ")}`);

      const { data, error: invokeError } = await supabase.functions.invoke<CheckoutResult>(
        "create-checkout-session",
        {
          body: {
            items: items.map(item => ({
              produkt_key: item.produktKey,
              groesse: item.groesse || undefined,
              menge: item.menge || 1,
            })),
          },
        }
      );

      if (invokeError) {
        console.error("[useStripeCheckout] Multi error:", invokeError);
        const errorMessage = invokeError.message || "Fehler beim Erstellen der Checkout-Session";
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }

      if (!data?.checkout_url) {
        setError("Keine Checkout-URL erhalten");
        toast.error("Fehler beim Starten der Zahlung");
        return false;
      }

      console.log(`[useStripeCheckout] Multi redirect: ${data.checkout_url}`);
      window.location.href = data.checkout_url;
      return true;

    } catch (err) {
      console.error("[useStripeCheckout] Multi unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(errorMessage);
      toast.error("Fehler beim Starten der Zahlung");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    startCheckout,
    startMultiCheckout,
    isLoading,
    error,
  };
}
