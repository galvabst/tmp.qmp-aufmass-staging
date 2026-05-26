import { useState, useMemo } from "react";
import { AlertTriangle, Lock, RefreshCw, History, Info, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAdminSubscriptionHealth, SubscriptionHealthRow } from "@/features/admin/hooks/useAdminSubscriptionHealth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return "—"; }
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  active: { label: "Aktiv", variant: "default" },
  past_due: { label: "Überfällig", variant: "secondary" },
  unpaid: { label: "Unbezahlt", variant: "destructive" },
  canceled: { label: "Gekündigt", variant: "destructive" },
  incomplete: { label: "Unvollständig", variant: "outline" },
  incomplete_expired: { label: "Abgelaufen", variant: "destructive" },
  paused: { label: "Pausiert", variant: "secondary" },
  trialing: { label: "Test", variant: "outline" },
};

const PRODUKT_LABEL: Record<string, string> = {
  "google-workspace": "Google Workspace",
  "scanner-lizenz": "Scanner-Lizenz",
};

const ONBOARDING_STEP_LABEL: Record<string, string> = {
  registrierung: "Registrierung",
  vertrag: "Vertrag",
  akademie: "Akademie",
  coaching: "Coaching",
  mitfahrt: "Mitfahrt",
  nachweise: "Nachweise",
  fertig: "Fertig",
};

function onboardingBadge(row: SubscriptionHealthRow) {
  if (row.onboarding_status === "ready") return { label: "Einsatzbereit", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (row.onboarding_status === "in_progress") {
    const step = ONBOARDING_STEP_LABEL[row.current_step ?? ""] ?? row.current_step ?? "Onboarding";
    return { label: `Onboarding · ${step}`, className: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  return { label: row.onboarding_status ?? "—", className: "bg-muted text-muted-foreground" };
}

interface SubscriptionEvent {
  id: string;
  event_type: string;
  invoice_id: string | null;
  invoice_status: string | null;
  amount_brutto: number | null;
  failure_reason: string | null;
  period_start: string | null;
  period_end: string | null;
  erstellt_am: string;
}

function useSubscriptionEvents(subscriptionId: string | null) {
  return useQuery<SubscriptionEvent[]>({
    queryKey: ["subscription-events", subscriptionId],
    enabled: !!subscriptionId,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from("contractor_subscription_events")
        .select("id, event_type, invoice_id, invoice_status, amount_brutto, failure_reason, period_start, period_end, erstellt_am")
        .eq("subscription_id", subscriptionId!)
        .order("erstellt_am", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SubscriptionEvent[];
    },
  });
}

export function SubscriptionHealthPanel() {
  const { data: rows, isLoading } = useAdminSubscriptionHealth();
  const [detail, setDetail] = useState<SubscriptionHealthRow | null>(null);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("reconcile-stripe-orders", {
        body: { mode: "subscriptions", trigger: "admin_manual" },
      });
      if (error) throw error;
      toast.success("Subscription-Abgleich gestartet.");
      await queryClient.invalidateQueries({ queryKey: ["admin-subscription-health"] });
    } catch (err) {
      toast.error(`Abgleich fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSyncing(false);
    }
  };

  // Eindeutige Techniker zählen (nicht Subscriptions)
  const uniqueContractorCount = useMemo(() => {
    if (!rows) return 0;
    return new Set(rows.map((r) => r.onboarding_id)).size;
  }, [rows]);

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base flex items-center gap-2">
              Subscription-Health
              {uniqueContractorCount > 0 && (
                <Badge variant="destructive">{uniqueContractorCount}</Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Aktive Feinaufmaß-Techniker, deren Stripe-Abo (Scanner-Lizenz oder Google Workspace) gekündigt, überfällig oder unbezahlt ist.
                  Gefeuerte und abgelehnte Techniker sind ausgeblendet. Klick auf einen Eintrag öffnet Event-Historie und Stripe-Link.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            <span className="ml-1 hidden sm:inline">Abgleich</span>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Lade …</p>
          ) : !rows || rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Alle aktiven Techniker haben gültige Abos. ✓</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {rows.map((row) => {
                  const badge = STATUS_BADGE[row.status] ?? { label: row.status, variant: "outline" as const };
                  const ob = onboardingBadge(row);
                  const produkt = PRODUKT_LABEL[row.produkt_key ?? ""] ?? row.produkt_key ?? "—";
                  const fullName = `${row.vorname ?? ""} ${row.nachname ?? ""}`.trim() || "Unbenannter Techniker";
                  return (
                    <button
                      key={row.subscription_id}
                      onClick={() => setDetail(row)}
                      className="flex w-full items-center justify-between rounded-lg border bg-card/60 px-3 py-2 text-left transition hover:bg-accent/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {row.access_state === "blocked" && <Lock className="h-3.5 w-3.5 text-destructive" />}
                          <p className="truncate text-sm font-medium">{fullName}</p>
                          <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${ob.className}`}>
                            {ob.label}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.email ?? "—"} · {produkt} · läuft am {fmtDate(row.current_period_end)}
                          {row.consecutive_failures > 0 && ` · ${row.consecutive_failures}× fehlgeschlagen`}
                        </p>
                      </div>
                      <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>

        <SubscriptionDetailDialog row={detail} onClose={() => setDetail(null)} />
      </Card>
    </TooltipProvider>
  );
}

function SubscriptionDetailDialog({
  row, onClose,
}: { row: SubscriptionHealthRow | null; onClose: () => void }) {
  const { data: events } = useSubscriptionEvents(row?.subscription_id ?? null);

  if (!row) return null;
  const produkt = PRODUKT_LABEL[row.produkt_key ?? ""] ?? row.produkt_key ?? "—";
  const fullName = `${row.vorname ?? ""} ${row.nachname ?? ""}`.trim() || "Unbenannter Techniker";
  const ob = onboardingBadge(row);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{fullName}</span>
            <span className="text-sm font-normal text-muted-foreground">· {produkt}</span>
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${ob.className}`}>{ob.label}</span>
            {row.email && <span className="text-xs text-muted-foreground">{row.email}</span>}
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-xs">
            <div><span className="text-muted-foreground">Status:</span> {row.status}</div>
            <div><span className="text-muted-foreground">Zugang:</span> {row.access_state}</div>
            <div><span className="text-muted-foreground">Periode bis:</span> {fmtDate(row.current_period_end)}</div>
            <div><span className="text-muted-foreground">Kündigt:</span> {row.cancel_at_period_end ? "Ja" : "Nein"}</div>
            <div className="col-span-2"><span className="text-muted-foreground">Letzter Fehler:</span> {row.last_payment_failed_reason ?? "—"}</div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Event-Historie</p>
            <ScrollArea className="max-h-64">
              <div className="space-y-1.5">
                {(events ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Noch keine Events erfasst.</p>
                )}
                {(events ?? []).map((e) => {
                  const isSuccess = e.event_type === "invoice.paid";
                  const isFail = e.event_type === "invoice.payment_failed";
                  return (
                    <div key={e.id} className="flex items-start gap-2 rounded border bg-card/40 px-2 py-1.5 text-xs">
                      <span
                        className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
                          isSuccess ? "bg-emerald-500" : isFail ? "bg-destructive" : "bg-muted-foreground"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{e.event_type}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {fmtDate(e.erstellt_am)}
                          </span>
                        </div>
                        {(e.amount_brutto || e.failure_reason) && (
                          <p className="truncate text-muted-foreground">
                            {e.amount_brutto != null && `${e.amount_brutto.toFixed(2)} €`}
                            {e.failure_reason && ` · ${e.failure_reason}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/admin/contractors/${row.onboarding_id}`} onClick={onClose}>
                <ExternalLink className="mr-1 h-4 w-4" />
                Im Feinaufmaß-Hub öffnen
              </Link>
            </Button>
            {row.stripe_customer_id && (
              <Button asChild variant="outline" className="flex-1">
                <a
                  href={`https://dashboard.stripe.com/customers/${row.stripe_customer_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  In Stripe öffnen
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
