import { Calendar, Clock, User, CheckCircle2, Euro, Users, MapPin, Sparkles, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CoachingSlot } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface CoachingStepProps {
  slots: CoachingSlot[];
  selectedSlotId?: string;
  onSelectSlot: (slotId: string) => void;
  onBookSlot: () => void;
}

export function CoachingStep({
  slots,
  selectedSlotId,
  onSelectSlot,
  onBookSlot,
}: CoachingStepProps) {
  const bookedSlot = slots.find(s => s.gebucht);
  const availableSlots = slots.filter(s => !s.gebucht);

  if (bookedSlot) {
    return (
      <div className="space-y-5">
        {/* Success Card */}
        <div className="relative overflow-hidden rounded-2xl border border-status-accepted/20 bg-gradient-to-br from-status-accepted/5 via-status-accepted/3 to-transparent p-6 text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-status-accepted to-transparent" />
          <div className="absolute top-4 right-4 w-20 h-20 bg-status-accepted/5 rounded-full" />
          <div className="absolute bottom-4 left-4 w-14 h-14 bg-status-accepted/5 rounded-full" />
          
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-status-accepted/10 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-status-accepted" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Praxis-Begleitung gebucht!</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
              Du begleitest <span className="font-semibold text-foreground">{bookedSlot.coachName}</span> bei einem echten Thermocheck.
            </p>
          </div>
        </div>

        {/* Booked Slot Details */}
        <div className="relative rounded-2xl border border-border/80 bg-card p-5 shadow-card">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-2xl" />
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground">Dein Termin</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <Calendar className="w-4.5 h-4.5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {format(parseISO(bookedSlot.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <Clock className="w-4.5 h-4.5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">Ganztägig</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <User className="w-4.5 h-4.5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">Coach: {bookedSlot.coachName}</span>
            </div>
          </div>
        </div>

        {/* Info Hint */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-start gap-3 relative">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Der Trainer wird dir den <span className="font-medium text-foreground">Treffpunkt rechtzeitig mitteilen</span>. 
              Bitte bringe deine komplette Ausstattung mit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Info Header Card */}
      <div className="relative rounded-2xl border border-border/80 bg-card p-5 shadow-card overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-2xl" />
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">Praxis-Coaching</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Begleite einen erfahrenen Techniker bei einem echten Thermocheck
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start gap-3 relative">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">So funktioniert's</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Du fährst mit einem erfahrenen Thermocheck-Techniker zu einem echten Auftrag und lernst den kompletten Ablauf vor Ort.
            </p>
          </div>
        </div>
      </div>

      {/* Slot-Liste */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-semibold text-foreground text-sm">Verfügbare Thermochecks zur Begleitung</h4>
          {availableSlots.length > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
              {availableSlots.length} verfügbar
            </span>
          )}
        </div>
        
        {availableSlots.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
                <Users className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Aktuell keine Termine verfügbar</p>
              <p className="text-xs text-muted-foreground">
                Bitte schau später nochmal vorbei.
              </p>
            </div>
          </div>
        ) : (
          availableSlots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            
            return (
              <div
                key={slot.id}
                className={cn(
                  'relative rounded-2xl border bg-card p-4 cursor-pointer transition-all duration-200',
                  isSelected
                    ? 'border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_12px_-2px_hsl(var(--primary)/0.1)]'
                    : 'border-border/80 shadow-card hover:shadow-[0_4px_16px_-4px_hsl(215_25%_15%/0.1)] hover:border-border'
                )}
                onClick={() => onSelectSlot(slot.id)}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-2xl" />
                )}
                
                <div className="flex items-start gap-3.5">
                  {/* Coach Avatar */}
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                      <AvatarImage src={slot.coachAvatarUrl} alt={slot.coachName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {slot.coachName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 text-primary fill-card" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-foreground text-sm">{slot.coachName}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(slot.datum), 'EEE, dd.MM.', { locale: de })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        Ganztägig
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3" />
                        {slot.region}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn(
                      'text-sm font-bold tabular-nums',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {slot.preis}€
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Buchen Button */}
      {selectedSlotId && (
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
          <Button onClick={onBookSlot} className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75 gap-2">
            <Users className="w-5 h-5" />
            Mitfahrt buchen
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
