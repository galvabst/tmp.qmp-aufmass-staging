/**
 * Wasserdicht-Loop — Fall-Katalog ungültiger Eingaben.
 *
 * Jeder Fall ist eine Eingabe, die ein Techniker tippen könnte, die aber NICHT
 * valide ist und vom Formular gefangen werden MUSS:
 *   - expect 'block' = physikalisch/logisch unmöglich → die Engine muss einen
 *     'block'-Befund liefern.
 *   - expect 'soft'  = unplausibel aber möglich → mindestens ein 'soft'-Befund.
 *
 * Der Test `aufmass-watertight.test.ts` fährt jeden Fall durch die ECHTE
 * `checkPlausibility`/`checkPvPlausibility`. Ein Fall, der nicht gefangen wird,
 * ist ein „Loch" → wird in der Engine gestopft. Die Fälle stammen aus dem
 * Agenten-Enumerations-Schwarm (siehe Workflow `aufmass-watertight-enumerate`)
 * und bleiben als Dauer-Regressionstest erhalten.
 */

export interface WatertightCase {
  /** Stabile ID (Seite + Nummer/Slug). */
  id: string;
  /** Formularseite (techniker|heizung_termin|gebaeude|…|pv). */
  page: string;
  /** Welcher Checker zuständig ist. */
  domain: 'wp' | 'pv';
  label: string;
  /** Primäres Feld, an dem der Fehler hängt. */
  field: string;
  /** Partielle Formularwerte, die den Fall ausmachen. */
  values: Record<string, unknown>;
  expect: 'block' | 'soft';
  why: string;
  /**
   * Bewusst verworfen (Agenten-Übereifer / via UI gar nicht eingebbar /
   * Fehlalarm-Risiko). Wird vom Regressionstest übersprungen. Mit Begründung.
   */
  skip?: string;
}

import { GENERATED_CASES } from './aufmass-watertight-cases.generated';
import { GENERATED_CASES_R2 } from './aufmass-watertight-cases.r2';
import { GENERATED_CASES_R3 } from './aufmass-watertight-cases.r3';
import { GENERATED_CASES_R4 } from './aufmass-watertight-cases.r4';
import { RECLASSIFY_SOFT, SKIP_REASONS } from './aufmass-watertight-overrides';

/**
 * Seed-Fälle (handgesetzt, bekannt-gefangen) — validieren die Harness-Mechanik.
 */
const SEED_CASES: WatertightCase[] = [
  { id: 'seed.gebaeude.flaeche', page: 'gebaeude', domain: 'wp', label: 'Wohnfläche 5 m²', field: 'beheizte_wohnflaeche_m2', values: { beheizte_wohnflaeche_m2: 5 }, expect: 'block', why: '5 m² beheizte Wohnfläche ist physikalisch unmöglich' },
  { id: 'seed.gebaeude.rlVl', page: 'gebaeude', domain: 'wp', label: 'Rücklauf ≥ Vorlauf', field: 'ruecklauftemperatur', values: { vorlauftemperatur: 50, ruecklauftemperatur: 55 }, expect: 'block', why: 'Rücklauf kann nicht höher als Vorlauf sein' },
  { id: 'seed.gebaeude.vorlaufWp', page: 'gebaeude', domain: 'wp', label: 'Vorlauf 65 °C', field: 'vorlauftemperatur', values: { vorlauftemperatur: 65, ruecklauftemperatur: 55 }, expect: 'soft', why: '65 °C Vorlauf ist für eine Wärmepumpe grenzwertig hoch' },
  { id: 'seed.termin.ibVorBa', page: 'heizung_termin', domain: 'wp', label: 'Heizung vor Bauantrag', field: 'heizung_inbetriebnahme_datum', values: { heizung_inbetriebnahme_datum: '2000-01-01', bauantrag_datum: '2010-01-01' }, expect: 'block', why: 'Heizung kann nicht vor dem Bauantrag in Betrieb gegangen sein' },
];

/**
 * Overrides aus der Loop-Triage auf die generierten Fälle anwenden:
 *  - skip: via UI nicht eingebbar / Fehlalarm → wird vom Regressionstest übersprungen.
 *  - reclassify: als block gemeldet, fachlich aber korrekt soft → expect angepasst.
 */
const RECLASS = new Set(RECLASSIFY_SOFT);
const ALL_GENERATED: WatertightCase[] = [...GENERATED_CASES, ...GENERATED_CASES_R2, ...GENERATED_CASES_R3, ...GENERATED_CASES_R4];
const APPLIED_GENERATED: WatertightCase[] = ALL_GENERATED.map((c) => {
  if (SKIP_REASONS[c.id]) return { ...c, skip: SKIP_REASONS[c.id] };
  if (RECLASS.has(c.id)) return { ...c, expect: 'soft' as const };
  return c;
});

/** Gesamter Fall-Katalog: Seeds + (triagierte) enumerierte Fälle aus dem Workflow. */
export const WATERTIGHT_CASES: WatertightCase[] = [...SEED_CASES, ...APPLIED_GENERATED];
