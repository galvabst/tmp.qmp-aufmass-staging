import { describe, it, expect, vi } from 'vitest';
import { stelleFotoInhaltSicher } from './foto-inhalt-pruefung';
import type { FotoPraesenzContext } from './foto-praesenz';
import type { FotoStatusEintrag, FotoInhaltStatus } from '../state/foto-pruefung-store';
import type { FotoCheckErgebnis } from './ki-foto-check-client';
import type { VotBild } from '../hooks/useVotBilder';
import type { VotBildKategorie } from './bild-kategorien';

let seq = 0;
function bild(kategorie: VotBildKategorie, id?: string): VotBild {
  seq += 1;
  return {
    id: id ?? `b${seq}`, vot_formular_id: 'f1', kategorie,
    storage_path: `path/${id ?? seq}.jpg`, dateiname: `${id ?? seq}.jpg`,
    beschreibung: null, reihenfolge: seq, created_at: '2026-06-21T00:00:00.000Z',
  };
}

const BASIS_CTX: FotoPraesenzContext = {
  istPvAufmass: false, istOel: false, mehrBilderHeizungsraum: false, hatErdung: false,
  alternative1Vorhanden: false, alternative2Vorhanden: false, hatUnbegehbareRaeume: false,
  hatPvAnlage: false, pvHindernisseVorhanden: false, pvOeffentlicheFlaeche: false, pvBlitzschutzVorhanden: false,
};

/** Test-Harness: In-Memory-Store + zählbare Deps. */
function harness(initial: Record<string, FotoInhaltStatus> = {}) {
  const store = new Map<string, FotoStatusEintrag>();
  for (const [id, status] of Object.entries(initial)) store.set(id, { status, kategorieLabel: 'X' });
  return {
    store,
    getStatus: (id: string) => store.get(id)?.status,
    setStatus: (id: string, e: FotoStatusEintrag | null) => { if (e) store.set(id, e); else store.delete(id); },
  };
}

const ok: FotoCheckErgebnis = { geprueft: true, passt: true, confidence: 0.9, erkannt: 'Treppe', begruendung: 'passt' };
const nichtOk: FotoCheckErgebnis = { geprueft: true, passt: false, confidence: 0.9, erkannt: 'Füße', begruendung: 'zeigt Füße' };

describe('stelleFotoInhaltSicher', () => {
  it('prüft nichts, wenn alle Pflichtfotos bereits ok sind', async () => {
    const h = harness({ T1: 'ok' });
    const pruefe = vi.fn(async () => ok);
    const ladeBlob = vi.fn(async () => new Blob(['x']));
    const n = await stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, { ...h, ladeBlob, pruefe });
    expect(n).toBe(0);
    expect(pruefe).not.toHaveBeenCalled();
    expect(ladeBlob).not.toHaveBeenCalled();
  });

  it('prüft ein nie-geprüftes Pflichtfoto nach → Status ok', async () => {
    const h = harness();
    const pruefe = vi.fn(async () => ok);
    const ladeBlob = vi.fn(async () => new Blob(['x']));
    const n = await stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, { ...h, ladeBlob, pruefe });
    expect(n).toBe(1);
    expect(pruefe).toHaveBeenCalledTimes(1);
    expect(h.store.get('T1')?.status).toBe('ok');
  });

  it('falsches Motiv → Status passt_nicht', async () => {
    const h = harness();
    const n = await stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']), pruefe: async () => nichtOk,
    });
    expect(n).toBe(1);
    expect(h.store.get('T1')?.status).toBe('passt_nicht');
    expect(h.store.get('T1')?.begruendung).toBe('zeigt Füße');
  });

  it('KI nicht erreichbar (pruefe → null) → Status ungeprueft (fail-closed später)', async () => {
    const h = harness();
    const n = await stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']), pruefe: async () => null,
    });
    expect(n).toBe(1);
    expect(h.store.get('T1')?.status).toBe('ungeprueft');
  });

  it('Bild nicht ladbar (ladeBlob → null) → Status ungeprueft, KEINE KI-Anfrage', async () => {
    const h = harness();
    const pruefe = vi.fn(async () => ok);
    const n = await stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, {
      ...h, ladeBlob: async () => null, pruefe,
    });
    expect(n).toBe(1);
    expect(pruefe).not.toHaveBeenCalled();
    expect(h.store.get('T1')?.status).toBe('ungeprueft');
  });

  it("'passt_nicht' wird NICHT erneut geprüft (definitives Falsch-Motiv)", async () => {
    const h = harness({ T1: 'passt_nicht' });
    const pruefe = vi.fn(async () => ok);
    const n = await stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']), pruefe,
    });
    expect(n).toBe(0);
    expect(pruefe).not.toHaveBeenCalled();
    expect(h.store.get('T1')?.status).toBe('passt_nicht');
  });

  it("'ungeprueft' WIRD erneut geprüft (Retry am Submit)", async () => {
    const h = harness({ T1: 'ungeprueft' });
    const pruefe = vi.fn(async () => ok);
    const n = await stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']), pruefe,
    });
    expect(n).toBe(1);
    expect(pruefe).toHaveBeenCalledTimes(1);
    expect(h.store.get('T1')?.status).toBe('ok');
  });

  it('Fotos nicht-sichtbarer Kategorien werden nicht geprüft', async () => {
    const h = harness();
    const pruefe = vi.fn(async () => ok);
    // Öltank ohne istOel → unsichtbar
    const n = await stelleFotoInhaltSicher([bild('oeltank', 'O1')], BASIS_CTX, {
      ...h, ladeBlob: async () => new Blob(['x']), pruefe,
    });
    expect(n).toBe(0);
    expect(pruefe).not.toHaveBeenCalled();
  });

  it('wirft ladeBlob → KEIN throw, Foto wird ungeprueft (fail-closed, blockt am Gate)', async () => {
    const h = harness();
    await expect(
      stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, {
        ...h, ladeBlob: async () => { throw new Error('Netzfehler'); }, pruefe: async () => ok,
      }),
    ).resolves.toBe(1);
    expect(h.store.get('T1')?.status).toBe('ungeprueft');
  });

  it('wirft pruefe → KEIN throw, Foto wird ungeprueft', async () => {
    const h = harness();
    await expect(
      stelleFotoInhaltSicher([bild('treppenabgang', 'T1')], BASIS_CTX, {
        ...h, ladeBlob: async () => new Blob(['x']), pruefe: async () => { throw new Error('KI down'); },
      }),
    ).resolves.toBe(1);
    expect(h.store.get('T1')?.status).toBe('ungeprueft');
  });

  it('nicht-endliches parallel (NaN/0/negativ) → seriell, ALLE Fotos werden trotzdem geprüft (kein stiller Skip)', async () => {
    for (const parallel of [NaN, 0, -3, Infinity] as number[]) {
      const h = harness();
      const pruefe = vi.fn(async () => ok);
      const fotos = [bild('treppenabgang', 'A1'), bild('treppenabgang', 'A2')];
      const n = await stelleFotoInhaltSicher(fotos, BASIS_CTX, {
        ...h, parallel, ladeBlob: async () => new Blob(['x']), pruefe,
      });
      expect(n).toBe(2);
      expect(pruefe).toHaveBeenCalledTimes(2);          // nichts übersprungen
      expect(h.store.get('A1')?.status).toBe('ok');
      expect(h.store.get('A2')?.status).toBe('ok');
    }
  });

  it('ein geworfenes Foto bricht NICHT die Prüfung der übrigen ab', async () => {
    const h = harness();
    let call = 0;
    const fotos = [bild('treppenabgang', 'T1'), bild('treppenabgang', 'T2')];
    const n = await stelleFotoInhaltSicher(fotos, BASIS_CTX, {
      ...h,
      parallel: 1, // deterministische Reihenfolge
      ladeBlob: async () => new Blob(['x']),
      pruefe: async () => { call += 1; if (call === 1) throw new Error('boom'); return ok; },
    });
    expect(n).toBe(2);
    expect(h.store.get('T1')?.status).toBe('ungeprueft'); // geworfen → ungeprueft
    expect(h.store.get('T2')?.status).toBe('ok');          // zweites lief normal weiter
  });
});
