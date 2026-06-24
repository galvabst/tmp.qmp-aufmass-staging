import { describe, it, expect } from 'vitest';
import {
  diffAutarcPayload,
  normalizeValue,
  diffHeatingCircuits,
  scalarsEqual,
  compareScalars,
  IGNORED_AUTARC_FIELDS,
  FLOAT_EPSILON,
  type AutarcDiffEntry,
} from './autarc-diff';

/**
 * Unit-Tests fuer Diff/Normalisierung (Spec §7, Contract §2 autarc-diff.ts).
 * Geprueft wird: nur gesendete Felder vergleichen, Float-Toleranz, Enum/Bool exakt,
 * "200" vs 200 egalisieren, heatingCircuits strukturell pro Index, computed Felder
 * (technicalFeasibilityAssesment & Co.) NIE vergleichen.
 */

describe('normalizeValue', () => {
  it('macht aus numerischem String eine Zahl ("200" -> 200)', () => {
    expect(normalizeValue('200')).toBe(200);
  });

  it('laesst echte Zahl unveraendert', () => {
    expect(normalizeValue(200)).toBe(200);
  });

  it('trimmt String-Werte (" a " -> "a")', () => {
    expect(normalizeValue(' a ')).toBe('a');
  });

  it('mappt null und undefined beide auf null', () => {
    expect(normalizeValue(null)).toBeNull();
    expect(normalizeValue(undefined)).toBeNull();
  });

  it('laesst Boolean unveraendert', () => {
    expect(normalizeValue(true)).toBe(true);
    expect(normalizeValue(false)).toBe(false);
  });

  it('haelt nicht-numerischen String als getrimmten String (kein NaN-Cast)', () => {
    expect(normalizeValue(' gas ')).toBe('gas');
  });
});

describe('scalarsEqual / compareScalars (geteilte SSoT, auch von autarc-reconcile genutzt)', () => {
  it('scalarsEqual: Zahlen innerhalb epsilon → gleich', () => {
    expect(scalarsEqual(18000, 18000.005, FLOAT_EPSILON)).toBe(true);
    expect(scalarsEqual(140, 999, FLOAT_EPSILON)).toBe(false);
  });
  it('scalarsEqual: Nicht-Zahlen strikt', () => {
    expect(scalarsEqual('gas', 'gas', FLOAT_EPSILON)).toBe(true);
    expect(scalarsEqual('gas', 'oil', FLOAT_EPSILON)).toBe(false);
    expect(scalarsEqual(true, false, FLOAT_EPSILON)).toBe(false);
  });
  it('compareScalars normalisiert erst ("140" vs 140 → gleich)', () => {
    expect(compareScalars('140', 140, FLOAT_EPSILON)).toBe(true);
    expect(compareScalars(' gas ', 'gas', FLOAT_EPSILON)).toBe(true);
    expect(compareScalars(null, undefined, FLOAT_EPSILON)).toBe(true);
  });
});

describe('IGNORED_AUTARC_FIELDS / FLOAT_EPSILON Konstanten', () => {
  it('ignoriert technicalFeasibilityAssesment (autarc-Tippfehler, computed) — wird NIE verglichen', () => {
    expect(IGNORED_AUTARC_FIELDS).toContain('technicalFeasibilityAssesment');
  });

  it('ignoriert die computed Heizlast-/Sizing-Felder', () => {
    expect(IGNORED_AUTARC_FIELDS).toContain('buildingHeatLoadKw');
    expect(IGNORED_AUTARC_FIELDS).toContain('consumptionBasedHeatload');
    expect(IGNORED_AUTARC_FIELDS).toContain('avgHeatload');
    expect(IGNORED_AUTARC_FIELDS).toContain('yearlyEnergyConsumption');
    expect(IGNORED_AUTARC_FIELDS).toContain('heatPumpSizing');
  });

  it('ignoriert technische IDs (id, humanId)', () => {
    expect(IGNORED_AUTARC_FIELDS).toContain('id');
    expect(IGNORED_AUTARC_FIELDS).toContain('humanId');
  });

  it('FLOAT_EPSILON ist eine kleine positive Zahl', () => {
    expect(typeof FLOAT_EPSILON).toBe('number');
    expect(FLOAT_EPSILON).toBeGreaterThan(0);
    expect(FLOAT_EPSILON).toBeLessThan(1);
  });
});

describe('diffAutarcPayload — vergleicht NUR gesendete Felder', () => {
  it('identischer Round-Trip ist ok (keine Abweichung)', () => {
    const sent = {
      buildingType: 'singleOrDoubleFamilyHouse',
      heatedLivingAreaM2: 140,
      isFacadeInsulated: true,
    };
    const result = diffAutarcPayload(sent, { ...sent });
    expect(result.ok).toBe(true);
    expect(result.abweichungen).toEqual([]);
  });

  it('zahliger Wert vs zahliger String ("140" zurueck) ist KEINE Abweichung', () => {
    const sent = { heatedLivingAreaM2: 140 };
    const readback = { heatedLivingAreaM2: '140' };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(true);
  });

  it('echte numerische Abweichung wird als art=abweichung gemeldet', () => {
    const sent = { heatedLivingAreaM2: 140 };
    const readback = { heatedLivingAreaM2: 200 };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(false);
    const entry = result.abweichungen.find((a) => a.feld === 'heatedLivingAreaM2');
    expect(entry).toBeDefined();
    expect(entry?.art).toBe('abweichung');
    expect(entry?.gesendet).toBe(140);
    expect(entry?.autarc).toBe(200);
  });

  it('Float innerhalb der Toleranz ist KEINE Abweichung', () => {
    const sent = { averageEnergyConsumptionLast3Years: 18000.0 };
    const readback = { averageEnergyConsumptionLast3Years: 18000.005 };
    const result = diffAutarcPayload(sent, readback, FLOAT_EPSILON);
    expect(result.ok).toBe(true);
  });

  it('Float ausserhalb der Toleranz ist eine Abweichung', () => {
    const sent = { averageEnergyConsumptionLast3Years: 18000 };
    const readback = { averageEnergyConsumptionLast3Years: 18050 };
    const result = diffAutarcPayload(sent, readback, FLOAT_EPSILON);
    expect(result.ok).toBe(false);
  });

  it('Enum-Abweichung (andere Schreibweise) ist eine Abweichung', () => {
    const sent = { buildingType: 'singleOrDoubleFamilyHouse' };
    const readback = { buildingType: 'multiFamilyHouse' };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(false);
    expect(result.abweichungen.some((a) => a.feld === 'buildingType')).toBe(true);
  });

  it('Boolean-Abweichung (true vs false) ist eine Abweichung', () => {
    const sent = { isFacadeInsulated: true };
    const readback = { isFacadeInsulated: false };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(false);
    expect(result.abweichungen.some((a) => a.feld === 'isFacadeInsulated')).toBe(true);
  });

  it('fehlendes Feld im readback wird als art=fehlt gemeldet', () => {
    const sent = { numberOfFloors: 2 };
    const readback = {};
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(false);
    const entry = result.abweichungen.find((a) => a.feld === 'numberOfFloors');
    expect(entry?.art).toBe('fehlt');
  });

  it('autarc-Extra-Felder (nur im readback, nicht gesendet) erzeugen KEINE Abweichung', () => {
    const sent = { heatedLivingAreaM2: 140 };
    const readback = {
      heatedLivingAreaM2: 140,
      buildingHeatLoadKw: 8.4,
      technicalFeasibilityAssesment: 'whatever',
      humanId: 'AT-1001',
    };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(true);
  });

  it('technicalFeasibilityAssesment wird NIE verglichen, selbst wenn gesendet abweichend', () => {
    const sent = { technicalFeasibilityAssesment: 'feasible', heatedLivingAreaM2: 140 };
    const readback = { technicalFeasibilityAssesment: 'not-feasible', heatedLivingAreaM2: 140 };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(true);
    expect(
      result.abweichungen.some((a) => a.feld === 'technicalFeasibilityAssesment'),
    ).toBe(false);
  });
});

describe('diffHeatingCircuits — strukturell pro Index (flow/return)', () => {
  const ok = [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 0 }];

  it('identische Heizkreise ergeben keine Abweichung', () => {
    const diffs = diffHeatingCircuits(ok, [{ ...ok[0] }], FLOAT_EPSILON);
    expect(diffs).toEqual([]);
  });

  it('abweichende flowTemperature ergibt eine Abweichung', () => {
    const readback = [{ name: 'Heizkreis 1', flowTemperature: 60, returnTemperature: 45, index: 0 }];
    const diffs = diffHeatingCircuits(ok, readback, FLOAT_EPSILON);
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs[0].art).toBe('abweichung');
  });

  it('abweichende returnTemperature ergibt eine Abweichung', () => {
    const readback = [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 40, index: 0 }];
    const diffs = diffHeatingCircuits(ok, readback, FLOAT_EPSILON);
    expect(diffs.length).toBeGreaterThan(0);
  });

  it('Vergleich ist reihenfolge-unabhaengig ueber index', () => {
    const sent = [
      { name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 0 },
      { name: 'HK2', flowTemperature: 35, returnTemperature: 28, index: 1 },
    ];
    const readbackShuffled = [
      { name: 'HK2', flowTemperature: 35, returnTemperature: 28, index: 1 },
      { name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 0 },
    ];
    const diffs = diffHeatingCircuits(sent, readbackShuffled, FLOAT_EPSILON);
    expect(diffs).toEqual([]);
  });

  it('fehlender Heizkreis-Index im readback wird als Abweichung gemeldet', () => {
    const sent = [
      { name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 0 },
      { name: 'HK2', flowTemperature: 35, returnTemperature: 28, index: 1 },
    ];
    const readback = [{ name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 0 }];
    const diffs = diffHeatingCircuits(sent, readback, FLOAT_EPSILON);
    expect(diffs.length).toBeGreaterThan(0);
  });
});

describe('diffAutarcPayload — heatingCircuits ueber das Gesamt-Payload', () => {
  it('abweichende Heizkreis-Vorlauftemperatur taucht in den Abweichungen auf', () => {
    const sent = {
      heatingCircuits: [
        { name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 0 },
      ],
    };
    const readback = {
      heatingCircuits: [
        { name: 'Heizkreis 1', flowTemperature: 60, returnTemperature: 45, index: 0 },
      ],
    };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(false);
    expect(result.abweichungen.length).toBeGreaterThan(0);
  });

  it('strukturell gleiche Heizkreise (nur Reihenfolge anders) sind ok', () => {
    const sent = {
      heatingCircuits: [
        { name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 0 },
        { name: 'HK2', flowTemperature: 35, returnTemperature: 28, index: 1 },
      ],
    };
    const readback = {
      heatingCircuits: [
        { name: 'HK2', flowTemperature: 35, returnTemperature: 28, index: 1 },
        { name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 0 },
      ],
    };
    const result = diffAutarcPayload(sent, readback);
    expect(result.ok).toBe(true);
  });
});

describe('AutarcDiffEntry-Form', () => {
  it('jede Abweichung traegt feld, gesendet, autarc und art', () => {
    const result = diffAutarcPayload({ numberOfFloors: 2 }, { numberOfFloors: 5 });
    const entry: AutarcDiffEntry = result.abweichungen[0];
    expect(entry).toHaveProperty('feld');
    expect(entry).toHaveProperty('gesendet');
    expect(entry).toHaveProperty('autarc');
    expect(['fehlt', 'abweichung']).toContain(entry.art);
  });
});
