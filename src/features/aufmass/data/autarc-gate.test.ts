import { describe, it, expect } from 'vitest';
import { evaluateGate, type GateInput } from './autarc-gate';
import type { AutarcMatchResult } from './autarc-match';
import type { AutarcDiffResult } from './autarc-diff';

/**
 * Unit-Tests Status-Automat + Meldungen (Spec §8, Contract §5).
 * Prioritaetskette (erstes Match gewinnt):
 *   1 transportError -> fehler
 *   2 match.fehler   -> fehler
 *   3 match.kein_projekt -> kein_projekt
 *   4 diff !ok       -> abweichung (+ Liste)
 *   5 roomCount===0/undef -> unvollstaendig
 *   6 !(heizlast>0)  -> eingereicht
 *   7 sonst          -> freigegeben (einziger nicht-blockender Erfolg)
 * Invariante: jede Panne -> fehler & blockt; freigegeben ist der EINZIGE blockt=false.
 */

const matched: AutarcMatchResult = { status: 'matched', projectId: 'p-1', source: 'saved' };
const diffOk: AutarcDiffResult = { ok: true, abweichungen: [] };
const diffBad: AutarcDiffResult = {
  ok: false,
  abweichungen: [{ feld: 'heatedLivingAreaM2', gesendet: 140, autarc: 200, art: 'abweichung' }],
};

/** Vollstaendig gruener Gate-Input -> freigegeben. */
function happyInput(): GateInput {
  return { match: matched, diff: diffOk, roomCount: 3, buildingHeatLoadKw: 8.4 };
}

describe('evaluateGate — Prioritaet 1: transportError schlaegt alles', () => {
  it('transportError -> fehler & blockt, selbst wenn alles andere gruen waere', () => {
    const r = evaluateGate({ ...happyInput(), transportError: 'ECONNRESET' });
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
    expect(r.meldung).toBeTruthy();
  });
});

describe('evaluateGate — Prioritaet 2/3: Match-Fehler', () => {
  it('match.status=fehler -> fehler & blockt', () => {
    const match: AutarcMatchResult = { status: 'fehler', projectId: null, source: null, meldung: 'Netz' };
    const r = evaluateGate({ match });
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
  });

  it('match.status=kein_projekt -> kein_projekt & blockt mit DE-Meldung', () => {
    const match: AutarcMatchResult = {
      status: 'kein_projekt',
      projectId: null,
      source: null,
      meldung: 'Kein autarc-Projekt gefunden',
    };
    const r = evaluateGate({ match });
    expect(r.status).toBe('kein_projekt');
    expect(r.blockt).toBe(true);
    expect(r.meldung).toBeTruthy();
  });
});

describe('evaluateGate — Prioritaet 4: Diff-Abweichung', () => {
  it('diff !ok -> abweichung & blockt & Abweichungsliste durchgereicht', () => {
    const r = evaluateGate({ match: matched, diff: diffBad, roomCount: 3, buildingHeatLoadKw: 8.4 });
    expect(r.status).toBe('abweichung');
    expect(r.blockt).toBe(true);
    expect(r.abweichungen).toBeDefined();
    expect(r.abweichungen?.length).toBeGreaterThan(0);
  });

  it('Abweichung gewinnt vor unvollstaendig/eingereicht (Prioritaet)', () => {
    const r = evaluateGate({ match: matched, diff: diffBad, roomCount: 0, buildingHeatLoadKw: 0 });
    expect(r.status).toBe('abweichung');
  });
});

describe('evaluateGate — Prioritaet 5: keine Raeume', () => {
  it('roomCount=0 -> unvollstaendig & blockt, Meldung nennt Raeume', () => {
    const r = evaluateGate({ match: matched, diff: diffOk, roomCount: 0, buildingHeatLoadKw: 8.4 });
    expect(r.status).toBe('unvollstaendig');
    expect(r.blockt).toBe(true);
    expect(r.meldung).toMatch(/[Rr]äume/);
  });

  it('roomCount=undefined -> unvollstaendig (kein stiller Durchlass)', () => {
    const r = evaluateGate({ match: matched, diff: diffOk, buildingHeatLoadKw: 8.4 });
    expect(r.status).toBe('unvollstaendig');
    expect(r.blockt).toBe(true);
  });

  it.each([
    ['negativ', -1],
    ['NaN', NaN],
    ['Bruchteil', 0.5],
    ['Infinity', Infinity],
  ])('roomCount=%s -> unvollstaendig & blockt (nur endlicher Wert >=1 zaehlt)', (_label, roomCount) => {
    const r = evaluateGate({ match: matched, diff: diffOk, roomCount: roomCount as number, buildingHeatLoadKw: 8.4 });
    expect(r.status).toBe('unvollstaendig');
    expect(r.blockt).toBe(true);
  });
});

describe('evaluateGate — Prioritaet 6: Heizlast fehlt/0', () => {
  it('buildingHeatLoadKw=0 -> eingereicht & blockt', () => {
    const r = evaluateGate({ match: matched, diff: diffOk, roomCount: 3, buildingHeatLoadKw: 0 });
    expect(r.status).toBe('eingereicht');
    expect(r.blockt).toBe(true);
    expect(r.meldung).toBeTruthy();
  });

  it('buildingHeatLoadKw=null -> eingereicht & blockt', () => {
    const r = evaluateGate({ match: matched, diff: diffOk, roomCount: 3, buildingHeatLoadKw: null });
    expect(r.status).toBe('eingereicht');
    expect(r.blockt).toBe(true);
  });

  it('buildingHeatLoadKw undefined -> eingereicht & blockt', () => {
    const r = evaluateGate({ match: matched, diff: diffOk, roomCount: 3 });
    expect(r.status).toBe('eingereicht');
    expect(r.blockt).toBe(true);
  });
});

describe('evaluateGate — Prioritaet 7: freigegeben (einziger Erfolg)', () => {
  it('diff ok + rooms>0 + heizlast>0 -> freigegeben & blockt=false', () => {
    const r = evaluateGate(happyInput());
    expect(r.status).toBe('freigegeben');
    expect(r.blockt).toBe(false);
  });

  it('freigegeben ist der EINZIGE Zustand mit blockt=false', () => {
    const blockenden: GateInput[] = [
      { ...happyInput(), transportError: 'x' },
      { match: { status: 'fehler', projectId: null, source: null } },
      { match: { status: 'kein_projekt', projectId: null, source: null } },
      { match: matched, diff: diffBad, roomCount: 3, buildingHeatLoadKw: 8.4 },
      { match: matched, diff: diffOk, roomCount: 0, buildingHeatLoadKw: 8.4 },
      { match: matched, diff: diffOk, roomCount: 3, buildingHeatLoadKw: 0 },
    ];
    for (const inp of blockenden) {
      expect(evaluateGate(inp).blockt).toBe(true);
    }
    expect(evaluateGate(happyInput()).blockt).toBe(false);
  });
});

describe('evaluateGate — Invariante: jeder Nicht-freigegeben-Zustand hat konkrete DE-Meldung', () => {
  it('keine Meldung ist leer oder bloss "Fehler" ohne naechsten Schritt', () => {
    const inputs: GateInput[] = [
      { ...happyInput(), transportError: 'ECONNRESET' },
      { match: { status: 'fehler', projectId: null, source: null } },
      { match: { status: 'kein_projekt', projectId: null, source: null } },
      { match: matched, diff: diffBad, roomCount: 3, buildingHeatLoadKw: 8.4 },
      { match: matched, diff: diffOk, roomCount: 0, buildingHeatLoadKw: 8.4 },
      { match: matched, diff: diffOk, roomCount: 3, buildingHeatLoadKw: 0 },
    ];
    for (const inp of inputs) {
      const r = evaluateGate(inp);
      expect(r.meldung.trim().length).toBeGreaterThan(5);
      expect(r.meldung.trim().toLowerCase()).not.toBe('fehler');
    }
  });
});
