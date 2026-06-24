import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setFotoVerdict,
  setFotoStatus,
  getFotoStatus,
  getBlockierendeFotos,
  getBlockierendeAnzahl,
  getFotoPruefVersion,
  resetFotoPruefung,
  subscribeFotoPruefung,
} from './foto-pruefung-store';

/**
 * Der Store ist die alleinige Quelle des harten KI-Foto-Blocks in handleSubmit
 * (getBlockierendeFotos().length > 0 → Submit gesperrt). Audit-Finding (high):
 * 0 Tests. Diese Suite sichert die Submit-relevanten Invarianten ab.
 */

beforeEach(() => {
  resetFotoPruefung();
});

describe('foto-pruefung-store — Block-Invarianten', () => {
  it('leerer Store → keine Blocker (fail-open: Foto ohne Verdict blockt nicht)', () => {
    expect(getBlockierendeFotos()).toEqual([]);
    expect(getBlockierendeAnzahl()).toBe(0);
  });

  it('passt=false → genau 1 Blocker', () => {
    setFotoVerdict('a', { passt: false, kategorieLabel: 'Galvanek-Hausschuhe', abzugEuro: 10 });
    expect(getBlockierendeAnzahl()).toBe(1);
    expect(getBlockierendeFotos()[0].kategorieLabel).toBe('Galvanek-Hausschuhe');
  });

  it('passt=true → kein Blocker', () => {
    setFotoVerdict('a', { passt: true, kategorieLabel: 'Heizanlage' });
    expect(getBlockierendeFotos()).toEqual([]);
  });

  it('passt=true überschreibt vorheriges passt=false → 0 Blocker', () => {
    setFotoVerdict('a', { passt: false, kategorieLabel: 'X', abzugEuro: 10 });
    expect(getBlockierendeAnzahl()).toBe(1);
    setFotoVerdict('a', { passt: true, kategorieLabel: 'X' });
    expect(getBlockierendeAnzahl()).toBe(0);
  });

  it('setFotoVerdict(id, null) entfernt das Verdict → Block aufgehoben (Löschen/Ersatz)', () => {
    setFotoVerdict('a', { passt: false, kategorieLabel: 'X', abzugEuro: 10 });
    expect(getBlockierendeAnzahl()).toBe(1);
    setFotoVerdict('a', null);
    expect(getBlockierendeAnzahl()).toBe(0);
  });

  it('zwei false-Verdicts → Summe abzugEuro korrekt', () => {
    setFotoVerdict('a', { passt: false, kategorieLabel: 'A', abzugEuro: 10 });
    setFotoVerdict('b', { passt: false, kategorieLabel: 'B', abzugEuro: 5 });
    const summe = getBlockierendeFotos().reduce((s, f) => s + (f.abzugEuro ?? 0), 0);
    expect(getBlockierendeAnzahl()).toBe(2);
    expect(summe).toBe(15);
  });

  it('resetFotoPruefung() leert alles (kein Cross-Auftrag-Leak)', () => {
    setFotoVerdict('a', { passt: false, kategorieLabel: 'A', abzugEuro: 10 });
    setFotoVerdict('b', { passt: false, kategorieLabel: 'B' });
    expect(getBlockierendeAnzahl()).toBe(2);
    resetFotoPruefung();
    expect(getBlockierendeFotos()).toEqual([]);
  });
});

describe('foto-pruefung-store — Status-API (fail-closed)', () => {
  it('setFotoStatus/getFotoStatus speichert + liest den Status', () => {
    setFotoStatus('a', { status: 'ok', kategorieLabel: 'Treppenabgang' });
    expect(getFotoStatus('a')?.status).toBe('ok');
    expect(getFotoStatus('unbekannt')).toBeUndefined();
  });

  it("'ungeprueft' ist KEIN getBlockierendeFotos-Blocker (Block läuft übers Gate, nicht über passt_nicht)", () => {
    setFotoStatus('a', { status: 'ungeprueft', kategorieLabel: 'Treppenabgang' });
    expect(getBlockierendeAnzahl()).toBe(0);
    expect(getFotoStatus('a')?.status).toBe('ungeprueft');
  });

  it("'passt_nicht' ist ein getBlockierendeFotos-Blocker", () => {
    setFotoStatus('a', { status: 'passt_nicht', kategorieLabel: 'Treppenabgang', abzugEuro: 0 });
    expect(getBlockierendeAnzahl()).toBe(1);
  });

  it('getFotoPruefVersion steigt bei jeder echten Änderung (für useSyncExternalStore)', () => {
    const v0 = getFotoPruefVersion();
    setFotoStatus('a', { status: 'ok', kategorieLabel: 'X' });
    const v1 = getFotoPruefVersion();
    expect(v1).toBeGreaterThan(v0);
    setFotoStatus('a', null);
    expect(getFotoPruefVersion()).toBeGreaterThan(v1);
  });
});

describe('foto-pruefung-store — subscribe/emit', () => {
  it('emit feuert bei echter Änderung', () => {
    const listener = vi.fn();
    const unsub = subscribeFotoPruefung(listener);
    setFotoVerdict('a', { passt: false, kategorieLabel: 'A' });
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('No-op (Löschen eines nicht-existenten Keys) emittiert NICHT', () => {
    const listener = vi.fn();
    const unsub = subscribeFotoPruefung(listener);
    setFotoVerdict('ghost', null); // kein Eintrag vorhanden
    expect(listener).not.toHaveBeenCalled();
    unsub();
  });

  it('No-op reset auf leerem Store emittiert NICHT', () => {
    const listener = vi.fn();
    const unsub = subscribeFotoPruefung(listener);
    resetFotoPruefung(); // Store ist bereits leer (beforeEach)
    expect(listener).not.toHaveBeenCalled();
    unsub();
  });

  it('unsubscribe stoppt weitere Benachrichtigungen', () => {
    const listener = vi.fn();
    const unsub = subscribeFotoPruefung(listener);
    unsub();
    setFotoVerdict('a', { passt: false, kategorieLabel: 'A' });
    expect(listener).not.toHaveBeenCalled();
  });
});
