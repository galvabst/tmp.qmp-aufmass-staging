import { describe, it, expect } from 'vitest';
import { mapAufmassToAutarc } from './aufmass-to-autarc';

/**
 * Runde 8 (20-Agenten-Edge-Sweep): mapAufmassToAutarc darf KEINEN nicht-endlichen
 * Zahlenwert in den autarc-Payload schreiben — vorher filterte der Payload nur
 * `Number.isNaN`, sodass Infinity/-Infinity bei Feldern wie numberOfResidents /
 * averageEnergyConsumptionLast3Years durchrutschten (JSON.stringify → "null" →
 * still „angekommen"). Jetzt: `!Number.isFinite` für ALLE Zahlenfelder.
 */

describe('Härtung R8 — mapAufmassToAutarc: Infinity/-Infinity NICHT im Payload', () => {
  it('numberOfResidents=Infinity → nicht im Payload', () => {
    const { payload } = mapAufmassToAutarc({ anzahl_bewohner: Infinity } as never);
    expect('numberOfResidents' in payload).toBe(false);
  });

  it('averageEnergyConsumptionLast3Years=-Infinity → nicht im Payload', () => {
    const { payload } = mapAufmassToAutarc({ durchschnittsverbrauch_3_jahre: -Infinity } as never);
    expect('averageEnergyConsumptionLast3Years' in payload).toBe(false);
  });

  it('numberOfFloors=Infinity & heatedLivingAreaM2=NaN → beide nicht im Payload', () => {
    const { payload } = mapAufmassToAutarc({ anzahl_etagen: Infinity, beheizte_wohnflaeche_m2: NaN } as never);
    expect('numberOfFloors' in payload).toBe(false);
    expect('heatedLivingAreaM2' in payload).toBe(false);
  });

  it('Sammel-Invariante: KEIN numerischer Payload-Wert ist nicht-endlich', () => {
    const { payload } = mapAufmassToAutarc({
      beheizte_wohnflaeche_m2: NaN,
      anzahl_bewohner: Infinity,
      anzahl_etagen: -Infinity,
      durchschnittsverbrauch_3_jahre: NaN,
      vorlauftemperatur: NaN,
      ruecklauftemperatur: Infinity,
    } as never);
    for (const [k, val] of Object.entries(payload)) {
      if (typeof val === 'number') {
        expect(Number.isFinite(val), `Payload-Feld ${k} ist nicht endlich`).toBe(true);
      }
    }
  });

  it('endliche Werte bleiben erhalten', () => {
    const { payload } = mapAufmassToAutarc({ anzahl_bewohner: 4, beheizte_wohnflaeche_m2: 140, anzahl_etagen: 2 } as never);
    expect(payload.numberOfResidents).toBe(4);
    expect(payload.heatedLivingAreaM2).toBe(140);
    expect(payload.numberOfFloors).toBe(2);
  });
});
