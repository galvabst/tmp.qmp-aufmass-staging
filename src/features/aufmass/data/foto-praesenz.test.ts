import { describe, it, expect } from 'vitest';
import { pruefeFotoPraesenz, type FotoPraesenzContext } from './foto-praesenz';
import { BILD_KATEGORIEN, type VotBildKategorie } from './bild-kategorien';
import type { VotBild } from '../hooks/useVotBilder';

/**
 * Submit-Gate-Test: Pflicht-Foto-Präsenz wird beim Absenden erzwungen.
 * Deterministisch, KI-unabhängig — der harte Foto-Schutz aus dem Audit-Finding
 * (high): „Aufmaß ließ sich mit 0 / zu wenigen Fotos einreichen".
 */

let idCounter = 0;
function bild(kategorie: VotBildKategorie): VotBild {
  idCounter += 1;
  return {
    id: `b-${idCounter}`,
    vot_formular_id: 'f-1',
    kategorie,
    storage_path: `p/${idCounter}.jpg`,
    dateiname: `${idCounter}.jpg`,
    beschreibung: null,
    reihenfolge: idCounter,
    created_at: '2026-06-21T00:00:00Z',
  };
}

/** n Bilder einer Kategorie erzeugen. */
function bilder(kategorie: VotBildKategorie, n: number): VotBild[] {
  return Array.from({ length: n }, () => bild(kategorie));
}

/** Kontext: kein PV-Aufmaß, keine Sonderfälle (Basis-Sichtbarkeit). */
const ctxBasis: FotoPraesenzContext = {
  istPvAufmass: false,
  istOel: false,
  mehrBilderHeizungsraum: false,
  hatErdung: false,
  alternative1Vorhanden: false,
  alternative2Vorhanden: false,
};

/** Alle IMMER sichtbaren Pflicht-Foto-Kategorien je in voller Mindestanzahl. */
function alleBasisPflichtfotos(): VotBild[] {
  const kategorien: VotBildKategorie[] = [
    // Galvanek-Hausschuhe — immer Pflicht (10-€-Abzug ohne Nachweis), Schritt 0
    'hausschuhe',
    // U-Werte / Gebäudehülle — nur der machbare Meterstab-Nachweis ist Pflicht
    'wanddicke_fenster_meterstab',
    'treppenabgang', 'eingang_heizungsraum', 'heizungsraum', 'heizanlage',
    'heizkreisverteiler', 'heizkoerper', 'zaehlerschrank', 'sicherungen',
    'zaehler', 'hausanschlusskasten', 'aufstellort_option_1', 'aufstellort_umgebung_1',
  ];
  return kategorien.flatMap((k) => bilder(k, BILD_KATEGORIEN[k].minAnzahl));
}

describe('pruefeFotoPraesenz — leere/zu wenige Fotos blocken', () => {
  it('keine Fotos → alle Basis-Pflichtkategorien fehlen', () => {
    const fehlend = pruefeFotoPraesenz([], ctxBasis);
    expect(fehlend.length).toBeGreaterThan(0);
    const kats = fehlend.map((f) => f.kategorie);
    expect(kats).toContain('treppenabgang');
    expect(kats).toContain('eingang_heizungsraum');
    // PV-Kategorien dürfen ohne PV-Aufmaß NICHT auftauchen.
    expect(kats).not.toContain('pv_dach');
    // Öltank nicht ohne heizungsart === 'oel'.
    expect(kats).not.toContain('oeltank');
  });

  it('treppenabgang braucht minAnzahl=4 — 1 Foto reicht nicht', () => {
    const fehlend = pruefeFotoPraesenz(bilder('treppenabgang', 1), ctxBasis);
    const treppe = fehlend.find((f) => f.kategorie === 'treppenabgang');
    expect(treppe).toBeDefined();
    expect(treppe!.vorhanden).toBe(1);
    expect(treppe!.minAnzahl).toBe(4);
    expect(treppe!.step).toBe(3);
  });

  it('alle Basis-Pflichtfotos vollständig → leer', () => {
    const fehlend = pruefeFotoPraesenz(alleBasisPflichtfotos(), ctxBasis);
    expect(fehlend).toEqual([]);
  });

  it('Hausschuhe sind Pflicht (Schritt 0) — fehlen ohne Sonderbedingung', () => {
    // Critic-Finding (high): hausschuhe fehlte in PFLICHT_FOTOS → 10-€-Abzug nicht erzwingbar.
    const fehlend = pruefeFotoPraesenz([], ctxBasis);
    const schuhe = fehlend.find((f) => f.kategorie === 'hausschuhe');
    expect(schuhe).toBeDefined();
    expect(schuhe!.minAnzahl).toBe(1);
    expect(schuhe!.step).toBe(0);

    // Mit 1 Hausschuh-Foto → nicht mehr gemeldet.
    const mitFoto = pruefeFotoPraesenz(bilder('hausschuhe', 1), ctxBasis);
    expect(mitFoto.find((f) => f.kategorie === 'hausschuhe')).toBeUndefined();
  });

  it('eine Kategorie genau an der Grenze (min erfüllt) → nicht gemeldet', () => {
    const nurTreppe = bilder('treppenabgang', BILD_KATEGORIEN.treppenabgang.minAnzahl);
    const fehlend = pruefeFotoPraesenz(nurTreppe, ctxBasis);
    expect(fehlend.find((f) => f.kategorie === 'treppenabgang')).toBeUndefined();
  });
});

describe('pruefeFotoPraesenz — bedingte Sichtbarkeit (kein Fehlalarm)', () => {
  it('Öltank-Foto erst erforderlich, wenn heizungsart === oel', () => {
    const ohneOel = pruefeFotoPraesenz([], { ...ctxBasis, istOel: false });
    expect(ohneOel.find((f) => f.kategorie === 'oeltank')).toBeUndefined();

    const mitOel = pruefeFotoPraesenz([], { ...ctxBasis, istOel: true });
    expect(mitOel.find((f) => f.kategorie === 'oeltank')).toBeDefined();
  });

  it('Erdung-Foto erst erforderlich, wenn hatErdung', () => {
    expect(pruefeFotoPraesenz([], { ...ctxBasis, hatErdung: false })
      .find((f) => f.kategorie === 'erdung')).toBeUndefined();
    expect(pruefeFotoPraesenz([], { ...ctxBasis, hatErdung: true })
      .find((f) => f.kategorie === 'erdung')).toBeDefined();
  });

  it('Extra-Heizungsraum-Foto erst bei mehrBilderHeizungsraum', () => {
    expect(pruefeFotoPraesenz([], { ...ctxBasis, mehrBilderHeizungsraum: false })
      .find((f) => f.kategorie === 'heizungsraum_extra')).toBeUndefined();
    expect(pruefeFotoPraesenz([], { ...ctxBasis, mehrBilderHeizungsraum: true })
      .find((f) => f.kategorie === 'heizungsraum_extra')).toBeDefined();
  });

  it('Aufstellort-Alternative 1 erst bei alternative1Vorhanden', () => {
    expect(pruefeFotoPraesenz([], { ...ctxBasis, alternative1Vorhanden: false })
      .find((f) => f.kategorie === 'aufstellort_alt_1')).toBeUndefined();
    expect(pruefeFotoPraesenz([], { ...ctxBasis, alternative1Vorhanden: true })
      .find((f) => f.kategorie === 'aufstellort_alt_1')).toBeDefined();
  });

  it('Aufstellort-Alternative 2 nur wenn Alt 1 UND Alt 2 vorhanden', () => {
    const nurAlt2Flag = pruefeFotoPraesenz([], { ...ctxBasis, alternative1Vorhanden: false, alternative2Vorhanden: true });
    expect(nurAlt2Flag.find((f) => f.kategorie === 'aufstellort_alt_2')).toBeUndefined();

    const beide = pruefeFotoPraesenz([], { ...ctxBasis, alternative1Vorhanden: true, alternative2Vorhanden: true });
    expect(beide.find((f) => f.kategorie === 'aufstellort_alt_2')).toBeDefined();
  });

  it('PV-Fotos erst beim PV-Aufmaß (istPvAufmass)', () => {
    const ohnePv = pruefeFotoPraesenz([], { ...ctxBasis, istPvAufmass: false });
    expect(ohnePv.find((f) => f.kategorie === 'pv_dach')).toBeUndefined();

    const mitPv = pruefeFotoPraesenz([], { ...ctxBasis, istPvAufmass: true });
    const kats = mitPv.map((f) => f.kategorie);
    expect(kats).toContain('pv_dach');
    expect(kats).toContain('pv_sparrenabstand');
    expect(kats).toContain('pv_dachziegel');
  });
});

describe('pruefeFotoPraesenz — optionale Kategorien zählen nie', () => {
  it('bewertung_nachweis (minAnzahl=0) wird nie als fehlend gemeldet', () => {
    expect(BILD_KATEGORIEN.bewertung_nachweis.minAnzahl).toBe(0);
    const fehlend = pruefeFotoPraesenz([], { ...ctxBasis, istPvAufmass: true });
    expect(fehlend.find((f) => f.kategorie === 'bewertung_nachweis')).toBeUndefined();
  });
});
