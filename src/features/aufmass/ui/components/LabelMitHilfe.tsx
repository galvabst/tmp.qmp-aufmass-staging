import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { feldHilfe } from '../../data/feld-hilfe';
import { FeldHilfeSheet } from './FeldHilfe';

interface Props {
  /** Feld-Schlüssel im Hilfe-Register (= Formular-Feldname, U-Werte als Punkt-Pfad). */
  hilfeKey: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  /** Inline-Microcopy (Ebene 1) unterdrücken, falls das Feld bereits einen eigenen Hinweis hat. */
  ohneInline?: boolean;
}

/** Punkt-Pfade (u_werte.aussenwand.x) → DOM-taugliche id-Fragmente. */
function idOf(key: string): string {
  return key.replace(/\./g, '-');
}

/** id der Inline-Hilfe für die `aria-describedby`-Verknüpfung am Eingabefeld. */
export function hilfeDescribedBy(hilfeKey: string): string {
  return `${idOf(hilfeKey)}-hilfe`;
}

/**
 * Drop-in-Ersatz für `<Label>` mit kontextueller Feld-Hilfe:
 * - Label-Zeile + dezenter „Hilfe"-Knopf (öffnet Bottom-Sheet), falls Tiefe vorhanden.
 * - darunter die Inline-Microcopy (Ebene 1, immer sichtbar, sagt WO man den Wert findet).
 * Fehlt ein Register-Eintrag, degradiert es sauber zu einem reinen `<Label>`.
 */
export function LabelMitHilfe({ hilfeKey, htmlFor, children, className, ohneInline }: Props) {
  const h = feldHilfe(hilfeKey);
  const hatTiefe = !!(h?.sheet || h?.kiFrage);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Label htmlFor={htmlFor} className={className}>{children}</Label>
        {hatTiefe && <FeldHilfeSheet hilfeKey={hilfeKey} />}
      </div>
      {!ohneInline && h?.inline && (
        <p id={hilfeDescribedBy(hilfeKey)} className="text-xs text-muted-foreground leading-snug">{h.inline}</p>
      )}
    </div>
  );
}
