import { describe, it, expect } from 'vitest';
import { checkPlausibility, hasBlockingPlausibility } from './aufmass-plausibility';
import { VALID_BASELINE } from './aufmass-watertight';

/** Regressionen aus Runde 6: FBH-Spreizung-FP + bewusstes 'beides'-Scoping des FBH-Hard-Blocks. */

const has = (issues: { ruleId: string }[], id: string) => issues.some((i) => i.ruleId === id);
const wp = (over: Record<string, unknown>) => checkPlausibility({ ...VALID_BASELINE, ...over });

describe('Härtung R6 — kleine Spreizung bei FBH ist KEIN Befund (realer Normalfall, kein Fehlalarm)', () => {
  it('FBH VL32/RL30 (2 K) → kein spreizung.klein', () => {
    expect(has(wp({ heizkoerper_typ: 'fussbodenheizung', vorlauftemperatur: 32, ruecklauftemperatur: 30 }), 'spreizung.klein')).toBe(false);
  });
  it('„beides" VL35/RL33 (2 K) → kein spreizung.klein', () => {
    expect(has(wp({ heizkoerper_typ: 'beides', vorlauftemperatur: 35, ruecklauftemperatur: 33 }), 'spreizung.klein')).toBe(false);
  });
  it('reine Heizkörper VL50/RL48 (2 K) → spreizung.klein bleibt soft (dort verdächtig)', () => {
    expect(has(wp({ heizkoerper_typ: 'heizkoerper', vorlauftemperatur: 50, ruecklauftemperatur: 48 }), 'spreizung.klein')).toBe(true);
  });
});

describe('Härtung R6 — FBH-Hard-Block scoped auf REINE Fußbodenheizung (kein Fehlalarm bei „beides")', () => {
  it('„beides" + 60 °C → soft (vorlauf.fbh), aber KEIN Hard-Block (Mischer-Setup möglich)', () => {
    const issues = wp({ heizkoerper_typ: 'beides', vorlauftemperatur: 60, ruecklauftemperatur: 45 });
    expect(has(issues, 'vorlauf.fbhUnmoeglich')).toBe(false);
    expect(has(issues, 'vorlauf.fbh')).toBe(true);
  });
  it('reine FBH + 60 °C → Hard-Block', () => {
    expect(hasBlockingPlausibility(wp({ heizkoerper_typ: 'fussbodenheizung', vorlauftemperatur: 60, ruecklauftemperatur: 45 }))).toBe(true);
  });
});
