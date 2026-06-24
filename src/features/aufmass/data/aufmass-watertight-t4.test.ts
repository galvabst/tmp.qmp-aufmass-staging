import { describe, it, expect } from 'vitest';
import { T4_CASES, type T4Case } from './aufmass-watertight-t4-cases';
import { runT4Case, judgedCorrectly, findT4Holes } from './aufmass-watertight-t4';

/**
 * Wasserdicht-Regressionstest T4: jeder (nicht übersprungene) Fall MUSS vom
 * echten `autarcVerifyCore` mit dem genau erwarteten Status & Block-Verhalten
 * (und ggf. konkretem Meldungs-Substring) beurteilt werden.
 *
 * Schlägt ein Fall fehl, ist ein „Loch" zurück → muss im Gate-Code gestopft
 * (oder als Übereifer mit Begründung übersprungen) werden.
 */
describe('Wasserdicht-Loop T4 — autarc-Gate urteilt jeden Fall korrekt', () => {
  const active = T4_CASES.filter((c) => !c.skip);

  for (const c of active) {
    it(`[${c.flaeche}] ${c.id} ${c.label} → ${c.expect.status}`, async () => {
      const r = await runT4Case(c);
      expect(
        r.status,
        `Falscher Status (${c.id}): erwartet ${c.expect.status}, bekam ${r.status} | meldung="${r.meldung}"`,
      ).toBe(c.expect.status);
      expect(
        r.blockt,
        `Falsches Block-Verhalten (${c.id}): erwartet ${c.expect.blockt}, bekam ${r.blockt}`,
      ).toBe(c.expect.blockt);
      if (c.expect.meldungEnthaelt) {
        expect(
          r.meldung,
          `Meldung (${c.id}) enthält nicht "${c.expect.meldungEnthaelt}": "${r.meldung}"`,
        ).toContain(c.expect.meldungEnthaelt);
      }
    });
  }
});

describe('Wasserdicht-Loop T4 — Invariante „kein Fehler je als Erfolg"', () => {
  it('jede Panne (HTTP/JSON/Timeout/Netz) endet in fehler & blockt', async () => {
    const pannen = T4_CASES.filter((c) => !c.skip && c.flaeche === 'panne');
    expect(pannen.length).toBeGreaterThan(0);
    for (const c of pannen) {
      const r = await runT4Case(c);
      expect(r.status, `Panne ${c.id} muss fehler sein`).toBe('fehler');
      expect(r.blockt, `Panne ${c.id} muss blocken`).toBe(true);
    }
  });

  it('freigegeben ist der EINZIGE Zustand mit blockt=false', async () => {
    for (const c of T4_CASES.filter((x) => !x.skip)) {
      const r = await runT4Case(c);
      if (r.blockt === false) {
        expect(r.status, `${c.id} darf nur mit freigegeben nicht-blocken`).toBe('freigegeben');
      }
    }
  });

  it('jeder Nicht-freigegeben-Zustand liefert eine konkrete, nicht-leere DE-Meldung', async () => {
    for (const c of T4_CASES.filter((x) => !x.skip)) {
      const r = await runT4Case(c);
      if (r.status !== 'freigegeben') {
        expect(r.meldung.trim().length, `${c.id} braucht eine Meldung`).toBeGreaterThan(5);
        expect(r.meldung.trim().toLowerCase()).not.toBe('fehler');
      }
    }
  });
});

describe('Wasserdicht-Loop T4 — Harness-Selbsttest', () => {
  it('findT4Holes findet bei korrekter Engine KEIN Loch (dry)', async () => {
    const holes = await findT4Holes(T4_CASES);
    expect(
      holes.map((c: T4Case) => c.id),
      `Offene Löcher: ${holes.map((c) => c.id).join(', ')}`,
    ).toEqual([]);
  });

  it('judgedCorrectly stimmt für den Happy-Path', async () => {
    const happy = T4_CASES.find((c) => c.id === 't4.happy.freigegeben')!;
    expect(await judgedCorrectly(happy)).toBe(true);
  });
});
