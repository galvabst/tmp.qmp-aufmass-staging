import { describe, it, expect } from 'vitest';
import { WATERTIGHT_CASES } from './aufmass-watertight-cases';
import { caughtBy } from './aufmass-watertight';

/**
 * Wasserdicht-Regressionstest: jeder (nicht übersprungene) ungültige Fall MUSS
 * vom Formular gefangen werden — über Zod-Schema (T1) oder Plausi-Engine (T2/T3).
 * Schlägt ein Fall fehl, ist ein „Loch" zurück → muss in der Engine gestopft
 * (oder als Übereifer mit Begründung übersprungen) werden.
 *
 * Fälle stammen aus dem Enumerations-Schwarm (Workflow `aufmass-watertight-enumerate`);
 * Skips/Reclassifies aus der Loop-Triage (`aufmass-watertight-overrides.ts`).
 */
describe('Wasserdicht-Loop — keine logisch unmögliche Eingabe darf durchkommen', () => {
  const active = WATERTIGHT_CASES.filter((c) => !c.skip);

  for (const c of active) {
    it(`[${c.page}] ${c.id} ${c.label} → ${c.expect}`, () => {
      expect(
        caughtBy(c),
        `LOCH (${c.id} / ${c.field}): ${c.why} | values=${JSON.stringify(c.values)}`,
      ).toBe(true);
    });
  }
});
