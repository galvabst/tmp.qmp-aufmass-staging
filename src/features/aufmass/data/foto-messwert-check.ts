import type { FotoCheckErgebnis } from './ki-foto-check-client';
import type { PlausibilityIssue } from './aufmass-plausibility';
import type { VotBildKategorie } from './bild-kategorien';

/**
 * Massband-/Zollstock-Wert-Quercheck (beratend, severity 'soft').
 *
 * Idee: Ein Mess-Foto (Maßband/Zollstock/Meterstab) zeigt einen Zahlenwert. Die
 * KI (Edge Function `aufmass-foto-check`) liest diesen Wert ab und liefert ihn als
 * `messwert` zurück. Diese reine Funktion vergleicht den abgelesenen Wert mit dem
 * im Formular GETIPPTEN Soll-Wert und meldet einen Soft-Befund, wenn beide über
 * die Toleranz hinaus auseinanderlaufen — dann landet das (wie jeder Soft-Befund)
 * im PlausibilityConfirmDialog: korrigieren ODER Pflicht-Begründung.
 *
 * Forward-kompatibel & fehlalarm-frei: Solange die Function noch KEINEN `messwert`
 * liefert (heute der Fall — der Patch ist im Report dokumentiert, aber NICHT
 * deployt), passiert hier NICHTS. Ebenso wenn das getippte Soll-Feld leer ist.
 * Dadurch ist das Andocken im Submit-Pfad heute dormant und kann NIE blockieren.
 *
 * severity ist immer 'soft' — ein abgelesener Wert ist eine KI-Schätzung und darf
 * (anders als die deterministische Engine) nie ein Hard-Block sein.
 */

export interface MesswertCheckErgebnis {
  /** KI-Ergebnis des Mess-Fotos (mit optionalem `messwert`). null = kein Foto/keine Prüfung. */
  ergebnis: FotoCheckErgebnis | null | undefined;
  /** Im Formular getippter Soll-Wert (z. B. dachneigung in °). null/undefined = nicht ausgefüllt. */
  sollWert: number | null | undefined;
}

/**
 * Zentrale, kalibrierbare Toleranz. Relativ (Anteil vom Soll) UND absolut (Floor),
 * damit kleine Soll-Werte nicht schon bei Mini-Differenzen Alarm schlagen
 * (z. B. 30° vs. 33° Dachneigung soll passen, 30° vs. 50° nicht).
 */
export const MESSWERT_TOLERANZ = {
  /** Erlaubte relative Abweichung (0.25 = ±25 %). */
  relativ: 0.25,
  /** Mindest-Toleranz absolut — schützt kleine Soll-Werte vor Fehlalarm. */
  absolutFloor: 5,
} as const;

/**
 * Mess-Foto-Kategorie → getipptes numerisches Soll-Feld + Einheit.
 *
 * Nur Kategorien mit einem ECHTEN numerischen Zielfeld im Formular sind hier
 * gelistet. Mess-Hinweise ohne numerisches Soll-Feld (Türbreite Heizungsraum-
 * Eingang, Heizungsraum-Meterstab, PV-Sparrenabstand=Freitext-String) fehlen
 * bewusst — für sie gäbe es keinen vergleichbaren getippten Wert. Siehe Report (1).
 */
export const MESSWERT_FELD_MAP: Partial<Record<VotBildKategorie, { field: string; einheit: string }>> = {
  // Dachziegel-Foto „idealerweise mit Maßband" → getippte Ziegel-/Sparren-Neigung (°).
  pv_dachziegel: { field: 'ziegel_neigung_grad', einheit: '°' },
  // Dach-Foto „für Modulplanung" → getippte Dachneigung (°).
  pv_dach: { field: 'dachneigung', einheit: '°' },
};

function istZahl(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

/**
 * Vergleicht den KI-abgelesenen Mess-Wert mit dem getippten Soll-Wert einer
 * Mess-Kategorie. Liefert höchstens EINEN Soft-Befund (oder null = alles ok /
 * nichts zu prüfen).
 *
 * @param kategorie Die Mess-Bild-Kategorie (entscheidet über Feld + Einheit).
 * @param input     KI-Ergebnis + getippter Soll-Wert.
 */
export function pruefeMesswertQuercheck(
  kategorie: VotBildKategorie,
  input: MesswertCheckErgebnis,
): PlausibilityIssue | null {
  const mapping = MESSWERT_FELD_MAP[kategorie];
  if (!mapping) return null; // Kategorie ohne numerisches Soll-Feld → nichts zu prüfen.

  const erg = input.ergebnis;
  // Fehlalarm-Schutz: kein geprüftes Foto / Function liefert (noch) keinen Messwert → still.
  if (!erg || !erg.geprueft || !istZahl(erg.messwert)) return null;
  // Kein getippter Soll-Wert → kein Vergleich möglich.
  if (!istZahl(input.sollWert)) return null;

  const gemessen = erg.messwert;
  const soll = input.sollWert;
  const toleranz = Math.max(MESSWERT_TOLERANZ.absolutFloor, Math.abs(soll) * MESSWERT_TOLERANZ.relativ);
  const abweichung = Math.abs(gemessen - soll);
  if (abweichung <= toleranz) return null; // im Rahmen → ok.

  const einheit = mapping.einheit;
  return {
    ruleId: `messwert.${mapping.field}`,
    field: mapping.field,
    severity: 'soft',
    message: `Eingetragen ${soll}${einheit}, auf dem Foto liest die KI aber ~${gemessen}${einheit} ab – bitte den Wert prüfen.`,
  };
}
