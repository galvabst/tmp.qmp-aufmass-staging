import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AdminQuizFrage } from '../../hooks/useAdminAkademieModule';

interface AntwortRow {
  text: string;
  korrekt: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frage: AdminQuizFrage | null;
  modulId: string;
  onSave: (data: any) => Promise<any>;
  isPending: boolean;
}

export function QuizFrageEditor({ open, onOpenChange, frage, modulId, onSave, isPending }: Props) {
  const [frageText, setFrageText] = useState('');
  const [reihenfolge, setReihenfolge] = useState(0);
  const [istAktiv, setIstAktiv] = useState(true);
  const [antworten, setAntworten] = useState<AntwortRow[]>([
    { text: '', korrekt: false },
    { text: '', korrekt: false },
  ]);

  useEffect(() => {
    if (frage) {
      setFrageText(frage.frage);
      setReihenfolge(frage.reihenfolge);
      setIstAktiv(frage.ist_aktiv);
      setAntworten(
        (frage.antworten as AntwortRow[]).map((a) => ({ text: a.text, korrekt: a.korrekt }))
      );
    } else {
      setFrageText('');
      setReihenfolge(0);
      setIstAktiv(true);
      setAntworten([
        { text: '', korrekt: false },
        { text: '', korrekt: false },
      ]);
    }
  }, [frage, open]);

  const addAntwort = () => {
    if (antworten.length < 6) {
      setAntworten([...antworten, { text: '', korrekt: false }]);
    }
  };

  const removeAntwort = (idx: number) => {
    if (antworten.length > 2) {
      setAntworten(antworten.filter((_, i) => i !== idx));
    }
  };

  const updateAntwort = (idx: number, field: keyof AntwortRow, value: string | boolean) => {
    setAntworten(antworten.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  };

  const hasKorrekt = antworten.some((a) => a.korrekt);
  const allFilled = frageText.trim() && antworten.every((a) => a.text.trim());
  const canSave = hasKorrekt && allFilled && !isPending;

  const handleSave = async () => {
    await onSave({
      ...(frage?.id ? { id: frage.id } : {}),
      modul_id: modulId,
      frage: frageText.trim(),
      antworten,
      reihenfolge,
      ist_aktiv: istAktiv,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{frage ? 'Quiz-Frage bearbeiten' : 'Neue Quiz-Frage'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Frage */}
          <div className="space-y-1.5">
            <Label>Frage</Label>
            <Textarea
              value={frageText}
              onChange={(e) => setFrageText(e.target.value)}
              placeholder="Wie lautet die Frage?"
              rows={3}
            />
          </div>

          {/* Reihenfolge + Aktiv */}
          <div className="flex items-center gap-4">
            <div className="space-y-1.5 flex-1">
              <Label>Reihenfolge</Label>
              <Input
                type="number"
                value={reihenfolge}
                onChange={(e) => setReihenfolge(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={istAktiv} onCheckedChange={setIstAktiv} />
              <Label>Aktiv</Label>
            </div>
          </div>

          {/* Antworten */}
          <div className="space-y-2">
            <Label>Antworten (min. 2, max. 6)</Label>
            {antworten.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Checkbox
                  checked={a.korrekt}
                  onCheckedChange={(v) => updateAntwort(idx, 'korrekt', !!v)}
                />
                <Input
                  className="flex-1"
                  value={a.text}
                  onChange={(e) => updateAntwort(idx, 'text', e.target.value)}
                  placeholder={`Antwort ${idx + 1}`}
                />
                {antworten.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => removeAntwort(idx)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {antworten.length < 6 && (
              <Button variant="outline" size="sm" onClick={addAntwort}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Antwort
              </Button>
            )}
            {!hasKorrekt && (
              <p className="text-xs text-destructive">Mindestens eine Antwort muss korrekt sein.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isPending ? 'Speichern…' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
