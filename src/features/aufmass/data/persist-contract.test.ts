/**
 * Persistenz-Vertrag: jedes Feld in FORM_DB_FIELDS MUSS eine Spalte in
 * thermocheck.thermocheck_vot_formulare sein — sonst scheitert der Save mit
 * PGRST204 "column not found" (useVotFormular.useUpsertVotFormular schreibt
 * jedes gesetzte FORM_DB_FIELDS-Feld; KEIN generischer Missing-Column-Retry).
 *
 * PROD_COLUMNS spiegelt den Ist-Stand der Tabelle. Die Gebäudedaten-/U-Werte-
 * Spalten (Migration 20260624090000, deckt 20260623120000 mit ab) sind in Prod
 * ANGEWENDET → hier enthalten. Bei DB-Änderungen diesen Snapshot aktualisieren.
 */
import { describe, it, expect } from 'vitest';
import { FORM_DB_FIELDS } from './aufmass-schema';

// Ist-Spalten in thermocheck.thermocheck_vot_formulare (Prod).
const PROD_COLUMNS = new Set<string>([
  'id', 'thermocheck_auftrag_id', 'eingereicht_am', 'eingereicht_von', 'created_at', 'updated_at',
  'status', 'techniker_name', 'techniker_telefon', 'thermocheck_datum',
  'heizung_inbetriebnahme_datum', 'heizung_funktionstuechtig', 'bauantrag_datum',
  'fossile_brennstoffe_nach_austausch', 'mehr_bilder_heizungsraum', 'heizungsart',
  'heizungsart_sonstige', 'oeltank_liter_gesamt', 'oeltank_anzahl', 'oeltank_liter_aktuell',
  'oeltank_transport_beschreibung', 'heizkoerper_typ', 'hat_erdung', 'alternative_1_vorhanden',
  'alternative_2_vorhanden', 'kunde_aufstellort_bestaetigt', 'kunde_bestaetigung_vorname',
  'kunde_bestaetigung_nachname', 'anzahl_duschen', 'hat_regendusche', 'anzahl_badewannen',
  'check_raeume_gescannt', 'check_anzahl_raeume', 'check_aufstellort_besprochen', 'check_alle_bilder',
  'check_heizkoerper_aufgenommen', 'bemerkungen', 'anzahl_unbegehbare_raeume', 'hat_pv_anlage',
  'agb_akzeptiert', 'distanz_ausseneinheit_kernloch', 'distanz_kernloch_innengeraet',
  'anzahl_durchbrueche_kernloch', 'aufstellort_aenderung', 'distanz_alter_neuer_aufstellort',
  'raumscan_url', 'heizungsraum_verlegen', 'anschluss_vorlauf_vorhanden', 'anschluss_vorlauf_distanz',
  'anschluss_ruecklauf_vorhanden', 'anschluss_ruecklauf_distanz', 'anschluss_warmwasser_vorhanden',
  'anschluss_warmwasser_distanz', 'anschluss_kaltwasser_vorhanden', 'anschluss_kaltwasser_distanz',
  'anschluss_zirkulation_vorhanden', 'anschluss_zirkulation_distanz', 'aufstellort_ai_pruefung_id',
  'aufstellort_ai_empfehlung', 'aufstellort_ai_zusammenfassung',
  // Gebäudedaten + U-Werte (Migration 20260624090000 — in Prod angewendet).
  'gebaeudetyp', 'beheizte_wohnflaeche_m2', 'anzahl_bewohner', 'anzahl_etagen',
  'hat_denkmalschutz', 'durchschnittsverbrauch_3_jahre', 'fassade_gedaemmt', 'dach_gedaemmt',
  'rohrsystem', 'verglasung', 'hat_kamin', 'hat_solarthermie', 'vorlauftemperatur',
  'ruecklauftemperatur', 'u_werte', 'u_werte_haftung_bestaetigt',
]);

// Die 16 Spalten, die die Gebäudedaten-/U-Werte-Migration (20260624090000,
// deckt 20260623120000 mit ab) ergänzt — müssen jetzt in PROD_COLUMNS stehen.
const GEBAEUDEDATEN_UWERTE_SPALTEN = [
  'gebaeudetyp', 'beheizte_wohnflaeche_m2', 'anzahl_bewohner', 'anzahl_etagen',
  'hat_denkmalschutz', 'durchschnittsverbrauch_3_jahre', 'fassade_gedaemmt', 'dach_gedaemmt',
  'rohrsystem', 'verglasung', 'hat_kamin', 'hat_solarthermie', 'vorlauftemperatur',
  'ruecklauftemperatur', 'u_werte', 'u_werte_haftung_bestaetigt',
];

describe('Persistenz-Vertrag FORM_DB_FIELDS ↔ DB-Spalten', () => {
  it('jedes FORM_DB_FIELDS-Feld ist eine echte Spalte (sonst PGRST204 beim Save)', () => {
    const fehlend = FORM_DB_FIELDS.filter((f) => !PROD_COLUMNS.has(f as string));
    expect(fehlend, `Spalten fehlen in thermocheck_vot_formulare: ${JSON.stringify(fehlend)}`).toEqual([]);
  });

  it('die Gebäudedaten-/U-Werte-Migration-Spalten sind in Prod vorhanden', () => {
    const fehlend = GEBAEUDEDATEN_UWERTE_SPALTEN.filter((c) => !PROD_COLUMNS.has(c));
    expect(fehlend, `Migration 20260624090000 nicht vollständig im Snapshot/Prod: ${JSON.stringify(fehlend)}`).toEqual([]);
  });
});
