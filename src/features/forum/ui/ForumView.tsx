import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ForumThreadCard } from './ForumThreadCard';
import { ForumThreadDetail } from './ForumThreadDetail';
import { ForumNewThread } from './ForumNewThread';
import { useForumThreads, type ForumThread } from '../hooks/useForumThreads';
import { GalvanekLogo } from '@/components/GalvanekLogo';

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
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground safe-area-top sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Forum</h1>
              <p className="text-primary-foreground/70 text-sm">Fragen & Antworten</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => setView('new')}
                className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4" />
                Frage stellen
              </Button>
              <GalvanekLogo size="sm" variant="white" className="opacity-95" />
            </div>
          </div>
          {/* Filter */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setFilter('alle')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === 'alle'
                  ? 'bg-white/25 text-white border-white/30 backdrop-blur-sm'
                  : 'bg-white/10 text-white/70 border-white/10 backdrop-blur-sm'
              }`}
            >
              Alle Fragen
            </button>
            <button
              onClick={() => setFilter('unbeantwortet')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === 'unbeantwortet'
                  ? 'bg-white/25 text-white border-white/30 backdrop-blur-sm'
                  : 'bg-white/10 text-white/70 border-white/10 backdrop-blur-sm'
              }`}
            >
              Unbeantwortete
            </button>
          </div>
        </div>
      </header>

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
