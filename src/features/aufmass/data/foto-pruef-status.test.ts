import { describe, it, expect } from 'vitest';
import { leiteFotoStatus, FOTO_UNGEPRUEFT } from './foto-pruef-status';
import type { FotoCheckErgebnis } from './ki-foto-check-client';

/**
 * Kern des Bugfixes: Bei KI-Ausfall (pruefeFotoInhalt → null) MUSS das Foto
 * sichtbar als 'ungeprueft' enden — NICHT still wie ein geprüftes/ok-Foto.
 * Diese Suite sichert die reine Status-Ableitung ab (UI-frei, deterministisch).
 */

const ergebnis = (over: Partial<FotoCheckErgebnis>): FotoCheckErgebnis => ({
  geprueft: true,
  passt: true,
  confidence: 0.9,
  erkannt: 'x',
  begruendung: '',
  ...over,
});

describe('leiteFotoStatus', () => {
  it('läuft → "laeuft" (Spinner-Zustand schlägt alles andere)', () => {
    expect(leiteFotoStatus(true, undefined)).toBe('laeuft');
    expect(leiteFotoStatus(true, ergebnis({ passt: false }))).toBe('laeuft');
  });

  it('null (KI nicht erreichbar) → "ungeprueft"', () => {
    expect(leiteFotoStatus(false, null)).toBe('ungeprueft');
  });

  it('undefined (noch kein Eintrag) → "ungeprueft"', () => {
    expect(leiteFotoStatus(false, undefined)).toBe('ungeprueft');
  });

  it('geprueft:false (Function liefert ungeprüft) → "ungeprueft"', () => {
    expect(leiteFotoStatus(false, ergebnis({ geprueft: false }))).toBe('ungeprueft');
  });

  it('geprueft + passt → "ok"', () => {
    expect(leiteFotoStatus(false, ergebnis({ passt: true }))).toBe('ok');
  });

  it('geprueft + passt=false → "passt_nicht"', () => {
    expect(leiteFotoStatus(false, ergebnis({ passt: false }))).toBe('passt_nicht');
  });

  it('FOTO_UNGEPRUEFT-Sentinel ergibt "ungeprueft" (nicht "ok")', () => {
    // Regression: der KI-Ausfall-Platzhalter darf NIE als geprüftes Foto durchgehen.
    expect(leiteFotoStatus(false, FOTO_UNGEPRUEFT)).toBe('ungeprueft');
  });
});
