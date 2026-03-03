import { MessageCircle, CheckCircle2, Shield } from 'lucide-react';
import type { ForumThread } from '../hooks/useForumThreads';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { getKategorieConfig } from '../lib/forum-kategorien';

interface ForumThreadCardProps {
  thread: ForumThread;
  onClick: (thread: ForumThread) => void;
}

export function ForumThreadCard({ thread, onClick }: ForumThreadCardProps) {
  const timeAgo = formatDistanceToNow(new Date(thread.erstellt_am), { addSuffix: true, locale: de });
  const kat = getKategorieConfig(thread.kategorie);
  const initials = thread.autor_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={() => onClick(thread)}
      className={`w-full text-left p-4 bg-card border rounded-xl shadow-card hover:shadow-card-hover transition-all ${
        thread.ist_geloest
          ? 'border-[hsl(var(--status-accepted))]/30 bg-[hsl(var(--status-accepted))]/[0.03]'
          : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${kat.color}`}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {thread.ist_geloest && (
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-accepted))] shrink-0" />
              )}
              <h3 className="text-sm font-semibold text-foreground truncate">{thread.titel}</h3>
            </div>
            {/* Kategorie badge */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${kat.color}`}>
              {kat.emoji} {kat.label}
            </span>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{thread.inhalt}</p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium">{thread.autor_name}</span>
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
