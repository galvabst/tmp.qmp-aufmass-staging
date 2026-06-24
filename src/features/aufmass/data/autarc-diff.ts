/**
 * autarc-diff — Normalisierung + Vergleich gesendet ↔ zurückgelesen (Spec §7).
 *
 * Reine, synchrone Funktionen — kein Netz, kein Deno. Verglichen werden NUR die
 * gesendeten Felder (das PATCH-payload aus `mapAufmassToAutarc`); autarc-eigene
 * berechnete Felder (Heizlast/Sizing/Feasibility/IDs) werden NIE verglichen.
 *
 * Regeln:
 *  - Zahlen: Float-Toleranz (epsilon).
 *  - Enums/Strings: exakt (getrimmt).
 *  - Booleans: exakt.
 *  - `"200"` vs `200`: egalisiert (numerischer String → Zahl).
 *  - `heatingCircuits`: strukturell pro `index` (flow/return), reihenfolge-unabhängig.
 */

/** Eine erkannte Abweichung zwischen gesendet und zurückgelesen. */
export interface AutarcDiffEntry {
  feld: string;
  gesendet: unknown;
  autarc: unknown;
  art: 'fehlt' | 'abweichung';
}

export interface AutarcDiffResult {
  /** true = keine Abweichung. */
  ok: boolean;
  abweichungen: AutarcDiffEntry[];
}

/**
 * autarc-Felder, die NIE verglichen werden (computed / wertlos als Signal).
 * `technicalFeasibilityAssesment` ist ein autarc-Tippfehler — so übernehmen.
 */
export const IGNORED_AUTARC_FIELDS: readonly string[] = [
  'technicalFeasibilityAssesment',
  'buildingHeatLoadKw',
  'consumptionBasedHeatload',
  'avgHeatload',
  'yearlyEnergyConsumption',
  'heatPumpSizing',
  'id',
  'humanId',
];

/** Default-Toleranz für Float-Vergleich. */
export const FLOAT_EPSILON = 0.01;

/**
 * Numerischer String? (z. B. "200" oder " 18000.5 ", aber nicht "gas" oder "").
 * `Number.isFinite` (statt nur `!isNaN`) lehnt "Infinity"/"-Infinity"/"1e400" ab —
 * sonst würde normalizeValue("Infinity") zu `Infinity` und ein kaputter Wert
 * unbemerkt numerisch verglichen.
 */
function isNumericString(s: string): boolean {
  const t = s.trim();
  if (t === '') return false;
  return Number.isFinite(Number(t));
}

/** Normalisiert einen Skalar für den Vergleich ("200"→200, " a "→"a", null/undefined→null). */
export function normalizeValue(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = v.trim();
    return isNumericString(t) ? Number(t) : t;
  }
  return v;
}

/**
 * Vergleicht zwei normalisierte Skalare; Zahlen mit Toleranz, sonst strikt.
 * Einzige Quelle der Wahrheit für den Skalar-Vergleich — auch `autarc-reconcile.ts`
 * nutzt diese Funktion (statt einer eigenen Kopie), damit epsilon-Semantik und
 * Sonderfälle nicht zwischen Gate und Reconcile divergieren können.
 */
export function scalarsEqual(a: unknown, b: unknown, epsilon: number): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= epsilon;
  }
  return a === b;
}

/** Skalar-Vergleich auf ROHwerten: erst normalisieren, dann `scalarsEqual`. */
export function compareScalars(a: unknown, b: unknown, epsilon: number): boolean {
  return scalarsEqual(normalizeValue(a), normalizeValue(b), epsilon);
}

/** Vergleicht flow-/returnTemperature eines Heizkreis-Paares (gesendet ↔ readback). */
function compareCircleScalars(
  s: Record<string, unknown>,
  r: Record<string, unknown>,
  epsilon: number,
): AutarcDiffEntry[] {
  const out: AutarcDiffEntry[] = [];
  if (!scalarsEqual(normalizeValue(s.flowTemperature), normalizeValue(r.flowTemperature), epsilon)) {
    out.push({
      feld: `heatingCircuits[${s.index}].flowTemperature`,
      gesendet: s.flowTemperature,
      autarc: r.flowTemperature ?? null,
      art: 'abweichung',
    });
  }
  if (!scalarsEqual(normalizeValue(s.returnTemperature), normalizeValue(r.returnTemperature), epsilon)) {
    out.push({
      feld: `heatingCircuits[${s.index}].returnTemperature`,
      gesendet: s.returnTemperature,
      autarc: r.returnTemperature ?? null,
      art: 'abweichung',
    });
  }
  return out;
}

/** Strukturvergleich heatingCircuits pro index (flow/return), reihenfolge-unabhängig über index. */
export function diffHeatingCircuits(
  sent: unknown,
  readback: unknown,
  epsilon: number,
): AutarcDiffEntry[] {
  const out: AutarcDiffEntry[] = [];
  const sentArr = Array.isArray(sent) ? (sent as Array<Record<string, unknown>>) : [];

  if (!Array.isArray(readback)) {
    // Komplett fehlende Heizkreise im readback: jeder gesendete Kreis fehlt.
    for (const s of sentArr) {
      out.push({
        feld: `heatingCircuits[${s.index}]`,
        gesendet: s,
        autarc: null,
        art: 'fehlt',
      });
    }
    return out;
  }

  const readArr = readback as Array<Record<string, unknown>>;

  // Einzelkreis-Positions-Fallback: Haben BEIDE Seiten genau EINEN Heizkreis,
  // wird flow/return direkt verglichen — unabhängig vom index. autarc nummeriert
  // den ersten Kreis ggf. anders, als wir senden (real: index 1; wir senden auch
  // 1, aber autarc könnte renummerieren); ein reiner Index-Match würde sonst
  // fälschlich „Heizkreis fehlt" melden, obwohl der einzige Kreis korrekt ankam.
  // Bei mehreren Kreisen bleibt der strikte index-basierte Vergleich (eine
  // Positions-Zuordnung wäre dort mehrdeutig).
  if (sentArr.length === 1 && readArr.length === 1) {
    return compareCircleScalars(sentArr[0], readArr[0], epsilon);
  }

  const byIndex = new Map<unknown, Record<string, unknown>>();
  for (const r of readArr) {
    byIndex.set(normalizeValue(r.index), r);
  }

  for (const s of sentArr) {
    const key = normalizeValue(s.index);
    const r = byIndex.get(key);
    if (!r) {
      out.push({
        feld: `heatingCircuits[${s.index}]`,
        gesendet: s,
        autarc: null,
        art: 'fehlt',
      });
      continue;
    }
    out.push(...compareCircleScalars(s, r, epsilon));
  }

  return out;
}

/** Vergleicht NUR die gesendeten Felder (payload) gegen das zurückgelesene Projekt. */
export function diffAutarcPayload(
  sent: Record<string, unknown>,
  readback: Record<string, unknown>,
  epsilon: number = FLOAT_EPSILON,
): AutarcDiffResult {
  const abweichungen: AutarcDiffEntry[] = [];

  for (const feld of Object.keys(sent)) {
    if (IGNORED_AUTARC_FIELDS.includes(feld)) continue;

    if (feld === 'heatingCircuits') {
      abweichungen.push(...diffHeatingCircuits(sent[feld], readback[feld], epsilon));
      continue;
    }

    const sentVal = sent[feld];
    // Das gesendete payload enthält nur befüllte Felder; trotzdem defensiv:
    if (sentVal == null) continue;

    if (!(feld in readback) || readback[feld] == null) {
      abweichungen.push({
        feld,
        gesendet: sentVal,
        autarc: feld in readback ? readback[feld] : null,
        art: 'fehlt',
      });
      continue;
    }

    const a = normalizeValue(sentVal);
    const b = normalizeValue(readback[feld]);
    if (!scalarsEqual(a, b, epsilon)) {
      abweichungen.push({
        feld,
        gesendet: sentVal,
        autarc: readback[feld],
        art: 'abweichung',
      });
    }
  }

  return { ok: abweichungen.length === 0, abweichungen };
}
