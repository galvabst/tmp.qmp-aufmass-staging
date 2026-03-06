import { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Euro, Gift, ChevronDown, FileText } from 'lucide-react';
import { TechnicianOrder } from '@/types/technician';
import { AUFTRAGSTYP_LABELS, OBJECT_ORDER_STATUS_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import {
  useContractorBoni,
  useBoniSummary,
  groupBoniByMonat,
  BONUS_TYP_LABELS,
  type BonusTyp,
} from '@/hooks/useContractorBoni';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GalvanekLogo } from '@/components/GalvanekLogo';
import { DeadlineCountdown, AngebotsterminBadge } from '@/components/DeadlineCountdown';

interface ReviewViewProps {
  orders: TechnicianOrder[];
  onOrderClick: (order: TechnicianOrder) => void;
  angebotstermine?: Map<string, { startDatetime: string; endDatetime: string }>;
}

type ActiveSection = 'ausstehend' | 'abgenommen' | 'boni' | null;

const statusConfig = {
  submitted: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Eingereicht' },
  in_review: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'In Prüfung' },
  approved: { icon: CheckCircle2, color: 'text-status-accepted', bg: 'bg-status-accepted/10', label: 'Abgenommen' },
  rework_required: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Nacharbeit' },
};

export function ReviewView({ orders, onOrderClick, angebotstermine }: ReviewViewProps) {
  const { data: boni } = useContractorBoni();
  const boniSummary = useBoniSummary(boni);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const reviewOrders = orders.filter(o =>
    ['submitted', 'in_review', 'approved', 'rework_required'].includes(o.status)
  );

  const pendingOrders = reviewOrders.filter(o => ['submitted', 'in_review'].includes(o.status));
  const approvedOrders = reviewOrders.filter(o => o.status === 'approved');
  const reworkOrders = reviewOrders.filter(o => o.status === 'rework_required');

  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.billableAmount || 0), 0);
  const approvedAmount = approvedOrders.reduce((sum, o) => sum + (o.billableAmount || 0), 0);

  const toggle = (section: ActiveSection) =>
    setActiveSection(prev => (prev === section ? null : section));

  // Determine which orders to show in the list
  const visibleOrders =
    activeSection === 'ausstehend'
      ? pendingOrders
      : activeSection === 'abgenommen'
        ? approvedOrders
        : reviewOrders;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">In Prüfung</h1>
              <p className="text-primary-foreground/70 text-sm">{reviewOrders.length} Aufträge</p>
            </div>
            <GalvanekLogo size="sm" variant="white" className="opacity-95" />
          </div>
        </div>
      </header>

      {/* Interactive Summary Cards */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          label="Ausstehend"
          amount={`${pendingAmount.toFixed(0)} €`}
          sub={`${pendingOrders.length} Aufträge`}
          active={activeSection === 'ausstehend'}
          onClick={() => toggle('ausstehend')}
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-4 h-4 text-status-accepted" />}
          label="Abgenommen"
          amount={`${approvedAmount.toFixed(0)} €`}
          amountClass="text-status-accepted"
          sub={`${approvedOrders.length} Aufträge`}
          active={activeSection === 'abgenommen'}
          onClick={() => toggle('abgenommen')}
        />
        <SummaryCard
          icon={<Gift className="w-4 h-4 text-primary" />}
          label="Boni"
          amount={`${boniSummary.freigegeben.toFixed(0)} €`}
          amountClass="text-primary"
          sub={`${boniSummary.count} Boni`}
          active={activeSection === 'boni'}
          onClick={() => toggle('boni')}
        />
      </div>

      {/* Expanded Section: Abgenommen Detail */}
      {activeSection === 'abgenommen' && (
        <div className="px-4 mb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-card rounded-xl p-3 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Noch nicht abgerechnet</span>
            </div>
            <p className="text-lg font-bold text-foreground">{approvedAmount.toFixed(0)} €</p>
            <p className="text-xs text-muted-foreground">{approvedOrders.length} Aufträge</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Abrechnungsfunktion folgt in Kürze
          </p>
        </div>
      )}

      {/* Expanded Section: Boni Detail */}
      {activeSection === 'boni' && (
        <BoniDetailSection boni={boni || []} />
      )}

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

      {/* Order List */}
      {visibleOrders.length === 0 && activeSection !== 'boni' ? (
        <div className="flex flex-col items-center justify-center p-8 text-center mt-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            {activeSection === 'ausstehend'
              ? 'Keine ausstehenden Aufträge'
              : activeSection === 'abgenommen'
                ? 'Keine abgenommenen Aufträge'
                : 'Keine Aufträge in Prüfung'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Schließe aktive Aufträge ab, um sie zur Prüfung einzureichen.
          </p>
        </div>
      ) : activeSection !== 'boni' ? (
        <div className="p-4 pt-0 space-y-3">
          {visibleOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onOrderClick={onOrderClick}
              angebotstermine={angebotstermine}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Sub-components ── */

function SummaryCard({
  icon, label, amount, amountClass, sub, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string;
  amountClass?: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-card rounded-xl p-4 shadow-card text-left transition-all',
        active && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-muted-foreground ml-auto transition-transform',
            active && 'rotate-180',
          )}
        />
      </div>
      <p className={cn('text-xl font-bold text-foreground', amountClass)}>{amount}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </button>
  );
}

function BoniDetailSection({ boni }: { boni: import('@/hooks/useContractorBoni').ContractorBonus[] }) {
  const gruppen = groupBoniByMonat(boni);

  if (gruppen.length === 0) {
    return (
      <div className="px-4 mb-4 animate-in slide-in-from-top-2 duration-200">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Boni vorhanden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
      {gruppen.map(g => (
        <div key={g.monatKey} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">{g.monatLabel}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{g.summe.toFixed(0)} €</span>
              {g.offen > 0 && (
                <Badge variant="outline" className="text-[10px]">offen</Badge>
              )}
            </div>
          </div>
          <div className="divide-y divide-border">
            {g.boni.map(b => (
              <div key={b.id} className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {b.lead_name || '–'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {BONUS_TYP_LABELS[b.bonus_typ as BonusTyp] || b.bonus_typ}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-semibold text-foreground">{b.betrag.toFixed(0)} €</p>
                  <p className={cn(
                    'text-[10px]',
                    b.abgerechnet_am ? 'text-status-accepted' : 'text-muted-foreground',
                  )}>
                    {b.abgerechnet_am ? 'Abgerechnet' : 'Offen'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({
  order, onOrderClick, angebotstermine,
}: {
  order: TechnicianOrder;
  onOrderClick: (o: TechnicianOrder) => void;
  angebotstermine?: Map<string, { startDatetime: string; endDatetime: string }>;
}) {
  const config = statusConfig[order.status as keyof typeof statusConfig];
  const StatusIcon = config?.icon || Clock;
  const agTermin = order.leadId ? angebotstermine?.get(order.leadId) : undefined;

  return (
    <button
      onClick={() => onOrderClick(order)}
      className="w-full bg-card rounded-xl p-4 shadow-card text-left hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {AUFTRAGSTYP_LABELS[order.auftragstyp]}
            </Badge>
            {agTermin && <AngebotsterminBadge startDatetime={agTermin.startDatetime} />}
          </div>
          <h3 className="font-semibold text-foreground">{order.customerName}</h3>
        </div>
        <div className={cn('px-2 py-1 rounded-full flex items-center gap-1', config?.bg)}>
          <StatusIcon className={cn('w-3 h-3', config?.color)} />
          <span className={cn('text-xs font-medium', config?.color)}>
            {config?.label || OBJECT_ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      {order.submittedAt && (
        <DeadlineCountdown
          scheduledDate={order.scheduledDate}
          zeitBis={order.zeitBis}
          submittedAt={order.submittedAt}
          compact
          className="mb-2"
        />
      )}

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
          {order.billableAmount != null ? `${order.billableAmount.toFixed(2)} €` : '–'}
        </div>
      </div>
    </button>
  );
}
