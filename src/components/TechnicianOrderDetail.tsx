import { ArrowLeft, MapPin, Calendar, Clock, Phone, FileText, Euro, Navigation, Play } from 'lucide-react';
import { TechnicianOrder, CheckinPhase, CHECKIN_PHASE_LABELS } from '@/types/technician';
import { AUFTRAGSTYP_LABELS, OBJECT_ORDER_STATUS_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface TechnicianOrderDetailProps {
  order: TechnicianOrder;
  onBack: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onStartCheckin?: (phase: CheckinPhase) => void;
}

export function TechnicianOrderDetail({ 
  order, 
  onBack, 
  onAccept, 
  onReject,
  onStartCheckin,
}: TechnicianOrderDetailProps) {
  const formattedDate = format(parseISO(order.scheduledDate), 'EEEE, d. MMMM yyyy', { locale: de });
  const fullAddress = `${order.address}, ${order.postalCode} ${order.city}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  const isPoolOrder = order.status === 'published';
  const isBookedOrder = order.status === 'booked';
  const canStartVorOrt = isBookedOrder && !order.vorOrtCheckinAt;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{order.customerName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground">
                  {AUFTRAGSTYP_LABELS[order.auftragstyp]}
                </Badge>
                <span className="text-xs text-primary-foreground/80">
                  {OBJECT_ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Date & Time */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{formattedDate}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {order.scheduledTime} Uhr
              </p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{order.address}</p>
              <p className="text-sm text-muted-foreground">{order.postalCode} {order.city}</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-primary font-medium"
              >
                <Navigation className="w-4 h-4" />
                Navigation starten
              </a>
            </div>
          </div>
        </div>

        {/* Contact */}
        {order.contactPhone && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Kontakt</p>
                <a 
                  href={`tel:${order.contactPhone}`}
                  className="font-semibold text-foreground"
                >
                  {order.contactPhone}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Beschreibung</p>
              <p className="text-foreground mt-1">{order.description}</p>
              {order.notes && (
                <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                  📝 {order.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Billing */}
        {order.billableAmount && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-status-accepted/10 rounded-full flex items-center justify-center">
                <Euro className="w-6 h-6 text-status-accepted" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vergütung</p>
                <p className="text-2xl font-bold text-foreground">{order.billableAmount.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {(isPoolOrder || canStartVorOrt) && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
          {isPoolOrder && onAccept && onReject && (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onReject}
              >
                Ablehnen
              </Button>
              <Button 
                className="flex-1"
                onClick={onAccept}
              >
                Annehmen
              </Button>
            </div>
          )}

          {canStartVorOrt && onStartCheckin && (
            <Button 
              className="w-full gap-2"
              size="lg"
              onClick={() => onStartCheckin('vor_ort')}
            >
              <Play className="w-5 h-5" />
              Check-in Vor-Ort starten
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
