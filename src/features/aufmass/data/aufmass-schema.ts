import { z } from 'zod';

const emptyToUndefined = (value: unknown) => {
  if (value === null || value === '') return undefined;
  if (typeof value === 'number' && Number.isNaN(value)) return undefined;
  return value;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().max(2000, 'Eingabe zu lang (max. 2000 Zeichen)').optional());
// Für SYSTEM-generierte Texte (KI-Zusammenfassungen/Empfehlungen) — kein Nutzer-
// Freitext, daher großzügiger Cap, damit eine lange KI-Antwort nicht abgeschnitten wird.
const optionalLongString = z.preprocess(emptyToUndefined, z.string().max(20000, 'Text zu lang').optional());
const optionalBoolean = z.preprocess(emptyToUndefined, z.boolean().optional());
// `.finite()` lehnt Infinity/-Infinity ab — z.number().min(0) allein lässt
// Infinity durch (Infinity >= 0), womit ein physikalisch unmöglicher Wert bis in
// die autarc-Payload / Heizlast-Logik rutschen könnte. Integer-Felder sind über
// `.int()` ohnehin Infinity-sicher (Number.isInteger(Infinity) === false).
const optionalNonNegativeNumber = z.preprocess(emptyToUndefined, z.number().finite().min(0).optional());
const optionalNonNegativeInteger = z.preprocess(emptyToUndefined, z.number().int().min(0).optional());
const optionalPositiveInteger = z.preprocess(emptyToUndefined, z.number().int().positive().optional());
const requiredNonNegativeNumber = (message = 'Bitte angeben') =>
  z.preprocess(emptyToUndefined, z.number({ required_error: message, invalid_type_error: message }).finite(message).min(0, message));
const requiredNonNegativeInteger = (message = 'Bitte angeben') =>
  z.preprocess(emptyToUndefined, z.number({ required_error: message, invalid_type_error: message }).int(message).min(0, message));

/** Echter Kalendertag im Format YYYY-MM-DD (fängt 2023-02-29, 2023-13-01, Tag 31 im 30-Tage-Monat). */
function istGueltigesDatum(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Jahr aus einem ISO-Datum (YYYY-MM-DD) als Zahl — die EINE Quelle der Wahrheit für
 * die Jahr-Extraktion (genutzt von aufmass-to-autarc, u-werte-plausibility,
 * aufmass-plausibility). Bewusst NICHT über `new Date().getFullYear()`: das
 * interpretiert den UTC-Mitternachts-Wert in lokaler Zeit und springt in Zeitzonen
 * westlich von UTC ein Jahr zurück ("2002-01-01" → 2001). Strenges YYYY-MM-DD-Match
 * (kein loses „beginnt mit 4 Ziffern"), damit Teil-/Falscheingaben nicht still ein
 * Jahr liefern. Liefert null bei Nicht-String oder ungültigem Format.
 */
export function yearFromIsoDate(d: unknown): number | null {
  if (typeof d !== 'string') return null;
  const m = /^(\d{4})-\d{2}-\d{2}/.exec(d);
  return m ? Number(m[1]) : null;
}

// Gebäudedaten-Enums (autarc-Mapping siehe aufmass-to-autarc.ts)
export const GEBAEUDETYP_WERTE = ['einfamilienhaus', 'doppelhaushaelfte', 'reihenhaus', 'reihenendhaus', 'mehrfamilienhaus', 'gewerbe'] as const;
export const ROHRSYSTEM_WERTE = ['einrohr', 'zweirohr', 'unbekannt'] as const;
export const VERGLASUNG_WERTE = ['einfach', 'zweifach', 'dreifach', 'zweifach_waermeschutz', 'dreifach_waermeschutz'] as const;

// ---- U-Werte / Gebäudehülle (geschichteter Aufbau) ----------------------
// Material NIE als Freitext erfassen → feste Auswahl + `andere` (+ optionale
// Notiz). Die Pflicht-/Plausibilitäts-/Haftungs-Logik läuft als Gate im Submit
// (wie PV/Foto), NICHT über das zod-Schema — daher hier alles optional mit
// Typ-/Bounds-Validierung. Enums exportiert für die UI.
export const MAUERWERK_MATERIAL_WERTE = ['vollziegel', 'hochlochziegel', 'kalksandstein', 'ytong_porenbeton', 'beton', 'bruchstein', 'gasbeton', 'andere'] as const;
export const DAEMMSTOFF_TYP_WERTE = ['mineralwolle', 'eps_styropor', 'xps', 'pur_pir', 'holzfaser', 'kork', 'schaumglas', 'keine', 'andere'] as const;
export const GEPRUEFT_PER_WERTE = ['gemessen', 'foto', 'kundenangabe', 'ki_abgeleitet'] as const;
export const DACHTYP_WERTE = ['satteldach', 'pultdach', 'walmdach', 'flachdach'] as const;
export const DACH_EINDECKUNG_WERTE = ['dachziegel_ton', 'dachziegel_beton', 'blech', 'schiefer', 'bitumen', 'andere'] as const;
export const FLACHDACH_ABDICHTUNG_WERTE = ['bitumen', 'pvc', 'tpo', 'andere'] as const;
export const BODEN_ART_WERTE = ['bodenplatte_erdberuehrt', 'kellerdecke_unbeheizt', 'kellerdecke_beheizt', 'unbekannt'] as const;
export const RAHMENMATERIAL_WERTE = ['kunststoff', 'holz', 'aluminium', 'holz_alu', 'andere'] as const;

/** Bounded optional number (0..max, endlich). */
const bnum = (max: number) => z.preprocess(emptyToUndefined, z.number().finite().min(0).max(max).optional());
/** Jahreszahl (Bau-/Dämmjahr) 1900..2100. */
const jahr = z.preprocess(emptyToUndefined, z.number().int().min(1900).max(2100).optional());

/** Außenwand-/Anbauwand-Schichtaufbau (von außen nach innen). */
const uWerteWandSchema = z.object({
  aussenputz_vorhanden: optionalBoolean,
  aussenputz_cm: bnum(10),
  armierung_vorhanden: optionalBoolean,
  daemmstoff_typ: z.enum(DAEMMSTOFF_TYP_WERTE).optional(),
  daemmstoff_cm: bnum(50),
  daemmstoff_jahr: jahr,
  mauerwerk_material: z.enum(MAUERWERK_MATERIAL_WERTE).optional(),
  mauerwerk_cm: bnum(100),
  innenputz_cm: bnum(10),
  geprueft_per: z.enum(GEPRUEFT_PER_WERTE).optional(),
  mauerwerk_notiz: optionalString,
  daemmstoff_notiz: optionalString,
});

const uWerteDachSchema = z.object({
  dachtyp: z.enum(DACHTYP_WERTE).optional(),
  eindeckung_material: z.enum(DACH_EINDECKUNG_WERTE).optional(),
  unterspannbahn_vorhanden: optionalBoolean,
  zwischensparren_daemmstoff_typ: z.enum(DAEMMSTOFF_TYP_WERTE).optional(),
  zwischensparren_cm: bnum(50),
  zwischensparren_jahr: jahr,
  aufdach_daemmstoff_typ: z.enum(DAEMMSTOFF_TYP_WERTE).optional(),
  aufdach_cm: bnum(50),
  aufdach_jahr: jahr,
  untersparren_cm: bnum(30),
  dampfsperre_vorhanden: optionalBoolean,
  flachdach_abdichtung: z.enum(FLACHDACH_ABDICHTUNG_WERTE).optional(),
  flachdach_gefaelle_prozent: bnum(45),
  geprueft_per: z.enum(GEPRUEFT_PER_WERTE).optional(),
  eindeckung_notiz: optionalString,
  daemmstoff_notiz: optionalString,
});

const uWerteBodenSchema = z.object({
  art: z.enum(BODEN_ART_WERTE).optional(),
  daemmung_typ: z.enum(DAEMMSTOFF_TYP_WERTE).optional(),
  daemmung_cm: bnum(40),
  daemmung_jahr: jahr,
  daemmung_notiz: optionalString,
  geprueft_per: z.enum(GEPRUEFT_PER_WERTE).optional(),
});

const uWerteFensterSchema = z.object({
  getauscht: optionalBoolean,
  tausch_jahr: jahr,
  rahmenmaterial: z.enum(RAHMENMATERIAL_WERTE).optional(),
  rahmen_notiz: optionalString,
  u_wert: z.preprocess(emptyToUndefined, z.number().finite().min(0.4).max(3.0).optional()),
  originalrechnung_url: optionalString,
});

const uWerteAnbauSchema = z.object({
  vorhanden: optionalBoolean,
  baujahr: jahr,
  wand: uWerteWandSchema.optional(),
  betroffene_raeume_notiz: optionalString,
});

/** Gesamter U-Werte-Block (Gebäudehülle, geschichtet). Alles optional auf
 *  Schema-Ebene; Pflicht-/Challenge-Logik im Submit-Gate (checkUWerte*). */
export const uWerteSchema = z.object({
  aussenwand: uWerteWandSchema.optional(),
  dach: uWerteDachSchema.optional(),
  unten: uWerteBodenSchema.optional(),
  fenster: uWerteFensterSchema.optional(),
  anbau: uWerteAnbauSchema.optional(),
});

export type UWerteData = z.infer<typeof uWerteSchema>;

/** Zod schema for draft saving (all optional) */
export const aufmassDraftSchema = z.object({
  techniker_name: optionalString,
  techniker_telefon: optionalString,
  thermocheck_datum: optionalString,
  heizung_inbetriebnahme_datum: optionalString,
  heizung_funktionstuechtig: optionalBoolean,
  bauantrag_datum: optionalString,
  fossile_brennstoffe_nach_austausch: optionalBoolean,
  // Gebäudedaten (autarc-Sync)
  gebaeudetyp: z.enum(GEBAEUDETYP_WERTE).optional(),
  beheizte_wohnflaeche_m2: optionalNonNegativeNumber,
  anzahl_bewohner: optionalPositiveInteger,
  anzahl_etagen: optionalPositiveInteger,
  hat_denkmalschutz: optionalBoolean,
  durchschnittsverbrauch_3_jahre: optionalNonNegativeNumber,
  fassade_gedaemmt: optionalBoolean,
  dach_gedaemmt: optionalBoolean,
  rohrsystem: z.enum(ROHRSYSTEM_WERTE).optional(),
  verglasung: z.enum(VERGLASUNG_WERTE).optional(),
  hat_kamin: optionalBoolean,
  hat_solarthermie: optionalBoolean,
  vorlauftemperatur: optionalNonNegativeNumber,
  ruecklauftemperatur: optionalNonNegativeNumber,
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
  aufstellort_ai_pruefung_id: optionalString,
  aufstellort_ai_empfehlung: optionalLongString,
  aufstellort_ai_zusammenfassung: optionalLongString,
  // U-Werte / Gebäudehülle (geschichtet) — Pflicht-/Challenge-Logik im Submit-Gate.
  u_werte: uWerteSchema.optional(),
  u_werte_haftung_bestaetigt: optionalBoolean,
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
  // Gebäudedaten (autarc-Sync) — Pflicht im Submit
  gebaeudetyp: z.enum(GEBAEUDETYP_WERTE, { required_error: 'Gebäudetyp wählen' }),
  beheizte_wohnflaeche_m2: requiredNonNegativeNumber('Wohnfläche erforderlich'),
  anzahl_bewohner: requiredNonNegativeInteger('Bewohnerzahl erforderlich'),
  anzahl_etagen: requiredNonNegativeInteger('Etagenzahl erforderlich'),
  hat_denkmalschutz: z.boolean({ required_error: 'Bitte auswählen' }),
  durchschnittsverbrauch_3_jahre: requiredNonNegativeNumber('Verbrauch erforderlich'),
  fassade_gedaemmt: z.boolean({ required_error: 'Bitte auswählen' }),
  dach_gedaemmt: z.boolean({ required_error: 'Bitte auswählen' }),
  rohrsystem: z.enum(ROHRSYSTEM_WERTE, { required_error: 'Rohrsystem wählen' }),
  verglasung: z.enum(VERGLASUNG_WERTE, { required_error: 'Verglasung wählen' }),
  hat_kamin: z.boolean({ required_error: 'Bitte auswählen' }),
  hat_solarthermie: z.boolean({ required_error: 'Bitte auswählen' }),
  vorlauftemperatur: requiredNonNegativeNumber('Vorlauftemperatur erforderlich'),
  ruecklauftemperatur: requiredNonNegativeNumber('Rücklauftemperatur erforderlich'),
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
  aufstellort_ai_pruefung_id: optionalString,
  aufstellort_ai_empfehlung: optionalLongString,
  aufstellort_ai_zusammenfassung: optionalLongString,
  // U-Werte / Gebäudehülle (geschichtet) — Pflicht-/Challenge-Logik im Submit-Gate
  // (checkUWertePlausibilitaet + UWerte-Gate in handleSubmit), nicht hier, damit
  // die bestehende Wasserdicht-Suite (VALID_BASELINE ohne u_werte) gültig bleibt.
  u_werte: uWerteSchema.optional(),
  u_werte_haftung_bestaetigt: optionalBoolean,
}).superRefine((data, ctx) => {
  // Conditional: Öl-Felder Pflicht bei heizungsart === 'oel'
  if (data.heizungsart === 'oel') {
    if (!data.oeltank_liter_gesamt) ctx.addIssue({ code: 'custom', path: ['oeltank_liter_gesamt'], message: 'Liter gesamt erforderlich' });
    if (!data.oeltank_anzahl) ctx.addIssue({ code: 'custom', path: ['oeltank_anzahl'], message: 'Anzahl Öltanks erforderlich' });
    if (data.oeltank_liter_aktuell == null) ctx.addIssue({ code: 'custom', path: ['oeltank_liter_aktuell'], message: 'Aktuelle Liter erforderlich' });
    // Pflicht-Freitext darf kein Platzhalter sein („-", „?", „k.A.", nur Ziffern/
    // Whitespace) — sonst rutscht eine faktisch leere Pflichtangabe durch.
    if (!data.oeltank_transport_beschreibung)
      ctx.addIssue({ code: 'custom', path: ['oeltank_transport_beschreibung'], message: 'Transport-Beschreibung erforderlich' });
    else if (!/\p{L}/u.test(data.oeltank_transport_beschreibung))
      ctx.addIssue({ code: 'custom', path: ['oeltank_transport_beschreibung'], message: 'Bitte die Öltank-Transportsituation aussagekräftig beschreiben' });
  }
  // Conditional: Sonstige Heizungsart — Pflichtangabe darf kein Platzhalter sein.
  if (data.heizungsart === 'sonstige') {
    if (!data.heizungsart_sonstige)
      ctx.addIssue({ code: 'custom', path: ['heizungsart_sonstige'], message: 'Bitte Heizungsart angeben' });
    else if (!/\p{L}/u.test(data.heizungsart_sonstige))
      ctx.addIssue({ code: 'custom', path: ['heizungsart_sonstige'], message: 'Bitte eine gültige Heizungsart angeben' });
  }
  // Format: Kundenbestätigungs-Name muss echte Buchstaben enthalten (nicht nur
  // „-", „?", Ziffern oder Whitespace) — dieselbe Härtung wie techniker_name,
  // sonst gilt eine sinnlose „Unterschrift" als gültige unabhängige Freigabe.
  for (const f of ['kunde_bestaetigung_vorname', 'kunde_bestaetigung_nachname'] as const) {
    const val = data[f];
    if (typeof val === 'string' && val !== '' && !/\p{L}/u.test(val)) {
      ctx.addIssue({ code: 'custom', path: [f], message: 'Bitte einen gültigen Namen eingeben' });
    }
  }
  // Conditional: Aufstellort-Änderung → Distanz Pflicht (0 ist gültig → Soft-Plausibilität greift)
  if (data.aufstellort_aenderung === true && data.distanz_alter_neuer_aufstellort == null) {
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
  // Format: Techniker-Name muss mindestens einen Buchstaben enthalten (nicht nur
  // Whitespace/Ziffern/Sonderzeichen — fängt Telefonnummer/Leerzeichen im Namensfeld).
  if (data.techniker_name != null && !/\p{L}/u.test(data.techniker_name)) {
    ctx.addIssue({ code: 'custom', path: ['techniker_name'], message: 'Bitte einen gültigen Namen eingeben' });
  }
  // Format: Telefon nur erlaubte Zeichen + 6–16 Ziffern (fängt zu kurz,
  // Buchstaben, nur Vorwahl, sowie über E.164 hinaus). Inhalts-Muster erlaubt.
  if (data.techniker_telefon != null) {
    const tel = data.techniker_telefon;
    const ziffern = (tel.match(/\d/g) ?? []).length;
    if (!/^[+()/\d\s-]+$/.test(tel) || ziffern < 6 || ziffern > 16) {
      ctx.addIssue({ code: 'custom', path: ['techniker_telefon'], message: 'Bitte eine gültige Telefonnummer eingeben' });
    }
  }
  // Datums-Gültigkeit: echter Kalendertag (das Datenmodell darf kein 2023-13-01
  // / 29.02. im Nicht-Schaltjahr akzeptieren, auch wenn es nicht über den Picker kommt).
  for (const f of ['thermocheck_datum', 'heizung_inbetriebnahme_datum', 'bauantrag_datum'] as const) {
    const val = data[f];
    if (typeof val === 'string' && val !== '' && !istGueltigesDatum(val)) {
      ctx.addIssue({ code: 'custom', path: [f], message: 'Bitte ein gültiges Datum wählen' });
    }
  }
});

export type AufmassDraftData = z.infer<typeof aufmassDraftSchema>;
export type AufmassSubmitData = z.infer<typeof aufmassSubmitSchema>;

/** Form field names that are stored in the DB (excluding images and rooms) */
export const FORM_DB_FIELDS = Object.keys(aufmassDraftSchema.shape) as (keyof AufmassDraftData)[];
