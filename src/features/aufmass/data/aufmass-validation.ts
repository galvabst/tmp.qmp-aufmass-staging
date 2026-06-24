import { aufmassSubmitSchema, AufmassDraftData } from './aufmass-schema';

/**
 * Zentrale Schritt-Validierung für den Aufmaß-Stepper.
 *
 * Quelle der Wahrheit ist `aufmassSubmitSchema` (inkl. der bedingten
 * Pflichtfelder aus dessen superRefine). Diese Datei mappt fehlende Felder auf
 * ihren Stepper-Schritt — damit Stepper-Status, die "X Pflichtfelder offen"-
 * Leiste und handleSubmit dieselbe Logik teilen.
 */

export interface FieldMeta {
  label: string;
  /** BASE_STEPS-Index. -1 = Abschluss (wird dynamisch aufgelöst). */
  step: number;
}

/** Feld → (Label, Basis-Schritt). Basis-Indizes gelten in beiden Stepper-Varianten. */
export const FIELD_META: Record<string, FieldMeta> = {
  techniker_name: { label: 'Techniker-Name', step: 0 },
  techniker_telefon: { label: 'Telefonnummer', step: 0 },
  thermocheck_datum: { label: 'Datum Thermocheck', step: 0 },
  heizung_inbetriebnahme_datum: { label: 'Inbetriebnahme-Datum Heizung', step: 1 },
  heizung_funktionstuechtig: { label: 'Heizung funktionstüchtig?', step: 1 },
  bauantrag_datum: { label: 'Bauantrag-Datum', step: 1 },
  fossile_brennstoffe_nach_austausch: { label: 'Fossile Brennstoffe nach Austausch?', step: 1 },
  // Gebäudedaten (Schritt 2)
  gebaeudetyp: { label: 'Gebäudetyp', step: 2 },
  beheizte_wohnflaeche_m2: { label: 'Beheizte Wohnfläche', step: 2 },
  anzahl_bewohner: { label: 'Bewohnerzahl', step: 2 },
  anzahl_etagen: { label: 'Etagenzahl', step: 2 },
  hat_denkmalschutz: { label: 'Denkmalschutz?', step: 2 },
  durchschnittsverbrauch_3_jahre: { label: 'Verbrauch (3-Jahres-Schnitt)', step: 2 },
  fassade_gedaemmt: { label: 'Fassade gedämmt?', step: 2 },
  dach_gedaemmt: { label: 'Dach gedämmt?', step: 2 },
  rohrsystem: { label: 'Rohrsystem', step: 2 },
  verglasung: { label: 'Verglasung', step: 2 },
  hat_kamin: { label: 'Kamin vorhanden?', step: 2 },
  hat_solarthermie: { label: 'Solarthermie vorhanden?', step: 2 },
  vorlauftemperatur: { label: 'Vorlauftemperatur', step: 2 },
  ruecklauftemperatur: { label: 'Rücklauftemperatur', step: 2 },
  // U-Werte / Gebäudehülle (im Gebäudedaten-Schritt 2)
  u_werte: { label: 'U-Werte / Gebäudehülle', step: 2 },
  u_werte_haftung_bestaetigt: { label: 'Bestätigung Hülle-Angaben', step: 2 },
  u_werte_aussenwand: { label: 'U-Werte: Außenwand', step: 2 },
  u_werte_dach: { label: 'U-Werte: Dach', step: 2 },
  u_werte_unten: { label: 'U-Werte: Bodenplatte/Keller', step: 2 },
  u_werte_fenster: { label: 'U-Werte: Fenster', step: 2 },
  u_werte_anbau: { label: 'U-Werte: Anbau', step: 2 },
  mehr_bilder_heizungsraum: { label: 'Mehr Bilder Heizungsraum?', step: 5 },
  heizungsraum_verlegen: { label: 'Heizungsraum verlegen?', step: 5 },
  anschluss_vorlauf_vorhanden: { label: 'Anschluss Vorlauf', step: 5 },
  anschluss_vorlauf_distanz: { label: 'Distanz Vorlauf', step: 5 },
  anschluss_ruecklauf_vorhanden: { label: 'Anschluss Rücklauf', step: 5 },
  anschluss_ruecklauf_distanz: { label: 'Distanz Rücklauf', step: 5 },
  anschluss_warmwasser_vorhanden: { label: 'Anschluss Warmwasser', step: 5 },
  anschluss_warmwasser_distanz: { label: 'Distanz Warmwasser', step: 5 },
  anschluss_kaltwasser_vorhanden: { label: 'Anschluss Kaltwasser', step: 5 },
  anschluss_kaltwasser_distanz: { label: 'Distanz Kaltwasser', step: 5 },
  anschluss_zirkulation_vorhanden: { label: 'Anschluss Zirkulation', step: 5 },
  anschluss_zirkulation_distanz: { label: 'Distanz Zirkulation', step: 5 },
  heizungsart: { label: 'Heizungsart', step: 6 },
  heizungsart_sonstige: { label: 'Heizungsart (sonstige)', step: 6 },
  oeltank_liter_gesamt: { label: 'Öltank Liter gesamt', step: 6 },
  oeltank_anzahl: { label: 'Anzahl Öltanks', step: 6 },
  oeltank_liter_aktuell: { label: 'Aktuelle Liter Öl', step: 6 },
  oeltank_transport_beschreibung: { label: 'Öltank-Transport beschreiben', step: 6 },
  heizkoerper_typ: { label: 'Heizkörper-Typ', step: 7 },
  hat_erdung: { label: 'Erdung vorhanden?', step: 8 },
  alternative_1_vorhanden: { label: '1. Alternative Aufstellort', step: 9 },
  alternative_2_vorhanden: { label: '2. Alternative Aufstellort', step: 9 },
  kunde_aufstellort_bestaetigt: { label: 'Kundenbestätigung Aufstellort', step: 9 },
  kunde_bestaetigung_vorname: { label: 'Vorname Kundenbestätigung', step: 9 },
  kunde_bestaetigung_nachname: { label: 'Nachname Kundenbestätigung', step: 9 },
  distanz_ausseneinheit_kernloch: { label: 'Distanz Außeneinheit → Kernloch', step: 9 },
  distanz_kernloch_innengeraet: { label: 'Distanz Kernloch → Innengerät', step: 9 },
  anzahl_durchbrueche_kernloch: { label: 'Anzahl Durchbrüche Kernloch', step: 9 },
  aufstellort_aenderung: { label: 'Aufstellort-Änderung?', step: 9 },
  distanz_alter_neuer_aufstellort: { label: 'Distanz alter ↔ neuer Aufstellort', step: 9 },
  anzahl_duschen: { label: 'Anzahl Duschen', step: 10 },
  hat_regendusche: { label: 'Regendusche?', step: 10 },
  anzahl_badewannen: { label: 'Anzahl Badewannen', step: 10 },
  check_raeume_gescannt: { label: 'Räume gescannt bestätigen', step: 11 },
  check_anzahl_raeume: { label: 'Anzahl Räume bestätigen', step: 11 },
  check_aufstellort_besprochen: { label: 'Aufstellort besprochen bestätigen', step: 11 },
  check_alle_bilder: { label: 'Alle Bilder bestätigen', step: 11 },
  check_heizkoerper_aufgenommen: { label: 'Heizkörper aufgenommen bestätigen', step: 11 },
  anzahl_unbegehbare_raeume: { label: 'Anzahl unbegehbare Räume', step: 12 },
  hat_pv_anlage: { label: 'PV-Anlage vorhanden?', step: 13 },
  agb_akzeptiert: { label: 'AGB akzeptieren', step: -1 },
};

export interface MissingField {
  field: string;
  label: string;
}

export interface StepValidation {
  /** Fehlende Pflichtfelder je (aufgelöstem) Schritt-Index. */
  missingByStep: Map<number, MissingField[]>;
  /** Pro Schritt-Index: true wenn dort Pflichtfelder fehlen. Länge = totalSteps. */
  stepHasError: boolean[];
  /** Felder, die zu keinem bekannten Schritt gehören (Schema-Drift). */
  unknownFields: string[];
  totalMissing: number;
  firstErrorStep: number | null;
}

/**
 * Validiert die aktuellen Formularwerte und ordnet fehlende Pflichtfelder den
 * Schritten zu. `resolveStep` löst den Abschluss-Schritt (-1) dynamisch auf,
 * da seine Position je nach PV-Variante variiert.
 */
export function computeStepValidation(
  values: Partial<AufmassDraftData>,
  totalSteps: number,
  resolveStep: (baseStep: number) => number,
): StepValidation {
  const missingByStep = new Map<number, MissingField[]>();
  const unknownFields: string[] = [];
  const stepHasError = new Array<boolean>(totalSteps).fill(false);

  const result = aufmassSubmitSchema.safeParse(values);
  if (result.success) {
    return { missingByStep, stepHasError, unknownFields, totalMissing: 0, firstErrorStep: null };
  }

  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '');
    const meta = FIELD_META[field];
    if (!meta) {
      if (field) unknownFields.push(field);
      continue;
    }
    const step = resolveStep(meta.step);
    if (step >= 0 && step < totalSteps) stepHasError[step] = true;
    const list = missingByStep.get(step) ?? [];
    if (!list.find(e => e.field === field)) list.push({ field, label: meta.label });
    missingByStep.set(step, list);
  }

  const totalMissing =
    [...missingByStep.values()].reduce((n, l) => n + l.length, 0) + unknownFields.length;
  const errorSteps = [...missingByStep.keys()].sort((a, b) => a - b);
  const firstErrorStep = errorSteps.length ? errorSteps[0] : null;

  return { missingByStep, stepHasError, unknownFields, totalMissing, firstErrorStep };
}
