import { useState } from "react";
import { AlertTriangle, Lock, RefreshCw, History, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAdminSubscriptionHealth, SubscriptionHealthRow } from "@/features/admin/hooks/useAdminSubscriptionHealth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseTC } from "@/integrations/supabase/thermocheck-client";
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

  const problemCount = rows?.length ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">
            Subscription-Health{" "}
            {problemCount > 0 && (
              <Badge variant="destructive" className="ml-2">{problemCount}</Badge>
            )}
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
          <p className="text-sm text-muted-foreground">Alle Abonnements aktiv. ✓</p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {rows.map((row) => {
                const badge = STATUS_BADGE[row.status] ?? { label: row.status, variant: "outline" as const };
                return (
                  <button
                    key={row.subscription_id}
                    onClick={() => setDetail(row)}
                    className="flex w-full items-center justify-between rounded-lg border bg-card/60 px-3 py-2 text-left transition hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {row.access_state === "blocked" && <Lock className="h-3.5 w-3.5 text-destructive" />}
                        <p className="truncate text-sm font-medium">
                          {row.vorname} {row.nachname}
                        </p>
                        <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.produkt_key ?? "—"} · läuft am {fmtDate(row.current_period_end)}
                        {row.consecutive_failures > 0 && ` · ${row.consecutive_failures}× fehlgeschlagen`}
                      </p>
                    </div>
                    <History className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <SubscriptionDetailDialog row={detail} onClose={() => setDetail(null)} />
    </Card>
  );
}

function SubscriptionDetailDialog({
  row, onClose,
}: { row: SubscriptionHealthRow | null; onClose: () => void }) {
  const { data: events } = useSubscriptionEvents(row?.subscription_id ?? null);

  if (!row) return null;
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {row.vorname} {row.nachname} · {row.produkt_key ?? "—"}
          </DialogTitle>
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

          {row.stripe_customer_id && (
            <Button asChild variant="outline" className="w-full">
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
      </DialogContent>
    </Dialog>
  );
}
