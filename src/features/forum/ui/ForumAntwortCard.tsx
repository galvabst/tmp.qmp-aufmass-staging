import { CheckCircle2 } from 'lucide-react';
import { TrainerBadge } from './TrainerBadge';
import type { ForumAntwort } from '../hooks/useForumAntworten';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ForumAntwortCardProps {
  antwort: ForumAntwort;
}

export function ForumAntwortCard({ antwort }: ForumAntwortCardProps) {
  const timeAgo = formatDistanceToNow(new Date(antwort.erstellt_am), { addSuffix: true, locale: de });

  return (
    <div
      className={`rounded-lg p-3 ${
        antwort.ist_akzeptiert
          ? 'border-2 border-[hsl(var(--status-accepted))] bg-[hsl(var(--status-accepted-bg))]'
          : antwort.ist_trainer_antwort
          ? 'border border-[hsl(var(--status-accepted))]/40 bg-[hsl(var(--status-accepted-bg))]/50'
          : 'border border-border bg-card'
      }`}
    >
      {antwort.ist_akzeptiert && (
        <div className="flex items-center gap-1.5 text-[hsl(var(--status-accepted))] text-xs font-semibold mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Akzeptierte Antwort
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-foreground">{antwort.autor_name}</span>
        {antwort.ist_trainer_antwort && <TrainerBadge />}
        <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{antwort.inhalt}</p>
    </div>
  );
}
