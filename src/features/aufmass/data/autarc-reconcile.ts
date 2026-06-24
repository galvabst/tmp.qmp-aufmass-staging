/**
 * autarc-reconcile — Feld-für-Feld-Abgleich Formular ↔ autarc-Projekt.
 *
 * TODO(autarc-waechter): Kein Produktions-Aufrufer. Aktiv weiterentwickeln (Wächter-
 * Ansicht „AutarcMappingPanel") ODER als Kandidat zum Entfernen markieren — Entscheidung
 * an ein Tracking-Issue koppeln, bevor diese Datei in einem Review in 6 Monaten zur
 * „wer braucht das?"-Frage wird. Bis dahin: getestet (autarc-reconcile.test.ts), geplant,
 * NICHT löschen.
 *
 * STATUS: VORBEREITETER, NOCH NICHT EINGEBUNDENER Code für die geplante
 * „Wächter-/Kontroll-Ansicht" (manueller, bidirektionaler Soll-Ist-Abgleich). Es
 * gibt HEUTE keinen Produktions-Aufrufer — der Submit-/Preview-Pfad nutzt
 * `mapAufmassToAutarc` (Vorschau) bzw. den autarc-Gate-Diff (`autarc-diff.ts`)
 * direkt. Einzige Importe stammen aktuell aus `autarc-reconcile.test.ts`. Beim
 * Bau der Wächter-Ansicht hier einsteigen (UI: AutarcMappingPanel) — bis dahin
 * NICHT löschen (geplant, getestet), aber auch nicht als „live" verstehen.
 *
 * Zweck (read-only Audit): nimmt die Form-Payload (via `mapAufmassToAutarc`) und
 * ein bereits abgerufenes autarc-Projektobjekt und liefert pro autarc-Feld einen
 * von vier Zuständen + einen lesbaren Report. Anders als `autarc-diff.ts` (das
 * NUR den Gate-Zweck „gesendet ↔ readback" abdeckt) ist dies ein vollständiger,
 * bidirektionaler Soll-Ist-Abgleich für die manuelle Kontrolle/Wächter-Ansicht.
 *
 * Reine, synchrone Funktionen — kein Netz, kein Deno, keine Seiteneffekte. Der
 * Netz-Abruf des autarc-Projekts passiert außerhalb (Edge-Function bzw. Runner).
 *
 * Vier Zustände pro Feld:
 *  - `match`            : Form-Wert und autarc-Wert sind gleich (normalisiert).
 *  - `abweichung`       : beide Seiten haben einen Wert, aber sie unterscheiden sich.
 *  - `fehlt_in_autarc`  : Form hat einen Wert, autarc hat keinen.
 *  - `fehlt_in_form`    : autarc hat einen Wert, das Formular hat keinen.
 *
 * Verglichen werden NUR die vom Formular gemappten autarc-Felder (direct+derived).
 * autarc-eigene computed-Felder (Heizlast/Sizing/IDs) werden ignoriert — siehe
 * `IGNORED_AUTARC_FIELDS` in autarc-diff.ts (dort die Quelle der Wahrheit).
 */

import type { AufmassDraftData } from './aufmass-schema';
import { mapAufmassToAutarc, type AutarcFieldMapping } from './aufmass-to-autarc';
import { normalizeValue, compareScalars, IGNORED_AUTARC_FIELDS, FLOAT_EPSILON } from './autarc-diff';

export type ReconcileState = 'match' | 'abweichung' | 'fehlt_in_autarc' | 'fehlt_in_form';

export interface ReconcileEntry {
  autarcField: string;
  /** Menschenlesbares Label aus dem Mapping (z. B. „Gebäudetyp"). */
  label: string;
  /** Wert aus dem Formular (gemappt, vor Normalisierung). */
  form: unknown;
  /** Wert aus dem autarc-Projekt (roh, vor Normalisierung). */
  autarc: unknown;
  state: ReconcileState;
}

export interface ReconcileResult {
  entries: ReconcileEntry[];
  counts: Record<ReconcileState, number>;
  /** true = kein `abweichung` und kein `fehlt_in_*` (alles `match`). */
  ok: boolean;
}

/** Float-Toleranz für den Abgleich (geteilt mit autarc-diff). */
export const RECONCILE_EPSILON = FLOAT_EPSILON;

/** Ist der (normalisierte) Wert „leer" im Reconcile-Sinn (null/undefined)? */
function istLeer(v: unknown): boolean {
  return normalizeValue(v) == null;
}

/**
 * Reconcile-Zustand für ein Feld aus (Form-Wert, autarc-Wert).
 * `heatingCircuits` bekommt eine eigene Behandlung über `heatingCircuitsState`.
 */
function entryState(form: unknown, autarc: unknown, epsilon: number): ReconcileState {
  const formLeer = istLeer(form);
  const autarcLeer = istLeer(autarc);
  if (formLeer && autarcLeer) return 'match'; // beide leer → kein Konflikt
  if (formLeer) return 'fehlt_in_form';
  if (autarcLeer) return 'fehlt_in_autarc';
  // Geteilte SSoT (autarc-diff.compareScalars) — kein eigener Toleranz-Vergleich mehr.
  return compareScalars(form, autarc, epsilon) ? 'match' : 'abweichung';
}

/**
 * Der Form-`heatingCircuits`-Wert im Mapping ist ein lesbarer String („VL x / RL y °C")
 * oder null; das autarc-Projekt liefert ein Array von Kreisen. Verglichen wird daher
 * nur die PRÄSENZ (hat die Form Vor-/Rücklauf? hat autarc mindestens einen Kreis?),
 * NICHT der genaue Wert — das genaue Heizkreis-Matching macht das Gate (`autarc-diff`).
 * So entsteht hier kein Phantom-„abweichung" durch unterschiedliche Repräsentation.
 */
function heatingCircuitsState(formLabelValue: unknown, autarcCircuits: unknown): ReconcileState {
  const formHat = formLabelValue != null;
  const autarcHat = Array.isArray(autarcCircuits) && autarcCircuits.length > 0;
  if (!formHat && !autarcHat) return 'match';
  if (!formHat) return 'fehlt_in_form';
  if (!autarcHat) return 'fehlt_in_autarc';
  return 'match'; // beide vorhanden → Präsenz stimmt; Werte prüft das Gate
}

const LEERE_COUNTS = (): Record<ReconcileState, number> => ({
  match: 0,
  abweichung: 0,
  fehlt_in_autarc: 0,
  fehlt_in_form: 0,
});

/**
 * Gleicht die Form-Payload (gemappt) gegen ein abgerufenes autarc-Projektobjekt ab.
 *
 * @param values         Teil-Aufmaß-Formulardaten (wie im Submit-Pfad).
 * @param autarcProject  Das von der autarc-API abgerufene Projekt (rohes Objekt).
 * @param epsilon        Float-Toleranz (Default `RECONCILE_EPSILON`).
 */
export function reconcileAufmassGegenAutarc(
  values: Partial<AufmassDraftData>,
  autarcProject: Record<string, unknown> | null | undefined,
  epsilon: number = RECONCILE_EPSILON,
): ReconcileResult {
  const project = autarcProject ?? {};
  const mapping = mapAufmassToAutarc(values);

  const entries: ReconcileEntry[] = [];
  const counts = LEERE_COUNTS();

  for (const f of mapping.fields as AutarcFieldMapping[]) {
    // `missing` = autarc-Feld, das das Formular HEUTE gar nicht erfasst → kein
    // sinnvoller Soll-Ist-Abgleich (es gibt keinen Form-Wert). Überspringen.
    if (f.source === 'missing') continue;
    // computed/technische autarc-Felder (Heizlast/Sizing/IDs) nie abgleichen.
    if (IGNORED_AUTARC_FIELDS.includes(f.autarcField)) continue;

    const autarcVal = f.autarcField in project ? project[f.autarcField] : null;

    const state =
      f.autarcField === 'heatingCircuits'
        ? heatingCircuitsState(f.value, autarcVal)
        : entryState(f.value, autarcVal, epsilon);

    entries.push({
      autarcField: f.autarcField,
      label: f.label,
      form: f.value,
      autarc: autarcVal,
      state,
    });
    counts[state] += 1;
  }

  const ok = counts.abweichung === 0 && counts.fehlt_in_autarc === 0 && counts.fehlt_in_form === 0;
  return { entries, counts, ok };
}

// --- Lesbarer Report ------------------------------------------------------

const STATE_SYMBOL: Record<ReconcileState, string> = {
  match: 'OK ',
  abweichung: '!= ',
  fehlt_in_autarc: '-> ', // im Formular vorhanden, in autarc nicht
  fehlt_in_form: '<- ', // in autarc vorhanden, im Formular nicht
};

const STATE_LABEL: Record<ReconcileState, string> = {
  match: 'stimmt überein',
  abweichung: 'weicht ab',
  fehlt_in_autarc: 'fehlt in autarc',
  fehlt_in_form: 'fehlt im Formular',
};

/** Wert für die Report-Anzeige knapp formatieren (null → „—"). */
function fmt(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'string') return v === '' ? '(leer)' : v;
  if (typeof v === 'boolean') return v ? 'ja' : 'nein';
  if (typeof v === 'number') return String(v);
  // Arrays/Objekte (z. B. heatingCircuits) kompakt als JSON.
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Baut einen lesbaren, deterministischen Klartext-Report aus dem Abgleich.
 * Kopf mit Zähl-Übersicht, danach eine Zeile pro Feld (Symbol + Label + Werte).
 */
export function formatReconcileReport(result: ReconcileResult): string {
  const { counts, entries, ok } = result;
  const kopf = ok
    ? 'autarc-Abgleich: alles stimmt überein.'
    : 'autarc-Abgleich: Abweichungen gefunden.';
  const summe =
    `  match=${counts.match}  abweichung=${counts.abweichung}  ` +
    `fehlt_in_autarc=${counts.fehlt_in_autarc}  fehlt_in_form=${counts.fehlt_in_form}`;

  const zeilen = entries.map((e) => {
    const sym = STATE_SYMBOL[e.state];
    const base = `${sym}${e.label} [${e.autarcField}] — ${STATE_LABEL[e.state]}`;
    if (e.state === 'match') return base;
    return `${base}: Formular=${fmt(e.form)} | autarc=${fmt(e.autarc)}`;
  });

  return [kopf, summe, '', ...zeilen].join('\n');
}
