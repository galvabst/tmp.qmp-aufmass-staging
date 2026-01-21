import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { TechnicianOrder } from '@/types/technician';
import { AUFTRAGSTYP_LABELS } from '@/lib/enums';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface BookingsViewProps {
  orders: TechnicianOrder[];
  onOrderClick: (order: TechnicianOrder) => void;
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Heute';
  if (isTomorrow(date)) return 'Morgen';
  return format(date, 'EEEE, d. MMMM', { locale: de });
}

export function BookingsView({ orders, onOrderClick }: BookingsViewProps) {
  const bookedOrders = orders
    .filter(o => o.status === 'booked')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  // Group by date
  const groupedOrders = bookedOrders.reduce((acc, order) => {
    const dateKey = order.scheduledDate;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, TechnicianOrder[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold">Meine Buchungen</h1>
          <p className="text-primary-foreground/80 text-sm">
            {bookedOrders.length} anstehende Termine
          </p>
        </div>
      </header>

      {bookedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center mt-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Keine Buchungen</h3>
          <p className="text-sm text-muted-foreground">
            Nimm Aufträge aus dem Pool an, um deine ersten Termine zu erhalten.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {Object.entries(groupedOrders).map(([dateKey, dateOrders]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDateLabel(dateKey)}
              </h2>
              <div className="space-y-3">
                {dateOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => onOrderClick(order)}
                    className="w-full bg-card rounded-xl p-4 shadow-card text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {AUFTRAGSTYP_LABELS[order.auftragstyp]}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {order.scheduledTime} Uhr
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground">{order.customerName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {order.address}, {order.city}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {order.billableAmount && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-sm text-muted-foreground">Vergütung: </span>
                        <span className="font-semibold text-foreground">{order.billableAmount.toFixed(2)} €</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
