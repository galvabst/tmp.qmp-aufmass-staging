import { Clock, MapPin, CheckCircle2, Circle, Play, ArrowRight } from 'lucide-react';
import { TechnicianOrder, CheckinPhase, CHECKIN_PHASE_LABELS } from '@/types/technician';
import { AUFTRAGSTYP_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GalvanekLogo } from '@/components/GalvanekLogo';

interface ActiveOrdersViewProps {
  orders: TechnicianOrder[];
  onCheckin: (orderId: string, phase: CheckinPhase) => void;
  onCheckout: (orderId: string, phase: CheckinPhase) => void;
  onOrderClick: (order: TechnicianOrder) => void;
}

function PhaseStatus({ 
  label, 
  checkinAt, 
  checkoutAt,
  isActive,
  canStart,
  onStart,
  onComplete,
}: { 
  label: string;
  checkinAt?: string;
  checkoutAt?: string;
  isActive: boolean;
  canStart: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const isCheckedIn = !!checkinAt;
  const isCompleted = !!checkoutAt;

  return (
    <div className={cn(
      'p-3 rounded-lg border transition-all',
      isActive ? 'border-primary bg-primary/5' : 
      isCompleted ? 'border-status-accepted bg-status-accepted/5' :
      'border-border bg-muted/30'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-status-accepted" />
          ) : isCheckedIn ? (
            <Clock className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
          <span className={cn(
            'font-medium text-sm',
            isCompleted ? 'text-status-accepted' :
            isActive ? 'text-primary' :
            'text-muted-foreground'
          )}>
            {label}
          </span>
        </div>

        {isActive && !isCheckedIn && canStart && (
          <Button size="sm" onClick={onStart} className="gap-1">
            <Play className="w-3 h-3" />
            Check-in
          </Button>
        )}

        {isActive && isCheckedIn && !isCompleted && (
          <Button size="sm" variant="outline" onClick={onComplete} className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Check-out
          </Button>
        )}

        {isCompleted && (
          <span className="text-xs text-status-accepted">Abgeschlossen</span>
        )}
      </div>
    </div>
  );
}

export function ActiveOrdersView({ orders, onCheckin, onCheckout, onOrderClick }: ActiveOrdersViewProps) {
  const activeOrders = orders.filter(o => o.status === 'in_progress');

  // Determine current phase for each order
  const getOrderPhaseInfo = (order: TechnicianOrder) => {
    const vorOrtComplete = !!order.vorOrtCheckoutAt;
    const nachbearbeitungComplete = !!order.nachbearbeitungCheckoutAt;
    
    if (!vorOrtComplete) {
      return { currentPhase: 'vor_ort' as CheckinPhase, canStartVorOrt: true, canStartNachbearbeitung: false };
    }
    if (!nachbearbeitungComplete) {
      return { currentPhase: 'nachbearbeitung' as CheckinPhase, canStartVorOrt: false, canStartNachbearbeitung: true };
    }
    return { currentPhase: null, canStartVorOrt: false, canStartNachbearbeitung: false };
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Aktive Aufträge</h1>
              <p className="text-primary-foreground/80 text-sm">
                {activeOrders.length} in Bearbeitung
              </p>
            </div>
            <GalvanekLogo size="sm" />
          </div>
        </div>
      </header>

      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center mt-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Keine aktiven Aufträge</h3>
          <p className="text-sm text-muted-foreground">
            Starte einen Check-in bei deinen gebuchten Aufträgen.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {activeOrders.map(order => {
            const phaseInfo = getOrderPhaseInfo(order);
            
            return (
              <div key={order.id} className="bg-card rounded-xl shadow-card overflow-hidden">
                {/* Order Header */}
                <button
                  onClick={() => onOrderClick(order)}
                  className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="text-xs mb-2">
                        {AUFTRAGSTYP_LABELS[order.auftragstyp]}
                      </Badge>
                      <h3 className="font-semibold text-foreground">{order.customerName}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {order.address}, {order.city}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>

                {/* Check-in/out Phases */}
                <div className="p-4 pt-0 space-y-2">
                  <PhaseStatus
                    label={CHECKIN_PHASE_LABELS.vor_ort}
                    checkinAt={order.vorOrtCheckinAt}
                    checkoutAt={order.vorOrtCheckoutAt}
                    isActive={phaseInfo.currentPhase === 'vor_ort'}
                    canStart={phaseInfo.canStartVorOrt}
                    onStart={() => onCheckin(order.id, 'vor_ort')}
                    onComplete={() => onCheckout(order.id, 'vor_ort')}
                  />
                  <PhaseStatus
                    label={CHECKIN_PHASE_LABELS.nachbearbeitung}
                    checkinAt={order.nachbearbeitungCheckinAt}
                    checkoutAt={order.nachbearbeitungCheckoutAt}
                    isActive={phaseInfo.currentPhase === 'nachbearbeitung'}
                    canStart={phaseInfo.canStartNachbearbeitung}
                    onStart={() => onCheckin(order.id, 'nachbearbeitung')}
                    onComplete={() => onCheckout(order.id, 'nachbearbeitung')}
                  />
                </div>

                {/* Billing Info */}
                {order.billableAmount && (
                  <div className="px-4 pb-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <span className="text-sm text-muted-foreground">Vergütung: </span>
                      <span className="font-bold text-foreground">{order.billableAmount.toFixed(2)} €</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
