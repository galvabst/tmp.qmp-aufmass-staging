import { AlertTriangle, Lock } from "lucide-react";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useMyContractorOnboardingId } from "@/hooks/useAkademieFortschritt";
import { useQuery } from "@tanstack/react-query";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * Returns true only when the contractor has finished onboarding (onboarding_status = 'ready').
 * Subscription warnings/blocks must NOT be shown during onboarding — at that point the
 * Innendienst handles activation manually.
 */
function useIsReadyContractor(): boolean {
  const { data: onboardingId } = useMyContractorOnboardingId();
  const { data: status } = useQuery({
    queryKey: ["my-onboarding-status-for-subscription-gate", onboardingId],
    enabled: !!onboardingId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabaseTC.rpc("get_my_contractor_onboarding");
      if (error) return null;
      const row = Array.isArray(data) ? data[0] : data;
      return (row?.onboarding_status as string | undefined) ?? null;
    },
  });
  return status === "ready";
}

/**
 * Banner-Variante: für `access_state === 'warning'`.
 */
export function SubscriptionWarningBanner() {
  const { data } = useSubscriptionAccess();
  const isReady = useIsReadyContractor();
  if (!isReady) return null;
  if (!data || data.access_state !== "warning") return null;

  const endsAt = formatDate(data.current_period_end);
  const reason = data.cancel_at_period_end
    ? `Dein Abonnement läuft am ${endsAt} aus.`
    : data.last_payment_failed_at
      ? `Deine letzte Abbuchung ist fehlgeschlagen.`
      : `Es gibt ein Problem mit deinem Abonnement.`;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-950/40">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {reason} Bitte kontaktiere deine Ansprechperson im Innendienst, um dein Abonnement zu klären.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Blocking-Variante: für `access_state === 'blocked'`.
 * Wird NICHT während dem Onboarding angezeigt — dort steuert der Innendienst die Aktivierung.
 */
export function SubscriptionBlockedOverlay() {
  const { data } = useSubscriptionAccess();
  const isReady = useIsReadyContractor();
  if (!isReady) return null;
  if (!data || data.access_state !== "blocked") return null;

  return (
    <Dialog open>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-3">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">
            Dein Abonnement ist nicht aktiv
          </h2>
          <p className="text-sm text-muted-foreground">
            Deine Zahlung ist fehlgeschlagen oder dein Abo ist abgelaufen.
            Bitte kontaktiere deine Ansprechperson im Innendienst, damit dein
            Account wieder freigeschaltet werden kann.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
