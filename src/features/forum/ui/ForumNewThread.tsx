import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateThread } from '../hooks/useCreateThread';

interface ForumNewThreadProps {
  onBack: () => void;
  onCreated: () => void;
}

export function ForumNewThread({ onBack, onCreated }: ForumNewThreadProps) {
  const [titel, setTitel] = useState('');
  const [inhalt, setInhalt] = useState('');
  const createThread = useCreateThread();

  const handleSubmit = async () => {
    if (!titel.trim() || !inhalt.trim()) return;
    await createThread.mutateAsync({ titel: titel.trim(), inhalt: inhalt.trim() });
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
            placeholder="Beschreibe deine Frage ausfuehrlich..."
            rows={8}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!titel.trim() || !inhalt.trim() || createThread.isPending}
          className="w-full"
        >
          {createThread.isPending ? 'Wird erstellt...' : 'Frage stellen'}
        </Button>
      </div>
    </div>
  );
}
