/**
 * Fail-closed Bewertung der Foto-INHALTE für den Submit-Pfad (rein, testbar).
 *
 * Nutzer-Entscheidung (21.06.2026): Ein sichtbares Pflichtfoto darf das Aufmaß
 * nur passieren lassen, wenn die KI es positiv als korrektes Motiv bestätigt hat
 * (Status `'ok'`). Alles andere blockiert:
 *   - `'passt_nicht'`  → falsches Motiv (Füße statt Treppe, Screenshot …) → der
 *                        Techniker muss das Foto löschen und ein korrektes machen.
 *   - `'ungeprueft'` / kein Status → KI nicht erreichbar oder noch nicht geprüft
 *                        → blockiert ebenfalls (fail-closed).
 *
 * Diese Funktion ist absichtlich KI- und React-frei: sie liest nur den (vorher
 * ermittelten) Status pro Bild. Das Anstoßen/Nachholen der KI-Prüfung liegt in
 * `foto-inhalt-pruefung.ts`, die Status-Haltung in `foto-pruefung-store.ts`.
 *
 * Die betrachteten Slots sind EXAKT die der Präsenz-Prüfung
 * (`sichtbarePflichtFotos`): Präsenz-Gate (genug Fotos?) und dieses Inhalts-Gate
 * (richtiges Motiv?) bewerten dieselbe Kategorie-Liste — so kann kein
 * verpflichtender Foto-Slot zwischen beiden Prüfungen divergieren/durchrutschen.
 */

import { BILD_KATEGORIEN, VotBildKategorie } from './bild-kategorien';
import { filterBilderByKategorie, type VotBild } from '../hooks/useVotBilder';
import { sichtbarePflichtFotos, stepFuerKategorie, type FotoPraesenzContext } from './foto-praesenz';
import type { FotoInhaltStatus } from '../state/foto-pruefung-store';

export interface FotoInhaltProblem {
  kategorie: VotBildKategorie;
  label: string;
  /** BASE_STEPS-Index des zugehörigen Foto-Schritts (für „Zu Schritt N"). */
  step: number;
  bildId: string;
  /** true = Kategorie ist aktuell ausgeblendet (Foto nur über Re-Aktivierung löschbar). */
  versteckt?: boolean;
}

export interface FotoInhaltGateErgebnis {
  /** KI hat ein falsches Motiv erkannt → ersetzen erzwingen. */
  falsch: FotoInhaltProblem[];
  /** Kein positives „ok" (KI offline / noch nicht geprüft) → fail-closed Block. */
  ungeprueft: FotoInhaltProblem[];
}

/**
 * Bewertet alle sichtbaren Pflichtfotos gegen ihren KI-Inhaltsstatus.
 *
 * @param statusOf  Status-Lookup pro bildId (undefined = noch nie geprüft).
 */
export function bewerteFotoInhalt(
  bilder: VotBild[],
  ctx: FotoPraesenzContext,
  statusOf: (bildId: string) => FotoInhaltStatus | undefined,
): FotoInhaltGateErgebnis {
  const falsch: FotoInhaltProblem[] = [];
  const ungeprueft: FotoInhaltProblem[] = [];
  const sichtbar = sichtbarePflichtFotos(ctx);
  const sichtbareKats = new Set(sichtbar.map((s) => s.kategorie));

  // 1) Jedes VORHANDENE Foto mit erkanntem Falsch-Motiv ('passt_nicht') blockt —
  //    auch wenn seine Kategorie aktuell ausgeblendet/nicht-Pflicht ist. Ein als
  //    falsch erkanntes Foto darf nicht still in der Einreichung verbleiben.
  //    Schließt das Loch „Kategorie nach dem Upload wieder ausgeblendet".
  for (const bild of bilder) {
    if (statusOf(bild.id) !== 'passt_nicht') continue;
    // Veraltete/unbekannte Kategorie (DB-Drift) hat keinen Config-Eintrag → label
    // wäre `undefined` (stiller Fehler). Überspringen statt ein Problem mit
    // label: undefined zu erzeugen.
    const config = BILD_KATEGORIEN[bild.kategorie];
    if (!config) continue;
    falsch.push({
      kategorie: bild.kategorie,
      label: config.label,
      step: stepFuerKategorie(bild.kategorie) ?? 0,
      bildId: bild.id,
      versteckt: !sichtbareKats.has(bild.kategorie),
    });
  }

  // 2) Jedes SICHTBARE Pflichtfoto muss positiv 'ok' sein (fail-closed). Nicht
  //    positiv bestätigte (undefined/'ungeprueft') blocken als ungeprueft.
  //    'passt_nicht' ist bereits in (1) erfasst → hier überspringen.
  for (const slot of sichtbar) {
    const label = BILD_KATEGORIEN[slot.kategorie].label;
    for (const bild of filterBilderByKategorie(bilder, slot.kategorie)) {
      const status = statusOf(bild.id);
      if (status === 'ok' || status === 'passt_nicht') continue;
      ungeprueft.push({ kategorie: slot.kategorie, label, step: slot.step, bildId: bild.id });
    }
  }

  return { falsch, ungeprueft };
}

/** true = irgendein sichtbares Pflichtfoto ist nicht positiv bestätigt. */
export function hatFotoInhaltBlocker(e: FotoInhaltGateErgebnis): boolean {
  return e.falsch.length > 0 || e.ungeprueft.length > 0;
}
