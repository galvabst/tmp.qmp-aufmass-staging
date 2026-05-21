import { useRef, useState, useEffect } from 'react';
import { Camera, ImagePlus, Check, Loader2, Sparkles, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAufstellortPruefung, type AufstellortEmpfehlung, type AufstellortPruefung } from '../../hooks/useAufstellortPruefung';
import { cn } from '@/lib/utils';

const VIEWS = [
  { slug: 'uebersicht', label: 'Übersicht', hint: '4–5m Abstand, kompletter Aufstell-Bereich + Hauswand sichtbar' },
  { slug: 'links90', label: 'Links (90°)', hint: 'Entlang Hauswand fotografiert — zeigt Tiefe nach links' },
  { slug: 'rechts90', label: 'Rechts (90°)', hint: 'Gegenrichtung — zeigt Tiefe nach rechts' },
  { slug: 'boden', label: 'Boden-Detail', hint: 'Nahaufnahme Untergrund (Pflaster / Rasen / Beton)' },
  { slug: 'wand', label: 'Wand-Detail', hint: 'Wo Rohrdurchführung möglich (Höhe, Fassade)' },
  { slug: 'mit_referenz', label: 'Mit Zollstock/A4', hint: 'Optional — High-Confidence-Modus', optional: true },
] as const;

const EMPF_META: Record<AufstellortEmpfehlung, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  keine_anpassung: { label: 'Aufstellort geeignet', cls: 'border-green-300 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100 dark:border-green-900/40', icon: CheckCircle2 },
  teilanpassung:   { label: 'Mit Auflagen geeignet', cls: 'border-yellow-300 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100 dark:border-yellow-900/40', icon: AlertTriangle },
  grossanpassung:  { label: 'Schwere Auflagen', cls: 'border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-100 dark:border-orange-900/40', icon: AlertTriangle },
  sanierung:       { label: 'Neuer Aufstellort nötig', cls: 'border-red-300 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-100 dark:border-red-900/40', icon: AlertCircle },
};

interface Props {
  leadId: string | null;
  disabled?: boolean;
  onApplyResult?: (p: AufstellortPruefung) => void;
}

export function AufstellortAIPanel({ leadId, disabled, onApplyResult }: Props) {
  const {
    pruefung, fotos, isLoading, isUploading, isStarting,
    uploadFotos, startAnalysis, resetPruefung, getSignedUrl,
  } = useAufstellortPruefung({ leadId, enabled: !!leadId });

  const [activeView, setActiveView] = useState<string>('uebersicht');
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const f of fotos) {
        const u = await getSignedUrl(f.storage_path);
        if (u) next[f.id] = u;
      }
      if (!cancelled) setThumbs(next);
    })();
    return () => { cancelled = true; };
  }, [fotos, getSignedUrl]);

  if (!leadId) {
    return <p className="text-xs text-muted-foreground italic">Kein Lead verknüpft — AI-Check nicht verfügbar.</p>;
  }
  if (isLoading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade…</div>;

  const status = pruefung?.status ?? 'draft';
  const uploadedSlugs = new Set(fotos.map((f) => f.ai_requested_view).filter(Boolean) as string[]);
  const pflicht = VIEWS.filter((v) => !v.optional);
  const pflichtDone = pflicht.filter((v) => uploadedSlugs.has(v.slug)).length;
  const allPflicht = pflichtDone >= pflicht.length;

  const handleFile = async (list: FileList | null) => {
    if (!list?.[0] || disabled) return;
    await uploadFotos([list[0]], { aiRequestedView: activeView, aiRequestReason: 'AI Aufstellort-Wizard' });
    if (inputRef.current) inputRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
    const next = VIEWS.find((v) => !v.optional && v.slug !== activeView && !uploadedSlugs.has(v.slug));
    if (next) setActiveView(next.slug);
  };

  return (
    <div className="space-y-4">
      {/* Header / Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI-Aufstellort-Check</span>
        </div>
        <Badge variant={allPflicht ? 'default' : 'secondary'}>{pflichtDone} / {pflicht.length} Pflicht-Views</Badge>
      </div>

      {status === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analyse fehlgeschlagen</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-xs"><strong>{pruefung?.error_code ?? 'unknown'}</strong>: {pruefung?.error_detail ?? '—'}</p>
            <Button size="sm" variant="outline" onClick={resetPruefung} disabled={disabled}>Neu starten</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Foto-Wizard nur in draft / photo_uploaded / waiting */}
      {(status === 'draft' || status === 'photo_uploaded' || status === 'waiting_for_photos') && !disabled && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            5 Pflicht-Views (Übersicht, Links 90°, Rechts 90°, Boden, Wand) — die AI prüft TA-Lärm, R290-Schutzbereich, Mindestabstände, Vitocal-Specs.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {VIEWS.map((v) => {
              const done = uploadedSlugs.has(v.slug);
              const active = activeView === v.slug;
              return (
                <button key={v.slug} type="button" onClick={() => setActiveView(v.slug)}
                  className={cn(
                    'rounded-lg border p-2 text-left transition',
                    active ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50',
                    done && !active && 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-xs font-medium">{v.label}</span>
                  </div>
                  {v.optional && <span className="text-[10px] text-muted-foreground">optional</span>}
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div>
              <p className="text-sm font-medium">{VIEWS.find((v) => v.slug === activeView)?.label}</p>
              <p className="text-xs text-muted-foreground">{VIEWS.find((v) => v.slug === activeView)?.hint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading || disabled}>
                <ImagePlus className="h-4 w-4 mr-1" /> Datei
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => cameraRef.current?.click()} disabled={isUploading || disabled}>
                <Camera className="h-4 w-4 mr-1" /> Foto aufnehmen
              </Button>
              {isUploading && <span className="flex items-center text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Hochladen…</span>}
            </div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" className="hidden" onChange={(e) => handleFile(e.target.files)} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files)} />
          </div>
        </div>
      )}

      {/* Foto-Thumbnails */}
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((f) => (
            <div key={f.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted">
              {thumbs[f.id] ? <img src={thumbs[f.id]} alt={f.ai_requested_view ?? ''} className="w-full h-full object-cover" /> : null}
              {f.ai_requested_view && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[9px] px-1 py-0.5 truncate">{f.ai_requested_view}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analyse-CTA */}
      {status === 'photo_uploaded' && !disabled && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Bereit für AI-Analyse</p>
            <p className="text-xs text-muted-foreground">Gemini Pro prüft alle Fotos gegen Norm + Vitocal-Specs.</p>
          </div>
          <Button type="button" size="sm" onClick={startAnalysis} disabled={isStarting || !allPflicht}>
            {isStarting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Startet…</> : <><Sparkles className="h-4 w-4 mr-1" /> Analyse starten</>}
          </Button>
        </div>
      )}

      {/* Analyzing */}
      {status === 'analyzing' && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium">AI analysiert den Aufstellort…</p>
            <p className="text-xs text-muted-foreground">Anker → Geometrie → Norm-Check (TA Lärm, R290, Abstände)</p>
          </div>
        </div>
      )}

      {/* AI braucht mehr */}
      {status === 'waiting_for_photos' && pruefung?.request_reason && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>AI braucht mehr Fotos</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-xs leading-relaxed">{pruefung.request_reason}</p>
            {pruefung.requested_photos && pruefung.requested_photos.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pruefung.requested_photos.map((rp, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{rp.view}</Badge>
                ))}
              </div>
            )}
            <Button size="sm" variant="outline" onClick={startAnalysis} disabled={isStarting}>
              Mit neuen Fotos weiter analysieren
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {status === 'completed' && pruefung?.empfehlung && (
        <ResultCard pruefung={pruefung} onApply={() => onApplyResult?.(pruefung)} onReset={resetPruefung} disabled={disabled} />
      )}
    </div>
  );
}

function ResultCard({ pruefung, onApply, onReset, disabled }: {
  pruefung: AufstellortPruefung; onApply: () => void; onReset: () => void; disabled?: boolean;
}) {
  const meta = EMPF_META[pruefung.empfehlung!];
  const Icon = meta.icon;
  const conf = pruefung.confidence != null ? Math.round(pruefung.confidence * 100) : null;
  return (
    <div className={cn('rounded-xl border-2 p-4 space-y-3', meta.cls)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6" />
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-70">AI-Empfehlung</p>
            <p className="text-base font-semibold">{meta.label}</p>
          </div>
        </div>
        {conf !== null && <Badge variant="outline" className="bg-background/60">{conf}%</Badge>}
      </div>

      {pruefung.findings?.reasoning && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{pruefung.findings.reasoning}</p>
      )}

      {pruefung.findings?.red_flags && pruefung.findings.red_flags.length > 0 && (
        <div>
          <p className="text-xs font-semibold flex items-center gap-1.5 mb-1"><AlertCircle className="h-3.5 w-3.5" /> Red Flags</p>
          <ul className="text-xs space-y-0.5">
            {pruefung.findings.red_flags.map((rf, i) => <li key={i}>• {rf}</li>)}
          </ul>
        </div>
      )}

      {pruefung.findings?.masnahmen && pruefung.findings.masnahmen.length > 0 && (
        <div>
          <p className="text-xs font-semibold flex items-center gap-1.5 mb-1"><FileCheck className="h-3.5 w-3.5" /> Maßnahmen</p>
          <ul className="text-xs space-y-0.5">
            {pruefung.findings.masnahmen.map((m, i) => <li key={i}>• {m}</li>)}
          </ul>
        </div>
      )}

      {pruefung.findings?.components && Object.keys(pruefung.findings.components).length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">Bewertung</p>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {Object.entries(pruefung.findings.components).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-current/10 pb-0.5">
                <span className="opacity-80">{k}</span>
                <span className="font-medium text-right">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {!disabled && (
          <Button type="button" size="sm" onClick={onApply}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> In Formular übernehmen
          </Button>
        )}
        {!disabled && (
          <Button type="button" size="sm" variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-1" /> Neue Prüfung
          </Button>
        )}
        <span className="text-[10px] opacity-60 ml-auto self-center">{pruefung.ai_model} · {pruefung.total_cost_eur.toFixed(4)} €</span>
      </div>
    </div>
  );
}
