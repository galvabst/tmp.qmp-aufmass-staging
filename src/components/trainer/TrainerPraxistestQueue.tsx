import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMyCoachingRideAlongs, type RideAlongTrainee } from '@/hooks/useMyCoachingRideAlongs';
import { useApprovePraxistest } from '@/features/quality-gate/hooks/useAdminQGQueue';
import { Link2, FileVideo, ShieldCheck, Loader2, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface TrainerPraxistestQueueProps {
  profileId: string;
}

function PraxistestCard({ trainee }: { trainee: RideAlongTrainee }) {
  const fullName = `${trainee.vorname} ${trainee.nachname}`.trim() || 'Unbekannt';
  const initials = `${trainee.vorname?.[0] || ''}${trainee.nachname?.[0] || ''}`.toUpperCase() || '?';
  const { mutate: approve, isPending } = useApprovePraxistest();

  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-card overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <Avatar className="w-11 h-11 border-2 border-primary/20">
          <AvatarImage src={trainee.avatarUrl} alt={fullName} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{fullName}</p>
          {trainee.gebuchtAm && (
            <p className="text-[11px] text-muted-foreground">
              Eingereicht am {format(parseISO(trainee.gebuchtAm), 'dd.MM.yyyy', { locale: de })}
            </p>
          )}
        </div>
      </div>

      <div className="mx-4 border-t border-border/40" />

      <div className="px-4 py-3 space-y-2">
        {/* Links */}
        <div className="flex items-center gap-3">
          {trainee.praxistestScanUrl && (
            <a href={trainee.praxistestScanUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
              <Link2 className="w-3.5 h-3.5" /> 3D-Scan ansehen
            </a>
          )}
          {trainee.praxistestVideoUrl && (
            <a href={trainee.praxistestVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
              <FileVideo className="w-3.5 h-3.5" /> Drohnenvideo ansehen
            </a>
          )}
        </div>

        {/* Approve button */}
        <Button
          size="sm"
          className="w-full gap-1.5"
          disabled={isPending}
          onClick={() => {
            approve(trainee.onboardingId!, {
              onSuccess: () => toast.success(`Praxistest von ${fullName} freigegeben`),
              onError: (err: any) => toast.error(err.message || 'Fehler bei der Freigabe'),
            });
          }}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Praxistest freigeben
        </Button>
      </div>
    </div>
  );
}

export function TrainerPraxistestQueue({ profileId }: TrainerPraxistestQueueProps) {
  const { data: rideAlongs, isLoading } = useMyCoachingRideAlongs(profileId);

  const pending = (rideAlongs || []).filter(
    (r) => r.praxistestEingereicht && !r.praxistestFreigabe && r.onboardingId
  );

  if (isLoading) {
    return (
      <section className="p-4 pt-0 space-y-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </section>
    );
  }

  if (pending.length === 0) {
    return (
      <section className="p-4 pt-0">
        <div className="bg-card rounded-xl border border-border/60 shadow-card p-6 text-center">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Keine offenen Praxistests</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Sobald ein Techniker seinen Praxistest einreicht, erscheint er hier.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 pt-0 space-y-3">
      {pending.map((t) => (
        <PraxistestCard key={t.auftragId} trainee={t} />
      ))}
    </section>
  );
}
