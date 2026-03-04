import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { AdminLektion } from '../../hooks/useAdminAkademieModule';

interface LektionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lektion: AdminLektion | null; // null = neue Lektion
  modulId: string;
  onSave: (data: {
    id?: string;
    modul_id: string;
    code: string;
    titel: string;
    beschreibung?: string;
    reihenfolge?: number;
    video_url?: string;
    video_dauer_minuten?: number;
    text_inhalt?: string;
    text_zusammenfassung?: string;
    ist_aktiv?: boolean;
    nur_fuer_neue?: boolean;
    auch_fuer_trainer?: boolean;
  }) => Promise<any>;
  isPending: boolean;
}

export function LektionEditor({ open, onOpenChange, lektion, modulId, onSave, isPending }: LektionEditorProps) {
  const [code, setCode] = useState('');
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [reihenfolge, setReihenfolge] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDauer, setVideoDauer] = useState<number | ''>('');
  const [textInhalt, setTextInhalt] = useState('');
  const [textZusammenfassung, setTextZusammenfassung] = useState('');
  const [istAktiv, setIstAktiv] = useState(true);
  const [nurFuerNeue, setNurFuerNeue] = useState(false);
  const [auchFuerTrainer, setAuchFuerTrainer] = useState(false);

  useEffect(() => {
    if (lektion) {
      setCode(lektion.code);
      setTitel(lektion.titel);
      setBeschreibung(lektion.beschreibung || '');
      setReihenfolge(lektion.reihenfolge);
      setVideoUrl(lektion.video_url || '');
      setVideoDauer(lektion.video_dauer_minuten ?? '');
      setTextInhalt(lektion.text_inhalt || '');
      setTextZusammenfassung(lektion.text_zusammenfassung || '');
      setIstAktiv(lektion.ist_aktiv);
      setNurFuerNeue(lektion.nur_fuer_neue ?? false);
      setAuchFuerTrainer(lektion.auch_fuer_trainer ?? false);
    } else {
      setCode('');
      setTitel('');
      setBeschreibung('');
      setReihenfolge(0);
      setVideoUrl('');
      setVideoDauer('');
      setTextInhalt('');
      setTextZusammenfassung('');
      setIstAktiv(true);
      setNurFuerNeue(false);
      setAuchFuerTrainer(false);
    }
  }, [lektion, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...(lektion ? { id: lektion.id } : {}),
      modul_id: modulId,
      code,
      titel,
      beschreibung: beschreibung || undefined,
      reihenfolge,
      video_url: videoUrl || undefined,
      video_dauer_minuten: videoDauer === '' ? undefined : Number(videoDauer),
      text_inhalt: textInhalt || undefined,
      text_zusammenfassung: textZusammenfassung || undefined,
      ist_aktiv: istAktiv,
      nur_fuer_neue: nurFuerNeue,
      auch_fuer_trainer: auchFuerTrainer,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lektion ? 'Lektion bearbeiten' : 'Neue Lektion'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lek-code">Code *</Label>
              <Input id="lek-code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="z.B. 1-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lek-reihenfolge">Reihenfolge</Label>
              <Input id="lek-reihenfolge" type="number" value={reihenfolge} onChange={(e) => setReihenfolge(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lek-titel">Titel *</Label>
            <Input id="lek-titel" value={titel} onChange={(e) => setTitel(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lek-beschreibung">Beschreibung</Label>
            <Textarea id="lek-beschreibung" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="lek-video">Video-URL (Bunny Stream)</Label>
              <Input id="lek-video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://iframe.mediadelivery.net/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lek-dauer">Dauer (Min.)</Label>
              <Input id="lek-dauer" type="number" value={videoDauer} onChange={(e) => setVideoDauer(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lek-text">Textinhalt</Label>
            <Textarea id="lek-text" value={textInhalt} onChange={(e) => setTextInhalt(e.target.value)} rows={4} placeholder="Markdown-fähiger Lerninhalt..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lek-zusammenfassung">Zusammenfassung</Label>
            <Textarea id="lek-zusammenfassung" value={textZusammenfassung} onChange={(e) => setTextZusammenfassung(e.target.value)} rows={2} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={istAktiv} onCheckedChange={setIstAktiv} id="lek-aktiv" />
            <Label htmlFor="lek-aktiv">Aktiv</Label>
          </div>

          <div className="rounded-lg border border-dashed p-3 space-y-3">
            <div>
              <div className="flex items-center gap-3">
                <Switch checked={nurFuerNeue} onCheckedChange={(v) => { setNurFuerNeue(v); if (v) setAuchFuerTrainer(false); }} id="lek-nur-neue" />
                <Label htmlFor="lek-nur-neue" className="font-medium">Nur für neue Onboarder</Label>
              </div>
              <p className="text-xs text-muted-foreground pl-14">
                Wenn aktiv, müssen bereits fertige Techniker diese Lektion <strong>nicht</strong> nachholen. Andernfalls wird ein Pflicht-Video-Overlay angezeigt.
              </p>
            </div>

            {!nurFuerNeue && (
              <div>
                <div className="flex items-center gap-3">
                  <Switch checked={auchFuerTrainer} onCheckedChange={setAuchFuerTrainer} id="lek-auch-trainer" />
                  <Label htmlFor="lek-auch-trainer" className="font-medium">Auch für Trainer</Label>
                </div>
                <p className="text-xs text-muted-foreground pl-14">
                  Wenn aktiv, müssen auch Trainer dieses Pflicht-Video anschauen (z.B. Fehlerprotokolle, Neuerungen).
                </p>
              </div>
            )}
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
