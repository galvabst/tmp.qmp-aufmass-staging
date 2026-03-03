import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateThread } from '../hooks/useCreateThread';
import { FORUM_KATEGORIEN, type ForumKategorie } from '../lib/forum-kategorien';

interface ForumNewThreadProps {
  onBack: () => void;
  onCreated: () => void;
}

export function ForumNewThread({ onBack, onCreated }: ForumNewThreadProps) {
  const [titel, setTitel] = useState('');
  const [inhalt, setInhalt] = useState('');
  const [kategorie, setKategorie] = useState<ForumKategorie | ''>('');
  const createThread = useCreateThread();

  const handleSubmit = async () => {
    if (!titel.trim() || !inhalt.trim() || !kategorie) return;
    await createThread.mutateAsync({ titel: titel.trim(), inhalt: inhalt.trim(), kategorie });
    onCreated();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Neue Frage</h1>
      </header>

      <div className="p-4 space-y-4 pb-24">
        {/* Kategorie chips */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Thema</label>
          <div className="flex flex-wrap gap-2">
            {FORUM_KATEGORIEN.map(k => (
              <button
                key={k.label}
                type="button"
                onClick={() => setKategorie(k.label)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  kategorie === k.label
                    ? k.color + ' font-semibold ring-1 ring-offset-1 ring-current'
                    : 'bg-muted/50 text-muted-foreground border-border'
                }`}
              >
                {k.emoji} {k.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Titel</label>
          <Input
            value={titel}
            onChange={e => setTitel(e.target.value)}
            placeholder="Kurze Zusammenfassung deiner Frage..."
            maxLength={200}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Beschreibung</label>
          <Textarea
            value={inhalt}
            onChange={e => setInhalt(e.target.value)}
            placeholder="Beschreibe deine Frage ausführlich..."
            rows={8}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!titel.trim() || !inhalt.trim() || !kategorie || createThread.isPending}
          className="w-full"
        >
          {createThread.isPending ? 'Wird erstellt...' : 'Frage stellen'}
        </Button>
      </div>
    </div>
  );
}
