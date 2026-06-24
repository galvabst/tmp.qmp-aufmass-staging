import { describe, it, expect } from 'vitest';
import {
  berechneWandUWert,
  berechneDachUWert,
  berechneBodenUWert,
  berechneUWerte,
  LAMBDA_MAUERWERK,
  LAMBDA_DAEMMSTOFF,
  R_SI,
  R_SE,
} from './u-werte-berechnung';
import type { UWerteData } from './aufmass-schema';

const wand = (w: Partial<NonNullable<UWerteData['aussenwand']>>) =>
  w as NonNullable<UWerteData['aussenwand']>;

describe('berechneWandUWert — Referenzfälle', () => {
  it('ungedämmte 36 cm Vollziegelwand ≈ 1.4 W/m²K', () => {
    const r = berechneWandUWert(wand({ mauerwerk_material: 'vollziegel', mauerwerk_cm: 36 }));
    expect(r).not.toBeNull();
    // Erwartung lt. Aufgabe: ~1.4 (Bandbreite Bestand)
    expect(r!.uWert).toBeGreaterThan(1.2);
    expect(r!.uWert).toBeLessThan(1.6);
  });

  it('gedämmte Wand ist deutlich niedriger als ungedämmt', () => {
    const ohne = berechneWandUWert(wand({ mauerwerk_material: 'vollziegel', mauerwerk_cm: 36 }));
    const mit = berechneWandUWert(wand({
      mauerwerk_material: 'vollziegel', mauerwerk_cm: 36,
      daemmstoff_typ: 'mineralwolle', daemmstoff_cm: 16,
    }));
    expect(mit).not.toBeNull();
    // 16 cm Mineralwolle (λ 0.035) → R ≈ 4.57 → U deutlich unter 0.25
    expect(mit!.uWert).toBeLessThan(0.25);
    expect(mit!.uWert).toBeLessThan(ohne!.uWert * 0.3);
  });

  it('rechnet R = d/λ + Rsi + Rse exakt nach (Vollziegel 36 cm)', () => {
    const r = berechneWandUWert(wand({ mauerwerk_material: 'vollziegel', mauerwerk_cm: 36 }))!;
    const rMauer = 0.36 / LAMBDA_MAUERWERK.vollziegel; // 0.36 / 0.68
    const rTotalExpected = R_SI.wand + R_SE.wand + rMauer;
    expect(r.rTotal).toBeCloseTo(Math.round(rTotalExpected * 1000) / 1000, 3);
    expect(r.uWert).toBeCloseTo(Math.round((1 / rTotalExpected) * 100) / 100, 2);
  });

  it('addiert Außen-/Innenputz + Dämmschicht als eigene Schichten', () => {
    const r = berechneWandUWert(wand({
      mauerwerk_material: 'hochlochziegel', mauerwerk_cm: 24,
      aussenputz_cm: 2, innenputz_cm: 1.5,
      daemmstoff_typ: 'eps_styropor', daemmstoff_cm: 10,
    }))!;
    expect(r.schichten.map((s) => s.name)).toEqual(['Außenputz', 'Dämmung', 'Mauerwerk', 'Innenputz']);
  });

  it('Porenbeton (Ytong) hat von Haus aus niedrigen U-Wert', () => {
    const r = berechneWandUWert(wand({ mauerwerk_material: 'ytong_porenbeton', mauerwerk_cm: 36 }))!;
    // λ 0.13 → R 2.77 → U < 0.4 auch ohne Zusatzdämmung
    expect(r.uWert).toBeLessThan(0.4);
  });

  it('„keine" Dämmung wird ignoriert (keine R-Schicht)', () => {
    const r = berechneWandUWert(wand({
      mauerwerk_material: 'vollziegel', mauerwerk_cm: 36,
      daemmstoff_typ: 'keine', daemmstoff_cm: 0,
    }))!;
    expect(r.schichten.some((s) => s.name === 'Dämmung')).toBe(false);
  });
});

describe('berechneWandUWert — nicht berechenbar', () => {
  it('ohne Mauerwerk-Material → null', () => {
    expect(berechneWandUWert(wand({ mauerwerk_cm: 36 }))).toBeNull();
  });
  it('ohne Mauerwerk-Dicke → null', () => {
    expect(berechneWandUWert(wand({ mauerwerk_material: 'vollziegel' }))).toBeNull();
  });
  it('undefined → null', () => {
    expect(berechneWandUWert(undefined)).toBeNull();
  });
});

describe('berechneDachUWert', () => {
  it('ohne Dachtyp → null', () => {
    expect(berechneDachUWert({})).toBeNull();
  });

  it('ungedämmtes Dach → sehr hoher U-Wert (nur Rsi+Rse)', () => {
    const r = berechneDachUWert({ dachtyp: 'satteldach' })!;
    // R = 0.10 + 0.04 = 0.14 → U ≈ 7.14
    expect(r.uWert).toBeGreaterThan(5);
  });

  it('20 cm Zwischensparren-Mineralwolle → niedriger U-Wert', () => {
    const r = berechneDachUWert({
      dachtyp: 'satteldach',
      zwischensparren_daemmstoff_typ: 'mineralwolle', zwischensparren_cm: 20,
    })!;
    // R ≈ 0.14 + 0.20/0.035 = 5.85 → U ≈ 0.17
    expect(r.uWert).toBeLessThan(0.25);
    expect(r.schichten.some((s) => s.name === 'Zwischensparren-Dämmung')).toBe(true);
  });

  it('addiert Auf-/Zwischen-/Untersparren-Lagen', () => {
    const r = berechneDachUWert({
      dachtyp: 'satteldach',
      zwischensparren_daemmstoff_typ: 'mineralwolle', zwischensparren_cm: 18,
      aufdach_daemmstoff_typ: 'pur_pir', aufdach_cm: 8,
      untersparren_cm: 4,
    })!;
    expect(r.schichten.length).toBe(3);
  });
});

describe('berechneBodenUWert', () => {
  it('ohne Art → null', () => {
    expect(berechneBodenUWert({})).toBeNull();
  });

  it('ungedämmte Bodenplatte → hoher U-Wert', () => {
    const r = berechneBodenUWert({ art: 'bodenplatte_erdberuehrt' })!;
    // R = Rsi 0.17 (+ Rse 0) → U ≈ 5.88
    expect(r.uWert).toBeGreaterThan(4);
  });

  it('12 cm Dämmung senkt den U-Wert deutlich', () => {
    const r = berechneBodenUWert({ art: 'kellerdecke_unbeheizt', daemmung_typ: 'eps_styropor', daemmung_cm: 12 })!;
    // R = 0.17 + 0.12/0.035 = 3.6 → U ≈ 0.28
    expect(r.uWert).toBeLessThan(0.4);
  });
});

describe('berechneUWerte — Gesamtblock', () => {
  it('liefert alle Bauteile (null wo nicht berechenbar)', () => {
    const res = berechneUWerte({
      aussenwand: { mauerwerk_material: 'vollziegel', mauerwerk_cm: 36 },
      dach: { dachtyp: 'satteldach', zwischensparren_daemmstoff_typ: 'mineralwolle', zwischensparren_cm: 20 },
      unten: { art: 'bodenplatte_erdberuehrt' },
    });
    expect(res.aussenwand).not.toBeNull();
    expect(res.dach).not.toBeNull();
    expect(res.unten).not.toBeNull();
    expect(res.anbauwand).toBeNull();
  });

  it('Anbauwand nur wenn anbau.vorhanden === true', () => {
    const ohne = berechneUWerte({ anbau: { wand: { mauerwerk_material: 'beton', mauerwerk_cm: 24 } } });
    expect(ohne.anbauwand).toBeNull();
    const mit = berechneUWerte({ anbau: { vorhanden: true, wand: { mauerwerk_material: 'beton', mauerwerk_cm: 24 } } });
    expect(mit.anbauwand).not.toBeNull();
  });

  it('leerer Block → alles null, kein Wurf', () => {
    const res = berechneUWerte(undefined);
    expect(res).toEqual({ aussenwand: null, dach: null, unten: null, anbauwand: null });
  });
});

describe('λ-Tabelle Sanity', () => {
  it('Dämmstoffe besser (kleineres λ) als Mauerwerk', () => {
    expect(LAMBDA_DAEMMSTOFF.mineralwolle).toBeLessThan(LAMBDA_MAUERWERK.vollziegel);
    expect(LAMBDA_DAEMMSTOFF.pur_pir).toBeLessThan(LAMBDA_DAEMMSTOFF.mineralwolle);
  });
  it('„keine" markiert keine Schicht (Infinity)', () => {
    expect(LAMBDA_DAEMMSTOFF.keine).toBe(Number.POSITIVE_INFINITY);
  });
});
