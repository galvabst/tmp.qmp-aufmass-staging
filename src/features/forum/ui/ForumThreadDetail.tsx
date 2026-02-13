import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TrainerBadge } from './TrainerBadge';
import { ForumAntwortCard } from './ForumAntwortCard';
import { useForumAntworten } from '../hooks/useForumAntworten';
import { useCreateAntwort } from '../hooks/useCreateAntwort';
import type { ForumThread } from '../hooks/useForumThreads';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ForumThreadDetailProps {
  thread: ForumThread;
  onBack: () => void;
}

export function ForumThreadDetail({ thread, onBack }: ForumThreadDetailProps) {
  const [antwortText, setAntwortText] = useState('');
  const { data: antworten, isLoading } = useForumAntworten(thread.id, thread.akzeptierte_antwort_id);
  const createAntwort = useCreateAntwort();
  const timeAgo = formatDistanceToNow(new Date(thread.erstellt_am), { addSuffix: true, locale: de });

  const handleSend = async () => {
    if (!antwortText.trim()) return;
    await createAntwort.mutateAsync({ threadId: thread.id, inhalt: antwortText.trim() });
    setAntwortText('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground truncate">{thread.titel}</h1>
        {thread.ist_geloest && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-accepted))] shrink-0" />}
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {/* Original question */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-foreground">{thread.autor_name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{thread.inhalt}</p>
        </div>

        {/* Answers */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {antworten?.length || 0} Antwort{(antworten?.length || 0) !== 1 ? 'en' : ''}
          </h2>
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-6">Laden...</div>
          ) : (
            antworten?.map(a => <ForumAntwortCard key={a.id} antwort={a} />)
          )}
          {!isLoading && antworten?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Noch keine Antworten – sei der Erste!</p>
          )}
        </div>
      </div>

      {/* Reply input */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-3 safe-area-bottom z-40">
        <div className="flex gap-2">
          <Textarea
            value={antwortText}
            onChange={e => setAntwortText(e.target.value)}
            placeholder="Deine Antwort..."
            rows={2}
            className="flex-1 min-h-[44px] resize-none"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!antwortText.trim() || createAntwort.isPending}
            className="shrink-0 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
