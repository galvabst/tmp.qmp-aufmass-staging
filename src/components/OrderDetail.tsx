import { Order, OrderStatus } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  FileText, 
  ArrowLeft,
  Check,
  X,
  Navigation
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export function OrderDetail({ order, onBack, onStatusChange }: OrderDetailProps) {
  const formattedDate = format(parseISO(order.scheduledDate), 'EEEE, d. MMMM yyyy', { locale: de });
  const fullAddress = `${order.address}, ${order.postalCode} ${order.city}`;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
  
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border safe-area-top">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Auftragsdetails</h1>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <section className="bg-card rounded-lg shadow-card p-4 animate-fade-in">
          <h2 className="font-semibold text-lg text-foreground mb-1">
            {order.customerName}
          </h2>
          <span className="text-sm text-primary font-medium">{order.projectType}</span>
        </section>

        {/* Date & Time */}
        <section className="bg-card rounded-lg shadow-card p-4 animate-fade-in">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Termin</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{formattedDate}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {order.scheduledTime} Uhr
              </p>
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-card rounded-lg shadow-card p-4 animate-fade-in">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Adresse</h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{order.address}</p>
              <p className="text-sm text-muted-foreground">{order.postalCode} {order.city}</p>
            </div>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Navigation starten
          </a>
        </section>

        {/* Contact */}
        {order.contactPhone && (
          <section className="bg-card rounded-lg shadow-card p-4 animate-fade-in">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Kontakt</h3>
            <a
              href={`tel:${order.contactPhone}`}
              className="flex items-center gap-3 p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{order.contactPhone}</p>
                <p className="text-xs text-muted-foreground">Tippen zum Anrufen</p>
              </div>
            </a>
          </section>
        )}

        {/* Description */}
        <section className="bg-card rounded-lg shadow-card p-4 animate-fade-in">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Beschreibung
          </h3>
          <p className="text-foreground leading-relaxed">{order.description}</p>
          
          {order.notes && (
            <div className="mt-4 p-3 bg-status-new-bg rounded-lg">
              <p className="text-sm font-medium text-status-new mb-1">Hinweis</p>
              <p className="text-sm text-foreground">{order.notes}</p>
            </div>
          )}
        </section>
      </div>

      {/* Action Buttons */}
      {order.status === 'new' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onStatusChange(order.id, 'rejected')}
            >
              <X className="w-5 h-5 mr-2" />
              Ablehnen
            </Button>
            <Button
              className="flex-1 h-12 bg-status-accepted hover:bg-status-accepted/90 text-white"
              onClick={() => onStatusChange(order.id, 'accepted')}
            >
              <Check className="w-5 h-5 mr-2" />
              Annehmen
            </Button>
          </div>
        </div>
      )}

      {order.status === 'accepted' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            className="w-full h-12 bg-primary hover:bg-primary/90"
            onClick={() => onStatusChange(order.id, 'completed')}
          >
            <Check className="w-5 h-5 mr-2" />
            Als erledigt markieren
          </Button>
        </div>
      )}
    </div>
  );
}
