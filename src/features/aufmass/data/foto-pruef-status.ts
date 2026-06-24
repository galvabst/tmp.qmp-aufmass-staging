import type { FotoCheckErgebnis } from './ki-foto-check-client';

/**
 * Sichtbarer Prüfstatus eines hochgeladenen Fotos im PhotoUploadField.
 *
 * Hintergrund (Bug): Bei KI-Ausfall liefert `pruefeFotoInhalt` bewusst `null`
 * (fail-open — der Aufmaß-Flow soll nicht blockieren, wenn die Gemini-Edge-
 * Function offline/nicht deployt ist). Bisher wurde dieses `null` im Component
 * still verschluckt: kein Eintrag, kein Ring, kein Badge → das Foto sah exakt
 * aus wie ein noch-nicht-geprüftes „ok"-Foto. Das verschleiert, dass die
 * Prüfung gar nicht lief.
 *
 * Diese reine Ableitung macht den Ausfall sichtbar als eigenen Status
 * `'ungeprueft'`, OHNE zu blockieren (fail-open bleibt). Sie ist absichtlich
 * UI- und React-frei, damit sie isoliert testbar ist.
 */
export type FotoPruefStatus = 'laeuft' | 'ungeprueft' | 'ok' | 'passt_nicht';

/**
 * Leitet den sichtbaren Prüfstatus aus dem laufenden Flag und dem KI-Ergebnis ab.
 *
 * @param laeuft   true, solange die KI-Prüfung dieses Fotos noch läuft (Spinner).
 * @param ergebnis Ergebnis der KI-Prüfung; `null`/`undefined` = KI nicht
 *                 erreichbar / nicht geprüft → `'ungeprueft'` (kein Block).
 */
export function leiteFotoStatus(
  laeuft: boolean,
  ergebnis: FotoCheckErgebnis | null | undefined,
): FotoPruefStatus {
  if (laeuft) return 'laeuft';
  if (!ergebnis || !ergebnis.geprueft) return 'ungeprueft';
  return ergebnis.passt ? 'ok' : 'passt_nicht';
}

/**
 * Platzhalter-Ergebnis für den KI-Ausfall: `pruefeFotoInhalt` liefert bei
 * Fehler/Offline `null`. Damit das Foto sichtbar als „ungeprüft" markiert wird
 * (statt wie ein nie-geprüftes auszusehen), legt das Component dieses Sentinel
 * im checks-Map ab — `geprueft:false` ⇒ `leiteFotoStatus` → `'ungeprueft'`.
 */
export const FOTO_UNGEPRUEFT: FotoCheckErgebnis = {
  geprueft: false,
  passt: false,
  confidence: 0,
  erkannt: '',
  begruendung: 'KI-Prüfung nicht verfügbar',
};
