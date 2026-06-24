import { checkPlausibility, PlausibilityIssue } from './aufmass-plausibility';
import { checkPvPlausibility } from './aufmass-pv-plausibility';
import { aufmassSubmitSchema, AufmassDraftData } from './aufmass-schema';
import { PvAufmassDraftData } from './pv-aufmass-schema';
import { WatertightCase } from './aufmass-watertight-cases';

/**
 * Wasserdicht-Runner: setzt jeden ungültigen Fall auf einen vollständig gültigen
 * Datensatz auf und prüft, ob das Formular ihn fängt — über BEIDE echten
 * Schichten: das Submit-Zod-Schema (T1) UND die Plausibilitäts-Engine (T2/T3).
 * „Gefangen" = mindestens eine Schicht lehnt den Fall (in erwarteter Stärke) ab.
 */

/** Vollständig gültiger WP-Aufmaß-Datensatz: Schema grün, 0 Plausi-Befunde. */
export const VALID_BASELINE: Record<string, unknown> = {
  techniker_name: 'Max Mustermann',
  techniker_telefon: '0151 23456789',
  thermocheck_datum: '2026-06-10',
  heizung_inbetriebnahme_datum: '2005-06-01',
  heizung_funktionstuechtig: true,
  bauantrag_datum: '1995-03-01',
  fossile_brennstoffe_nach_austausch: false,
  gebaeudetyp: 'einfamilienhaus',
  beheizte_wohnflaeche_m2: 140,
  anzahl_bewohner: 3,
  anzahl_etagen: 2,
  hat_denkmalschutz: false,
  durchschnittsverbrauch_3_jahre: 18000,
  fassade_gedaemmt: true,
  dach_gedaemmt: true,
  rohrsystem: 'zweirohr',
  verglasung: 'zweifach_waermeschutz',
  hat_kamin: false,
  hat_solarthermie: false,
  vorlauftemperatur: 55,
  ruecklauftemperatur: 45,
  mehr_bilder_heizungsraum: false,
  heizungsraum_verlegen: false,
  heizungsart: 'gas',
  heizkoerper_typ: 'heizkoerper',
  hat_erdung: true,
  alternative_1_vorhanden: true,
  alternative_2_vorhanden: false,
  kunde_aufstellort_bestaetigt: true,
  kunde_bestaetigung_vorname: 'Erika',
  kunde_bestaetigung_nachname: 'Beispiel',
  anzahl_duschen: 2,
  hat_regendusche: false,
  anzahl_badewannen: 1,
  check_raeume_gescannt: true,
  check_anzahl_raeume: true,
  check_aufstellort_besprochen: true,
  check_alle_bilder: true,
  check_heizkoerper_aufgenommen: true,
  anzahl_unbegehbare_raeume: 0,
  hat_pv_anlage: false,
  agb_akzeptiert: true,
  distanz_ausseneinheit_kernloch: 5,
  distanz_kernloch_innengeraet: 3,
  anzahl_durchbrueche_kernloch: 1,
  aufstellort_aenderung: false,
};

/** Plausibler PV-Basisdatensatz (Kontext für PV-Querfeld-Fälle). */
export const PV_BASELINE: Record<string, unknown> = {
  solarthermie_vorhanden: false,
  dachneigung: 35,
  ziegel_neigung_grad: 35,
  gebaeude_entfernung: 0,
  module_gleiches_gebaeude: true,
  dc_ueber_10m: false,
  fassade_gedaemmt: false,
  denkmalschutz: 'nein',
};

export function mergedFor(c: WatertightCase): Record<string, unknown> {
  return c.domain === 'pv'
    ? { ...PV_BASELINE, ...c.values }
    : { ...VALID_BASELINE, ...c.values };
}

/** T1: lehnt das Submit-Schema GENAU wegen des Fall-Feldes ab? */
function schemaCatches(field: string, merged: Record<string, unknown>): boolean {
  const r = aufmassSubmitSchema.safeParse(merged);
  return !r.success && r.error.issues.some((i) => String(i.path[0]) === field);
}

/** T2/T3: liefert die Plausi-Engine einen Befund in erwarteter Stärke? */
function plausiCatches(c: WatertightCase, merged: Record<string, unknown>): boolean {
  const issues: PlausibilityIssue[] = c.domain === 'pv'
    ? checkPvPlausibility(merged as Partial<PvAufmassDraftData>)
    : checkPlausibility(merged as Partial<AufmassDraftData>);
  return c.expect === 'block'
    ? issues.some((i) => i.severity === 'block')
    : issues.length > 0;
}

/** Wird der ungültige Fall vom Formular gefangen (eine der Schichten reicht)? */
export function caughtBy(c: WatertightCase): boolean {
  const merged = mergedFor(c);
  const schemaHit = c.domain === 'wp' && schemaCatches(c.field, merged);
  return schemaHit || plausiCatches(c, merged);
}

/** Alle nicht gefangenen Fälle = Löcher. */
export function findHoles(cases: WatertightCase[]): WatertightCase[] {
  return cases.filter((c) => !caughtBy(c));
}
