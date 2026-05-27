import { useState, useMemo } from "react";
import { AlertTriangle, RefreshCw, Info, ExternalLink, ShieldCheck, AlertCircle, CircleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminSubscriptionHealth, SubscriptionHealthRow, HealthLevel,
} from "@/features/admin/hooks/useAdminSubscriptionHealth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return "—"; }
}

const PRODUKT_LABEL: Record<string, string> = {
  "google-workspace": "Google Workspace",
  "scanner-lizenz": "Scanner-Lizenz",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  past_due: "Überfällig",
  unpaid: "Unbezahlt",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
  incomplete_expired: "Abgelaufen",
  paused: "Pausiert",
  trialing: "Test",
};

const INVOICE_LABEL: Record<string, string> = {
  paid: "Bezahlt",
  open: "Offen",
  void: "Storniert",
  uncollectible: "Uneinbringlich",
  draft: "Entwurf",
};

const STEP_LABEL: Record<string, string> = {
  registrierung: "Registrierung",
  profil: "Profil",
  dokumente: "Dokumente",
  bestellungen: "Bestellungen",
  equipment: "Equipment",
  akademie: "Akademie",
  coaching: "Coaching",
  mitfahrt: "Mitfahrt",
  nachweise: "Nachweise",
  fertig: "Fertig",
};

const LEVEL_META: Record<HealthLevel, { label: string; className: string; icon: typeof AlertCircle }> = {
  action_required: {
    label: "Aktion nötig",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    icon: AlertCircle,
  },
  attention: {
    label: "Hinweis",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: CircleAlert,
  },
  ok: {
    label: "OK",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
  },
};

function onboardingBadge(row: SubscriptionHealthRow) {
  const eff = row.effective_onboarding_status;
  if (row.is_trainer) return { label: "Trainer · Einsatzbereit", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (eff === "ready") return { label: "Einsatzbereit", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (eff === "in_progress" || eff === "started" || eff === "mitfahrt" || eff === "invited" || eff === "angelegt") {
    const step = STEP_LABEL[row.current_step ?? ""] ?? row.current_step ?? "Onboarding";
    return { label: `Onboarding · ${step}`, className: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { label: eff ?? "—", className: "bg-muted text-muted-foreground border-transparent" };
}

interface TechnicianGroup {
  onboarding_id: string;
  rows: SubscriptionHealthRow[];
  worst: HealthLevel;
}

const LEVEL_RANK: Record<HealthLevel, number> = { action_required: 0, attention: 1, ok: 2 };

function groupByTechnician(rows: SubscriptionHealthRow[]): TechnicianGroup[] {
  const map = new Map<string, TechnicianGroup>();
  for (const r of rows) {
    let g = map.get(r.onboarding_id);
    if (!g) {
      g = { onboarding_id: r.onboarding_id, rows: [], worst: r.health_level };
      map.set(r.onboarding_id, g);
    }
    g.rows.push(r);
    if (LEVEL_RANK[r.health_level] < LEVEL_RANK[g.worst]) g.worst = r.health_level;
  }
  return Array.from(map.values()).sort(
    (a, b) => LEVEL_RANK[a.worst] - LEVEL_RANK[b.worst],
  );
}

interface SubscriptionHealthPanelProps {
  onSelectContractor?: (onboardingId: string) => void;
}

export function SubscriptionHealthPanel({ onSelectContractor }: SubscriptionHealthPanelProps) {
  const { data: rows, isLoading } = useAdminSubscriptionHealth();
  const [detail, setDetail] = useState<TechnicianGroup | null>(null);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const groups = useMemo(() => groupByTechnician(rows ?? []), [rows]);

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

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base flex items-center gap-2">
              Lizenz- & Abo-Check
              {groups.length > 0 && (
                <Badge variant="destructive">{groups.length}</Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  Aktive Feinaufmaß-Techniker mit auffälligem Stripe-Status für Scanner-Lizenz oder Google Workspace.
                  „Aktion nötig" = echte Zahlungsprobleme. „Hinweis" = z. B. gekündigt, aber letzte Rechnung bezahlt.
                  Trainer werden als einsatzbereit erkannt; gefeuerte/inaktive Techniker sind ausgeblendet.
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
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Alle aktiven Techniker haben gültige Scanner- und Workspace-Abos. ✓
            </p>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <div className="space-y-2">
                {groups.map((g) => {
                  const first = g.rows[0];
                  const fullName = `${first.vorname ?? ""} ${first.nachname ?? ""}`.trim() || "Unbenannter Techniker";
                  const ob = onboardingBadge(first);
                  const meta = LEVEL_META[g.worst];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={g.onboarding_id}
                      onClick={() => setDetail(g)}
                      className="flex w-full items-start gap-3 rounded-lg border bg-card/60 px-3 py-2.5 text-left transition hover:bg-accent/40"
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${g.worst === "action_required" ? "text-destructive" : "text-amber-600"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{fullName}</p>
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${ob.className}`}>
                            {ob.label}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {first.email ?? "—"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {g.rows.map((r) => {
                            const label = PRODUKT_LABEL[r.produkt_key ?? ""] ?? r.produkt_key ?? "—";
                            const rmeta = LEVEL_META[r.health_level];
                            return (
                              <span
                                key={r.subscription_id}
                                className={`rounded-md border px-1.5 py-0.5 text-[10px] ${rmeta.className}`}
                              >
                                {label} · {STATUS_LABEL[r.status] ?? r.status}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>

        <TechnicianDetailDialog
          group={detail}
          onClose={() => setDetail(null)}
          onOpenContractor={onSelectContractor}
        />
      </Card>
    </TooltipProvider>
  );
}

function TechnicianDetailDialog({
  group, onClose, onOpenContractor,
}: {
  group: TechnicianGroup | null;
  onClose: () => void;
  onOpenContractor?: (onboardingId: string) => void;
}) {
  if (!group) return null;
  const first = group.rows[0];
  const fullName = `${first.vorname ?? ""} ${first.nachname ?? ""}`.trim() || "Unbenannter Techniker";
  const ob = onboardingBadge(first);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{fullName}</span>
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${ob.className}`}>
              {ob.label}
            </span>
            {first.email && <span className="text-xs text-muted-foreground">{first.email}</span>}
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {group.rows.map((r) => {
            const meta = LEVEL_META[r.health_level];
            const label = PRODUKT_LABEL[r.produkt_key ?? ""] ?? r.produkt_key ?? "—";
            return (
              <div key={r.subscription_id} className="rounded-lg border bg-card/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{label}</p>
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
                {r.health_reason && (
                  <p className="mt-1 text-xs text-muted-foreground">{r.health_reason}</p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Stripe-Status:</span>{" "}
                    {STATUS_LABEL[r.status] ?? r.status}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Letzte Rechnung:</span>{" "}
                    {r.latest_invoice_status
                      ? INVOICE_LABEL[r.latest_invoice_status] ?? r.latest_invoice_status
                      : "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Letzte bezahlte Bestellung:</span>{" "}
                    {fmtDate(r.last_paid_order_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Periode bis:</span>{" "}
                    {fmtDate(r.current_period_end)}
                  </div>
                  {r.cancel_at_period_end && (
                    <div className="col-span-2 text-amber-700">
                      Kündigung zum Periodenende vorgemerkt
                    </div>
                  )}
                  {r.last_payment_failed_reason && (
                    <div className="col-span-2 text-destructive">
                      Letzter Fehler: {r.last_payment_failed_reason}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex flex-col gap-2 sm:flex-row">
            {onOpenContractor && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onOpenContractor(group.onboarding_id);
                  onClose();
                }}
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Im Feinaufmaß-Hub öffnen
              </Button>
            )}
            {first.stripe_customer_id && (
              <Button asChild variant="outline" className="flex-1">
                <a
                  href={`https://dashboard.stripe.com/customers/${first.stripe_customer_id}`}
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
