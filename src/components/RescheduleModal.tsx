import { useState } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarClock, Check, X, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PendingReschedule } from "@/hooks/useMyPendingProposals";

interface RescheduleModalProps {
  reschedules: PendingReschedule[];
  onDone: () => void;
}

export function RescheduleModal({ reschedules, onDone }: RescheduleModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [open, setOpen] = useState(true);

  if (!reschedules.length) return null;

  const current = reschedules[currentIndex];
  if (!current) return null;

  const goNext = () => {
    if (currentIndex < reschedules.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setOpen(false);
      onDone();
    }
  };

  const handleAccept = async (terminId: string) => {
    setAccepting(terminId);
    try {
      const { data, error } = await supabase.rpc("accept_thermocheck_reschedule" as any, {
        p_termin_id: terminId,
      });

      if (error) {
        toast.error("Fehler: " + error.message);
        return;
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || "Konnte Termin nicht annehmen");
        return;
      }

      toast.success("Neuen Termin angenommen! ✅");
      goNext();
    } catch {
      toast.error("Unerwarteter Fehler");
    } finally {
      setAccepting(null);
    }
  };

  const handleDeclineAll = async () => {
    setDeclining(true);
    try {
      const { data, error } = await supabase.rpc(
        "decline_thermocheck_reschedule",
        { p_auftrag_id: current.auftragId }
      );

      if (error) {
        toast.error("Fehler: " + error.message);
        return;
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || "Konnte Termine nicht ablehnen");
        return;
      }

      toast.success("Alle Termine abgelehnt – Auftrag zurück im Pool");
      goNext();
    } catch {
      toast.error("Unerwarteter Fehler");
    } finally {
      setDeclining(false);
    }
  };

  const formatProposalDate = (datum: string, zeitVon: string | null, zeitBis: string | null, ganztaegig: boolean) => {
    const date = parseISO(datum);
    const dayStr = format(date, "EEEE, dd. MMMM yyyy", { locale: de });
    if (ganztaegig) return `${dayStr} · Ganztägig`;
    const from = zeitVon?.slice(0, 5) || "";
    const to = zeitBis?.slice(0, 5) || "";
    return `${dayStr} · ${from} – ${to}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-5 h-5 text-orange-500" />
            <DialogTitle className="text-lg">Termin verschoben</DialogTitle>
          </div>
          <DialogDescription>
            Dein Termin bei <strong>{current.customerName}</strong>
            {(current.plz || current.ort) && (
              <> in <strong>{[current.plz, current.ort].filter(Boolean).join(" ")}</strong></>
            )}{" "}
            wurde verschoben. Wähle einen neuen Termin oder lehne alle ab.
          </DialogDescription>
        </DialogHeader>

        {reschedules.length > 1 && (
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} von {reschedules.length} Aufträgen
          </p>
        )}

        <div className="space-y-2 mt-2">
          {current.proposals.map((p) => (
            <div
              key={p.terminId}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <span className="text-sm">
                {formatProposalDate(p.datum, p.zeitVon, p.zeitBis, p.ganztaegig)}
              </span>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleAccept(p.terminId)}
                disabled={accepting !== null || declining}
              >
                {accepting === p.terminId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Das Ablehnen von Aufträgen wirkt sich negativ auf deine Bewertung aus.</span>
        </div>

        <Button
          variant="destructive"
          className="w-full mt-2"
          onClick={handleDeclineAll}
          disabled={accepting !== null || declining}
        >
          {declining ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <X className="w-4 h-4 mr-2" />
          )}
          Alle ablehnen – zurück in den Pool
        </Button>
      </DialogContent>
    </Dialog>
  );
}
