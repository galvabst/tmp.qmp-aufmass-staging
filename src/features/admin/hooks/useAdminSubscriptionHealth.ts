import { useQuery } from "@tanstack/react-query";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";

export interface SubscriptionHealthRow {
  subscription_id: string;
  onboarding_id: string;
  profile_id: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  produkt_key: string | null;
  status: string;
  access_state: "ok" | "warning" | "blocked";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  last_payment_failed_at: string | null;
  last_payment_failed_reason: string | null;
  last_payment_succeeded_at: string | null;
  consecutive_failures: number;
  aktualisiert_am: string;
}

/**
 * Admin: alle Subscriptions mit Problemen
 * (access_state != 'ok' ODER status nicht 'active').
 */
export function useAdminSubscriptionHealth() {
  return useQuery<SubscriptionHealthRow[]>({
    queryKey: ["admin-subscription-health"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from("v_subscription_health")
        .select("*")
        .neq("access_state", "ok")
        .order("aktualisiert_am", { ascending: false });

      if (error) {
        console.error("[useAdminSubscriptionHealth] error:", error);
        throw error;
      }
      return (data ?? []) as SubscriptionHealthRow[];
    },
  });
}
