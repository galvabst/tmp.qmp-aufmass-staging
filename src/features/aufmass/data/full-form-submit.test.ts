/**
 * Full-Form-Submit-Kette (Integration der echten Gates).
 *
 * Repliziert die Gate-Reihenfolge aus AufmassFormPage.handleSubmit gegen die
 * ECHTEN Validierungsfunktionen — beweist, dass ein vollständig gültiger
 * Datensatz die komplette Kette passiert UND dass jeder Gate Müll korrekt blockt.
 *
 * Bewusst KEINE DB/React: handleSubmit selbst ist eine Komponentenmethode; hier
 * wird die Gate-LOGIK verifiziert (Gate 3 = KI-Foto-Inhalt ist im DEV-Bypass
 * fail-open und wird ausgelassen; Gate 8 = Soft-Plausi ist nicht blockierend).
 */
import { describe, it, expect } from 'vitest';
import { aufmassSubmitSchema } from './aufmass-schema';
import {
  pruefeFotoPraesenz,
  sichtbarePflichtFotos,
  type FotoPraesenzContext,
} from './foto-praesenz';
import { pruefeUWerteVollstaendigkeit, checkUWertePlausibilitaet } from './u-werte-plausibility';
import { checkPlausibility } from './aufmass-plausibility';
import { checkPvPlausibility } from './aufmass-pv-plausibility';
import { BILD_KATEGORIEN, type VotBildKategorie } from './bild-kategorien';
import type { VotBild } from '../hooks/useVotBilder';

const heute = () => new Date().toISOString().slice(0, 10);

// ── vollständig gültiger Basis-Datensatz (ohne PV-Aufmaß: hat_pv_anlage=true) ──
const validBase = {
  // Schritt 0 — Techniker
  techniker_name: 'Max Mustermann',
  techniker_telefon: '+49 151 12345678',
  thermocheck_datum: heute(),
  // Schritt 1 — Kundendaten
  heizung_inbetriebnahme_datum: '2005-06-01',
  heizung_funktionstuechtig: true,
  bauantrag_datum: '1995-03-01',
  fossile_brennstoffe_nach_austausch: false,
  // Schritt 2 — Gebäudedaten
  gebaeudetyp: 'einfamilienhaus',
  beheizte_wohnflaeche_m2: 140,
  anzahl_bewohner: 3,
  anzahl_etagen: 2,
  hat_denkmalschutz: false,
  durchschnittsverbrauch_3_jahre: 16000,
  fassade_gedaemmt: true,
  dach_gedaemmt: true,
  rohrsystem: 'zweirohr',
  verglasung: 'zweifach_waermeschutz',
  hat_kamin: false,
  hat_solarthermie: false,
  vorlauftemperatur: 55,
  ruecklauftemperatur: 45,
  // U-Werte (Gate 4 erzwingt den Kern)
  u_werte: {
    aussenwand: { mauerwerk_material: 'hochlochziegel', mauerwerk_cm: 24 },
    dach: { dachtyp: 'satteldach' },
    unten: { art: 'kellerdecke_unbeheizt' },
  },
  u_werte_haftung_bestaetigt: true,
  // Schritt 5 — Heizungsraum
  mehr_bilder_heizungsraum: false,
  heizungsraum_verlegen: false,
  // Schritt 6 — Heizungsart
  heizungsart: 'gas',
  // Schritt 7 — Heizkörper
  heizkoerper_typ: 'heizkoerper',
  // Schritt 8 — Elektrik
  hat_erdung: false,
  // Schritt 9 — Aufstellort
  alternative_1_vorhanden: false,
  alternative_2_vorhanden: false,
  kunde_aufstellort_bestaetigt: true,
  kunde_bestaetigung_vorname: 'Hans',
  kunde_bestaetigung_nachname: 'Müller',
  distanz_ausseneinheit_kernloch: 3,
  distanz_kernloch_innengeraet: 5,
  anzahl_durchbrueche_kernloch: 1,
  aufstellort_aenderung: false,
  // Schritt 10 — Sanitär
  anzahl_duschen: 2,
  hat_regendusche: false,
  anzahl_badewannen: 1,
  // Schritt 11 — Checkliste
  check_raeume_gescannt: true,
  check_anzahl_raeume: true,
  check_aufstellort_besprochen: true,
  check_alle_bilder: true,
  check_heizkoerper_aufgenommen: true,
  // Schritt 12 — Unbegehbare Räume
  anzahl_unbegehbare_raeume: 0,
  // Schritt 13 — PV-Entscheidung (true = bestehende Anlage, KEIN PV-Aufmaß)
  hat_pv_anlage: true,
  // Abschluss
  agb_akzeptiert: true,
} as const;

type Vals = Record<string, unknown> & { u_werte?: { fenster?: { getauscht?: boolean } } };

function ctxFor(v: Vals): FotoPraesenzContext {
  return {
    istPvAufmass: v.hat_pv_anlage === false,
    istOel: v.heizungsart === 'oel',
    mehrBilderHeizungsraum: v.mehr_bilder_heizungsraum === true,
    hatErdung: v.hat_erdung === true,
    alternative1Vorhanden: v.alternative_1_vorhanden === true,
    alternative2Vorhanden: v.alternative_2_vorhanden === true,
    hatUnbegehbareRaeume: ((v.anzahl_unbegehbare_raeume as number) ?? 0) > 0,
    hatPvAnlage: v.hat_pv_anlage === true,
    fensterGetauscht: v.u_werte?.fenster?.getauscht === true,
  };
}

let idc = 0;
const mkBild = (kategorie: VotBildKategorie, reihenfolge: number): VotBild => ({
  id: `b${++idc}`,
  vot_formular_id: 'f1',
  kategorie,
  storage_path: `p/${kategorie}/${reihenfolge}.jpg`,
  dateiname: `${kategorie}_${reihenfolge}.jpg`,
  beschreibung: null,
  reihenfolge,
  created_at: '2026-06-24T00:00:00Z',
});

/** Genau so viele Bilder je sichtbarer Pflicht-Kategorie, wie minAnzahl verlangt. */
function buildCompleteBilder(ctx: FotoPraesenzContext): VotBild[] {
  const out: VotBild[] = [];
  for (const { kategorie } of sichtbarePflichtFotos(ctx)) {
    const min = BILD_KATEGORIEN[kategorie].minAnzahl;
    for (let i = 0; i < min; i++) out.push(mkBild(kategorie, i + 1));
  }
  return out;
}

type PvVals = Parameters<typeof checkPvPlausibility>[0];

/** Repliziert die blockierende Gate-Kette aus handleSubmit (ohne KI-Gate/Soft). */
function runSubmitGates(values: unknown, bilder: VotBild[], pvValues?: PvVals) {
  // Gate 1 — zod Pflichtfelder
  const parsed = aufmassSubmitSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, gate: '1-zod', detail: parsed.error.issues.map((i) => i.path.join('.') || '(root)') };
  }
  const v = parsed.data as Vals;

  // Gate 2 — Foto-Präsenz
  const fehlend = pruefeFotoPraesenz(bilder, ctxFor(v));
  if (fehlend.length) return { ok: false, gate: '2-foto', detail: fehlend.map((f) => f.kategorie) };

  // Gate 4 — U-Werte-Vollständigkeit
  const uw = pruefeUWerteVollstaendigkeit(v);
  if (uw.length) return { ok: false, gate: '4-uwerte', detail: uw };

  // Gate 4b — U-Werte-BLOCK VOR der Haftung (logisch unmögliche Hülle-Werte müssen
  // korrigiert werden, bevor der Techniker die Richtigkeit bestätigt).
  const uBlocks = checkUWertePlausibilitaet(v).filter((i) => i.severity === 'block');
  if (uBlocks.length) return { ok: false, gate: '4b-uwerte-block', detail: uBlocks.map((b) => b.ruleId) };

  // Gate 5 — Haftungs-Checkbox
  if (v.u_werte_haftung_bestaetigt !== true) return { ok: false, gate: '5-haftung', detail: [] };

  // Gate 6 — Plausibilität (block)
  const blocks = [...checkPlausibility(v), ...checkUWertePlausibilitaet(v)].filter((i) => i.severity === 'block');
  if (blocks.length) return { ok: false, gate: '6-plausi-block', detail: blocks.map((b) => b.ruleId) };

  // Gate 7 — PV-Aufmaß (nur wenn keine bestehende Anlage)
  if (v.hat_pv_anlage === false) {
    const pv = (pvValues ?? {}) as PvVals & Record<string, unknown>;
    const pvBlocks = checkPvPlausibility(pv).filter((i) => i.severity === 'block');
    if (pvBlocks.length) return { ok: false, gate: '7-pv-block', detail: pvBlocks.map((b) => b.ruleId) };
    const dachform = (pv.dachform as string) ?? '';
    const flach = /\bflachdach\b/i.test(dachform) || pv.dachneigung === 0;
    const missing: string[] = [];
    if (!pv.dachform) missing.push('dachform');
    if (pv.dachneigung == null) missing.push('dachneigung');
    if (!flach && !pv.dachausrichtung) missing.push('dachausrichtung');
    if (pv.pv_bestaetigung !== true) missing.push('pv_bestaetigung');
    if (!pv.pv_unterschrift) missing.push('pv_unterschrift');
    if (missing.length) return { ok: false, gate: '7-pv-fields', detail: missing };
  }

  return { ok: true as const, gate: null, detail: [] };
}

describe('Full-Form-Submit — Happy Path (alle Gates grün)', () => {
  it('vollständiger gültiger Datensatz OHNE PV passiert die komplette Kette', () => {
    const bilder = buildCompleteBilder(ctxFor(validBase as unknown as Vals));
    const res = runSubmitGates(validBase, bilder);
    // Bei Fehler den Grund sichtbar machen:
    expect(res, JSON.stringify(res)).toMatchObject({ ok: true });
  });

  it('Basis-Datensatz erzeugt KEINE block-Plausibilität (soft erlaubt)', () => {
    const v = aufmassSubmitSchema.parse(validBase) as Vals;
    const all = [...checkPlausibility(v), ...checkUWertePlausibilitaet(v)];
    const blocks = all.filter((i) => i.severity === 'block');
    const softs = all.filter((i) => i.severity === 'soft').map((i) => i.ruleId);
    // Soft-Befunde nur informativ ausgeben (kein Fehler):
    if (softs.length) console.log('   ℹ️ Soft-Befunde im Basis-Datensatz:', softs);
    expect(blocks).toEqual([]);
  });

  it('vollständiger gültiger Datensatz MIT PV-Aufmaß passiert die Kette', () => {
    const pvVariante = { ...validBase, hat_pv_anlage: false };
    const validPv: PvVals = {
      dachform: 'satteldach',
      dachneigung: 35,
      dachausrichtung: 'sued',
      pv_bestaetigung: true,
      pv_unterschrift: 'Hans Müller',
    };
    const bilder = buildCompleteBilder(ctxFor(pvVariante as unknown as Vals));
    const res = runSubmitGates(pvVariante, bilder, validPv);
    expect(res, JSON.stringify(res)).toMatchObject({ ok: true });
  });
});

describe('Full-Form-Submit — jeder Gate blockt korrekt', () => {
  const fullBilder = () => buildCompleteBilder(ctxFor(validBase as unknown as Vals));

  it('Gate 1 (zod): fehlender techniker_name → Block', () => {
    const v = { ...validBase, techniker_name: '' };
    expect(runSubmitGates(v, fullBilder())).toMatchObject({ ok: false, gate: '1-zod' });
  });

  it('Gate 2 (Foto): eine Pflicht-Kategorie fehlt → Block', () => {
    const ctx = ctxFor(validBase as unknown as Vals);
    const cats = sichtbarePflichtFotos(ctx).map((c) => c.kategorie);
    const ohneEine = fullBilder().filter((b) => b.kategorie !== cats[0]);
    const res = runSubmitGates(validBase, ohneEine);
    expect(res).toMatchObject({ ok: false, gate: '2-foto' });
  });

  it('Gate 4 (U-Werte): fehlender Dachtyp → Block', () => {
    const v = { ...validBase, u_werte: { ...validBase.u_werte, dach: {} } };
    expect(runSubmitGates(v, fullBilder())).toMatchObject({ ok: false, gate: '4-uwerte' });
  });

  it('Gate 5 (Haftung): Checkbox nicht bestätigt → Block', () => {
    const v = { ...validBase, u_werte_haftung_bestaetigt: false };
    expect(runSubmitGates(v, fullBilder())).toMatchObject({ ok: false, gate: '5-haftung' });
  });

  it('Gate 4b (U-Werte-Block): Dämmjahr < Baujahr blockt VOR der Haftung', () => {
    // Logisch unmöglicher Hülle-Wert + Haftung NICHT bestätigt → der U-Werte-Block
    // (4b) muss greifen, NICHT die Haftung (5). Beweist die korrigierte Reihenfolge.
    const v = {
      ...validBase,
      u_werte_haftung_bestaetigt: false,
      u_werte: {
        ...validBase.u_werte,
        aussenwand: { mauerwerk_material: 'hochlochziegel', mauerwerk_cm: 24, daemmstoff_jahr: 1990 }, // < Baujahr 1995
      },
    };
    expect(runSubmitGates(v, fullBilder())).toMatchObject({ ok: false, gate: '4b-uwerte-block' });
  });

  it('Gate 6 (Plausi-Block): Rücklauf > Vorlauf → Block', () => {
    const v = { ...validBase, vorlauftemperatur: 45, ruecklauftemperatur: 55 };
    expect(runSubmitGates(v, fullBilder())).toMatchObject({ ok: false, gate: '6-plausi-block' });
  });

  it('Gate 7 (PV): PV-Aufmaß ohne Dachform/Unterschrift → Block', () => {
    const pvVariante = { ...validBase, hat_pv_anlage: false };
    const bilder = buildCompleteBilder(ctxFor(pvVariante as unknown as Vals));
    const res = runSubmitGates(pvVariante, bilder, {});
    expect(res).toMatchObject({ ok: false });
    expect(['7-pv-block', '7-pv-fields']).toContain((res as { gate: string }).gate);
  });
});
