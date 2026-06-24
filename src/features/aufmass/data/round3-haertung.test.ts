import { describe, it, expect } from 'vitest';
import { aufmassSubmitSchema } from './aufmass-schema';
import { checkPlausibility } from './aufmass-plausibility';
import { checkPvPlausibility } from './aufmass-pv-plausibility';
import { VALID_BASELINE } from './aufmass-watertight';

/** Regressionen aus Runde 3 (Konvergenz): AI-Cap-Ausnahme + Locking bestehender,
 *  zuvor untesteter Plausibilitäts-/Schema-Regeln. */

const sub = (over: Record<string, unknown>) => aufmassSubmitSchema.safeParse({ ...VALID_BASELINE, ...over });
const has = (issues: { ruleId: string }[], id: string) => issues.some((i) => i.ruleId === id);
const wp = (over: Record<string, unknown>) => checkPlausibility({ ...VALID_BASELINE, ...over });

describe('Härtung R3 — AI-Felder nicht vom 2000er-Cap abgeschnitten', () => {
  it('aufstellort_ai_zusammenfassung mit 5000 Zeichen bleibt gültig', () => {
    expect(sub({ aufstellort_ai_zusammenfassung: 'a'.repeat(5000) }).success).toBe(true);
  });
  it('Nutzer-Freitext bemerkungen mit 5000 Zeichen bleibt abgelehnt (User-Cap 2000)', () => {
    expect(sub({ bemerkungen: 'a'.repeat(5000) }).success).toBe(false);
  });
});

describe('Härtung R3 — leeres PV-Plausi erzeugt KEINE Befunde (Presence-Gate liegt in der UI)', () => {
  it('checkPvPlausibility({}) ist leer — daher erzwingt das Submit-Gate die Kern-PV-Felder', () => {
    expect(checkPvPlausibility({})).toEqual([]);
  });
});

describe('Härtung R3 — bestehende Querfeld-Regeln gelockt', () => {
  it('2. Alternative ohne 1. Alternative → alternative.reihenfolge soft', () => {
    expect(has(wp({ alternative_1_vorhanden: false, alternative_2_vorhanden: true }), 'alternative.reihenfolge')).toBe(true);
  });
  it('Distanz alt/neu gesetzt, aber keine Aufstellort-Änderung → aufstellort.distOhneAenderung soft', () => {
    expect(has(wp({ aufstellort_aenderung: false, distanz_alter_neuer_aufstellort: 5 }), 'aufstellort.distOhneAenderung')).toBe(true);
  });
  it('Anschluss „nicht vorhanden" aber Distanz > 0 → Widerspruch soft', () => {
    expect(has(wp({ anschluss_vorlauf_vorhanden: false, anschluss_vorlauf_distanz: 5 }), 'anschluss.vorlauf.widerspruch')).toBe(true);
  });
  it('Vor-/Rücklauf-Paar inkonsistent (nur einer vorhanden) → anschluss.vlRlPaar soft', () => {
    expect(has(wp({ anschluss_vorlauf_vorhanden: true, anschluss_ruecklauf_vorhanden: false }), 'anschluss.vlRlPaar')).toBe(true);
  });
});

describe('Härtung R3 — heizungsraum_verlegen erzwingt Anschluss-Distanzen (Schema)', () => {
  it('verlegen=true ohne Anschluss-Felder → Schema lehnt ab', () => {
    const r = sub({ heizungsraum_verlegen: true });
    expect(r.success).toBe(false);
  });
});
