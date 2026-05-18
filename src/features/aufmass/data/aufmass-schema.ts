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
  heizungsart_sonstige: z.string().optional(),
  oeltank_liter_gesamt: z.number().int().positive().optional(),
  oeltank_anzahl: z.number().int().positive().optional(),
  oeltank_liter_aktuell: z.number().int().min(0).optional(),
  oeltank_transport_beschreibung: z.string().optional(),
  heizkoerper_typ: z.enum(['heizkoerper', 'fussbodenheizung', 'beides']).optional(),
  hat_erdung: z.boolean().optional(),
  alternative_1_vorhanden: z.boolean().optional(),
  alternative_2_vorhanden: z.boolean().optional(),
  kunde_aufstellort_bestaetigt: z.boolean().optional(),
  kunde_bestaetigung_vorname: z.string().optional(),
  kunde_bestaetigung_nachname: z.string().optional(),
  anzahl_duschen: z.number().int().min(0).optional(),
  hat_regendusche: z.boolean().optional(),
  anzahl_badewannen: z.number().int().min(0).optional(),
  check_raeume_gescannt: z.boolean().optional(),
  check_anzahl_raeume: z.boolean().optional(),
  check_aufstellort_besprochen: z.boolean().optional(),
  check_alle_bilder: z.boolean().optional(),
  check_heizkoerper_aufgenommen: z.boolean().optional(),
  bemerkungen: z.string().optional(),
  anzahl_unbegehbare_raeume: z.number().int().min(0).max(5).optional(),
  hat_pv_anlage: z.boolean().optional(),
  agb_akzeptiert: z.boolean().optional(),
  distanz_ausseneinheit_kernloch: z.number().min(0).optional(),
  distanz_kernloch_innengeraet: z.number().min(0).optional(),
  anzahl_durchbrueche_kernloch: z.number().int().min(0).optional(),
  aufstellort_aenderung: z.boolean().optional(),
  distanz_alter_neuer_aufstellort: z.number().min(0).optional(),
  raumscan_url: z.string().optional(),
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
  anschluss_vorlauf_vorhanden: z.boolean().optional(),
  anschluss_vorlauf_distanz: z.number().min(0).optional(),
  anschluss_ruecklauf_vorhanden: z.boolean().optional(),
  anschluss_ruecklauf_distanz: z.number().min(0).optional(),
  anschluss_warmwasser_vorhanden: z.boolean().optional(),
  anschluss_warmwasser_distanz: z.number().min(0).optional(),
  anschluss_kaltwasser_vorhanden: z.boolean().optional(),
  anschluss_kaltwasser_distanz: z.number().min(0).optional(),
  anschluss_zirkulation_vorhanden: z.boolean().optional(),
  anschluss_zirkulation_distanz: z.number().min(0).optional(),
  heizungsart: z.enum(['gas', 'oel', 'sonstige'], { required_error: 'Heizungsart wählen' }),
  heizungsart_sonstige: z.string().optional(),
  oeltank_liter_gesamt: z.number().int().positive().optional(),
  oeltank_anzahl: z.number().int().positive().optional(),
  oeltank_liter_aktuell: z.number().int().min(0).optional(),
  oeltank_transport_beschreibung: z.string().optional(),
  heizkoerper_typ: z.enum(['heizkoerper', 'fussbodenheizung', 'beides'], { required_error: 'Heizkörpertyp wählen' }),
  hat_erdung: z.boolean({ required_error: 'Bitte auswählen' }),
  alternative_1_vorhanden: z.boolean(),
  alternative_2_vorhanden: z.boolean().optional(),
  kunde_aufstellort_bestaetigt: z.literal(true, { errorMap: () => ({ message: 'Kundenbestätigung erforderlich' }) }),
  kunde_bestaetigung_vorname: z.string().min(1, 'Vorname erforderlich'),
  kunde_bestaetigung_nachname: z.string().min(1, 'Nachname erforderlich'),
  anzahl_duschen: z.number().int().min(0, 'Bitte angeben'),
  hat_regendusche: z.boolean({ required_error: 'Bitte auswählen' }),
  anzahl_badewannen: z.number().int().min(0, 'Bitte angeben'),
  check_raeume_gescannt: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_anzahl_raeume: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_aufstellort_besprochen: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_alle_bilder: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  check_heizkoerper_aufgenommen: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
  bemerkungen: z.string().optional(),
  anzahl_unbegehbare_raeume: z.number().int().min(0).max(5),
  hat_pv_anlage: z.boolean({ required_error: 'Bitte auswählen' }),
  agb_akzeptiert: z.literal(true, { errorMap: () => ({ message: 'AGB müssen akzeptiert werden' }) }),
  distanz_ausseneinheit_kernloch: z.number().min(0, 'Bitte angeben'),
  distanz_kernloch_innengeraet: z.number().min(0, 'Bitte angeben'),
  anzahl_durchbrueche_kernloch: z.number().int().min(0, 'Bitte angeben'),
  aufstellort_aenderung: z.boolean({ required_error: 'Bitte auswählen' }),
  distanz_alter_neuer_aufstellort: z.number().min(0).optional(),
  raumscan_url: z.string().optional(),
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
