import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { AdminModul } from '../../hooks/useAdminAkademieModule';

interface ModulEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modul: AdminModul | null; // null = neues Modul
  onSave: (data: {
    id?: string;
    code: string;
    titel: string;
    beschreibung?: string;
    reihenfolge?: number;
    ist_aktiv?: boolean;
  }) => Promise<any>;
  isPending: boolean;
}

export function ModulEditor({ open, onOpenChange, modul, onSave, isPending }: ModulEditorProps) {
  const [code, setCode] = useState('');
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [reihenfolge, setReihenfolge] = useState(0);
  const [istAktiv, setIstAktiv] = useState(true);

  useEffect(() => {
    if (modul) {
      setCode(modul.code);
      setTitel(modul.titel);
      setBeschreibung(modul.beschreibung || '');
      setReihenfolge(modul.reihenfolge);
      setIstAktiv(modul.ist_aktiv);
    } else {
      setCode('');
      setTitel('');
      setBeschreibung('');
      setReihenfolge(0);
      setIstAktiv(true);
    }
  }, [modul, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...(modul ? { id: modul.id } : {}),
      code,
      titel,
      beschreibung: beschreibung || undefined,
      reihenfolge,
      ist_aktiv: istAktiv,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modul ? 'Modul bearbeiten' : 'Neues Modul'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modul-code">Code *</Label>
            <Input id="modul-code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="z.B. MOD-01" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modul-titel">Titel *</Label>
            <Input id="modul-titel" value={titel} onChange={(e) => setTitel(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modul-beschreibung">Beschreibung</Label>
            <Textarea id="modul-beschreibung" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modul-reihenfolge">Reihenfolge</Label>
              <Input id="modul-reihenfolge" type="number" value={reihenfolge} onChange={(e) => setReihenfolge(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={istAktiv} onCheckedChange={setIstAktiv} id="modul-aktiv" />
              <Label htmlFor="modul-aktiv">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" disabled={isPending || !code || !titel}>
              {isPending ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
