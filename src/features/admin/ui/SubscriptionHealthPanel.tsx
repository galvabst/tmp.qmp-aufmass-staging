import { useState, useMemo } from "react";
import { AlertTriangle, RefreshCw, Info, ExternalLink, ShieldCheck, AlertCircle, CircleAlert, Zap, CheckCircle2, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminSubscriptionHealth, SubscriptionHealthRow, HealthLevel,
} from "@/features/admin/hooks/useAdminSubscriptionHealth";
import {
  useAdminEinmaligeOrderHealth, EinmaligeOrderHealthRow,
} from "@/features/admin/hooks/useAdminEinmaligeOrderHealth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";
import { toast } from "sonner";

type PipelineFilter = "all" | "onboarding" | "active";
type TypFilter = "all" | "abo" | "einmalig";

const PRODUKT_LABEL_EINMALIG: Record<string, string> = {
  "ausweiskarte": "Ausweiskarte",
  "pullover": "Pullover",
  "schlappen": "Schlappen",
  "arbeitsschuhe": "Arbeitsschuhe",
};

function isActiveContractor(row: { effective_onboarding_status: string | null; is_trainer: boolean }) {
  return row.is_trainer || row.effective_onboarding_status === "ready";
}

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

function onboardingBadge(row: {
  effective_onboarding_status: string | null;
  current_step: string | null;
  is_trainer: boolean;
}) {
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
  rows: SubscriptionHealthRow[];          // Abos
  einmalig_rows: EinmaligeOrderHealthRow[]; // Einmal-Bestellungen
  worst: HealthLevel;
  // Erstes Identitäts-Row (Name/E-Mail/Onboarding-Status) — bevorzugt aus Abos, sonst Einmalig
  identity: {
    vorname: string | null;
    nachname: string | null;
    email: string | null;
    effective_onboarding_status: string | null;
    current_step: string | null;
    is_trainer: boolean;
    onboarding_status: string | null;
    stripe_customer_id: string | null;
  };
}

const LEVEL_RANK: Record<HealthLevel, number> = { action_required: 0, attention: 1, ok: 2 };

function groupByTechnician(
  aboRows: SubscriptionHealthRow[],
  einmaligRows: EinmaligeOrderHealthRow[],
): TechnicianGroup[] {
  const map = new Map<string, TechnicianGroup>();
  const ensure = (id: string, identity: TechnicianGroup["identity"]): TechnicianGroup => {
    let g = map.get(id);
    if (!g) {
      g = { onboarding_id: id, rows: [], einmalig_rows: [], worst: "ok", identity };
      map.set(id, g);
    }
    return g;
  };
  for (const r of aboRows) {
    const g = ensure(r.onboarding_id, {
      vorname: r.vorname, nachname: r.nachname, email: r.email,
      effective_onboarding_status: r.effective_onboarding_status,
      current_step: r.current_step, is_trainer: r.is_trainer,
      onboarding_status: r.onboarding_status,
      stripe_customer_id: r.stripe_customer_id,
    });
    g.rows.push(r);
    if (LEVEL_RANK[r.health_level] < LEVEL_RANK[g.worst]) g.worst = r.health_level;
  }
  for (const r of einmaligRows) {
    const g = ensure(r.onboarding_id, {
      vorname: r.vorname, nachname: r.nachname, email: r.email,
      effective_onboarding_status: r.effective_onboarding_status,
      current_step: r.current_step, is_trainer: r.is_trainer,
      onboarding_status: r.onboarding_status,
      stripe_customer_id: r.stripe_customer_id,
    });
    g.einmalig_rows.push(r);
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
  const { data: aboRows, isLoading: aboLoading } = useAdminSubscriptionHealth();
  const { data: einmaligRows, isLoading: einmaligLoading } = useAdminEinmaligeOrderHealth();
  const [detail, setDetail] = useState<TechnicianGroup | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("all");
  const [typFilter, setTypFilter] = useState<TypFilter>("all");
  const queryClient = useQueryClient();

  const isLoading = aboLoading || einmaligLoading;

  const allGroups = useMemo(
    () => groupByTechnician(aboRows ?? [], einmaligRows ?? []),
    [aboRows, einmaligRows],
  );

  // Filter anwenden — Pipeline + Typ. Wenn ein Typ leer wird, fällt die Gruppe weg.
  const groups = useMemo(() => {
    return allGroups
      .map((g) => {
        const keepAbo = typFilter === "all" || typFilter === "abo";
        const keepEinmalig = typFilter === "all" || typFilter === "einmalig";
        return {
          ...g,
          rows: keepAbo ? g.rows : [],
          einmalig_rows: keepEinmalig ? g.einmalig_rows : [],
        };
      })
      .filter((g) => g.rows.length + g.einmalig_rows.length > 0)
      .filter((g) => {
        if (pipelineFilter === "all") return true;
        const active = isActiveContractor(g.identity);
        return pipelineFilter === "active" ? active : !active;
      })
      .map((g) => {
        // worst neu berechnen nach Filter
        const all: HealthLevel[] = [
          ...g.rows.map((r) => r.health_level),
          ...g.einmalig_rows.map((r) => r.health_level),
        ];
        const worst = all.reduce<HealthLevel>(
          (acc, lvl) => (LEVEL_RANK[lvl] < LEVEL_RANK[acc] ? lvl : acc),
          "ok",
        );
        return { ...g, worst };
      });
  }, [allGroups, pipelineFilter, typFilter]);

  const [kittens, setKittens] = useState<{ id: number; top: number; delay: number; duration: number; size: number; dir: 1 | -1 }[]>([]);
  const launchKittens = () => {
    const now = Date.now();
    const items = Array.from({ length: 14 }, (_, i) => ({
      id: now + i,
      top: Math.random() * 80 + 5,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 0.9,
      size: 28 + Math.random() * 28,
      dir: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
    }));
    setKittens(items);
    window.setTimeout(() => setKittens([]), 2600);
  };

  const handleSync = async () => {
    launchKittens();
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("reconcile-stripe-orders", {
        body: { mode: "subscriptions", trigger: "admin_manual" },
      });
      if (error) throw error;
      toast.success("Subscription-Abgleich gestartet.");
      await queryClient.invalidateQueries({ queryKey: ["admin-subscription-health"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-einmalige-order-health"] });
    } catch (err) {
      toast.error(`Abgleich fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSyncing(false);
    }
  };


  const [liveSyncing, setLiveSyncing] = useState(false);
  const handleLiveSyncAll = async () => {
    if (groups.length === 0) return;
    setLiveSyncing(true);
    const ids = groups.map((g) => g.onboarding_id);
    let done = 0; let newSubs = 0; let warns = 0;
    const errs: string[] = [];
    for (const id of ids) {
      try {
        const { data, error } = await supabase.functions.invoke("stripe-sync-contractor", {
          body: { onboarding_id: id },
        });
        if (error) throw error;
        const r = data?.results?.[0];
        if (r) {
          newSubs += r.subscriptions_new ?? 0;
          warns += (r.warnings?.length ?? 0);
        }
      } catch (e) {
        errs.push(e instanceof Error ? e.message : String(e));
      }
      done++;
      toast.message(`Live-Abgleich ${done} / ${ids.length}`, {
        description: `${newSubs} neue Subs gefunden${warns ? ` · ${warns} Hinweise` : ""}`,
        id: "live-sync-all",
      });
    }
    setLiveSyncing(false);
    await queryClient.invalidateQueries({ queryKey: ["admin-subscription-health"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-einmalige-order-health"] });
    if (errs.length === 0) toast.success(`Live-Abgleich fertig: ${ids.length} Techniker, ${newSubs} neue Subs erkannt.`);
    else toast.error(`Live-Abgleich mit Fehlern: ${errs.length} / ${ids.length}. Siehe Konsole.`);
    if (errs.length > 0) console.error("[live-sync-all] errors:", errs);
  };

  const [stripeLiveSyncing, setStripeLiveSyncing] = useState(false);
  const handleStripeLiveSync = async (hours: 24 | 48) => {
    setStripeLiveSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-live-sync", {
        body: { hours },
      });
      if (error) throw error;
      const updated = data?.updated ?? 0;
      const inserted = data?.inserted ?? 0;
      const unmatched = (data?.unmatched ?? []) as Array<{ stripe_id: string; customer_email: string | null; amount: number | null; reason: string }>;
      const errs = (data?.errors ?? []) as Array<{ stripe_id: string; error: string }>;
      const checked = (data?.checked_subscriptions ?? 0) + (data?.checked_payment_intents ?? 0);

      if (updated + inserted > 0) {
        toast.success(`Stripe Live-Sync (${hours}h): ${inserted} neu angelegt, ${updated} aktualisiert (${checked} Stripe-Objekte geprüft).`);
      } else {
        toast.success(`Stripe Live-Sync (${hours}h): keine Änderungen nötig (${checked} Stripe-Objekte geprüft).`);
      }
      if (unmatched.length > 0) {
        console.warn("[stripe-live-sync] unmatched:", unmatched);
        toast.warning(`${unmatched.length} Stripe-Zahlung(en) ohne Zuordnung — siehe Konsole für Details.`);
      }
      if (errs.length > 0) {
        console.error("[stripe-live-sync] errors:", errs);
        toast.error(`${errs.length} Fehler beim Sync — siehe Konsole.`);
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-subscription-health"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-einmalige-order-health"] });
    } catch (err) {
      toast.error(`Stripe Live-Sync fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStripeLiveSyncing(false);
    }
  };

  const totalUnfilteredCount = allGroups.length;

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base flex items-center gap-2">
              Lizenz- & Abo-Check
              {totalUnfilteredCount > 0 && (
                <Badge variant="destructive">{totalUnfilteredCount}</Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                  Techniker mit auffälligem Stripe-Status für Abos (Scanner-Lizenz, Google Workspace) oder einmalige Bestellungen (z. B. Pullover, Ausweiskarte).
                  Filter darunter trennen Pipeline (Onboarding / Aktiv) und Bestelltyp.
                  Trainer werden als einsatzbereit erkannt; gefeuerte/inaktive Techniker sind ausgeblendet.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={stripeLiveSyncing || liveSyncing || syncing} title="Stripe Live-Sync (Fallback)">
                  <Zap className={`h-4 w-4 ${stripeLiveSyncing ? "animate-pulse text-amber-500" : "text-amber-600"}`} />
                  <span className="ml-1 hidden sm:inline">Stripe Live-Sync</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem onClick={() => handleStripeLiveSync(24)} disabled={stripeLiveSyncing}>
                  Letzte 24 Stunden abgleichen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStripeLiveSync(48)} disabled={stripeLiveSyncing}>
                  Letzte 48 Stunden abgleichen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {groups.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleLiveSyncAll} disabled={liveSyncing || syncing || stripeLiveSyncing}>
                    <RefreshCw className={`h-4 w-4 ${liveSyncing ? "animate-spin" : ""}`} />
                    <span className="ml-1 hidden sm:inline">Sub-Sync (pro Techniker)</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Pullt für jeden gefilterten Techniker direkt aus Stripe alle Subscriptions & letzten Rechnungen.
                </TooltipContent>
              </Tooltip>
            )}
            <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing || liveSyncing || stripeLiveSyncing}>
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              <span className="ml-1 hidden sm:inline">Abgleich</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filterzeile */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <FilterChips<PipelineFilter>
              label="Pipeline"
              value={pipelineFilter}
              onChange={setPipelineFilter}
              options={[
                { value: "all", label: "Alle" },
                { value: "onboarding", label: "Onboarding" },
                { value: "active", label: "Aktiv (THC)" },
              ]}
            />
            <FilterChips<TypFilter>
              label="Typ"
              value={typFilter}
              onChange={setTypFilter}
              options={[
                { value: "all", label: "Alle" },
                { value: "abo", label: "Abos" },
                { value: "einmalig", label: "Einmalig" },
              ]}
            />
            <span className="ml-auto text-muted-foreground">
              {groups.length} / {totalUnfilteredCount}
            </span>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Lade …</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Treffer für die aktuelle Filterauswahl. ✓
            </p>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <div className="space-y-2">
                {groups.map((g) => {
                  const id = g.identity;
                  const fullName = `${id.vorname ?? ""} ${id.nachname ?? ""}`.trim() || "Unbenannter Techniker";
                  const ob = onboardingBadge(id);
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
                          {id.email ?? "—"}
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
                                Abo · {label} · {STATUS_LABEL[r.status] ?? r.status}
                              </span>
                            );
                          })}
                          {g.einmalig_rows.map((r) => {
                            const label = PRODUKT_LABEL_EINMALIG[r.produkt_key] ?? PRODUKT_LABEL[r.produkt_key] ?? r.produkt_key;
                            const rmeta = LEVEL_META[r.health_level];
                            const statusLabel = r.stripe_payment_status === "failed" ? "Fehlgeschlagen" : "Offen";
                            return (
                              <span
                                key={r.order_id}
                                className={`rounded-md border px-1.5 py-0.5 text-[10px] ${rmeta.className}`}
                              >
                                Einmalig · {label} · {statusLabel}
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

function FilterChips<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-0.5">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                active
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TechnicianDetailDialog({
  group, onClose, onOpenContractor,
}: {
  group: TechnicianGroup | null;
  onClose: () => void;
  onOpenContractor?: (onboardingId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<null | {
    when: Date;
    customer_ids: string[];
    customer_ids_via_email: string[];
    subscriptions_found: number;
    subscriptions_new: number;
    invoices_new: number;
    warnings: string[];
  }>(null);

  if (!group) return null;
  const id = group.identity;
  const fullName = `${id.vorname ?? ""} ${id.nachname ?? ""}`.trim() || "Unbenannter Techniker";
  const ob = onboardingBadge(id);

  const handleLiveSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-sync-contractor", {
        body: { onboarding_id: group.onboarding_id },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      if (r) {
        setLastSync({
          when: new Date(),
          customer_ids: r.customer_ids ?? [],
          customer_ids_via_email: r.customer_ids_via_email ?? [],
          subscriptions_found: r.subscriptions_found ?? 0,
          subscriptions_new: r.subscriptions_new ?? 0,
          invoices_new: r.invoices_new ?? 0,
          warnings: r.warnings ?? [],
        });
        toast.success(
          `Live-Sync: ${r.subscriptions_found} Subs gefunden, ${r.subscriptions_new} neu, ${r.invoices_new} neue Rechnungen.`,
        );
      } else {
        toast.error("Live-Sync lieferte kein Ergebnis.");
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-subscription-health"] });
    } catch (e) {
      toast.error(`Live-Sync fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
    }
  };

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
            {id.email && <span className="text-xs text-muted-foreground">{id.email}</span>}
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
                <ManualConfirmBlock row={r} />
              </div>
            );
          })}

          {group.einmalig_rows.map((r) => {
            const meta = LEVEL_META[r.health_level];
            const label = PRODUKT_LABEL_EINMALIG[r.produkt_key] ?? PRODUKT_LABEL[r.produkt_key] ?? r.produkt_key;
            return (
              <div key={r.order_id} className="rounded-lg border bg-card/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Einmalig · {label}</p>
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
                {r.health_reason && (
                  <p className="mt-1 text-xs text-muted-foreground">{r.health_reason}</p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Zahlung:</span>{" "}
                    {r.stripe_payment_status === "failed" ? "Fehlgeschlagen" : "Offen (pending)"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Betrag:</span>{" "}
                    {r.betrag_brutto != null ? `${Number(r.betrag_brutto).toFixed(2)} €` : "—"}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Erstellt:</span>{" "}
                    {fmtDate(r.created_at)}
                  </div>
                </div>
              </div>
            );
          })}

          {lastSync && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-amber-800">
                <Zap className="h-3.5 w-3.5" />
                Letzter Live-Sync: {lastSync.when.toLocaleTimeString("de-DE")}
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-amber-900">
                <div>Gefundene Subs: <b>{lastSync.subscriptions_found}</b></div>
                <div>Neu in DB: <b>{lastSync.subscriptions_new}</b></div>
                <div>Neue Rechnungen: <b>{lastSync.invoices_new}</b></div>
                <div>Customer-IDs: <b>{lastSync.customer_ids.length}</b></div>
              </div>
              {lastSync.customer_ids_via_email.length > 0 && (
                <p className="mt-1 text-amber-800">
                  Per E-Mail-Match neu gefunden: {lastSync.customer_ids_via_email.join(", ")}
                </p>
              )}
              {lastSync.warnings.length > 0 && (
                <ul className="mt-1 list-disc pl-4 text-amber-700">
                  {lastSync.warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleLiveSync}
              disabled={syncing}
            >
              <Zap className={`mr-1 h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
              {syncing ? "Synce …" : "Live mit Stripe abgleichen"}
            </Button>
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
            {id.stripe_customer_id && (
              <Button asChild variant="outline" className="flex-1">
                <a
                  href={`https://dashboard.stripe.com/customers/${id.stripe_customer_id}`}
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

function ManualConfirmBlock({ row }: { row: SubscriptionHealthRow }) {
  const queryClient = useQueryClient();
  const [notiz, setNotiz] = useState("");
  const [busy, setBusy] = useState(false);
  const confirmed = !!row.manuell_bestaetigt_am;

  const confirm = async () => {
    setBusy(true);
    const { error } = await supabaseTC.rpc("subscription_manuell_bestaetigen", {
      p_subscription_id: row.subscription_id,
      p_notiz: notiz || null,
    });
    setBusy(false);
    if (error) {
      toast.error(`Bestätigen fehlgeschlagen: ${error.message}`);
      return;
    }
    toast.success("Abo manuell als bezahlt bestätigt.");
    setNotiz("");
    await queryClient.invalidateQueries({ queryKey: ["admin-subscription-health"] });
  };

  const reset = async () => {
    setBusy(true);
    const { error } = await supabaseTC.rpc("subscription_manuell_zuruecksetzen", {
      p_subscription_id: row.subscription_id,
    });
    setBusy(false);
    if (error) {
      toast.error(`Zurücksetzen fehlgeschlagen: ${error.message}`);
      return;
    }
    toast.success("Manuelle Bestätigung zurückgenommen.");
    await queryClient.invalidateQueries({ queryKey: ["admin-subscription-health"] });
  };

  if (confirmed) {
    return (
      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-2 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div className="text-emerald-800">
            <div className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Manuell bestätigt am {fmtDate(row.manuell_bestaetigt_am)}
            </div>
            {row.manuell_bestaetigt_notiz && (
              <p className="mt-0.5 text-emerald-700">{row.manuell_bestaetigt_notiz}</p>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            Zurücknehmen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-1.5 sm:flex-row">
      <Input
        value={notiz}
        onChange={(e) => setNotiz(e.target.value)}
        placeholder="Notiz (z.B. Zahlt per Überweisung – Beleg im Drive)"
        className="h-8 text-xs"
        disabled={busy}
      />
      <Button size="sm" variant="secondary" onClick={confirm} disabled={busy}>
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Als bezahlt markieren
      </Button>
    </div>
  );
}
