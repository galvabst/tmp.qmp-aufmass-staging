import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface PipelineStat {
  key: string;
  label: string;
  count: number;
  percent: number;
  icon: LucideIcon;
  bgColor: string;
}

interface PipelineCardsProps {
  stats: PipelineStat[];
  activeFilter?: string | null;
  onFilterChange?: (key: string | null) => void;
  className?: string;
}

export function PipelineCards({
  stats,
  activeFilter,
  onFilterChange,
  className,
}: PipelineCardsProps) {
  const handleClick = (key: string) => {
    if (!onFilterChange) return;
    // Toggle: if already active, clear filter
    onFilterChange(activeFilter === key ? null : key);
  };

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide',
        className
      )}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = activeFilter === stat.key;

        return (
          <button
            key={stat.key}
            onClick={() => handleClick(stat.key)}
            className={cn(
              'flex-shrink-0 min-w-[100px] rounded-lg p-3 transition-all',
              'border-2 text-left',
              stat.bgColor,
              isActive
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-transparent hover:border-border',
              onFilterChange && 'cursor-pointer'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {stat.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                {stat.count}
              </span>
              <span className="text-xs text-muted-foreground">
                {stat.percent}%
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
