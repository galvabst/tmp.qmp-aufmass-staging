import { PLAUSIBILITY_THRESHOLDS as T } from './aufmass-plausibility';

/**
 * T0 — Eingabe-Masken. Zentrale Zahlen-Grenzen je Feld, abgeleitet aus denselben
 * PLAUSIBILITY_THRESHOLDS wie die T2/T3-Engine (eine Wahrheit, kein Drift).
 *
 * `numberFieldProps(field)` liefert die HTML-Attribute zum Spreaden auf ein
 * `<Input type="number">`. Verhindert Müll bereits an der Quelle (richtige
 * Tastatur, keine Negativen via Spinner, Ganzzahl vs. Dezimal). Die harte
 * Sperre bleibt T2 (block) beim Absenden — `max` begrenzt nur den Spinner.
 */

export interface FieldBound {
  min?: number;
  max?: number;
  step?: number;
  /** Ganzzahl-Feld → step=1, inputMode='numeric'. Sonst Dezimal → 'decimal'. */
  integer?: boolean;
}

export const FIELD_BOUNDS: Record<string, FieldBound> = {
  // -- Gebäudedaten --
  beheizte_wohnflaeche_m2: { min: 1, max: T.wohnflaeche.hardMax, step: 1 },
  anzahl_bewohner: { min: T.bewohner.hardMin, max: T.bewohner.hardMax, integer: true },
  anzahl_etagen: { min: T.etagen.hardMin, max: T.etagen.hardMax, integer: true },
  durchschnittsverbrauch_3_jahre: { min: 1, step: 1 },
  vorlauftemperatur: { min: 0, max: T.vorlauf.hardMax, step: 1 },
  ruecklauftemperatur: { min: 0, max: T.ruecklauf.hardMax, step: 1 },

  // -- Öltank --
  oeltank_liter_gesamt: { min: 1, max: T.oeltank.literHardMax, step: 100 },
  oeltank_liter_aktuell: { min: 0, max: T.oeltank.literHardMax, step: 100 },
  oeltank_anzahl: { min: T.oeltank.anzahlHardMin, max: T.oeltank.anzahlHardMax, integer: true },

  // -- Aufstellort / Distanzen --
  distanz_ausseneinheit_kernloch: { min: 0, max: T.distanz.kernlochHardMax, step: 0.5 },
  distanz_kernloch_innengeraet: { min: 0, max: T.distanz.kernlochHardMax, step: 0.5 },
  anzahl_durchbrueche_kernloch: { min: 0, max: T.distanz.durchbruecheHardMax, integer: true },
  distanz_alter_neuer_aufstellort: { min: 0, max: T.distanz.aufstellortHardMax, step: 0.5 },

  // -- Anschluss-Distanzen (Heizungsraum-Verlegung) --
  anschluss_vorlauf_distanz: { min: 0, max: T.distanz.anschlussHardMax, step: 0.5 },
  anschluss_ruecklauf_distanz: { min: 0, max: T.distanz.anschlussHardMax, step: 0.5 },
  anschluss_warmwasser_distanz: { min: 0, max: T.distanz.anschlussHardMax, step: 0.5 },
  anschluss_kaltwasser_distanz: { min: 0, max: T.distanz.anschlussHardMax, step: 0.5 },
  anschluss_zirkulation_distanz: { min: 0, max: T.distanz.anschlussHardMax, step: 0.5 },

  // -- Sanitär --
  anzahl_duschen: { min: 0, max: T.sanitaer.hardMax, integer: true },
  anzahl_badewannen: { min: 0, max: T.sanitaer.hardMax, integer: true },

  // -- Unbegehbare Räume (Schema-Cap max 5) --
  anzahl_unbegehbare_raeume: { min: 0, max: 5, integer: true },

  // -- PV (Plausibilität folgt in Phase B) --
  dachneigung: { min: 0, max: 90, step: 1 },
  ziegel_neigung_grad: { min: 0, max: 90, step: 1 },
  aufdachdaemmung_dicke: { min: 0, max: 60, step: 1 },
  gebaeude_entfernung: { min: 0, step: 1 },
};

export interface NumberFieldProps {
  type: 'number';
  inputMode: 'numeric' | 'decimal';
  min?: number;
  max?: number;
  step?: number;
}

/**
 * HTML-Attribute für ein bounded `<Input type="number">`. Spreaden NEBEN
 * `register(field, { valueAsNumber: true })` (kein Attribut-Konflikt).
 */
export function numberFieldProps(field: string): NumberFieldProps {
  const b = FIELD_BOUNDS[field];
  if (!b) return { type: 'number', inputMode: 'numeric' };
  const integer = b.integer === true;
  return {
    type: 'number',
    inputMode: integer ? 'numeric' : 'decimal',
    min: b.min,
    max: b.max,
    step: b.step ?? (integer ? 1 : undefined),
  };
}
