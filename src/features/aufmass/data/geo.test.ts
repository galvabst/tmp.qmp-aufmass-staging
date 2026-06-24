import { describe, it, expect } from 'vitest';
import { bewerteGeo, formatDistanz, geoCheckLaeuftNoch, GEO_OK_RADIUS_M, GEO_ABZUG_EUR } from './geo';

/**
 * Geo-Bewertung + Submit-Gate-Predicate.
 *
 * Design (dokumentiert): Geo ist Abzug-statt-Block (fail-open). bewerteGeo kennt
 * nur 'ok' (<=400 m, 0 €) und 'abweichung' (>400 m, 20 €). Diese Tests sichern
 * die Schwelle (Grenzfall genau 400 m) gegen Regressionen (< statt <=) ab.
 */

describe('bewerteGeo — Schwelle und Abzug', () => {
  it('Distanz 0 → ok / 0 €', () => {
    expect(bewerteGeo(0)).toEqual({ status: 'ok', abzug: 0 });
  });

  it('genau am Radius (400 m) → ok / 0 € (Grenze inklusive)', () => {
    expect(bewerteGeo(GEO_OK_RADIUS_M)).toEqual({ status: 'ok', abzug: 0 });
  });

  it('knapp über dem Radius (400,01 m) → abweichung / 20 €', () => {
    expect(bewerteGeo(GEO_OK_RADIUS_M + 0.01)).toEqual({ status: 'abweichung', abzug: GEO_ABZUG_EUR });
  });

  it('401 m → abweichung / 20 €', () => {
    expect(bewerteGeo(401)).toEqual({ status: 'abweichung', abzug: GEO_ABZUG_EUR });
  });

  it('sehr große Distanz → abweichung / 20 €', () => {
    expect(bewerteGeo(50_000)).toEqual({ status: 'abweichung', abzug: GEO_ABZUG_EUR });
  });
});

describe('formatDistanz — de-DE', () => {
  it('120 → "120 m"', () => expect(formatDistanz(120)).toBe('120 m'));
  it('999 → "999 m"', () => expect(formatDistanz(999)).toBe('999 m'));
  it('1000 → "1 km"', () => expect(formatDistanz(1000)).toBe('1 km'));
  it('3200 → "3,2 km" (Komma)', () => expect(formatDistanz(3200)).toBe('3,2 km'));
});

describe('geoCheckLaeuftNoch — Submit-Gate-Predicate', () => {
  it('idle / locating / checking → noch nicht abgeschlossen (true)', () => {
    expect(geoCheckLaeuftNoch('idle')).toBe(true);
    expect(geoCheckLaeuftNoch('locating')).toBe(true);
    expect(geoCheckLaeuftNoch('checking')).toBe(true);
  });

  it('ok / abweichung → abgeschlossen (false)', () => {
    expect(geoCheckLaeuftNoch('ok')).toBe(false);
    expect(geoCheckLaeuftNoch('abweichung')).toBe(false);
  });

  it('kein_gps / nicht_pruefbar → fail-open, blockt NICHT (false)', () => {
    // Bewusst false: weder Geocoding-Ausfall noch GPS-Verweigerung sollen das
    // Einreichen via dieses Predicate pausieren (Produkt-/Policy-Entscheidung).
    expect(geoCheckLaeuftNoch('kein_gps')).toBe(false);
    expect(geoCheckLaeuftNoch('nicht_pruefbar')).toBe(false);
  });
});
