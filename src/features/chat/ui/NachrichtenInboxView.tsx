import { MessageCircle, ChevronRight, Inbox } from 'lucide-react';
import { useAuftragChatInbox, InboxItem } from '@/features/chat/hooks/useAuftragChatInbox';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface NachrichtenInboxViewProps {
  auftragIds: string[];
  unreadCounts: Map<string, number>;
  onOpenChat: (auftragId: string, kundenName: string) => void;
}

function formatTime(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Gestern';
  return format(d, 'd. MMM', { locale: de });
}

export function NachrichtenInboxView({ auftragIds, unreadCounts, onOpenChat }: NachrichtenInboxViewProps) {
  const { data: inboxItems = [], isLoading } = useAuftragChatInbox(auftragIds);

  // Sort: unread first, then by time
  const sorted = [...inboxItems].sort((a, b) => {
    const aUnread = (unreadCounts.get(a.auftragId) || 0) > 0;
    const bUnread = (unreadCounts.get(b.auftragId) || 0) > 0;
    if (aUnread !== bUnread) return aUnread ? -1 : 1;
    return new Date(b.letzteNachrichtAm).getTime() - new Date(a.letzteNachrichtAm).getTime();
  });

  const totalUnread = [...unreadCounts.values()].reduce((s, v) => s + v, 0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="p-4 bg-muted rounded-2xl mb-4">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Keine Nachrichten</p>
        <p className="text-sm text-muted-foreground mt-1">
          Sobald der Innendienst Ihnen schreibt, erscheinen die Nachrichten hier.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {/* Unread banner */}
      {totalUnread > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2.5 mb-2">
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            {totalUnread} neue {totalUnread === 1 ? 'Nachricht' : 'Nachrichten'}
          </span>
        </div>
      )}

      {sorted.map((item) => {
        const unread = unreadCounts.get(item.auftragId) || 0;
        return (
          <button
            key={item.auftragId}
            onClick={() => onOpenChat(item.auftragId, item.kundenName)}
            className={cn(
              'w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-colors',
              unread > 0
                ? 'bg-primary/5 border border-primary/20'
                : 'bg-card border border-border'
            )}
          >
            <div className={cn(
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              unread > 0 ? 'bg-primary/15' : 'bg-muted'
            )}>
              <MessageCircle className={cn('w-5 h-5', unread > 0 ? 'text-primary' : 'text-muted-foreground')} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-sm truncate', unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
                  {item.kundenName}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {formatTime(item.letzteNachrichtAm)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={cn(
                  'text-xs truncate',
                  unread > 0 ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {item.istEigeneNachricht ? 'Du: ' : `${item.autorName}: `}
                  {item.letzteNachricht}
                </p>
                {unread > 0 && (
                  <span className="shrink-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5">
                    {unread}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
