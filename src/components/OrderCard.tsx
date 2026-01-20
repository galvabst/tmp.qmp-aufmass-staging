import { Order } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const formattedDate = format(parseISO(order.scheduledDate), 'EEE, d. MMM', { locale: de });
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-lg shadow-card hover:shadow-card-hover transition-all duration-200 p-4 text-left animate-fade-in active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground font-medium">
              {order.projectType}
            </span>
          </div>
          
          <h3 className="font-semibold text-foreground truncate">
            {order.customerName}
          </h3>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{order.address}, {order.city}</span>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-sm text-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{order.scheduledTime} Uhr</span>
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
