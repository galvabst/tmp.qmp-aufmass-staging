import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutResult {
  checkout_url: string;
  session_id: string;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [waitingForProductKey, setWaitingForProductKey] = useState<string | null>(null);

  const startCheckout = useCallback(async (produktKey: string, groesse?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useStripeCheckout] Starting checkout for: ${produktKey}, groesse: ${groesse}`);

      const { data, error: invokeError } = await supabase.functions.invoke<CheckoutResult>(
        "create-checkout-session",
        {
          body: { 
            produkt_key: produktKey, 
            groesse: groesse || undefined,
          },
        }
      );

      if (invokeError) {
        console.error("[useStripeCheckout] Edge function error:", invokeError);
        const errorMessage = invokeError.message || "Fehler beim Erstellen der Checkout-Session";
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }

      if (!data?.checkout_url) {
        console.error("[useStripeCheckout] No checkout_url in response:", data);
        setError("Keine Checkout-URL erhalten");
        toast.error("Fehler beim Starten der Zahlung");
        return false;
      }

      console.log(`[useStripeCheckout] Redirecting to Stripe: ${data.checkout_url}`);
      
      // Stripe Checkout in neuem Tab öffnen - App bleibt im Hintergrund
      window.open(data.checkout_url, '_blank');
      
      // Polling-Modus aktivieren
      setIsWaitingForPayment(true);
      setWaitingForProductKey(produktKey);
      toast.info('Zahlung wird in neuem Tab geöffnet – warte auf Bestätigung...');
      
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

  const stopWaiting = useCallback(() => {
    setIsWaitingForPayment(false);
    setWaitingForProductKey(null);
  }, []);

  return {
    startCheckout,
    isLoading,
    error,
    isWaitingForPayment,
    waitingForProductKey,
    stopWaiting,
  };
}
