import { z } from 'zod';

const emptyToUndefined = (value: unknown) => {
  if (value === null || value === '') return undefined;
  if (typeof value === 'number' && Number.isNaN(value)) return undefined;
  return value;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalBoolean = z.preprocess(emptyToUndefined, z.boolean().optional());
const optionalNonNegativeNumber = z.preprocess(emptyToUndefined, z.number().min(0).optional());
const optionalNonNegativeInteger = z.preprocess(emptyToUndefined, z.number().int().min(0).optional());
const optionalPositiveInteger = z.preprocess(emptyToUndefined, z.number().int().positive().optional());
const requiredNonNegativeNumber = (message = 'Bitte angeben') =>
  z.preprocess(emptyToUndefined, z.number({ required_error: message, invalid_type_error: message }).min(0, message));
const requiredNonNegativeInteger = (message = 'Bitte angeben') =>
  z.preprocess(emptyToUndefined, z.number({ required_error: message, invalid_type_error: message }).int(message).min(0, message));

/** Zod schema for draft saving (all optional) */
export const aufmassDraftSchema = z.object({
  techniker_name: optionalString,
  techniker_telefon: optionalString,
  thermocheck_datum: optionalString,
  heizung_inbetriebnahme_datum: optionalString,
  heizung_funktionstuechtig: optionalBoolean,
  bauantrag_datum: optionalString,
  fossile_brennstoffe_nach_austausch: optionalBoolean,
  mehr_bilder_heizungsraum: optionalBoolean,
  heizungsraum_verlegen: optionalBoolean,
  anschluss_vorlauf_vorhanden: optionalBoolean,
  anschluss_vorlauf_distanz: optionalNonNegativeNumber,
  anschluss_ruecklauf_vorhanden: optionalBoolean,
  anschluss_ruecklauf_distanz: optionalNonNegativeNumber,
  anschluss_warmwasser_vorhanden: optionalBoolean,
  anschluss_warmwasser_distanz: optionalNonNegativeNumber,
  anschluss_kaltwasser_vorhanden: optionalBoolean,
  anschluss_kaltwasser_distanz: optionalNonNegativeNumber,
  anschluss_zirkulation_vorhanden: optionalBoolean,
  anschluss_zirkulation_distanz: optionalNonNegativeNumber,
  heizungsart: z.enum(['gas', 'oel', 'sonstige']).optional(),
  heizungsart_sonstige: optionalString,
  oeltank_liter_gesamt: optionalPositiveInteger,
  oeltank_anzahl: optionalPositiveInteger,
  oeltank_liter_aktuell: optionalNonNegativeInteger,
  oeltank_transport_beschreibung: optionalString,
  heizkoerper_typ: z.enum(['heizkoerper', 'fussbodenheizung', 'beides']).optional(),
  hat_erdung: optionalBoolean,
  alternative_1_vorhanden: optionalBoolean,
  alternative_2_vorhanden: optionalBoolean,
  kunde_aufstellort_bestaetigt: optionalBoolean,
  kunde_bestaetigung_vorname: optionalString,
  kunde_bestaetigung_nachname: optionalString,
  anzahl_duschen: optionalNonNegativeInteger,
  hat_regendusche: optionalBoolean,
  anzahl_badewannen: optionalNonNegativeInteger,
  check_raeume_gescannt: optionalBoolean,
  check_anzahl_raeume: optionalBoolean,
  check_aufstellort_besprochen: optionalBoolean,
  check_alle_bilder: optionalBoolean,
  check_heizkoerper_aufgenommen: optionalBoolean,
  bemerkungen: optionalString,
  anzahl_unbegehbare_raeume: z.preprocess(emptyToUndefined, z.number().int().min(0).max(5).optional()),
  hat_pv_anlage: optionalBoolean,
  agb_akzeptiert: optionalBoolean,
  distanz_ausseneinheit_kernloch: optionalNonNegativeNumber,
  distanz_kernloch_innengeraet: optionalNonNegativeNumber,
  anzahl_durchbrueche_kernloch: optionalNonNegativeInteger,
  aufstellort_aenderung: optionalBoolean,
  distanz_alter_neuer_aufstellort: optionalNonNegativeNumber,
  raumscan_url: optionalString,
});

/** Zod schema for final submission (required fields enforced) */
export const aufmassSubmitSchema = z.object({
  techniker_name: z.string().min(1, 'Name erforderlich'),
  techniker_telefon: z.string().min(1, 'Telefonnummer erforderlich'),
  thermocheck_datum: z.string().min(1, 'Datum erforderlich'),
  heizung_inbetriebnahme_datum: z.string().min(1, 'Inbetriebnahme-Datum erforderlich'),
  heizung_funktionstuechtig: z.boolean({ required_error: 'Bitte auswählen' }),
  bauantrag_datum: z.string().min(1, 'Bauantrag-Datum erforderlich'),
  fossile_brennstoffe_nach_austausch: z.boolean({ required_error: 'Bitte auswählen' }),
  mehr_bilder_heizungsraum: z.boolean(),
  heizungsraum_verlegen: z.boolean({ required_error: 'Bitte auswählen' }),
  anschluss_vorlauf_vorhanden: optionalBoolean,
  anschluss_vorlauf_distanz: optionalNonNegativeNumber,
  anschluss_ruecklauf_vorhanden: optionalBoolean,
  anschluss_ruecklauf_distanz: optionalNonNegativeNumber,
  anschluss_warmwasser_vorhanden: optionalBoolean,
  anschluss_warmwasser_distanz: optionalNonNegativeNumber,
  anschluss_kaltwasser_vorhanden: optionalBoolean,
  anschluss_kaltwasser_distanz: optionalNonNegativeNumber,
  anschluss_zirkulation_vorhanden: optionalBoolean,
  anschluss_zirkulation_distanz: optionalNonNegativeNumber,
  heizungsart: z.enum(['gas', 'oel', 'sonstige'], { required_error: 'Heizungsart wählen' }),
  heizungsart_sonstige: optionalString,
  oeltank_liter_gesamt: optionalPositiveInteger,
  oeltank_anzahl: optionalPositiveInteger,
  oeltank_liter_aktuell: optionalNonNegativeInteger,
  oeltank_transport_beschreibung: optionalString,
  heizkoerper_typ: z.enum(['heizkoerper', 'fussbodenheizung', 'beides'], { required_error: 'Heizkörpertyp wählen' }),
  hat_erdung: z.boolean({ required_error: 'Bitte auswählen' }),
  alternative_1_vorhanden: z.boolean(),
  alternative_2_vorhanden: optionalBoolean,
  kunde_aufstellort_bestaetigt: z.literal(true, { errorMap: () => ({ message: 'Kundenbestätigung erforderlich' }) }),
  kunde_bestaetigung_vorname: z.string().min(1, 'Vorname erforderlich'),
  kunde_bestaetigung_nachname: z.string().min(1, 'Nachname erforderlich'),
  anzahl_duschen: requiredNonNegativeInteger(),
  hat_regendusche: z.boolean({ required_error: 'Bitte auswählen' }),
  anzahl_badewannen: requiredNonNegativeInteger(),
  check_raeume_gescannt: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_anzahl_raeume: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_aufstellort_besprochen: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_alle_bilder: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_heizkoerper_aufgenommen: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  bemerkungen: optionalString,
  anzahl_unbegehbare_raeume: z.preprocess(emptyToUndefined, z.number({ required_error: 'Bitte angeben', invalid_type_error: 'Bitte angeben' }).int('Bitte angeben').min(0, 'Bitte angeben').max(5, 'Maximal 5')),
  hat_pv_anlage: z.boolean({ required_error: 'Bitte auswählen' }),
  agb_akzeptiert: z.literal(true, { errorMap: () => ({ message: 'AGB müssen akzeptiert werden' }) }),
  distanz_ausseneinheit_kernloch: requiredNonNegativeNumber(),
  distanz_kernloch_innengeraet: requiredNonNegativeNumber(),
  anzahl_durchbrueche_kernloch: requiredNonNegativeInteger(),
  aufstellort_aenderung: z.boolean({ required_error: 'Bitte auswählen' }),
  distanz_alter_neuer_aufstellort: optionalNonNegativeNumber,
  raumscan_url: optionalString,
}).superRefine((data, ctx) => {
  // Conditional: Öl-Felder Pflicht bei heizungsart === 'oel'
  if (data.heizungsart === 'oel') {
    if (!data.oeltank_liter_gesamt) ctx.addIssue({ code: 'custom', path: ['oeltank_liter_gesamt'], message: 'Liter gesamt erforderlich' });
    if (!data.oeltank_anzahl) ctx.addIssue({ code: 'custom', path: ['oeltank_anzahl'], message: 'Anzahl Öltanks erforderlich' });
    if (data.oeltank_liter_aktuell == null) ctx.addIssue({ code: 'custom', path: ['oeltank_liter_aktuell'], message: 'Aktuelle Liter erforderlich' });
    if (!data.oeltank_transport_beschreibung) ctx.addIssue({ code: 'custom', path: ['oeltank_transport_beschreibung'], message: 'Transport-Beschreibung erforderlich' });
  }
  // Conditional: Sonstige Heizungsart
  if (data.heizungsart === 'sonstige' && !data.heizungsart_sonstige) {
    ctx.addIssue({ code: 'custom', path: ['heizungsart_sonstige'], message: 'Bitte Heizungsart angeben' });
  }
  // Conditional: Aufstellort-Änderung → Distanz Pflicht
  if (data.aufstellort_aenderung === true && !data.distanz_alter_neuer_aufstellort) {
    ctx.addIssue({ code: 'custom', path: ['distanz_alter_neuer_aufstellort'], message: 'Distanz erforderlich bei Aufstellort-Änderung' });
  }
  // Conditional: Heizungsraum verlegen → alle Anschluss-Felder Pflicht
  if (data.heizungsraum_verlegen === true) {
    const leitungen = ['vorlauf', 'ruecklauf', 'warmwasser', 'kaltwasser', 'zirkulation'] as const;
    for (const l of leitungen) {
      const vorhandenKey = `anschluss_${l}_vorhanden` as keyof typeof data;
      const distanzKey = `anschluss_${l}_distanz` as keyof typeof data;
      if (data[vorhandenKey] == null) ctx.addIssue({ code: 'custom', path: [vorhandenKey], message: 'Bitte auswählen' });
      if (data[distanzKey] == null || (data[distanzKey] as number) < 0) ctx.addIssue({ code: 'custom', path: [distanzKey], message: 'Distanz erforderlich' });
    }
  }
});

export type AufmassDraftData = z.infer<typeof aufmassDraftSchema>;
export type AufmassSubmitData = z.infer<typeof aufmassSubmitSchema>;

/** Form field names that are stored in the DB (excluding images and rooms) */
export const FORM_DB_FIELDS = Object.keys(aufmassDraftSchema.shape) as (keyof AufmassDraftData)[];
