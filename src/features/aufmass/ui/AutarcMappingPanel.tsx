import { X, ArrowRight, CheckCircle2, Wand2, AlertTriangle } from 'lucide-react';
import { AufmassDraftData } from '../data/aufmass-schema';
import { mapAufmassToAutarc, MappingSource } from '../data/aufmass-to-autarc';

interface Props {
  values: Partial<AufmassDraftData>;
  onClose: () => void;
}

const SOURCE_META: Record<MappingSource, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  direct: { label: 'direkt', cls: 'text-emerald-600 bg-emerald-500/10', Icon: CheckCircle2 },
  derived: { label: 'abgeleitet', cls: 'text-blue-600 bg-blue-500/10', Icon: Wand2 },
  missing: { label: 'fehlt', cls: 'text-amber-600 bg-amber-500/10', Icon: AlertTriangle },
};

/** Read-only Vorschau: was würde aus dem aktuellen Aufmaß nach autarc geschrieben. */
export function AutarcMappingPanel({ values, onClose }: Props) {
  const { fields, filledCount, totalCount } = mapAufmassToAutarc(values);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <aside className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col">
        <header className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-1">
            <h2 className="font-bold text-foreground">Nach autarc übertragen</h2>
            <p className="text-xs text-muted-foreground">
              {filledCount} von {totalCount} Feldern befüllt · read-only Vorschau
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground active:bg-muted/70"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {fields.map((f) => {
            const meta = SOURCE_META[f.source];
            const Icon = meta.Icon;
            return (
              <div
                key={f.autarcField}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background"
              >
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${meta.cls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{f.label}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                    <code className="text-muted-foreground">{f.autarcField}</code>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
                    <span className={f.value == null ? 'text-amber-600 italic' : 'text-foreground font-medium'}>
                      {f.value == null ? '— leer' : String(f.value)}
                    </span>
                  </div>
                  {f.note && <p className="text-[11px] text-muted-foreground mt-0.5">{f.note}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <strong className="text-amber-600">Amber = fehlt im Formular.</strong> Diese Felder
            müssen als neue Pflichtfelder ergänzt werden, damit autarc vollständig befüllt wird.
            Räume/Fotos/U-Werte bleiben in autarc (API kann sie nicht schreiben).
          </p>
        </footer>
      </aside>
    </div>
  );
}
