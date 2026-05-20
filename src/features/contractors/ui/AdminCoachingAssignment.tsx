import { useState } from 'react';
import { Car, Loader2, Calendar as CalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  useTrainerList, useTrainerAuftraege, useAdminBookCoachingRide,
} from '../hooks/useAdminContractorActions';

interface Props {
  traineeProfileId: string | null;
  traineeName: string;
}

export function AdminCoachingAssignment({ traineeProfileId, traineeName }: Props) {
  const [trainerOnbId, setTrainerOnbId] = useState<string>('');
  const [auftragId, setAuftragId] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: trainers = [], isLoading: trainersLoading } = useTrainerList();
  const { data: auftraege = [], isLoading: auftraegeLoading } = useTrainerAuftraege(trainerOnbId || null);
  const { mutate: book, isPending } = useAdminBookCoachingRide();

  if (!traineeProfileId) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">Trainee hat noch kein verknüpftes Profil — Zuweisung nicht möglich.</p>
      </div>
    );
  }

  const selectedAuftrag = auftraege.find(a => a.auftragId === auftragId);
  const trainer = trainers.find(t => t.onboardingId === trainerOnbId);

  const handleConfirm = () => {
    if (!auftragId) return;
    book(
      { traineeProfileId, auftragId },
      {
        onSuccess: () => {
          toast.success(`${traineeName} dem Coaching-Auftrag zugewiesen`);
          setConfirmOpen(false);
          setTrainerOnbId('');
          setAuftragId('');
        },
        onError: (err: unknown) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Car className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Coaching-Mitfahrt manuell zuweisen</p>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Gleicher Effekt, als hätte der Trainee selbst gebucht. Vergangene Termine erlaubt (Nacherfassung).
      </p>

      <div className="space-y-2">
        <Select value={trainerOnbId} onValueChange={(v) => { setTrainerOnbId(v); setAuftragId(''); }}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={trainersLoading ? 'Lade Trainer…' : 'Trainer wählen…'} />
          </SelectTrigger>
          <SelectContent>
            {trainers.map(t => (
              <SelectItem key={t.onboardingId} value={t.onboardingId}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={auftragId} onValueChange={setAuftragId} disabled={!trainerOnbId || auftraegeLoading}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={
              !trainerOnbId ? 'Zuerst Trainer wählen' :
              auftraegeLoading ? 'Lade Aufträge…' :
              auftraege.length === 0 ? 'Keine Aufträge für diesen Trainer' :
              'Auftrag / Termin wählen…'
            } />
          </SelectTrigger>
          <SelectContent>
            {auftraege.map(a => {
              const first = a.termine[0];
              const dateLabel = first ? format(parseISO(first.datum), 'd. MMM yyyy', { locale: de }) : 'Kein Termin';
              const isPast = first ? isBefore(parseISO(first.datum), startOfDay(new Date())) : false;
              const taken = !!a.gebuchtVonProfileId && a.gebuchtVonProfileId !== traineeProfileId;
              return (
                <SelectItem key={a.auftragId} value={a.auftragId} disabled={taken}>
                  <span className="flex items-center gap-2">
                    <CalIcon className="w-3 h-3" />
                    <span>{dateLabel} · {a.customerName}{a.ort ? ` (${a.ort})` : ''}</span>
                    {isPast && <Badge variant="secondary" className="text-[9px] h-4">vergangen</Badge>}
                    {taken && <Badge variant="destructive" className="text-[9px] h-4">belegt</Badge>}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        className="w-full"
        disabled={!auftragId || isPending}
        onClick={() => setConfirmOpen(true)}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Zuweisen
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Coaching-Mitfahrt zuweisen?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                <strong>{traineeName}</strong> wird als Mitfahrer für den Auftrag von <strong>{trainer?.name}</strong> eingetragen.
              </span>
              {selectedAuftrag?.termine[0] && (
                <span className="block mt-1 text-xs">
                  Termin: {format(parseISO(selectedAuftrag.termine[0].datum), 'd. MMM yyyy', { locale: de })}
                </span>
              )}
              <span className="block mt-2 text-xs text-amber-600 dark:text-amber-400">
                Bestehende ausstehende Buchung des Trainees wird automatisch freigegeben.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>Zuweisen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
