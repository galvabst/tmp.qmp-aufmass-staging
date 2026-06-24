import { describe, it, expect } from 'vitest';
import { mapAufmassToAutarc } from './aufmass-to-autarc';

/** Regressionen aus Runde 7: mapAufmassToAutarc darf keine NaN/non-finite Werte in den
 *  autarc-Payload schreiben (würden als null serialisiert und still „ankommen"). */

describe('Härtung R7 — mapAufmassToAutarc filtert NaN/non-finite', () => {
  it('NaN-Vorlauf → KEIN heatingCircuits-Payload', () => {
    const { payload } = mapAufmassToAutarc({ vorlauftemperatur: NaN, ruecklauftemperatur: 35 } as never);
    expect(payload.heatingCircuits).toBeUndefined();
  });
  it('Infinity-Rücklauf → KEIN heatingCircuits-Payload', () => {
    const { payload } = mapAufmassToAutarc({ vorlauftemperatur: 55, ruecklauftemperatur: Infinity } as never);
    expect(payload.heatingCircuits).toBeUndefined();
  });
  it('NaN-Wohnfläche landet NICHT im Payload', () => {
    const { payload } = mapAufmassToAutarc({ beheizte_wohnflaeche_m2: NaN } as never);
    expect('heatedLivingAreaM2' in payload).toBe(false);
  });
  it('endliche Werte bleiben unverändert erhalten', () => {
    const { payload } = mapAufmassToAutarc({ vorlauftemperatur: 55, ruecklauftemperatur: 45, beheizte_wohnflaeche_m2: 140 } as never);
    expect(Array.isArray(payload.heatingCircuits)).toBe(true);
    expect((payload.heatingCircuits as Array<Record<string, unknown>>)[0].flowTemperature).toBe(55);
    expect(payload.heatedLivingAreaM2).toBe(140);
  });
});
