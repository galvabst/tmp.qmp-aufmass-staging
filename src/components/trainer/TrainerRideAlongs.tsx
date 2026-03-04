import { useState } from 'react';
import { Users, Calendar, MapPin, Phone, Mail, UserCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyCoachingRideAlongs, useBewerteCoachingMitfahrt, RideAlongTrainee } from '@/hooks/useMyCoachingRideAlongs';
import { format, parseISO } from 'date-fns';
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

function BewertungBadge({ bewertung }: { bewertung?: string }) {
  if (bewertung === 'bestanden') {
    return <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">✓ Bestanden</Badge>;
  }
  if (bewertung === 'nicht_bestanden') {
    return <Badge variant="destructive" className="text-[11px]">✗ Nicht bestanden</Badge>;
  }
  return <Badge variant="outline" className="text-[11px] text-muted-foreground">Ausstehend</Badge>;
}

function TraineeCard({ trainee }: { trainee: RideAlongTrainee }) {
  const fullName = `${trainee.vorname} ${trainee.nachname}`.trim() || 'Unbekannt';
  const initials = `${trainee.vorname?.[0] || ''}${trainee.nachname?.[0] || ''}`.toUpperCase() || '?';
  const wohnort = [trainee.plz, trainee.ort].filter(Boolean).join(' ') || 'Nicht angegeben';
  const firstDate = trainee.termine[0]?.datum;
  const isPending = !trainee.bewertung || trainee.bewertung === 'ausstehend';

  const { mutate: bewerte, isPending: isMutating } = useBewerteCoachingMitfahrt();
  const [confirmAction, setConfirmAction] = useState<'bestanden' | 'nicht_bestanden' | null>(null);

  const handleBewertung = (entscheidung: 'bestanden' | 'nicht_bestanden') => {
    bewerte(
      { auftragId: trainee.auftragId, entscheidung },
      {
        onSuccess: (result) => {
          toast.success(entscheidung === 'bestanden' ? 'Trainee als bestanden markiert' : 'Trainee muss neue Mitfahrt buchen');
          setConfirmAction(null);
        },
        onError: (err: any) => {
          toast.error(err.message || 'Fehler bei der Bewertung');
          setConfirmAction(null);
        },
      }
    );
  };

  return (
    <>
      <div className="bg-card rounded-xl border border-border/60 shadow-card overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <Avatar className="w-11 h-11 border-2 border-primary/20">
            <AvatarImage src={trainee.avatarUrl} alt={fullName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
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

        {/* Date & Contact */}
        <div className="p-4 space-y-2.5">
          {firstDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">
                {format(parseISO(firstDate), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">Ganztägig</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            {trainee.telefon ? (
              <a href={`tel:${trainee.telefon}`} className="text-primary hover:underline">{trainee.telefon}</a>
            ) : (
              <span className="text-muted-foreground italic text-xs">Nicht hinterlegt</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            {trainee.email ? (
              <a href={`mailto:${trainee.email}`} className="text-primary hover:underline truncate">{trainee.email}</a>
            ) : (
              <span className="text-muted-foreground italic text-xs">Nicht hinterlegt</span>
            )}
          </div>
        </div>

        {/* Action Buttons for pending */}
        {isPending && (
          <>
            <div className="mx-4 border-t border-border/40" />
            <div className="p-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                disabled={isMutating}
                onClick={() => setConfirmAction('bestanden')}
              >
                {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Bestanden
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                disabled={isMutating}
                onClick={() => setConfirmAction('nicht_bestanden')}
              >
                {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Nicht bestanden
              </Button>
            </div>
          </>
        )}

        {/* Footer */}
        {trainee.gebuchtAm && (
          <>
            <div className="mx-4 border-t border-border/40" />
            <div className="px-4 py-2.5">
              <p className="text-[11px] text-muted-foreground">
                Gebucht am {format(parseISO(trainee.gebuchtAm), 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'bestanden' ? 'Mitfahrt als bestanden bewerten?' : 'Mitfahrt als nicht bestanden bewerten?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'bestanden'
                ? `${fullName} wird freigeschaltet und kann das Onboarding abschließen.`
                : `${fullName} muss eine neue Mitfahrt buchen. Die aktuelle Buchung wird freigegeben.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              disabled={isMutating}
              onClick={() => confirmAction && handleBewertung(confirmAction)}
              className={confirmAction === 'nicht_bestanden' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isMutating && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {confirmAction === 'bestanden' ? 'Bestanden' : 'Nicht bestanden'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function TrainerRideAlongs({ profileId }: TrainerRideAlongsProps) {
  const { data: rideAlongs, isLoading } = useMyCoachingRideAlongs(profileId);

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
          <p className="text-xs text-muted-foreground/60 mt-1">
            Sobald ein Techniker eine Mitfahrt bei dir bucht, erscheint er hier.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rideAlongs.map((trainee) => (
            <TraineeCard key={trainee.auftragId} trainee={trainee} />
          ))}
        </div>
      )}
    </section>
  );
}
