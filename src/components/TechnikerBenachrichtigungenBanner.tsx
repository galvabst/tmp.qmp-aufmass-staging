import { AlertTriangle, Check, X } from 'lucide-react';
import { useTechnikerBenachrichtigungen, useMarkBenachrichtigungGelesen } from '@/hooks/useTechnikerBenachrichtigungen';

/**
 * Top-of-app banner that surfaces unread system notifications for technicians,
 * e.g. orders that were cancelled or set to "verloren" by the back office.
 * Auto-hides when no unread items remain.
 */
export function TechnikerBenachrichtigungenBanner() {
  const { data: items = [] } = useTechnikerBenachrichtigungen();
  const markRead = useMarkBenachrichtigungGelesen();

  const unread = items.filter(i => !i.gelesen_am);
  if (unread.length === 0) return null;

  return (
    <div className="px-4 pt-3 space-y-2">
      {unread.map(n => (
        <div
          key={n.id}
          className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{n.titel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{n.nachricht}</p>
          </div>
          <button
            type="button"
            onClick={() => markRead.mutate(n.id)}
            disabled={markRead.isPending}
            className="shrink-0 inline-flex items-center gap-1 rounded-full bg-background border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Als gelesen markieren"
          >
            <Check className="h-3.5 w-3.5" />
            OK
          </button>
        </div>
      ))}
    </div>
  );
}
