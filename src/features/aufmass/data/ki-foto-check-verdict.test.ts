import { describe, it, expect } from 'vitest';
import {
  baueFotoVerdict,
  mockFotoCheck,
  type FotoRohUrteil,
} from './ki-foto-check-client';
import { leiteFotoStatus } from './foto-pruef-status';
import { stelleFotoInhaltSicher } from './foto-inhalt-pruefung';
import { bewerteFotoInhalt, hatFotoInhaltBlocker } from './foto-inhalt-gate';
import type { FotoPraesenzContext } from './foto-praesenz';
import type { FotoStatusEintrag, FotoInhaltStatus } from '../state/foto-pruefung-store';
import type { VotBild } from '../hooks/useVotBilder';
import type { VotBildKategorie } from './bild-kategorien';

/**
 * Erweiterte Foto-Validierung: jedes Pflichtfoto wird auf MOTIV + SCHÄRFE +
 * LESBARKEIT geprüft. Diese Suite sichert die reine Zusammenfassung
 * (`baueFotoVerdict`), den deterministischen DEV-Mock (`mockFotoCheck`) und die
 * Ende-zu-Ende-Wirkung über die echte Status-Pipeline ins fail-closed Gate.
 */

// ── Roh-Urteil-Fabrik (alles ok = bestanden) ──────────────────────────────
const rohOk = (over: Partial<FotoRohUrteil> = {}): FotoRohUrteil => ({
  motivOk: true,
  schaerfeOk: true,
  lesbarkeitOk: true,
  confidence: 0.9,
  erkannt: 'Treppe',
  ...over,
});

describe('baueFotoVerdict — fail-closed über 3 Achsen', () => {
  it('alle drei Achsen ok → passt=true mit positiver Begründung', () => {
    const v = baueFotoVerdict(rohOk());
    expect(v.passt).toBe(true);
    expect(v.begruendung.length).toBeGreaterThan(0);
  });

  it('reicht den konkreten KI-Grund durch, wenn bestanden und Grund vorhanden', () => {
    const v = baueFotoVerdict(rohOk({ grund: 'Treppe klar erkennbar' }));
    expect(v.passt).toBe(true);
    expect(v.begruendung).toBe('Treppe klar erkennbar');
  });

  it('falsches Motiv → passt=false mit Motiv-Grund', () => {
    const v = baueFotoVerdict(rohOk({ motivOk: false }));
    expect(v.passt).toBe(false);
    expect(v.begruendung).toMatch(/Falsches Motiv/i);
  });

  it('unscharf → passt=false mit Schärfe-Grund', () => {
    const v = baueFotoVerdict(rohOk({ schaerfeOk: false }));
    expect(v.passt).toBe(false);
    expect(v.begruendung).toMatch(/unscharf|verwackelt/i);
  });

  it('Gefordertes nicht lesbar → passt=false mit Lesbarkeits-Grund', () => {
    const v = baueFotoVerdict(rohOk({ lesbarkeitOk: false }));
    expect(v.passt).toBe(false);
    expect(v.begruendung).toMatch(/lesbar/i);
  });

  it('mehrere Achsen durchgefallen → alle Gründe in der Begründung (Motiv zuerst)', () => {
    const v = baueFotoVerdict(rohOk({ motivOk: false, schaerfeOk: false, lesbarkeitOk: false }));
    expect(v.passt).toBe(false);
    expect(v.begruendung).toMatch(/Falsches Motiv.*unscharf.*lesbar/is);
  });

  it('bei Fehlschlag wird der konkrete KI-Grund VORANGESTELLT', () => {
    const v = baueFotoVerdict(rohOk({ schaerfeOk: false, grund: 'Typenschild verschwommen' }));
    expect(v.passt).toBe(false);
    expect(v.begruendung).toMatch(/^Typenschild verschwommen/);
    expect(v.begruendung).toMatch(/unscharf|verwackelt/i);
  });

  it('Begründung ist immer ein nicht-leerer Klartext-String (wird gespeichert)', () => {
    for (const over of [{}, { motivOk: false }, { schaerfeOk: false }, { lesbarkeitOk: false }] as Partial<FotoRohUrteil>[]) {
      const v = baueFotoVerdict(rohOk(over));
      expect(typeof v.begruendung).toBe('string');
      expect(v.begruendung.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('mockFotoCheck — deterministisch & sichtbar geprüft', () => {
  it('liefert ein geprüftes, bestehendes Ergebnis (kein Blind-Bypass-Marker)', () => {
    const r = mockFotoCheck('treppenabgang');
    expect(r.geprueft).toBe(true);
    expect(r.passt).toBe(true);
    expect(r.motivOk).toBe(true);
    expect(r.schaerfeOk).toBe(true);
    expect(r.lesbarkeitOk).toBe(true);
    expect(r.erkannt).not.toBe('DEV-Bypass'); // alter Marker ist weg
  });

  it('ist deterministisch (zwei Aufrufe → identisch)', () => {
    expect(mockFotoCheck('zaehler')).toEqual(mockFotoCheck('zaehler'));
  });

  it('Lesbarkeits-Kategorie (zaehler) nennt Typenschild/Skala/Text in der Begründung', () => {
    expect(mockFotoCheck('zaehler').begruendung).toMatch(/Typenschild|Skala|Text/i);
  });

  it('das Mock-Ergebnis ergibt über leiteFotoStatus den sichtbaren Status "ok"', () => {
    expect(leiteFotoStatus(false, mockFotoCheck('heizungsraum'))).toBe('ok');
  });
});

// ── Ende-zu-Ende: Mock/echte Urteile → Store → fail-closed Gate ────────────
let seq = 0;
function bild(kategorie: VotBildKategorie, id?: string): VotBild {
  seq += 1;
  return {
    id: id ?? `b${seq}`, vot_formular_id: 'f1', kategorie,
    storage_path: `path/${id ?? seq}.jpg`, dateiname: `${id ?? seq}.jpg`,
    beschreibung: null, reihenfolge: seq, created_at: '2026-06-24T00:00:00.000Z',
  };
}

const BASIS_CTX: FotoPraesenzContext = {
  istPvAufmass: false, istOel: false, mehrBilderHeizungsraum: false, hatErdung: false,
  alternative1Vorhanden: false, alternative2Vorhanden: false, hatUnbegehbareRaeume: false,
  hatPvAnlage: false, pvHindernisseVorhanden: false, pvOeffentlicheFlaeche: false, pvBlitzschutzVorhanden: false,
};

function harness() {
  const store = new Map<string, FotoStatusEintrag>();
  return {
    store,
    getStatus: (id: string) => store.get(id)?.status,
    setStatus: (id: string, e: FotoStatusEintrag | null) => { if (e) store.set(id, e); else store.delete(id); },
    statusOf: (id: string): FotoInhaltStatus | undefined => store.get(id)?.status,
  };
}

describe('E2E: erweiterte Validierung → Store → Gate', () => {
  it('korrektes Foto (Mock passt) → Status ok, Gate lässt durch', async () => {
    const h = harness();
    const b = bild('treppenabgang', 'OK1');
    await stelleFotoInhaltSicher([b], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']),
      pruefe: async (_blob, kat) => mockFotoCheck(kat),
    });
    expect(h.store.get('OK1')?.status).toBe('ok');
    const gate = bewerteFotoInhalt([b], BASIS_CTX, h.statusOf);
    expect(hatFotoInhaltBlocker(gate)).toBe(false);
  });

  it('falsches Motiv → Status passt_nicht + gespeicherter Grund, Gate blockt', async () => {
    const h = harness();
    const b = bild('treppenabgang', 'BAD1');
    await stelleFotoInhaltSicher([b], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']),
      pruefe: async () => {
        const v = baueFotoVerdict(rohOk({ motivOk: false, erkannt: 'Füße' }));
        return { geprueft: true, passt: v.passt, confidence: 0.9, erkannt: 'Füße', begruendung: v.begruendung };
      },
    });
    expect(h.store.get('BAD1')?.status).toBe('passt_nicht');
    expect(h.store.get('BAD1')?.begruendung).toMatch(/Falsches Motiv/i);
    const gate = bewerteFotoInhalt([b], BASIS_CTX, h.statusOf);
    expect(gate.falsch.map((f) => f.bildId)).toEqual(['BAD1']);
    expect(hatFotoInhaltBlocker(gate)).toBe(true);
  });

  it('unscharfes Foto → Status passt_nicht mit Schärfe-Grund, Gate blockt', async () => {
    const h = harness();
    const b = bild('zaehler', 'BLUR1');
    await stelleFotoInhaltSicher([b], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']),
      pruefe: async () => {
        const v = baueFotoVerdict(rohOk({ schaerfeOk: false }));
        return { geprueft: true, passt: v.passt, confidence: 0.5, erkannt: 'Zähler unscharf', begruendung: v.begruendung };
      },
    });
    expect(h.store.get('BLUR1')?.status).toBe('passt_nicht');
    expect(h.store.get('BLUR1')?.begruendung).toMatch(/unscharf|verwackelt/i);
    expect(hatFotoInhaltBlocker(bewerteFotoInhalt([b], BASIS_CTX, h.statusOf))).toBe(true);
  });

  it('unlesbares Typenschild → Status passt_nicht mit Lesbarkeits-Grund, Gate blockt', async () => {
    const h = harness();
    const b = bild('zaehler', 'UNRD1');
    await stelleFotoInhaltSicher([b], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']),
      pruefe: async () => {
        const v = baueFotoVerdict(rohOk({ lesbarkeitOk: false }));
        return { geprueft: true, passt: v.passt, confidence: 0.6, erkannt: 'Zähler', begruendung: v.begruendung };
      },
    });
    expect(h.store.get('UNRD1')?.status).toBe('passt_nicht');
    expect(h.store.get('UNRD1')?.begruendung).toMatch(/lesbar/i);
    expect(hatFotoInhaltBlocker(bewerteFotoInhalt([b], BASIS_CTX, h.statusOf))).toBe(true);
  });
});
