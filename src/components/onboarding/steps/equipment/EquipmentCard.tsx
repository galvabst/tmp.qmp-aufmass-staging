import { ReactNode } from 'react';
import { CheckCircle2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  stepNumber: number;
  children: ReactNode;
}

export function EquipmentCard({ icon: Icon, title, subtitle, isCompleted, stepNumber, children }: EquipmentCardProps) {
  return (
    <div className={cn(
      'relative rounded-2xl border bg-card p-5 transition-all duration-300',
      isCompleted
        ? 'border-status-accepted/30 shadow-[0_0_0_1px_hsl(var(--status-accepted)/0.1),0_4px_12px_-2px_hsl(var(--status-accepted)/0.08)]'
        : 'border-border/80 shadow-card hover:shadow-[0_4px_16px_-4px_hsl(215_25%_15%/0.1)]'
    )}>
      {/* Completed glow accent */}
      {isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-status-accepted to-transparent rounded-t-2xl" />
      )}

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className={cn(
          'relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300',
          isCompleted
            ? 'bg-status-accepted/10'
            : 'bg-primary/8'
        )}>
          <Icon className={cn(
            'w-5 h-5 transition-colors duration-300',
            isCompleted ? 'text-status-accepted' : 'text-primary'
          )} />
          {isCompleted && (
            <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-status-accepted fill-status-accepted-bg" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-[15px] leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
          isCompleted
            ? 'bg-status-accepted/10 text-status-accepted'
            : 'bg-muted text-muted-foreground'
        )}>
          {isCompleted ? '✓ Fertig' : `#${stepNumber}`}
        </span>
      </div>

      {children}
    </div>
  );
}
