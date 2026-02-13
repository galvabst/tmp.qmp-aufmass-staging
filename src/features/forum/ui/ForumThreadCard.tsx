import { MessageCircle, CheckCircle2, Shield } from 'lucide-react';
import type { ForumThread } from '../hooks/useForumThreads';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ForumThreadCardProps {
  thread: ForumThread;
  onClick: (thread: ForumThread) => void;
}

export function ForumThreadCard({ thread, onClick }: ForumThreadCardProps) {
  const timeAgo = formatDistanceToNow(new Date(thread.erstellt_am), { addSuffix: true, locale: de });

  return (
    <button
      onClick={() => onClick(thread)}
      className="w-full text-left p-4 bg-card border border-border rounded-xl shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {thread.ist_geloest && (
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-accepted))] shrink-0" />
            )}
            <h3 className="text-sm font-semibold text-foreground truncate">{thread.titel}</h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{thread.inhalt}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{thread.autor_name}</span>
            <span>·</span>
            <span>{timeAgo}</span>
            <div className="flex items-center gap-1 ml-auto">
              {thread.hat_trainer_antwort && (
                <Shield className="w-3.5 h-3.5 text-[hsl(var(--status-accepted))]" />
              )}
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{thread.antworten_count}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
