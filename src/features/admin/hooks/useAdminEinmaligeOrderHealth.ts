import { useQuery } from "@tanstack/react-query";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";
import type { HealthLevel } from "./useAdminSubscriptionHealth";

export interface EinmaligeOrderHealthRow {
  order_id: string;
  onboarding_id: string;
  profile_id: string | null;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  onboarding_status: string | null;
  effective_onboarding_status: string | null;
  current_step: string | null;
  is_trainer: boolean;
  produkt_key: string;
  stripe_payment_status: string;
  betrag_brutto: number | null;
  paid_at: string | null;
  created_at: string;
  stripe_session_id: string | null;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  health_level: HealthLevel;
  health_reason: string | null;
}

/**
 * Admin: einmalige Bestellungen mit Zahlungsproblemen
 * (pending > 24h oder failed). Trainer/gefeuerte/inaktive bereits ausgefiltert.
 */
export function useAdminEinmaligeOrderHealth() {
  return useQuery<EinmaligeOrderHealthRow[]>({
    queryKey: ["admin-einmalige-order-health"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from("v_einmalige_order_health" as any)
        .select("*")
        .neq("health_level", "ok");

      if (error) {
        console.error("[useAdminEinmaligeOrderHealth] error:", error);
        throw error;
      }
      return (data ?? []) as unknown as EinmaligeOrderHealthRow[];
    },
  });
}
