import { useState, useMemo } from 'react';
import { Users, Calendar, MapPin, Phone, Mail, UserCircle, CheckCircle2, XCircle, Loader2, Ban, UserX, Link2, FileVideo, ShieldCheck, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyCoachingRideAlongs, useBewerteCoachingMitfahrt, type RideAlongTrainee, type CoachingBewertung } from '@/hooks/useMyCoachingRideAlongs';
import { useApprovePraxistest } from '@/features/quality-gate/hooks/useAdminQGQueue';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrainerRideAlongsProps {
  profileId: string;
}

/* ───────── Badge ───────── */

function BewertungBadge({ bewertung }: { bewertung: CoachingBewertung }) {
  switch (bewertung) {
    case 'bestanden':
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">✓ Bestanden</Badge>;
    case 'nicht_bestanden':
      return <Badge variant="destructive" className="text-[11px]">✗ Nicht bestanden</Badge>;
    case 'abgesagt':
      return <Badge variant="outline" className="text-[11px] text-orange-600 border-orange-300 bg-orange-50">Abgesagt</Badge>;
    case 'no_show':
      return <Badge variant="outline" className="text-[11px] text-red-600 border-red-300 bg-red-50">No-Show</Badge>;
    default:
      return <Badge variant="outline" className="text-[11px] text-muted-foreground">Ausstehend</Badge>;
  }
}

/* ───────── Confirm Dialog Labels ───────── */

const ENTSCHEIDUNG_CONFIG: Record<string, { title: string; description: (name: string) => string; buttonLabel: string; destructive: boolean }> = {
  bestanden: {
    title: 'Mitfahrt als bestanden bewerten?',
    description: (n) => `${n} wird freigeschaltet und kann das Onboarding abschließen.`,
    buttonLabel: 'Bestanden',
    destructive: false,
  },
  nicht_bestanden: {
    title: 'Mitfahrt als nicht bestanden bewerten?',
    description: (n) => `${n} muss eine neue Mitfahrt buchen.`,
    buttonLabel: 'Nicht bestanden',
    destructive: true,
  },
  abgesagt: {
    title: 'Mitfahrt als abgesagt markieren?',
    description: (n) => `${n} muss eine neue Mitfahrt buchen. Die aktuelle Buchung bleibt im Verlauf.`,
    buttonLabel: 'Abgesagt markieren',
    destructive: true,
  },
  no_show: {
    title: 'Trainee als No-Show markieren?',
    description: (n) => `${n} ist nicht erschienen und muss eine neue Mitfahrt buchen.`,
    buttonLabel: 'No-Show markieren',
    destructive: true,
  },
};

const TOAST_MESSAGES: Record<string, string> = {
  bestanden: 'Trainee als bestanden markiert und freigeschaltet',
  nicht_bestanden: 'Trainee muss neue Mitfahrt buchen',
  abgesagt: 'Mitfahrt als abgesagt markiert',
  no_show: 'Trainee als No-Show markiert',
};

/* ───────── Card ───────── */

function TraineeCard({ trainee, isPast }: { trainee: RideAlongTrainee; isPast: boolean }) {
  const fullName = `${trainee.vorname} ${trainee.nachname}`.trim() || 'Unbekannt';
  const initials = `${trainee.vorname?.[0] || ''}${trainee.nachname?.[0] || ''}`.toUpperCase() || '?';
  const wohnort = [trainee.plz, trainee.ort].filter(Boolean).join(' ') || 'Nicht angegeben';
  const firstDate = trainee.termine[0]?.datum;
  const isPending = trainee.bewertung === 'ausstehend';
  const showActions = isPast && isPending;
  const showPraxistestApproval = trainee.praxistestEingereicht && !trainee.praxistestFreigabe && trainee.onboardingId;

  const { mutate: bewerte, isPending: isMutating } = useBewerteCoachingMitfahrt();
  const { mutate: approvePraxistest, isPending: isApproving } = useApprovePraxistest();
  const [confirmAction, setConfirmAction] = useState<'bestanden' | 'nicht_bestanden' | 'abgesagt' | 'no_show' | null>(null);

  const handleBewertung = (entscheidung: typeof confirmAction) => {
    if (!entscheidung) return;
    bewerte(
      { auftragId: trainee.auftragId, entscheidung },
      {
        onSuccess: () => {
          toast.success(TOAST_MESSAGES[entscheidung]);
          setConfirmAction(null);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Fehler bei der Bewertung');
          setConfirmAction(null);
        },
      },
    );
  };

  const config = confirmAction ? ENTSCHEIDUNG_CONFIG[confirmAction] : null;

  return (
    <>
      <div className="bg-card rounded-xl border border-border/60 shadow-card overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <Avatar className="w-11 h-11 border-2 border-primary/20">
            <AvatarImage src={trainee.avatarUrl} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{fullName}</p>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="text-xs truncate">{wohnort}</span>
            </div>
          </div>
          <BewertungBadge bewertung={trainee.bewertung} />
        </div>

        <div className="mx-4 border-t border-border/40" />

        {/* Date, Contact & Praxistest – compact */}
        <div className="px-4 py-3 space-y-1.5">
          {firstDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-foreground font-medium text-xs">
                {format(parseISO(firstDate), 'EE, dd.MM.yyyy', { locale: de })}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">Ganztägig</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {trainee.telefon ? (
              <a href={`tel:${trainee.telefon}`} className="text-primary hover:underline">{trainee.telefon}</a>
            ) : (
              <span className="text-muted-foreground italic">Nicht hinterlegt</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {trainee.email ? (
              <a href={`mailto:${trainee.email}`} className="text-primary hover:underline truncate">{trainee.email}</a>
            ) : (
              <span className="text-muted-foreground italic">Nicht hinterlegt</span>
            )}
          </div>

          {/* Praxistest links */}
          {trainee.praxistestEingereicht && (trainee.praxistestScanUrl || trainee.praxistestVideoUrl) && (
            <div className="flex items-center gap-3 pt-1">
              {trainee.praxistestScanUrl && (
                <a href={trainee.praxistestScanUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Link2 className="w-3.5 h-3.5" /> 3D-Scan
                </a>
              )}
              {trainee.praxistestVideoUrl && (
                <a href={trainee.praxistestVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <FileVideo className="w-3.5 h-3.5" /> Drohnenvideo
                </a>
              )}
            </div>
          )}

          {/* Praxistest approve button for trainer */}
          {showPraxistestApproval && (
            <div className="pt-1">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
                disabled={isApproving}
                onClick={() => {
                  approvePraxistest(trainee.onboardingId!, {
                    onSuccess: () => toast.success(`Praxistest von ${fullName} freigegeben`),
                    onError: (err: any) => toast.error(err.message || 'Fehler bei der Freigabe'),
                  });
                }}
              >
                {isApproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Praxistest freigeben
              </Button>
            </div>
          )}
        </div>

        {/* Actions for past + pending */}
        {showActions && (
          <>
            <div className="mx-4 border-t border-border/40" />
            <div className="p-4 space-y-2">
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1.5" disabled={isMutating} onClick={() => setConfirmAction('bestanden')}>
                  <CheckCircle2 className="w-4 h-4" /> Bestanden
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5" disabled={isMutating} onClick={() => setConfirmAction('nicht_bestanden')}>
                  <XCircle className="w-4 h-4" /> Nicht bestanden
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50" disabled={isMutating} onClick={() => setConfirmAction('abgesagt')}>
                  <Ban className="w-4 h-4" /> Abgesagt
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-red-600 border-red-300 hover:bg-red-50" disabled={isMutating} onClick={() => setConfirmAction('no_show')}>
                  <UserX className="w-4 h-4" /> No-Show
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        {trainee.gebuchtAm && (
          <div className="px-4 py-1.5 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground">
              Gebucht {format(parseISO(trainee.gebuchtAm), 'dd.MM.yyyy', { locale: de })}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {config && (
        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{config.title}</AlertDialogTitle>
              <AlertDialogDescription>{config.description(fullName)}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isMutating}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                disabled={isMutating}
                onClick={() => handleBewertung(confirmAction)}
                className={config.destructive ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                {isMutating && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                {config.buttonLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

/* ───────── Section ───────── */

function RideAlongSection({ title, trainees, isPast, collapsible = false, initialCount = 3 }: { title: string; trainees: RideAlongTrainee[]; isPast: boolean; collapsible?: boolean; initialCount?: number }) {
  const [showAll, setShowAll] = useState(false);
  if (trainees.length === 0) return null;
  
  const shouldCollapse = collapsible && trainees.length > initialCount;
  const displayed = shouldCollapse && !showAll ? trainees.slice(0, initialCount) : trainees;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
        <span className="text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">{trainees.length}</span>
      </div>
      <div className="space-y-3">
        {displayed.map((t) => <TraineeCard key={t.auftragId} trainee={t} isPast={isPast} />)}
      </div>
      {shouldCollapse && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-xs font-medium text-primary py-2 hover:underline"
        >
          {showAll ? 'Weniger anzeigen' : `Alle ${trainees.length} anzeigen`}
        </button>
      )}
    </div>
  );
}

/* ───────── Main ───────── */

export function TrainerRideAlongs({ profileId }: TrainerRideAlongsProps) {
  const { data: rideAlongs, isLoading } = useMyCoachingRideAlongs(profileId);

  const pendingApprovalCount = useMemo(
    () => (rideAlongs || []).filter(r => r.praxistestEingereicht && !r.praxistestFreigabe).length,
    [rideAlongs]
  );
  const today = startOfDay(new Date());
  const upcoming = (rideAlongs || []).filter((r) => {
    const firstDate = r.termine[0]?.datum;
    return firstDate && isAfter(parseISO(firstDate), today);
  });
  const past = (rideAlongs || []).filter((r) => {
    const firstDate = r.termine[0]?.datum;
    return !firstDate || !isAfter(parseISO(firstDate), today);
  });

  return (
    <section className="p-4 pt-0">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">Meine Mitfahrten</h2>
        {rideAlongs && rideAlongs.length > 0 && (
          <span className="text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full ml-auto">
            {rideAlongs.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : !rideAlongs || rideAlongs.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/60 shadow-card p-6 text-center">
          <UserCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Mitfahrten gebucht</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Sobald ein Techniker eine Mitfahrt bei dir bucht, erscheint er hier.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <RideAlongSection title="Anstehende Mitfahrten" trainees={upcoming} isPast={false} />
          <RideAlongSection title="Vergangene Mitfahrten" trainees={past} isPast={true} collapsible initialCount={3} />
        </div>
      )}
    </section>
  );
}
