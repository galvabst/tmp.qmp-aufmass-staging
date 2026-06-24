import { describe, it, expect } from 'vitest';
import { pruefeMesswertQuercheck, MESSWERT_TOLERANZ, MESSWERT_FELD_MAP } from './foto-messwert-check';
import type { FotoCheckErgebnis } from './ki-foto-check-client';

/**
 * Massband-/Zollstock-Wert-Quercheck (severity 'soft', beratend).
 *
 * Kernverhalten:
 *  - Wert passt (im Toleranzband)        → kein Befund.
 *  - Wert weicht über Toleranz ab        → Soft-Befund auf das getippte Feld.
 *  - Function liefert (noch) keinen Wert → KEIN Fehlalarm (forward-kompatibel).
 *  - Soll-Wert leer                      → kein Vergleich → kein Befund.
 *  - Toleranzgrenze exakt                → noch ok (≤ Toleranz).
 */

const ergebnis = (over: Partial<FotoCheckErgebnis>): FotoCheckErgebnis => ({
  geprueft: true,
  passt: true,
  confidence: 0.9,
  erkannt: 'Maßband am Dachziegel',
  begruendung: '',
  ...over,
});

describe('pruefeMesswertQuercheck', () => {
  it('Wert passt (gemessen == getippt) → kein Befund', () => {
    const r = pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 30 }), sollWert: 30 });
    expect(r).toBeNull();
  });

  it('Wert innerhalb der relativen Toleranz (30 vs. 36, ±25 % = ±7,5) → kein Befund', () => {
    const r = pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 36 }), sollWert: 30 });
    expect(r).toBeNull();
  });

  it('Wert weicht klar ab (30 getippt, 50 gemessen) → Soft-Befund auf dachneigung', () => {
    const r = pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 50 }), sollWert: 30 });
    expect(r).not.toBeNull();
    expect(r?.severity).toBe('soft');
    expect(r?.field).toBe('dachneigung');
    expect(r?.ruleId).toBe('messwert.dachneigung');
    expect(r?.message).toContain('30°');
    expect(r?.message).toContain('50°');
  });

  it('forward-kompatibel: kein messwert von der Function → kein Fehlalarm', () => {
    // Heutiger Live-Zustand (v7 liefert messwert nicht) — darf nie auslösen.
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({}), sollWert: 30 })).toBeNull();
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: null }), sollWert: 30 })).toBeNull();
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: undefined }), sollWert: 30 })).toBeNull();
  });

  it('kein Foto / nicht geprüft → kein Befund', () => {
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: null, sollWert: 30 })).toBeNull();
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: undefined, sollWert: 30 })).toBeNull();
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ geprueft: false, messwert: 50 }), sollWert: 30 })).toBeNull();
  });

  it('kein getippter Soll-Wert → kein Vergleich → kein Befund', () => {
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 50 }), sollWert: null })).toBeNull();
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 50 }), sollWert: undefined })).toBeNull();
  });

  it('Kategorie ohne numerisches Soll-Feld (z. B. Hausschuhe) → kein Befund', () => {
    expect(pruefeMesswertQuercheck('hausschuhe', { ergebnis: ergebnis({ messwert: 50 }), sollWert: 30 })).toBeNull();
    // pv_sparrenabstand ist Freitext-String → bewusst NICHT im Feld-Mapping.
    expect(pruefeMesswertQuercheck('pv_sparrenabstand', { ergebnis: ergebnis({ messwert: 50 }), sollWert: 30 })).toBeNull();
  });

  it('Toleranzgrenze: exakt auf der Grenze ist noch ok, knapp darüber löst aus', () => {
    // Soll 40 → relative Toleranz = max(5, 40*0.25=10) = 10. 50 = exakt Grenze → ok.
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 50 }), sollWert: 40 })).toBeNull();
    // 51 = knapp über der Grenze → Soft-Befund.
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 51 }), sollWert: 40 })?.severity).toBe('soft');
  });

  it('absoluter Toleranz-Floor schützt kleine Soll-Werte (Soll 4 → ±5 statt ±1)', () => {
    // Soll 4 → relative Toleranz wäre nur 1, aber Floor=5 greift. 8 (Abweichung 4) → ok.
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 8 }), sollWert: 4 })).toBeNull();
    // Abweichung 6 > Floor 5 → Soft.
    expect(pruefeMesswertQuercheck('pv_dach', { ergebnis: ergebnis({ messwert: 10 }), sollWert: 4 })?.severity).toBe('soft');
  });

  it('zweite gemappte Kategorie (pv_dachziegel → ziegel_neigung_grad) löst korrekt aus', () => {
    const r = pruefeMesswertQuercheck('pv_dachziegel', { ergebnis: ergebnis({ messwert: 70 }), sollWert: 30 });
    expect(r?.field).toBe('ziegel_neigung_grad');
    expect(r?.ruleId).toBe('messwert.ziegel_neigung_grad');
  });

  it('Konstanten exportiert & plausibel (Schutz vor versehentlicher Fehlkalibrierung)', () => {
    expect(MESSWERT_TOLERANZ.relativ).toBeGreaterThan(0);
    expect(MESSWERT_TOLERANZ.relativ).toBeLessThan(1);
    expect(MESSWERT_TOLERANZ.absolutFloor).toBeGreaterThan(0);
    expect(MESSWERT_FELD_MAP.pv_dach?.field).toBe('dachneigung');
    expect(MESSWERT_FELD_MAP.pv_dach?.einheit).toBe('°');
  });
});
