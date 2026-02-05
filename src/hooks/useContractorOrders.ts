import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractorBestellung {
  id: string;
  onboarding_id: string;
  produkt_typ: "kleidung" | "lizenz" | "coaching";
  produkt_key: string;
  stripe_session_id: string | null;
  stripe_payment_status: "pending" | "paid" | "failed" | "refunded";
  stripe_payment_intent_id: string | null;
  betrag_netto: number | null;
  betrag_brutto: number | null;
  created_at: string;
  paid_at: string | null;
  groesse: string | null;
}

/**
 * Hook to fetch contractor's orders from the database
 * Used to sync payment status after Stripe redirect
 */
export function useContractorOrders(onboardingId: string | null) {
  return useQuery({
    queryKey: ["contractor-orders", onboardingId],
    queryFn: async (): Promise<ContractorBestellung[]> => {
      if (!onboardingId) return [];

      // Use fetch to access thermocheck schema directly
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      const response = await fetch(
        `https://keplsvhudmfaagixttql.supabase.co/rest/v1/contractor_bestellungen?onboarding_id=eq.${onboardingId}&order=created_at.desc`,
        {
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY",
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
            "Accept-Profile": "thermocheck",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("[useContractorOrders] Failed to fetch orders:", response.status);
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      return (data || []) as ContractorBestellung[];
    },
    enabled: !!onboardingId,
    staleTime: 30 * 1000, // 30 seconds - refetch more often for payment status
  });
}

/**
 * Get paid product keys from orders
 */
export function getPaidProductKeys(orders: ContractorBestellung[]): string[] {
  return orders
    .filter(order => order.stripe_payment_status === "paid")
    .map(order => order.produkt_key);
}
