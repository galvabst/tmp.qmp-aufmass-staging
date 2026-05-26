import { useQuery } from "@tanstack/react-query";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

export type SubscriptionAccessState = "ok" | "warning" | "blocked";

export interface SubscriptionAccess {
  access_state: SubscriptionAccessState;
  worst_subscription_id: string | null;
  worst_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_payment_failed_at: string | null;
  produkt_key: string | null;
}

/**
 * Hook that reads the aggregated worst-case subscription access state
 * for the currently logged-in technician. Drives warning banner and
 * blocked-modal in the app.
 */
export function useSubscriptionAccess() {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  return useQuery<SubscriptionAccess>({
    queryKey: ["subscription-access", userId],
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabaseTC.rpc("get_my_subscription_access");
      if (error) {
        console.error("[useSubscriptionAccess] RPC error:", error);
        throw error;
      }
      const row = Array.isArray(data) ? data[0] : data;
      return (row as SubscriptionAccess) ?? {
        access_state: "ok",
        worst_subscription_id: null,
        worst_status: null,
        current_period_end: null,
        cancel_at_period_end: false,
        last_payment_failed_at: null,
        produkt_key: null,
      };
    },
  });
}
