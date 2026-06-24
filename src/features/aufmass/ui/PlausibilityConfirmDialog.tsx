import { useEffect } from 'react';
import { AlertTriangle, Sparkles, Loader2, PencilLine } from 'lucide-react';

/** Beibehalten für den beratenden KI-Client (ai-plausibility-client.ts). */
export interface ConfirmWarning {
  message: string;
  source: 'Regel' | 'KI';
}

/** Ein deterministischer Soft-Befund, der eine Pflicht-Begründung braucht. */
export interface SoftFinding {
  ruleId: string;
  field: string;
  message: string;
}

interface Props {
  /** Soft-Befunde (deterministisch) → Korrigieren ODER Pflicht-Begründung. */
  findings: SoftFinding[];
  /** KI-Hinweise (beratend) → nur Anzeige, KEINE Begründung, blockt NICHT. */
  aiHinweise: string[];
  aiLoading?: boolean;
  begruendungen: Record<string, string>;
  onChange: (ruleId: string, text: string) => void;
  onKorrigieren: (field: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * Soft-Block-Dialog: unplausible-aber-mögliche Werte. Hard-Blocks werden vorher
 * per Toast abgefangen und kommen hier nie an. Absenden ist erst frei, wenn jeder
 * Soft-Befund korrigiert ODER begründet wurde. KI-Hinweise sind rein beratend.
 */
export function PlausibilityConfirmDialog({
  findings, aiHinweise, aiLoading, begruendungen, onChange, onKorrigieren, onSubmit, onCancel, isSubmitting,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const offen = findings.filter((f) => (begruendungen[f.ruleId] ?? '').trim().length === 0);
  const alleBegruendet = offen.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button type="button" aria-label="Schließen" onClick={onCancel} className="absolute inset-0 bg-black/40" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="plausi-title" className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <header className="flex items-start gap-3 p-5 border-b border-zinc-200">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 id="plausi-title" className="font-bold text-zinc-900">Vor dem Absenden prüfen</h2>
            <p className="text-xs text-zinc-500">
              {findings.length} Angabe{findings.length === 1 ? '' : 'n'} unplausibel – korrigieren oder begründen.
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {findings.map((f) => {
            const leer = (begruendungen[f.ruleId] ?? '').trim().length === 0;
            return (
              <div key={f.ruleId} className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-amber-900">{f.message}</p>
                  <button
                    type="button"
                    onClick={() => onKorrigieren(f.field)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <PencilLine className="w-3.5 h-3.5" /> Korrigieren
                  </button>
                </div>
                <textarea
                  value={begruendungen[f.ruleId] ?? ''}
                  onChange={(e) => onChange(f.ruleId, e.target.value)}
                  placeholder="Begründung (Pflicht) – warum stimmt das so?"
                  rows={2}
                  aria-invalid={leer}
                  className={`w-full rounded-lg border bg-white px-2.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${
                    leer ? 'border-amber-300 focus:ring-amber-400' : 'border-emerald-300 focus:ring-emerald-400'
                  }`}
                />
              </div>
            );
          })}

          {(aiHinweise.length > 0 || aiLoading) && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" /> KI-Hinweise (beratend, blockt nicht)
              </p>
              {aiLoading ? (
                <p className="flex items-center gap-1.5 text-xs text-zinc-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> KI-Gesamtcheck läuft …</p>
              ) : (
                <ul className="space-y-1 text-xs text-zinc-600 list-disc list-inside">
                  {aiHinweise.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-zinc-200 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 h-11 rounded-xl border border-zinc-300 bg-white font-medium text-zinc-700 active:bg-zinc-100">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!alleBegruendet || isSubmitting}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm active:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : alleBegruendet ? 'Absenden' : `Noch ${offen.length} begründen`}
          </button>
        </footer>
      </div>
    </div>
  );
}
