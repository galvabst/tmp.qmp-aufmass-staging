import { describe, it, expect } from 'vitest';
import { bewerteFotoInhalt, hatFotoInhaltBlocker } from './foto-inhalt-gate';
import { pruefeFotoPraesenz, sichtbarePflichtFotos, type FotoPraesenzContext } from './foto-praesenz';
import type { FotoInhaltStatus } from '../state/foto-pruefung-store';
import type { VotBild } from '../hooks/useVotBilder';
import type { VotBildKategorie } from './bild-kategorien';

/**
 * Fail-closed Inhalts-Gate: ein sichtbares Pflichtfoto passiert nur mit Status
 * 'ok'. 'passt_nicht' → falsch (ersetzen), undefined/'ungeprueft' → ungeprueft
 * (Block). Nicht-sichtbare/optionale Kategorien werden ignoriert.
 */

let seq = 0;
function bild(kategorie: VotBildKategorie, id?: string): VotBild {
  seq += 1;
  return {
    id: id ?? `b${seq}`,
    vot_formular_id: 'f1',
    kategorie,
    storage_path: `path/${id ?? seq}.jpg`,
    dateiname: `${id ?? seq}.jpg`,
    beschreibung: null,
    reihenfolge: seq,
    created_at: '2026-06-21T00:00:00.000Z',
  };
}

/** Kontext ohne PV/Öl/Alternativen → nur die immer-sichtbaren Pflicht-Slots. */
const BASIS_CTX: FotoPraesenzContext = {
  istPvAufmass: false,
  istOel: false,
  mehrBilderHeizungsraum: false,
  hatErdung: false,
  alternative1Vorhanden: false,
  alternative2Vorhanden: false,
  hatUnbegehbareRaeume: false,
  hatPvAnlage: false,
  pvHindernisseVorhanden: false,
  pvOeffentlicheFlaeche: false,
  pvBlitzschutzVorhanden: false,
};

/** Status-Lookup aus einer Map (undefined = noch nie geprüft). */
function statusFrom(map: Record<string, FotoInhaltStatus>) {
  return (id: string): FotoInhaltStatus | undefined => map[id];
}

describe('bewerteFotoInhalt — fail-closed', () => {
  it('keine Fotos → kein Blocker (Präsenz-Check ist separat zuständig)', () => {
    const e = bewerteFotoInhalt([], BASIS_CTX, () => undefined);
    expect(e.falsch).toEqual([]);
    expect(e.ungeprueft).toEqual([]);
    expect(hatFotoInhaltBlocker(e)).toBe(false);
  });

  it('Pflichtfoto ohne Status (nie geprüft) → ungeprueft blockt (fail-closed)', () => {
    const b = bild('treppenabgang', 'T1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, () => undefined);
    expect(e.ungeprueft).toHaveLength(1);
    expect(e.ungeprueft[0].bildId).toBe('T1');
    expect(e.ungeprueft[0].kategorie).toBe('treppenabgang');
    expect(e.falsch).toEqual([]);
    expect(hatFotoInhaltBlocker(e)).toBe(true);
  });

  it("Status 'ungeprueft' (KI offline) → blockt ebenfalls", () => {
    const b = bild('treppenabgang', 'T1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ T1: 'ungeprueft' }));
    expect(e.ungeprueft).toHaveLength(1);
    expect(hatFotoInhaltBlocker(e)).toBe(true);
  });

  it("Status 'ok' → kein Blocker", () => {
    const b = bild('treppenabgang', 'T1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ T1: 'ok' }));
    expect(e.falsch).toEqual([]);
    expect(e.ungeprueft).toEqual([]);
    expect(hatFotoInhaltBlocker(e)).toBe(false);
  });

  it("Status 'passt_nicht' (Füße statt Treppe) → falsch (ersetzen erzwingen)", () => {
    const b = bild('treppenabgang', 'T1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ T1: 'passt_nicht' }));
    expect(e.falsch).toHaveLength(1);
    expect(e.falsch[0].bildId).toBe('T1');
    expect(e.falsch[0].label).toBe('Treppenabgang');
    expect(e.ungeprueft).toEqual([]);
    expect(hatFotoInhaltBlocker(e)).toBe(true);
  });

  it('ein einziges falsches Foto unter vielen guten blockt (alle werden geprüft)', () => {
    const fotos = [
      bild('treppenabgang', 'T1'),
      bild('treppenabgang', 'T2'),
      bild('treppenabgang', 'T3'),
      bild('treppenabgang', 'T4'),
    ];
    const e = bewerteFotoInhalt(fotos, BASIS_CTX, statusFrom({ T1: 'ok', T2: 'ok', T3: 'ok', T4: 'passt_nicht' }));
    expect(e.falsch).toHaveLength(1);
    expect(e.falsch[0].bildId).toBe('T4');
  });

  it('falsch UND ungeprueft gleichzeitig werden getrennt gemeldet', () => {
    const fotos = [bild('treppenabgang', 'T1'), bild('heizungsraum', 'H1')];
    const e = bewerteFotoInhalt(fotos, BASIS_CTX, statusFrom({ T1: 'passt_nicht' /* H1 ungeprüft */ }));
    expect(e.falsch.map((f) => f.bildId)).toEqual(['T1']);
    expect(e.ungeprueft.map((f) => f.bildId)).toEqual(['H1']);
  });

  it('Falsch-Motiv blockt AUCH in nicht-sichtbarer Kategorie (Loch: nach Upload ausgeblendet)', () => {
    // Öltank-Foto wurde als passt_nicht erkannt, dann istOel ausgeschaltet → muss
    // trotzdem blocken (versteckt=true), sonst rutscht das falsche Foto durch.
    const b = bild('oeltank', 'O1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ O1: 'passt_nicht' }));
    expect(e.falsch.map((f) => f.bildId)).toEqual(['O1']);
    expect(e.falsch[0].versteckt).toBe(true);
    expect(hatFotoInhaltBlocker(e)).toBe(true);
  });

  it('UNGEPRÜFTES/unbewertetes Foto in nicht-sichtbarer Kategorie blockt NICHT (optional, nicht Pflicht)', () => {
    const b = bild('oeltank', 'O1');
    const undef = bewerteFotoInhalt([b], BASIS_CTX, () => undefined);
    expect(hatFotoInhaltBlocker(undef)).toBe(false);
    const ungep = bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ O1: 'ungeprueft' }));
    expect(hatFotoInhaltBlocker(ungep)).toBe(false);
  });

  it('Öltank-Foto ist sichtbar=Pflicht, sobald Öl-Heizung aktiv ist (versteckt=false)', () => {
    const b = bild('oeltank', 'O1');
    const ctx: FotoPraesenzContext = { ...BASIS_CTX, istOel: true };
    const e = bewerteFotoInhalt([b], ctx, statusFrom({ O1: 'passt_nicht' }));
    expect(e.falsch.map((f) => f.bildId)).toEqual(['O1']);
    expect(e.falsch[0].versteckt).toBe(false);
  });

  it('PV-Foto: ungeprüft blockt nur bei aktivem PV-Aufmaß; passt_nicht blockt immer', () => {
    const b = bild('pv_dach', 'P1');
    // ungeprüft + PV inaktiv → kein Block; PV aktiv → ungeprueft-Block
    expect(hatFotoInhaltBlocker(bewerteFotoInhalt([b], BASIS_CTX, () => undefined))).toBe(false);
    expect(bewerteFotoInhalt([b], { ...BASIS_CTX, istPvAufmass: true }, () => undefined).ungeprueft.map((f) => f.bildId)).toEqual(['P1']);
    // passt_nicht blockt unabhängig vom PV-Zustand
    expect(bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ P1: 'passt_nicht' })).falsch.map((f) => f.bildId)).toEqual(['P1']);
  });

  it('optionale Kategorie ohne Status (bewertung_nachweis) blockt nie', () => {
    const b = bild('bewertung_nachweis', 'BW1');
    expect(hatFotoInhaltBlocker(bewerteFotoInhalt([b], BASIS_CTX, () => undefined))).toBe(false);
  });

  it('optionale Kategorie mit erkanntem Falsch-Motiv blockt (kein Müll in der Einreichung)', () => {
    const b = bild('bewertung_nachweis', 'BW1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ BW1: 'passt_nicht' }));
    expect(e.falsch.map((f) => f.bildId)).toEqual(['BW1']);
  });

  it('veraltete/unbekannte Kategorie (DB-Drift) mit passt_nicht → übersprungen, kein label: undefined', () => {
    // Cast simuliert eine aus der DB geladene Kategorie, die nicht (mehr) im
    // BILD_KATEGORIEN-Enum existiert. Ohne Guard entstünde ein Problem mit label:undefined.
    const b = bild('voellig_veraltet_xyz' as VotBildKategorie, 'X1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, statusFrom({ X1: 'passt_nicht' }));
    expect(e.falsch).toEqual([]);
    expect(hatFotoInhaltBlocker(e)).toBe(false);
  });

  it('step wird für die „Zu Schritt N"-Navigation mitgegeben', () => {
    const b = bild('eingang_heizungsraum', 'E1');
    const e = bewerteFotoInhalt([b], BASIS_CTX, () => undefined);
    expect(e.ungeprueft[0].step).toBe(4);
  });
});

describe('Konsistenz Präsenz ⇄ Inhalts-Gate (gleiche Slots)', () => {
  it('Gate bewertet nur Kategorien, die auch sichtbarePflichtFotos liefert', () => {
    // Ein Foto je sichtbarer Pflicht-Kategorie, alle ohne Status → alle ungeprueft.
    const ctxPv: FotoPraesenzContext = { ...BASIS_CTX, istPvAufmass: true, istOel: true };
    const slots = sichtbarePflichtFotos(ctxPv);
    const fotos = slots.map((s, i) => bild(s.kategorie, `c${i}`));
    const e = bewerteFotoInhalt(fotos, ctxPv, () => undefined);
    const gateKats = new Set(e.ungeprueft.map((p) => p.kategorie));
    const slotKats = new Set(slots.map((s) => s.kategorie));
    expect([...gateKats].sort()).toEqual([...slotKats].sort());
  });

  it('Präsenz erfüllt (genug Fotos), Inhalt aber alle ungeprüft → fail-closed blockt trotzdem', () => {
    // treppenabgang braucht 4 → 4 Fotos: Präsenz ok, Inhalt ohne Status → Block.
    const fotos = [1, 2, 3, 4].map((n) => bild('treppenabgang', `T${n}`));
    // Nur Treppenabgang betrachten: Kontext, aber wir prüfen Präsenz nur für diese Kat.
    const fehlend = pruefeFotoPraesenz(fotos, BASIS_CTX).filter((f) => f.kategorie === 'treppenabgang');
    expect(fehlend).toEqual([]); // Präsenz: genug Treppenabgang-Fotos
    const e = bewerteFotoInhalt(fotos, BASIS_CTX, () => undefined);
    expect(e.ungeprueft.filter((p) => p.kategorie === 'treppenabgang')).toHaveLength(4);
    expect(hatFotoInhaltBlocker(e)).toBe(true);
  });
});
