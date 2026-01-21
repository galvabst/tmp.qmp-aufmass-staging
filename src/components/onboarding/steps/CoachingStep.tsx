import { Calendar, Clock, MapPin, User, CheckCircle2 } from 'lucide-react';
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

  // Wenn bereits gebucht, zeige Bestätigung
  if (bookedSlot) {
    return (
      <div className="space-y-6">
        <div className="bg-status-accepted/10 border-2 border-status-accepted rounded-xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-status-accepted mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Coaching gebucht!</h3>
          <p className="text-muted-foreground mt-2">
            Dein Praxis-Coaching wurde erfolgreich gebucht.
          </p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card">
          <h4 className="font-semibold text-foreground mb-4">Dein Termin</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-foreground">
                {format(parseISO(bookedSlot.datum), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-foreground">
                {bookedSlot.uhrzeitVon} - {bookedSlot.uhrzeitBis} Uhr
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-foreground">{bookedSlot.ort}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <span className="text-foreground">Coach: {bookedSlot.coachName}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Du erhältst eine Bestätigungs-E-Mail mit allen Details. 
            Bitte erscheine pünktlich und bringe deine komplette Ausstattung mit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex gap-3">
          <User className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Praxis-Coaching</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Begleite einen erfahrenen Techniker bei einem echten Einsatz. 
              Dies ist der letzte Schritt vor deiner Aktivierung.
            </p>
          </div>
        </div>
      </div>

      {/* Slot-Liste */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Verfügbare Termine</h4>
        
        {availableSlots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          
          return (
            <div
              key={slot.id}
              className={cn(
                'bg-card rounded-xl p-4 shadow-card cursor-pointer transition-all',
                isSelected ? 'ring-2 ring-primary' : 'hover:shadow-lg'
              )}
              onClick={() => onSelectSlot(slot.id)}
            >
              <div className="flex items-start gap-4">
                {/* Coach Avatar */}
                <Avatar className="w-12 h-12">
                  <AvatarImage src={slot.coachAvatarUrl} alt={slot.coachName} />
                  <AvatarFallback>
                    {slot.coachName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{slot.coachName}</span>
                    <Badge variant="secondary">{slot.region}</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(parseISO(slot.datum), 'dd.MM.yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {slot.uhrzeitVon} - {slot.uhrzeitBis}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {slot.ort}
                    </span>
                  </div>
                </div>

                {/* Preis & Select */}
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">
                    {slot.preis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                  {isSelected && (
                    <div className="mt-2">
                      <CheckCircle2 className="w-6 h-6 text-primary ml-auto" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buchen Button */}
      {selectedSlotId && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
          <Button onClick={onBookSlot} className="w-full" size="lg">
            Termin buchen
          </Button>
        </div>
      )}
    </div>
  );
}
