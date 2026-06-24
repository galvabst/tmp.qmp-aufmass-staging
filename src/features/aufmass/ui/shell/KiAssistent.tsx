import { useState, useSyncExternalStore } from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, OctagonAlert, Camera, HelpCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlausibilityIssue } from '../../data/aufmass-plausibility';
import { helpForStep } from '../../data/aufmass-hilfe';
import { subscribeFotoPruefung, getBlockierendeAnzahl } from '../../state/foto-pruefung-store';

type Tab = 'pruefung' | 'fotos' | 'hilfe';

interface KiAssistentProps {
  stepTitle: string;
  phaseLabel: string;
  /** Live-Plausibilität (deterministisch, gratis) — beratend, blockt nie. */
  warnings: PlausibilityIssue[];
  hasPhotos: boolean;
}

/**
 * Ständiger KI-Begleiter neben dem Formular. Beratend — blockt nie.
 * Tabs: Prüfung (Live-Plausibilität), Fotos (Hinweis), Hilfe (Feld-Kontext).
 * Auf Desktop als Seiten-Panel, auf Handy als einklappbares Panel platziert.
 */
export function KiAssistent({ stepTitle, phaseLabel, warnings, hasPhotos }: KiAssistentProps) {
  const [tab, setTab] = useState<Tab>('pruefung');
  const [open, setOpen] = useState(true);

  const blocks = warnings.filter((w) => w.severity === 'block');
  const warns = warnings.filter((w) => w.severity === 'soft');
  const help = helpForStep(stepTitle);
  // Foto-Inhalts-Blocker (KI: „passt nicht") aus dem geteilten Store — damit das
  // Panel nicht fälschlich „keine Auffälligkeiten" zeigt, während ein Foto das
  // Geforderte nicht zeigt.
  const fotoBlocker = useSyncExternalStore(subscribeFotoPruefung, getBlockierendeAnzahl, () => 0);
  const count = warnings.length + fotoBlocker;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden lg:sticky lg:top-32">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left lg:cursor-default"
        aria-expanded={open}
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <span className="font-semibold text-sm text-foreground">KI-Assistent</span>
        {count > 0 && (
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', blocks.length ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/15 text-amber-700')}>
            {count}
          </span>
        )}
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground ml-auto transition-transform lg:hidden', open && 'rotate-180')} />
      </button>

      <div className={cn('lg:block', open ? 'block' : 'hidden')}>
        {/* Tabs */}
        <div className="flex gap-1 px-3 pb-3">
          <TabBtn active={tab === 'pruefung'} onClick={() => setTab('pruefung')} icon={ShieldCheck} label="Prüfung" badge={count || undefined} />
          <TabBtn active={tab === 'fotos'} onClick={() => setTab('fotos')} icon={Camera} label="Fotos" />
          <TabBtn active={tab === 'hilfe'} onClick={() => setTab('hilfe')} icon={HelpCircle} label="Hilfe" />
        </div>

        <div className="px-4 pb-4 space-y-2 max-h-[42vh] lg:max-h-[50vh] overflow-y-auto">
          {tab === 'pruefung' && (
            count === 0 ? (
              <Row tone="ok" icon={CheckCircle2} text="Keine Auffälligkeiten – Angaben plausibel." />
            ) : (
              <>
                {fotoBlocker > 0 && (
                  <Row
                    tone="block"
                    icon={OctagonAlert}
                    text={`${fotoBlocker} Foto${fotoBlocker === 1 ? '' : 's'} zeigt nicht das Geforderte – bitte löschen und ein korrektes aufnehmen. Sonst kein Einreichen.`}
                  />
                )}
                {blocks.map((w, i) => <Row key={`b${i}`} tone="block" icon={OctagonAlert} text={w.message} />)}
                {warns.map((w, i) => <Row key={`w${i}`} tone="warn" icon={AlertTriangle} text={w.message} />)}
              </>
            )
          )}

          {tab === 'fotos' && (
            hasPhotos ? (
              <Row tone="info" icon={Camera} text="Dieser Schritt erwartet Fotos. Achte auf scharfe, vollständige Aufnahmen – beim Aufstellort prüft die KI sie automatisch." />
            ) : (
              <Row tone="muted" icon={Camera} text="Kein Foto-Schritt." />
            )
          )}

          {tab === 'hilfe' && (
            help.length > 0 ? (
              help.map((h, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold text-foreground">{h.titel}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{h.text}</p>
                </div>
              ))
            ) : (
              <Row tone="muted" icon={HelpCircle} text={`Keine spezielle Hilfe für „${stepTitle}".`} />
            )
          )}
        </div>

        <p className="px-4 pb-3 text-[10px] leading-relaxed text-muted-foreground border-t border-border pt-2">
          Rote Hinweise blockieren das Absenden. Gelbe musst du beim Absenden korrigieren oder begründen.
        </p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, badge }: {
  active: boolean; onClick: () => void; icon: typeof ShieldCheck; label: string; badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground active:bg-muted/70',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {badge ? <span className={cn('text-[9px] px-1 rounded-full', active ? 'bg-primary-foreground/20' : 'bg-amber-500/20 text-amber-700')}>{badge}</span> : null}
    </button>
  );
}

function Row({ tone, icon: Icon, text }: {
  tone: 'ok' | 'warn' | 'block' | 'info' | 'muted'; icon: typeof CheckCircle2; text: string;
}) {
  const cls = {
    ok: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300',
    warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300',
    block: 'bg-destructive/10 text-destructive',
    info: 'bg-primary/5 text-foreground',
    muted: 'bg-muted text-muted-foreground',
  }[tone];
  return (
    <div className={cn('flex items-start gap-2 rounded-xl p-2.5 text-xs leading-relaxed', cls)}>
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}
