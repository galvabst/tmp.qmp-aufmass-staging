import { useQuery } from "@tanstack/react-query";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";

export type HealthLevel = "ok" | "attention" | "action_required";

export interface SubscriptionHealthRow {
  subscription_id: string;
  onboarding_id: string;
  profile_id: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  onboarding_status: string | null;
  effective_onboarding_status: string | null;
  current_step: string | null;
  is_trainer: boolean;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  produkt_key: string | null;
  status: string;
  access_state: "ok" | "warning" | "blocked";
  latest_invoice_status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  last_payment_failed_at: string | null;
  last_payment_failed_reason: string | null;
  last_payment_succeeded_at: string | null;
  last_paid_order_at: string | null;
  last_order_status: string | null;
  consecutive_failures: number;
  aktualisiert_am: string;
  health_level: HealthLevel;
  health_reason: string | null;
}

/**
 * Admin: alle Subscriptions, die Aufmerksamkeit brauchen
 * (health_level != 'ok'). Trainer und gefeuerte/ausgestiegene Techniker
 * werden bereits in der View korrekt behandelt.
 */
export function useAdminSubscriptionHealth() {
  return useQuery<SubscriptionHealthRow[]>({
    queryKey: ["admin-subscription-health"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from("v_subscription_health")
        .select("*")
        .neq("health_level", "ok")
        .order("health_level", { ascending: true })
        .order("nachname", { ascending: true });

      if (error) {
        console.error("[useAdminSubscriptionHealth] error:", error);
        throw error;
      }
      return (data ?? []) as SubscriptionHealthRow[];
    },
  });
}
