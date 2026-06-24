import { describe, it, expect } from 'vitest';
import { FELD_HILFE, feldHilfe } from './feld-hilfe';

/**
 * Vollständigkeits- & Qualitäts-Gate für das Feld-Hilfe-Register. Schützt die
 * Laien-Tauglichkeit (jedes sichtbare Feld hat Hilfe) gegen Regressionen, wenn
 * jemand das Register kürzt oder umbenennt.
 */

/** Felder, die im Formular sichtbar ausgefüllt werden und IMMER eine Inline-Hilfe brauchen. */
const PFLICHT_INLINE = [
  // Techniker
  'techniker_name', 'techniker_telefon', 'thermocheck_datum',
  // Bestehende Heizung
  'heizung_inbetriebnahme_datum', 'heizung_funktionstuechtig', 'bauantrag_datum', 'fossile_brennstoffe_nach_austausch',
  // Gebäude
  'gebaeudetyp', 'beheizte_wohnflaeche_m2', 'anzahl_bewohner', 'anzahl_etagen', 'hat_denkmalschutz',
  'durchschnittsverbrauch_3_jahre', 'fassade_gedaemmt', 'dach_gedaemmt', 'rohrsystem', 'verglasung',
  'hat_kamin', 'hat_solarthermie', 'vorlauftemperatur', 'ruecklauftemperatur',
  // U-Werte
  'u_werte.aussenwand.daemmstoff_typ', 'u_werte.aussenwand.mauerwerk_material', 'u_werte.aussenwand.mauerwerk_cm',
  'u_werte.dach.dachtyp', 'u_werte.dach.zwischensparren_daemmstoff_typ', 'u_werte.unten.art',
  'u_werte.fenster.getauscht', 'u_werte.fenster.u_wert', 'u_werte.anbau.vorhanden', 'u_werte_haftung_bestaetigt',
  // Heizungsraum / Anschlüsse
  'heizungsraum_verlegen', 'mehr_bilder_heizungsraum',
  // Heizungsart
  'heizungsart', 'oeltank_liter_gesamt', 'oeltank_anzahl', 'oeltank_liter_aktuell',
  // Heizkörper / Elektrik
  'heizkoerper_typ', 'hat_erdung',
  // Aufstellort
  'alternative_1_vorhanden', 'kunde_aufstellort_bestaetigt', 'distanz_ausseneinheit_kernloch',
  'distanz_kernloch_innengeraet', 'anzahl_durchbrueche_kernloch', 'aufstellort_aenderung',
  // Sanitär
  'anzahl_duschen', 'hat_regendusche', 'anzahl_badewannen',
  // Checkliste
  'check_raeume_gescannt', 'check_anzahl_raeume', 'check_aufstellort_besprochen', 'check_alle_bilder', 'check_heizkoerper_aufgenommen',
  // Sonstiges
  'bemerkungen', 'anzahl_unbegehbare_raeume', 'hat_pv_anlage', 'agb_akzeptiert',
] as const;

/** „Schwere" Felder: brauchen Tiefe (Sheet) UND eine vorbefüllte KI-Frage. */
const SCHWER = [
  'heizung_inbetriebnahme_datum', 'fossile_brennstoffe_nach_austausch', 'bauantrag_datum',
  'beheizte_wohnflaeche_m2', 'durchschnittsverbrauch_3_jahre', 'hat_denkmalschutz',
  'fassade_gedaemmt', 'dach_gedaemmt', 'rohrsystem', 'verglasung', 'vorlauftemperatur', 'ruecklauftemperatur',
  'heizungsart', 'heizkoerper_typ', 'hat_erdung',
  'u_werte.aussenwand.daemmstoff_typ', 'u_werte.aussenwand.mauerwerk_material', 'u_werte.dach.dachtyp',
  'u_werte.dach.zwischensparren_daemmstoff_typ', 'u_werte.unten.art', 'u_werte.fenster.u_wert',
] as const;

describe('feld-hilfe Register', () => {
  it('hat für jedes sichtbare Pflichtfeld eine nicht-leere Inline-Hilfe', () => {
    for (const key of PFLICHT_INLINE) {
      const h = feldHilfe(key);
      expect(h, `Feld-Hilfe fehlt für: ${key}`).toBeDefined();
      expect(h!.inline.trim().length, `inline leer für: ${key}`).toBeGreaterThan(3);
    }
  });

  it('hält Inline-Hilfen kurz (Faustregel ≤ 18 Wörter)', () => {
    for (const [key, h] of Object.entries(FELD_HILFE)) {
      const woerter = h.inline.trim().split(/\s+/).length;
      expect(woerter, `inline zu lang (${woerter} Wörter) bei: ${key}`).toBeLessThanOrEqual(18);
    }
  });

  it('gibt schweren Feldern Tiefe (Sheet mit Titel) UND eine KI-Frage', () => {
    for (const key of SCHWER) {
      const h = feldHilfe(key);
      expect(h, `Feld-Hilfe fehlt für schweres Feld: ${key}`).toBeDefined();
      expect(h!.sheet, `sheet fehlt für schweres Feld: ${key}`).toBeDefined();
      expect(h!.sheet!.titel.trim().length, `sheet.titel leer bei: ${key}`).toBeGreaterThan(2);
      expect(h!.kiFrage?.trim().length ?? 0, `kiFrage fehlt für schweres Feld: ${key}`).toBeGreaterThan(5);
    }
  });

  it('liefert undefined für unbekannte Keys', () => {
    expect(feldHilfe('gibt_es_nicht')).toBeUndefined();
  });

  it('spiegelt den Anbau-Wandaufbau per Pfad-Fallback auf die Außenwand-Hilfe', () => {
    // u_werte.anbau.wand.* hat keine eigenen Keys → identisches Schema → Fallback auf aussenwand.
    const direct = feldHilfe('u_werte.aussenwand.daemmstoff_typ');
    const anbau = feldHilfe('u_werte.anbau.wand.daemmstoff_typ');
    expect(direct, 'Außenwand-Referenz fehlt').toBeDefined();
    expect(anbau, 'Anbau-Fallback greift nicht').toEqual(direct);
    expect(feldHilfe('u_werte.anbau.wand.mauerwerk_material')).toBeDefined();
  });

  it('hat Inline-Hilfe für alle Anschluss-Pflichtfelder (werden bei Verlegung Pflicht)', () => {
    for (const l of ['vorlauf', 'ruecklauf', 'warmwasser', 'kaltwasser', 'zirkulation']) {
      expect(feldHilfe(`anschluss_${l}_vorhanden`)?.inline?.trim(), `${l}_vorhanden`).toBeTruthy();
      expect(feldHilfe(`anschluss_${l}_distanz`)?.inline?.trim(), `${l}_distanz`).toBeTruthy();
    }
  });

  it('Verglasungs-Hilfe nutzt die korrekte 2/4/6-Reflexlogik (nicht 1/2/3)', () => {
    const h = feldHilfe('verglasung');
    const text = JSON.stringify(h);
    expect(text).toMatch(/2.*=.*einfach|2 Lichtreflexe/i);
    // Häufiger Fehler wäre "1 = einfach" — darf NICHT vorkommen.
    expect(text).not.toMatch(/1 ?= ?einfach/i);
  });
});
