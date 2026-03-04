import { CheckCircle2, Clock, AlertTriangle, Euro, Gift } from 'lucide-react';
import { TechnicianOrder } from '@/types/technician';
import { AUFTRAGSTYP_LABELS, OBJECT_ORDER_STATUS_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { useContractorBoni, useBoniSummary } from '@/hooks/useContractorBoni';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GalvanekLogo } from '@/components/GalvanekLogo';

interface ReviewViewProps {
  orders: TechnicianOrder[];
  onOrderClick: (order: TechnicianOrder) => void;
}

const statusConfig = {
  submitted: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Eingereicht' },
  in_review: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'In Prüfung' },
  approved: { icon: CheckCircle2, color: 'text-status-accepted', bg: 'bg-status-accepted/10', label: 'Abgenommen' },
  rework_required: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Nacharbeit' },
};

export function ReviewView({ orders, onOrderClick }: ReviewViewProps) {
  const { data: boni } = useContractorBoni();
  const boniSummary = useBoniSummary(boni);

  const reviewOrders = orders.filter(o => 
    ['submitted', 'in_review', 'approved', 'rework_required'].includes(o.status)
  );

  // Calculate totals
  const pendingOrders = reviewOrders.filter(o => ['submitted', 'in_review'].includes(o.status));
  const approvedOrders = reviewOrders.filter(o => o.status === 'approved');
  const reworkOrders = reviewOrders.filter(o => o.status === 'rework_required');

  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.billableAmount || 0), 0);
  const approvedAmount = approvedOrders.reduce((sum, o) => sum + (o.billableAmount || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">In Prüfung</h1>
              <p className="text-primary-foreground/70 text-sm">
                {reviewOrders.length} Aufträge
              </p>
            </div>
            <GalvanekLogo size="sm" variant="white" className="opacity-95" />
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Ausstehend</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{pendingAmount.toFixed(2)} €</p>
          <p className="text-xs text-muted-foreground">{pendingOrders.length} Aufträge</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-status-accepted" />
            <span className="text-xs text-muted-foreground">Abgenommen</span>
          </div>
          <p className="text-2xl font-bold text-status-accepted">{approvedAmount.toFixed(2)} €</p>
          <p className="text-xs text-muted-foreground">{approvedOrders.length} Aufträge</p>
        </div>
      </div>

      {/* Rework Alert */}
      {reworkOrders.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{reworkOrders.length} Auftrag(e) benötigen Nacharbeit</span>
            </div>
          </div>
        </div>
      )}

      {reviewOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center mt-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Keine Aufträge in Prüfung</h3>
          <p className="text-sm text-muted-foreground">
            Schließe aktive Aufträge ab, um sie zur Prüfung einzureichen.
          </p>
        </div>
      ) : (
        <div className="p-4 pt-0 space-y-3">
          {reviewOrders.map(order => {
            const config = statusConfig[order.status as keyof typeof statusConfig];
            const StatusIcon = config?.icon || Clock;
            
            return (
              <button
                key={order.id}
                onClick={() => onOrderClick(order)}
                className="w-full bg-card rounded-xl p-4 shadow-card text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {AUFTRAGSTYP_LABELS[order.auftragstyp]}
                    </Badge>
                    <h3 className="font-semibold text-foreground">{order.customerName}</h3>
                  </div>
                  <div className={cn('px-2 py-1 rounded-full flex items-center gap-1', config?.bg)}>
                    <StatusIcon className={cn('w-3 h-3', config?.color)} />
                    <span className={cn('text-xs font-medium', config?.color)}>
                      {config?.label || OBJECT_ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">
                    {order.submittedAt && (
                      <>Eingereicht: {format(parseISO(order.submittedAt), 'd. MMM yyyy', { locale: de })}</>
                    )}
                    {order.approvedAt && (
                      <>Abgenommen: {format(parseISO(order.approvedAt), 'd. MMM yyyy', { locale: de })}</>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    <Euro className="w-4 h-4" />
                    {order.billableAmount != null
                      ? `${order.billableAmount.toFixed(2)} €`
                      : '–'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
