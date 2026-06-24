import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Prod-Pfad von pruefeFotoInhalt (echter Edge-Function-Call, NICHT der DEV-Mock).
 *
 * Audit-Finding (medium, Runde 1): liefert die Function die 3 Achsen
 * (motivOk/schaerfeOk/lesbarkeitOk), muss das Endurteil über dieselbe fail-closed
 * Verdichtung baueFotoVerdict laufen wie im Mock — NICHT blind r.passt übernehmen.
 * Ältere Function-Versionen ohne Achsen → r.passt als Fallback.
 *
 * In vitest gilt import.meta.env.DEV === true → VITE_FOTO_CHECK_REAL=1 stubben,
 * damit der echte Pfad (statt mockFotoCheck) läuft.
 */

const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));
// Bild→Base64 ist canvas-basiert (in jsdom unbrauchbar) → deterministisch mocken.
vi.mock('./foto-verarbeitung', () => ({
  bildAlsKiBase64: vi.fn(async () => ({ base64: 'AAAA', mimeType: 'image/jpeg' })),
}));

import { pruefeFotoInhalt } from './ki-foto-check-client';

const blob = new Blob(['x'], { type: 'image/jpeg' });

beforeEach(() => {
  invokeMock.mockReset();
  vi.stubEnv('VITE_FOTO_CHECK_REAL', '1');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('pruefeFotoInhalt — Prod-Pfad mit 3-Achsen-Verdichtung', () => {
  it('alle Achsen ok → passt=true (über baueFotoVerdict)', async () => {
    invokeMock.mockResolvedValue({
      data: { geprueft: true, passt: true, confidence: 0.9, erkannt: 'Treppe', begruendung: 'klar', motivOk: true, schaerfeOk: true, lesbarkeitOk: true },
      error: null,
    });
    const r = await pruefeFotoInhalt(blob, 'treppenabgang');
    expect(r?.passt).toBe(true);
    expect(r?.motivOk).toBe(true);
    expect(r?.schaerfeOk).toBe(true);
    expect(r?.lesbarkeitOk).toBe(true);
  });

  it('Lesbarkeit fällt durch → passt=false, AUCH wenn die Function passt:true meldet', async () => {
    // Beweist die fail-closed Verdichtung: r.passt allein würde fälschlich durchwinken.
    invokeMock.mockResolvedValue({
      data: { geprueft: true, passt: true, confidence: 0.8, erkannt: 'Zähler', begruendung: 'unscharf', motivOk: true, schaerfeOk: true, lesbarkeitOk: false },
      error: null,
    });
    const r = await pruefeFotoInhalt(blob, 'zaehler');
    expect(r?.passt).toBe(false);
    expect(r?.lesbarkeitOk).toBe(false);
    expect((r?.begruendung ?? '').length).toBeGreaterThan(0);
  });

  it('Motiv falsch → passt=false (Achse schlägt durch)', async () => {
    invokeMock.mockResolvedValue({
      data: { geprueft: true, passt: false, confidence: 0.7, erkannt: 'Hund', begruendung: 'falsches Motiv', motivOk: false, schaerfeOk: true, lesbarkeitOk: true },
      error: null,
    });
    const r = await pruefeFotoInhalt(blob, 'heizanlage');
    expect(r?.passt).toBe(false);
    expect(r?.motivOk).toBe(false);
  });

  it('ohne Achsen (ältere Function) → Fallback auf r.passt', async () => {
    invokeMock.mockResolvedValue({
      data: { geprueft: true, passt: true, confidence: 0.6, erkannt: 'Treppe', begruendung: 'ok' },
      error: null,
    });
    const r = await pruefeFotoInhalt(blob, 'treppenabgang');
    expect(r?.passt).toBe(true);
    // Achsen bleiben undefined, wenn die Function sie nicht liefert.
    expect(r?.motivOk).toBeUndefined();
    expect(r?.schaerfeOk).toBeUndefined();
    expect(r?.lesbarkeitOk).toBeUndefined();
  });

  it('ohne Achsen + passt:false → passt=false (Fallback respektiert Ablehnung)', async () => {
    invokeMock.mockResolvedValue({
      data: { geprueft: true, passt: false, confidence: 0.5, erkannt: '?', begruendung: 'nein' },
      error: null,
    });
    const r = await pruefeFotoInhalt(blob, 'treppenabgang');
    expect(r?.passt).toBe(false);
  });

  it('geprueft:false → null (beratend, blockt den Flow nicht hier)', async () => {
    invokeMock.mockResolvedValue({ data: { geprueft: false }, error: null });
    const r = await pruefeFotoInhalt(blob, 'treppenabgang');
    expect(r).toBeNull();
  });

  it('Function-Fehler → null', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const r = await pruefeFotoInhalt(blob, 'treppenabgang');
    expect(r).toBeNull();
  });
});
