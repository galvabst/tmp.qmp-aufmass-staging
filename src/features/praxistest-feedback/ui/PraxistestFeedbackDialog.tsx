import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Trash2, ShieldX, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ImageAnnotator } from './ImageAnnotator';
import { useRejectPraxistest } from '../hooks/useRejectPraxistest';
import { KOMPONENTE_LABEL, type PraxistestKomponente, type RejectComponentPayload } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onboardingId: string;
  contractorName: string;
  scanEingereicht: boolean;
  videoEingereicht: boolean;
  onSuccess?: () => void;
}

interface CompState {
  selected: boolean;
  kommentar: string;
  bilder: Blob[];
  previews: string[];
}

const EMPTY: CompState = { selected: false, kommentar: '', bilder: [], previews: [] };

export function PraxistestFeedbackDialog({
  open, onOpenChange, onboardingId, contractorName,
  scanEingereicht, videoEingereicht, onSuccess,
}: Props) {
  const [scan, setScan] = useState<CompState>({ ...EMPTY });
  const [video, setVideo] = useState<CompState>({ ...EMPTY });
  const [annotating, setAnnotating] = useState<{ komp: PraxistestKomponente; file: File } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { mutate: reject, isPending } = useRejectPraxistest();

  const reset = () => {
    setScan({ ...EMPTY });
    setVideo({ ...EMPTY });
    setAnnotating(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      scan.previews.forEach((u) => URL.revokeObjectURL(u));
      video.previews.forEach((u) => URL.revokeObjectURL(u));
      reset();
    }
    onOpenChange(next);
  };

  const onPickFile = (komp: PraxistestKomponente, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte ein Bild auswählen');
      return;
    }
    setAnnotating({ komp, file });
  };

  const handleAnnotationSave = (blob: Blob) => {
    if (!annotating) return;
    const url = URL.createObjectURL(blob);
    const setter = annotating.komp === 'scan' ? setScan : setVideo;
    setter((prev) => ({ ...prev, bilder: [...prev.bilder, blob], previews: [...prev.previews, url] }));
    setAnnotating(null);
  };

  const removeBild = (komp: PraxistestKomponente, idx: number) => {
    const setter = komp === 'scan' ? setScan : setVideo;
    setter((prev) => {
      URL.revokeObjectURL(prev.previews[idx]);
      return {
        ...prev,
        bilder: prev.bilder.filter((_, i) => i !== idx),
        previews: prev.previews.filter((_, i) => i !== idx),
      };
    });
  };

  const handleSubmit = () => {
    const components: RejectComponentPayload[] = [];
    if (scan.selected) {
      if (!scan.kommentar.trim()) { toast.error('Kommentar für Scan fehlt'); return; }
      components.push({ komponente: 'scan', kommentar: scan.kommentar, bildBlobs: scan.bilder });
    }
    if (video.selected) {
      if (!video.kommentar.trim()) { toast.error('Kommentar für Video fehlt'); return; }
      components.push({ komponente: 'video', kommentar: video.kommentar, bildBlobs: video.bilder });
    }
    if (components.length === 0) {
      toast.error('Mindestens eine Komponente auswählen');
      return;
    }

    reject({ onboardingId, components }, {
      onSuccess: () => {
        toast.success(`${contractorName} muss ${components.map(c => KOMPONENTE_LABEL[c.komponente]).join(' & ')} neu einreichen`);
        handleClose(false);
        onSuccess?.();
      },
      onError: (err: unknown) => toast.error((err as Error).message || 'Ablehnung fehlgeschlagen'),
    });
  };

  const renderComp = (
    komp: PraxistestKomponente,
    state: CompState,
    setter: (s: CompState) => void,
    eingereicht: boolean,
    inputRef: React.RefObject<HTMLInputElement>,
  ) => (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={state.selected}
          onCheckedChange={(v) => setter({ ...state, selected: !!v })}
          disabled={!eingereicht}
          id={`reject-${komp}`}
        />
        <Label htmlFor={`reject-${komp}`} className="font-semibold cursor-pointer">
          {KOMPONENTE_LABEL[komp]} ablehnen
        </Label>
        {!eingereicht && <Badge variant="outline" className="ml-auto text-[10px]">Nicht eingereicht</Badge>}
      </div>

      {state.selected && (
        <div className="space-y-3 pl-6">
          <div className="space-y-1.5">
            <Label className="text-xs">Begründung *</Label>
            <Textarea
              value={state.kommentar}
              onChange={(e) => setter({ ...state, kommentar: e.target.value })}
              placeholder="Warum wird diese Komponente abgelehnt?"
              rows={3}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Markierte Screenshots ({state.bilder.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Screenshot hinzufügen
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => onPickFile(komp, e)}
              />
            </div>
            {state.previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {state.previews.map((url, i) => (
                  <div key={i} className="relative group rounded-md overflow-hidden border border-border">
                    <img src={url} alt={`Markierung ${i + 1}`} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeBild(komp, i)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Beim Hochladen öffnet sich ein Markier-Werkzeug.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-destructive" />
              Praxistest-Feedback
            </DialogTitle>
            <DialogDescription>
              Lehne <strong>{contractorName}</strong>s Praxistest komponentenweise ab. Der Quiz-Status bleibt bestehen — der Techniker muss nur die abgelehnten Teile neu einreichen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {renderComp('scan', scan, setScan, scanEingereicht, scanInputRef)}
            {renderComp('video', video, setVideo, videoEingereicht, videoInputRef)}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isPending || (!scan.selected && !video.selected)}
              className="gap-1.5"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
              Ablehnung absenden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!annotating} onOpenChange={(o) => !o && setAnnotating(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Screenshot markieren</DialogTitle>
            <DialogDescription>Zeichne mit dem Stift, setze Pfeile oder klicke für Notizen.</DialogDescription>
          </DialogHeader>
          {annotating && (
            <ImageAnnotator
              source={annotating.file}
              onSave={handleAnnotationSave}
              onCancel={() => setAnnotating(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
