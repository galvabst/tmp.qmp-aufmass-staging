import { AlertTriangle, Lock, ExternalLink } from "lucide-react";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const STRIPE_PORTAL_URL = "https://billing.stripe.com/p/login/test_xxx"; // Wird vom Innendienst ersetzt / per Edge Function dynamisiert.

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
 * Banner-Variante: für `access_state === 'warning'`.
 * Wird oben im Techniker-Hub eingeblendet.
 */
export function SubscriptionWarningBanner() {
  const { data } = useSubscriptionAccess();
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
            {reason} Bitte verlängern, sonst wird dein Account gesperrt.
          </p>
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto p-0 text-amber-900 dark:text-amber-100"
          >
            <a href={STRIPE_PORTAL_URL} target="_blank" rel="noreferrer">
              Zahlungsmethode aktualisieren <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Blocking-Variante: für `access_state === 'blocked'`.
 * Vollbild-Modal, das den Techniker an der Nutzung hindert.
 */
export function SubscriptionBlockedOverlay() {
  const { data } = useSubscriptionAccess();
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
          <p className="mb-6 text-sm text-muted-foreground">
            Deine Zahlung ist fehlgeschlagen oder dein Abo ist abgelaufen.
            Bitte verlängere dein Abonnement, bevor du den nächsten Auftrag
            annehmen oder bearbeiten kannst.
          </p>
          <Button asChild className="w-full">
            <a href={STRIPE_PORTAL_URL} target="_blank" rel="noreferrer">
              Jetzt verlängern <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
