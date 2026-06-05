import { describe, it, expect } from 'vitest';
import { mapRidesToSlots, COACHING_PREIS_AUFSCHLAG } from './coaching-slots';
import type { DbCoachingRide } from '@/hooks/useCoachingSlots';

function makeRide(overrides: Partial<DbCoachingRide> = {}): DbCoachingRide {
  return {
    auftrag_id: 'a1',
    trainer_profile_id: 'p1',
    termine: [{ datum: '2026-07-01', ganztaegig: false, zeit_von: '09:00', zeit_bis: '12:00' }],
    region: '80331 München',
    trainer_vorname: 'Max',
    trainer_nachname: 'Muster',
    trainer_coaching_preis: 100,
    ...overrides,
  };
}

describe('mapRidesToSlots', () => {
  it('gibt leeres Array zurück, wenn nichts vorhanden ist', () => {
    expect(mapRidesToSlots(null, [])).toEqual([]);
    expect(mapRidesToSlots(undefined, [])).toEqual([]);
  });

  it('mappt verfügbare Rides mit gebucht=false', () => {
    const slots = mapRidesToSlots(null, [makeRide({ auftrag_id: 'r1' })]);
    expect(slots).toHaveLength(1);
    expect(slots[0].id).toBe('r1');
    expect(slots[0].gebucht).toBe(false);
  });

  it('setzt den gebuchten Ride an erste Stelle (gebucht=true), dann verfügbare', () => {
    const slots = mapRidesToSlots(
      makeRide({ auftrag_id: 'booked' }),
      [makeRide({ auftrag_id: 'avail1' }), makeRide({ auftrag_id: 'avail2' })],
    );
    expect(slots.map(s => s.id)).toEqual(['booked', 'avail1', 'avail2']);
    expect(slots[0].gebucht).toBe(true);
    expect(slots[1].gebucht).toBe(false);
    expect(slots[2].gebucht).toBe(false);
  });

  it('rechnet den Preis mit Aufschlag und rundet', () => {
    const [slot] = mapRidesToSlots(null, [makeRide({ trainer_coaching_preis: 100 })]);
    expect(slot.preis).toBe(Math.round(100 * COACHING_PREIS_AUFSCHLAG)); // 130
  });

  it('behandelt fehlenden Preis als 0', () => {
    const [slot] = mapRidesToSlots(null, [makeRide({ trainer_coaching_preis: undefined })]);
    expect(slot.preis).toBe(0);
  });

  it('fällt bei fehlendem Namen auf "Trainer" zurück', () => {
    const [slot] = mapRidesToSlots(null, [makeRide({ trainer_vorname: '', trainer_nachname: '' })]);
    expect(slot.coachName).toBe('Trainer');
  });

  it('mappt termine-Felder von snake_case auf camelCase', () => {
    const [slot] = mapRidesToSlots(null, [makeRide()]);
    expect(slot.termine[0]).toEqual({
      datum: '2026-07-01',
      ganztaegig: false,
      zeitVon: '09:00',
      zeitBis: '12:00',
    });
  });

  it('spiegelt region auf ort und region', () => {
    const [slot] = mapRidesToSlots(null, [makeRide({ region: '10115 Berlin' })]);
    expect(slot.ort).toBe('10115 Berlin');
    expect(slot.region).toBe('10115 Berlin');
  });
});
