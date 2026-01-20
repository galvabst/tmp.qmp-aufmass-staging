import { OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  new: {
    label: 'Neu',
    className: 'bg-status-new-bg text-status-new',
  },
  accepted: {
    label: 'Angenommen',
    className: 'bg-status-accepted-bg text-status-accepted',
  },
  completed: {
    label: 'Erledigt',
    className: 'bg-status-completed-bg text-status-completed',
  },
  rejected: {
    label: 'Abgelehnt',
    className: 'bg-status-rejected-bg text-status-rejected',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
