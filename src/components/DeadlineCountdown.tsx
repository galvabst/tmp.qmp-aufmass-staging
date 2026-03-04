import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { calculateDeadline, calculateLateFee, formatTimeRemaining } from '@/lib/late-fee-calculator';
import { cn } from '@/lib/utils';

interface DeadlineCountdownProps {
  scheduledDate: string;
  zeitBis?: string;
  /** If set, the order was already submitted — show static result */
  submittedAt?: string;
  compact?: boolean;
  className?: string;
}

export function DeadlineCountdown({ scheduledDate, zeitBis, submittedAt, compact, className }: DeadlineCountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (submittedAt) return; // no need to tick for submitted orders
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [submittedAt]);

  const deadline = calculateDeadline(scheduledDate, zeitBis);
  
  // If submitted, calculate fee at submission time
  const effectiveNow = submittedAt ? new Date(submittedAt) : now;
  const result = calculateLateFee(deadline, effectiveNow);

  // Don't show countdown if deadline is far in the future (> 48h) and not overdue
  if (!result.isOverdue && result.msRemaining > 48 * 60 * 60 * 1000 && !compact) {
    return null;
  }

  if (result.isOverdue) {
    return (
      <div className={cn(
        'flex items-center gap-1.5 rounded-lg',
        compact ? 'text-xs' : 'text-xs px-2 py-1 bg-destructive/10 border border-destructive/20',
        className
      )}>
        <AlertTriangle className={cn('shrink-0 text-destructive', compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        <span className="font-semibold text-destructive">
          {submittedAt ? 'Verspätet' : 'ÜBERFÄLLIG'}
        </span>
        <span className="font-bold text-destructive">
          {result.fee.toFixed(0)} € Strafe
        </span>
        {!submittedAt && !compact && (
          <span className="text-destructive/70">
            (+{result.hoursOverdue}h)
          </span>
        )}
      </div>
    );
  }

  // Show countdown
  const timeStr = formatTimeRemaining(result.msRemaining);
  const isUrgent = result.msRemaining < 4 * 60 * 60 * 1000; // < 4h

  return (
    <div className={cn(
      'flex items-center gap-1.5',
      compact ? 'text-xs' : 'text-xs px-2 py-1 rounded-lg border',
      isUrgent
        ? compact ? 'text-orange-600 dark:text-orange-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
        : compact ? 'text-muted-foreground' : 'bg-muted/50 border-border text-muted-foreground',
      className
    )}>
      <Clock className={cn('shrink-0', compact ? 'w-3 h-3' : 'w-3.5 h-3.5', isUrgent && 'animate-pulse')} />
      <span className="font-medium">
        Abgabe in {timeStr}
      </span>
    </div>
  );
}

interface AngebotsterminBadgeProps {
  startDatetime: string;
  className?: string;
}

export function AngebotsterminBadge({ startDatetime, className }: AngebotsterminBadgeProps) {
  const start = new Date(startDatetime);
  const now = new Date();
  const msUntil = start.getTime() - now.getTime();
  const daysUntil = Math.ceil(msUntil / (24 * 60 * 60 * 1000));

  const isPast = msUntil < 0;
  const isSoon = daysUntil <= 2 && !isPast;

  const label = isPast
    ? 'AG-Termin verstrichen'
    : daysUntil === 0
      ? 'AG-Termin heute'
      : daysUntil === 1
        ? 'AG-Termin morgen'
        : `AG in ${daysUntil} Tagen`;

  return (
    <div className={cn(
      'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
      isPast
        ? 'bg-destructive/10 text-destructive'
        : isSoon
          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      className
    )}>
      <Clock className="w-3 h-3" />
      {label}
    </div>
  );
}
