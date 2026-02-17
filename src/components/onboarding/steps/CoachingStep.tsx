import { useState } from 'react';
import { Calendar, Clock, User, CheckCircle2, Users, MapPin, ArrowRight, CalendarCheck, Car, Award, RefreshCw, Sparkles, Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CoachingSlot } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { MultiSourceVideoPlayer } from '@/components/akademie/MultiSourceVideoPlayer';

interface CoachingStepProps {
  slots: CoachingSlot[];
  selectedSlotId?: string;
  onSelectSlot: (slotId: string) => void;
  onBookSlot: () => void;
}

/* ── 3-Step Flow Indicator ── */
function StepFlow({ compact = false }: { compact?: boolean }) {
  const steps = [
    { icon: CalendarCheck, label: 'Termin', sub: 'buchen' },
    { icon: Car, label: 'Mitfahrt', sub: '& lernen' },
    { icon: Award, label: 'Zertifiziert', sub: '& startklar' },
  ];

  return (
    <div className={cn('flex items-center justify-between', compact ? 'gap-1 px-2' : 'gap-2 px-1')}>
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1.5 min-w-0">
            <div className={cn(
              'rounded-xl flex items-center justify-center bg-primary/8 text-primary transition-all',
              compact ? 'w-9 h-9' : 'w-12 h-12'
            )}>
              <step.icon className={cn(compact ? 'w-4 h-4' : 'w-5.5 h-5.5')} />
            </div>
            <div className="text-center">
              <p className={cn('font-semibold text-foreground leading-tight', compact ? 'text-[11px]' : 'text-xs')}>{step.label}</p>
              <p className={cn('text-muted-foreground leading-tight', compact ? 'text-[10px]' : 'text-[11px]')}>{step.sub}</p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 mx-2 mt-[-18px]">
              <div className="h-px bg-gradient-to-r from-primary/30 via-primary/15 to-primary/30" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Termine Chips ── */
function TermineChips({ termine }: { termine: CoachingSlot['termine'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {termine.map((t, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md"
        >
          <Calendar className="w-3 h-3" />
          {format(parseISO(t.datum), 'EEE, dd.MM.', { locale: de })}
        </span>
      ))}
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3" />
        Ganztägig
      </span>
    </div>
  );
}

/* ── Boarding Pass (booked state) ── */
function BoardingPass({ slot }: { slot: CoachingSlot }) {
  const firstTermin = slot.termine[0];

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-status-accepted/25 bg-card overflow-hidden shadow-card">
        <div className="h-1.5 bg-gradient-to-r from-status-accepted/60 via-status-accepted to-status-accepted/60" />

        <div className="px-5 pt-5 pb-3 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-accepted/10 text-status-accepted text-xs font-bold tracking-wide uppercase mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Praxis-Begleitung bestätigt
          </div>
        </div>

        <div className="mx-5 border-t border-dashed border-border/60" />

        <div className="px-5 py-4 flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-14 h-14 border-[3px] border-status-accepted/30 shadow-sm">
              <AvatarImage src={slot.coachAvatarUrl} alt={slot.coachName} />
              <AvatarFallback className="bg-status-accepted/10 text-status-accepted font-bold text-base">
                {slot.coachName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-status-accepted fill-card" />
          </div>
          <div>
            <p className="font-bold text-foreground text-base">{slot.coachName}</p>
            <p className="text-xs text-muted-foreground">{slot.coachBio || 'Erfahrener Thermocheck-Coach'}</p>
          </div>
        </div>

        <div className="mx-5 border-t border-dashed border-border/60" />

        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Termine</p>
          <TermineChips termine={slot.termine} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Region</p>
              <p className="text-sm font-semibold text-foreground">{slot.region || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Dauer</p>
              <p className="text-sm font-semibold text-foreground">Ganztägig</p>
            </div>
          </div>
        </div>

        <div className="mx-5 border-t border-dashed border-border/60" />

        <div className="px-5 py-3.5 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Bringe deine <span className="font-medium text-foreground">komplette Ausstattung</span> mit. Treffpunkt wird rechtzeitig mitgeteilt.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function CoachingStep({
  slots,
  selectedSlotId,
  onSelectSlot,
  onBookSlot,
}: CoachingStepProps) {
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const bookedSlot = slots.find(s => s.gebucht);
  const availableSlots = slots.filter(s => !s.gebucht);

  if (bookedSlot) {
    return <BoardingPass slot={bookedSlot} />;
  }

  const handleToggleExpand = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSlotId(prev => prev === slotId ? null : slotId);
  };

  return (
    <div className="space-y-5">
      {/* Step Flow */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        <StepFlow compact={availableSlots.length > 0} />
      </div>

      {/* Empty State */}
      {availableSlots.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 mx-auto flex items-center justify-center mb-4">
              <CalendarCheck className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Neue Termine werden vorbereitet</p>
            <p className="text-xs text-muted-foreground mb-5 max-w-[240px] mx-auto">
              Wir benachrichtigen dich, sobald ein Trainer verfügbar ist.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Seite neu laden
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Slot List Header */}
          <div className="flex items-center justify-between px-1">
            <h4 className="font-semibold text-foreground text-sm">Verfügbare Termine</h4>
            <span className="text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
              {availableSlots.length} verfügbar
            </span>
          </div>

          {/* Slot Cards */}
          <div className="space-y-3">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              const isExpanded = expandedSlotId === slot.id;
              const hasVideo = !!slot.coachVideoUrl;

              return (
                <div
                  key={slot.id}
                  className={cn(
                    'relative rounded-2xl border bg-card cursor-pointer transition-all duration-200',
                    isSelected
                      ? 'border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_16px_-4px_hsl(var(--primary)/0.15)] scale-[1.01]'
                      : 'border-border/80 shadow-card hover:shadow-[0_4px_16px_-4px_hsl(215_25%_15%/0.1)] hover:border-border'
                  )}
                  onClick={() => onSelectSlot(slot.id)}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-2xl" />
                  )}

                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className={cn(
                          'w-14 h-14 border-[3px] shadow-sm transition-colors',
                          isSelected ? 'border-primary/30' : 'border-background'
                        )}>
                          <AvatarImage src={slot.coachAvatarUrl} alt={slot.coachName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {slot.coachName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-5 h-5 text-primary fill-card" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm mb-0.5">{slot.coachName}</p>
                        <p className="text-[11px] text-muted-foreground mb-1.5">
                          {slot.coachBio || 'Erfahrener Thermocheck-Coach'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <TermineChips termine={slot.termine} />
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-md">
                            <MapPin className="w-3 h-3" />
                            {slot.region}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className={cn(
                        'shrink-0 rounded-xl px-3 py-2 text-center transition-colors',
                        isSelected ? 'bg-primary/10' : 'bg-muted/40'
                      )}>
                        <span className={cn(
                          'text-sm font-bold tabular-nums',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}>
                          {slot.preis}€
                        </span>
                        <p className="text-[9px] text-muted-foreground">/Tag</p>
                      </div>
                    </div>

                    {/* Video Button */}
                    {hasVideo && (
                      <button
                        onClick={(e) => handleToggleExpand(slot.id, e)}
                        className={cn(
                          'mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                          isExpanded
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        <Play className="w-3 h-3" />
                        Video ansehen
                        <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                    )}
                  </div>

                  {/* Expanded Video Section */}
                  {isExpanded && hasVideo && (
                    <div className="border-t border-border/60 p-4 space-y-3">
                      <div className="rounded-xl overflow-hidden">
                        <MultiSourceVideoPlayer
                          videoUrl={slot.coachVideoUrl!}
                          heightMode="contained"
                        />
                      </div>
                      {slot.coachBio && (
                        <p className="text-xs text-muted-foreground italic">
                          „{slot.coachBio}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Book Button */}
          {selectedSlotId && (
            <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
              <Button onClick={onBookSlot} className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75 gap-2">
                <Users className="w-5 h-5" />
                Mitfahrt buchen
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
