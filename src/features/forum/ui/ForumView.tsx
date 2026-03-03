import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ForumThreadCard } from './ForumThreadCard';
import { ForumThreadDetail } from './ForumThreadDetail';
import { ForumNewThread } from './ForumNewThread';
import { useForumThreads, type ForumThread } from '../hooks/useForumThreads';

export function ForumView() {
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [filter, setFilter] = useState<'alle' | 'unbeantwortet'>('alle');
  const { data: threads, isLoading } = useForumThreads(filter);

  if (view === 'new') {
    return (
      <ForumNewThread
        onBack={() => setView('list')}
        onCreated={() => setView('list')}
      />
    );
  }

  if (view === 'detail' && selectedThread) {
    return (
      <ForumThreadDetail
        thread={selectedThread}
        onBack={() => {
          setView('list');
          setSelectedThread(null);
        }}
      />
    );
  }

  return (
    <div className="pb-20">
      {/* Compact toolbar */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="flex gap-2 flex-1">
          <button
            onClick={() => setFilter('alle')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === 'alle'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            Alle Fragen
          </button>
          <button
            onClick={() => setFilter('unbeantwortet')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === 'unbeantwortet'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            Unbeantwortete
          </button>
        </div>
        <Button
          size="icon"
          variant="default"
          onClick={() => setView('new')}
          className="shrink-0 h-8 w-8 rounded-full"
          aria-label="Frage stellen"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-12">Laden...</div>
        ) : threads && threads.length > 0 ? (
          threads.map(thread => (
            <ForumThreadCard
              key={thread.id}
              thread={thread}
              onClick={t => {
                setSelectedThread(t);
                setView('detail');
              }}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-4">
              {filter === 'unbeantwortet' ? 'Keine unbeantworteten Fragen!' : 'Noch keine Fragen – stelle die erste!'}
            </p>
            <Button variant="outline" size="sm" onClick={() => setView('new')}>
              Frage stellen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
