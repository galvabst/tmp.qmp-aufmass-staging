import { describe, it, expect } from 'vitest';
import { checkPlausibility, PlausibilityIssue } from './aufmass-plausibility';
import { VALID_BASELINE } from './aufmass-watertight';
import type { AufmassDraftData } from './aufmass-schema';

/**
 * Validierungs-Härtung (Workstream validierungs-haertung): zusätzliche block/soft-
 * Plausi-Regeln, damit ein Laie nichts Widersprüchliches einreichen kann.
 * Jede neue Regel hat genau einen positiven Test (feuert) + einen negativen
 * (feuert nicht, wenn plausibel) und die Garantie, dass die VALID_BASELINE
 * (0 Befunde) unangetastet bleibt.
 */

type V = Parameters<typeof checkPlausibility>[0];
const has = (issues: PlausibilityIssue[], ruleId: string) => issues.some((i) => i.ruleId === ruleId);
const sev = (issues: PlausibilityIssue[], ruleId: string) => issues.find((i) => i.ruleId === ruleId)?.severity;
const check = (v: V) => checkPlausibility(v);

describe('Härtung – VALID_BASELINE bleibt sauber', () => {
  it('VALID_BASELINE hat weiterhin 0 Plausibilitäts-Befunde (keine neue Regel feuert fälschlich)', () => {
    expect(checkPlausibility(VALID_BASELINE as Partial<AufmassDraftData>)).toEqual([]);
  });
});

describe('Härtung – Öltank-Füllstand-Konsistenz', () => {
  it('funktionierende Ölheizung mit leerem Tank (0 L) → soft', () => {
    const v: V = { heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_liter_aktuell: 0, heizung_funktionstuechtig: true };
    expect(sev(check(v), 'oeltank.aktuellLeer')).toBe('soft');
  });
  it('defekte Ölheizung mit leerem Tank (0 L) → plausibel, kein Befund', () => {
    const v: V = { heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_liter_aktuell: 0, heizung_funktionstuechtig: false };
    expect(has(check(v), 'oeltank.aktuellLeer')).toBe(false);
  });
  it('Ölheizung mit Restöl → kein Befund', () => {
    const v: V = { heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_liter_aktuell: 1200, heizung_funktionstuechtig: true };
    expect(has(check(v), 'oeltank.aktuellLeer')).toBe(false);
  });
  it('Gasheizung (nicht Öl) → Öltank-Füllstand-Regel greift nicht', () => {
    const v: V = { heizungsart: 'gas', oeltank_liter_aktuell: 0, heizung_funktionstuechtig: true };
    expect(has(check(v), 'oeltank.aktuellLeer')).toBe(false);
  });
});

describe('Härtung – Durchbrüche ↔ Leitungsweg', () => {
  it('viele Durchbrüche bei kurzer Leitung → soft', () => {
    // 8 Durchbrüche bei 2+2 = 4 m Leitung: max plausibel = ceil(4/3)+1 = 3 → feuert.
    const v: V = { anzahl_durchbrueche_kernloch: 8, distanz_ausseneinheit_kernloch: 2, distanz_kernloch_innengeraet: 2 };
    expect(sev(check(v), 'durchbrueche.zuVieleFuerLeitung')).toBe('soft');
  });
  it('Durchbrüche passend zur Leitungslänge → kein Befund', () => {
    // 3 Durchbrüche bei 5+4 = 9 m: max plausibel = ceil(9/3)+1 = 4 → 3 <= 4 → kein Befund.
    const v: V = { anzahl_durchbrueche_kernloch: 3, distanz_ausseneinheit_kernloch: 5, distanz_kernloch_innengeraet: 4 };
    expect(has(check(v), 'durchbrueche.zuVieleFuerLeitung')).toBe(false);
  });
  it('≤ 3 Durchbrüche werden nie als „zu viele für Leitung" gemeldet (kurze Wege ohne Bezug)', () => {
    const v: V = { anzahl_durchbrueche_kernloch: 3, distanz_ausseneinheit_kernloch: 0, distanz_kernloch_innengeraet: 0 };
    expect(has(check(v), 'durchbrueche.zuVieleFuerLeitung')).toBe(false);
  });
  it('ohne erfasste Distanzen → keine Leitungs-Querprüfung (kein Fehlalarm)', () => {
    const v: V = { anzahl_durchbrueche_kernloch: 9 };
    expect(has(check(v), 'durchbrueche.zuVieleFuerLeitung')).toBe(false);
  });
});
