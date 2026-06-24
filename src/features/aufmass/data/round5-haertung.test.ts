import { describe, it, expect } from 'vitest';
import { checkPlausibility, hasBlockingPlausibility } from './aufmass-plausibility';
import { checkPvPlausibility } from './aufmass-pv-plausibility';
import { VALID_BASELINE } from './aufmass-watertight';

/** Regressionen aus Runde 5 (Bestätigungsrunde). */

const has = (issues: { ruleId: string }[], id: string) => issues.some((i) => i.ruleId === id);
const wp = (over: Record<string, unknown>) => checkPlausibility({ ...VALID_BASELINE, ...over });

describe('Härtung R5 — FBH-Vorlauf hart geblockt über ~55 °C', () => {
  it('FBH + 60 °C Vorlauf → block (vorlauf.fbhUnmoeglich)', () => {
    const issues = wp({ heizkoerper_typ: 'fussbodenheizung', vorlauftemperatur: 60, ruecklauftemperatur: 40 });
    expect(has(issues, 'vorlauf.fbhUnmoeglich')).toBe(true);
    expect(hasBlockingPlausibility(issues)).toBe(true);
  });
  it('FBH + 56 °C Vorlauf → block', () => {
    expect(has(wp({ heizkoerper_typ: 'fussbodenheizung', vorlauftemperatur: 56, ruecklauftemperatur: 40 }), 'vorlauf.fbhUnmoeglich')).toBe(true);
  });
  it('FBH + 50 °C Vorlauf → KEIN Hard-Block (nur soft-Hinweis)', () => {
    const issues = wp({ heizkoerper_typ: 'fussbodenheizung', vorlauftemperatur: 50, ruecklauftemperatur: 40 });
    expect(has(issues, 'vorlauf.fbhUnmoeglich')).toBe(false);
  });
});

describe('Härtung R5 — Flachdach-Erkennung per Wort-Grenze (kein Substring-Fehltreffer)', () => {
  it('"Flachdachgaube auf Satteldach" (30°) ist KEIN Flachdach → Aufdachdämmung NICHT als Flachdach-Konflikt', () => {
    const issues = checkPvPlausibility({ dachform: 'Flachdachgaube auf Satteldach', dachneigung: 30, aufdachdaemmung: true, aufdachdaemmung_dicke: 12 });
    expect(has(issues, 'pv.aufdach.flachdach')).toBe(false);
  });
  it('echtes "Flachdach" (0°) + Aufdachdämmung → Flachdach-Konflikt soft', () => {
    const issues = checkPvPlausibility({ dachform: 'Flachdach', dachneigung: 0, aufdachdaemmung: true, aufdachdaemmung_dicke: 12 });
    expect(has(issues, 'pv.aufdach.flachdach')).toBe(true);
  });
  it('dachneigung 0 ohne Dachform-String gilt weiterhin als Flachdach', () => {
    const issues = checkPvPlausibility({ dachneigung: 0, aufdachdaemmung: true, aufdachdaemmung_dicke: 12 });
    expect(has(issues, 'pv.aufdach.flachdach')).toBe(true);
  });
});
