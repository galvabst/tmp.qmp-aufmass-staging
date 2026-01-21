import { Calendar, Clock, MapPin, User, CheckCircle2, Home, Euro, Users } from 'lucide-react';
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
          <h3 className="text-xl font-bold text-foreground">Praxis-Begleitung gebucht!</h3>
          <p className="text-muted-foreground mt-2">
            Du begleitest {bookedSlot.coachName} bei einem echten Thermocheck.
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
            {bookedSlot.objektAdresse && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-foreground">{bookedSlot.objektAdresse}</span>
              </div>
            )}
            {bookedSlot.objektTyp && (
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-primary" />
                <span className="text-foreground">Thermocheck - {bookedSlot.objektTyp}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <span className="text-foreground">Coach: {bookedSlot.coachName}</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            📧 Du erhältst eine Bestätigungs-E-Mail mit allen Details und dem Treffpunkt. 
            Bitte erscheine pünktlich und bringe deine komplette Ausstattung mit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Header */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Praxis-Coaching</h3>
            <p className="text-sm text-muted-foreground">
              Begleite einen erfahrenen Techniker bei einem echten Thermocheck
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-foreground">
          <strong>ℹ️ So funktioniert's:</strong> Du fährst mit einem erfahrenen Thermocheck-Techniker 
          zu einem echten Auftrag und lernst den kompletten Ablauf vor Ort.
        </p>
      </div>

      {/* Slot-Liste */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">Verfügbare Thermochecks zur Begleitung</h4>
        
        {availableSlots.length === 0 ? (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground mt-2">
              Aktuell keine Termine verfügbar. Bitte schau später nochmal vorbei.
            </p>
          </div>
        ) : (
          availableSlots.map((slot) => {
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
                    
                    <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {format(parseISO(slot.datum), 'EEE, dd.MM.yyyy', { locale: de })}
                          {' · '}{slot.uhrzeitVon} - {slot.uhrzeitBis} Uhr
                        </span>
                      </div>
                      {slot.objektAdresse && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{slot.objektAdresse}</span>
                        </div>
                      )}
                      {slot.objektTyp && (
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 flex-shrink-0" />
                          <span>Thermocheck - {slot.objektTyp}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preis & Select */}
                  <div className="text-right flex-shrink-0">
                    <Badge variant="secondary" className="mb-2">
                      <Euro className="w-3 h-3 mr-1" />
                      {slot.preis}€
                    </Badge>
                    {isSelected && (
                      <div>
                        <CheckCircle2 className="w-6 h-6 text-primary ml-auto" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Buchen Button */}
      {selectedSlotId && (
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background to-transparent">
          <Button onClick={onBookSlot} className="w-full h-12 text-base">
            <Users className="w-5 h-5 mr-2" />
            Mitfahrt buchen - {slots.find(s => s.id === selectedSlotId)?.preis}€
          </Button>
        </div>
      )}
    </div>
  );
}
