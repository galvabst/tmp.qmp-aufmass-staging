import { MapPin, Clock, ChevronRight, Euro, Lock } from 'lucide-react';
import { TechnicianOrder } from '@/types/technician';
import { AUFTRAGSTYP_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface TechnicianOrderCardProps {
  order: TechnicianOrder;
  onClick: () => void;
  showBilling?: boolean;
  showFullDetails?: boolean;
}

export function TechnicianOrderCard({ 
  order, 
  onClick, 
  showBilling = true,
  showFullDetails = false,
}: TechnicianOrderCardProps) {
  const formattedDate = format(parseISO(order.scheduledDate), 'EEE, d. MMM', { locale: de });
  const isLocked = order.isLocked === true;

  const locationDisplay = showFullDetails 
    ? `${order.address}, ${order.city}`
    : `${order.postalCode} ${order.city}`;

  const handleClick = () => {
    if (isLocked) {
      toast.info(order.lockReason || 'Nicht freigegeben');
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full bg-card rounded-2xl p-4 shadow-card border border-border/50 text-left transition-all duration-200 ${
        isLocked
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md hover:border-border active:scale-[0.98]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className={`text-xs font-medium border-0 ${
              isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
            }`}>
              {AUFTRAGSTYP_LABELS[order.auftragstyp]}
            </Badge>
            {isLocked && (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          <h3 className="font-semibold text-foreground">{order.customerName}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {locationDisplay}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {formattedDate} · {order.scheduledTime} Uhr
          </p>
        </div>
        {isLocked ? (
          <Lock className="w-5 h-5 text-muted-foreground mt-1" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
        )}
      </div>
      
      {showBilling && order.billableAmount != null && !isLocked && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Vergütung</span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Euro className="w-4 h-4" />
            {order.billableAmount.toFixed(2)}
          </span>
        </div>
      )}
    </button>
  );
}
