/**
 * autarc-gate — Status-Automat + „was fehlt"-Meldungen (Spec §8, Contract §5).
 *
 * Reine, synchrone Entscheidungslogik — keine I/O. Nimmt die Signale aus dem
 * Verify-Flow (Match, Diff, rooms-Count, Heizlast, Transport-Fehler) und leitet
 * deterministisch den Endzustand + eine konkrete deutschsprachige Meldung ab.
 *
 * Prioritätskette (erstes Match gewinnt):
 *   1 transportError gesetzt        → fehler          (blockt) [HÖCHSTE]
 *   2 match.status === 'fehler'      → fehler          (blockt)
 *   3 match.status === 'kein_projekt'→ kein_projekt    (blockt)
 *   4 diff && !diff.ok               → abweichung      (blockt) + Liste
 *   5 roomCount kein endl. Wert >=1  → unvollstaendig  (blockt)
 *   6 !(buildingHeatLoadKw > 0)      → eingereicht     (blockt)
 *   7 sonst                          → freigegeben     (FREI — einziger Erfolg)
 *
 * Invariante: `freigegeben` ist der EINZIGE Zustand mit `blockt === false`.
 */

import type { AutarcMatchResult } from './autarc-match';
import type { AutarcDiffEntry, AutarcDiffResult } from './autarc-diff';

/** Endzustände lt. Spec §5/§8. */
export type AutarcSyncStatus =
  | 'ausstehend'
  | 'ok' // Round-Trip grün, aber noch nicht final freigegeben
  | 'freigegeben' // ok + rooms>0 + heizlast>0  (Spec: „final korrekt")
  | 'eingereicht' // Round-Trip grün, autarc noch nicht vollständig/berechnet
  | 'abweichung'
  | 'unvollstaendig'
  | 'kein_projekt'
  | 'fehler';

export interface GateInput {
  match: AutarcMatchResult;
  /** nur wenn match=matched + readback erfolgte. */
  diff?: AutarcDiffResult;
  /** aus GET /rooms. */
  roomCount?: number;
  buildingHeatLoadKw?: number | null;
  /** Technischer Fehler (Netz/HTTP/JSON) — überschreibt alles → 'fehler'. */
  transportError?: string | null;
}

export interface GateResult {
  status: AutarcSyncStatus;
  /** true = blockt „freigegeben". */
  blockt: boolean;
  /** Konkrete, deutschsprachige Handlungsanweisung. NIE generisch. */
  meldung: string;
  /** Maschinenlesbare Differenzliste (für UI), falls vorhanden. */
  abweichungen?: AutarcDiffEntry[];
}

/** Baut eine konkrete Klartext-Zeile aus den ersten Abweichungen. */
function diffMeldung(abweichungen: AutarcDiffEntry[]): string {
  const teile = abweichungen.slice(0, 3).map((a) => {
    const wie =
      a.art === 'fehlt'
        ? `${a.feld}: in autarc nicht angekommen (gesendet ${JSON.stringify(a.gesendet)})`
        : `${a.feld}: gesendet ${JSON.stringify(a.gesendet)}, in autarc ${JSON.stringify(a.autarc)}`;
    return wie;
  });
  const rest = abweichungen.length > 3 ? ` (und ${abweichungen.length - 3} weitere)` : '';
  return (
    'Die Gebäudedaten kamen in autarc nicht korrekt an: ' +
    teile.join('; ') +
    rest +
    '. Bitte die Werte prüfen und erneut abgeben.'
  );
}

/** Reiner Status-Automat: leitet aus den Signalen den Endzustand + Meldung ab. */
export function evaluateGate(input: GateInput): GateResult {
  // 1. Transport-Fehler hat höchste Priorität.
  if (input.transportError) {
    return {
      status: 'fehler',
      blockt: true,
      meldung:
        `Verbindung zu autarc fehlgeschlagen (${input.transportError}). ` +
        'Die Daten wurden NICHT bestätigt. Bitte später erneut abgeben — es wurde nichts als erledigt markiert.',
    };
  }

  // 2. Match-Fehler (Netz/HTTP bei der Projekt-Auflösung).
  if (input.match.status === 'fehler') {
    return {
      status: 'fehler',
      blockt: true,
      meldung:
        input.match.meldung ??
        'autarc-Projekt konnte wegen eines technischen Fehlers nicht aufgelöst werden. Bitte erneut versuchen.',
    };
  }

  // 3. Kein Projekt auflösbar.
  if (input.match.status === 'kein_projekt') {
    return {
      status: 'kein_projekt',
      blockt: true,
      meldung:
        input.match.meldung ??
        'Kein autarc-Projekt zu diesem Auftrag gefunden. Bitte das Projekt in autarc manuell verknüpfen — das Aufmaß bleibt lokal gespeichert.',
    };
  }

  // 4. Diff-Abweichung (gesendet ≠ zurückgelesen).
  if (input.diff && !input.diff.ok) {
    return {
      status: 'abweichung',
      blockt: true,
      meldung: diffMeldung(input.diff.abweichungen),
      abweichungen: input.diff.abweichungen,
    };
  }

  // 5. Keine (gültige Zahl an) Räume in autarc gescannt. Symmetrisch streng wie
  // die Heizlast: nur ein endlicher Wert >= 1 gilt als „Räume vorhanden" —
  // null/0/negativ/NaN/Infinity/Bruchteil dürfen NIE als vollständig durchgehen.
  if (!(typeof input.roomCount === 'number' && Number.isFinite(input.roomCount) && input.roomCount >= 1)) {
    return {
      status: 'unvollstaendig',
      blockt: true,
      meldung:
        'In autarc sind noch keine Räume gescannt. Bitte vor Ort in der autarc-App alle Räume aufnehmen und dann erneut abgeben.',
    };
  }

  // 6. Heizlast noch nicht berechnet/0 (oder kein endlicher Zahlenwert: NaN/Infinity
  // dürfen NIE als „berechnet" → freigegeben durchgehen).
  if (!(typeof input.buildingHeatLoadKw === 'number' && Number.isFinite(input.buildingHeatLoadKw) && input.buildingHeatLoadKw > 0)) {
    return {
      status: 'eingereicht',
      blockt: true,
      meldung:
        'Die Gebäudedaten und Räume sind in autarc, aber die Heizlast wurde noch nicht berechnet. ' +
        'Bitte das Projekt in autarc kurz öffnen/aktualisieren; sobald die Heizlast erscheint, wird automatisch finalisiert.',
    };
  }

  // 7. Einziger Erfolg.
  return {
    status: 'freigegeben',
    blockt: false,
    meldung:
      'Alles geprüft: Gebäudedaten korrekt in autarc, Räume gescannt, Heizlast berechnet. Aufmaß ist freigegeben.',
  };
}
