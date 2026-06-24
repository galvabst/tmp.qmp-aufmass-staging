/**
 * Kontext-Hilfe pro Schritt (Material „helper text"-Prinzip).
 *
 * Statisch — kein KI-Call. Erklärt, was ein Feld bedeutet und was ein typischer
 * Wert ist. Wird im KI-Assistenten (Tab „Hilfe") angezeigt.
 */

export interface HelpItem {
  titel: string;
  text: string;
}

const STEP_HELP: Record<string, HelpItem[]> = {
  'Techniker-Daten': [
    { titel: 'Datum', text: 'Tag des Vor-Ort-Termins. Wird i. d. R. automatisch gesetzt.' },
  ],
  'Kundendaten': [
    { titel: 'Inbetriebnahme Heizung', text: 'Baujahr/Datum der bestehenden Heizung – grob reicht, falls kein Typenschild.' },
    { titel: 'Bauantrag', text: 'Datum des Bauantrags bestimmt die Baualtersklasse (Dämmstandard).' },
  ],
  'Gebäudedaten': [
    { titel: 'Beheizte Wohnfläche', text: 'Nur beheizte Fläche – ohne unbeheizten Keller/Garage. EFH typisch 100–200 m².' },
    { titel: 'Bewohner', text: 'Personen im Haushalt. Plausibel sind ~30–60 m² pro Person.' },
    { titel: 'Vorlauftemperatur', text: 'WP-tauglich meist ≤ 55 °C (Heizkörper) bzw. ≤ 45 °C (Fußbodenheizung).' },
    { titel: 'Verbrauch', text: '3-Jahres-Schnitt. Bei Öl in Litern – das System rechnet auf kWh um.' },
  ],
  'Heizungsraum': [
    { titel: 'Anschlüsse', text: 'Vor-/Rücklauf, Warm-/Kaltwasser, Zirkulation: Distanz in Metern zum Aufstellort.' },
  ],
  'Heizungsart & Heizanlage': [
    { titel: 'Öltank', text: 'Liter gesamt + aktueller Stand. Wichtig für Demontage/Transport.' },
  ],
  'Aufstellort': [
    { titel: 'KI-Foto-Check', text: 'Lade die 5 Pflicht-Ansichten – die KI prüft TA-Lärm, R290-Schutzbereich und Mindestabstände automatisch.' },
  ],
  'Sanitär': [
    { titel: 'Duschen / Badewannen', text: 'Anzahl im Haushalt. Mehr Badewannen als Bewohner ist ungewöhnlich.' },
  ],
  'Unbegehbare Räume': [
    { titel: 'Was zählt?', text: 'Räume, die du nicht scannen/betreten konntest. 0 = alle gescannt – die 0 bitte bewusst auswählen.' },
  ],
  'Checkliste': [
    { titel: 'Bestätigungen', text: 'Kurze Endkontrolle: Räume gescannt, Aufstellort besprochen, alle Fotos da.' },
  ],
};

export function helpForStep(title: string): HelpItem[] {
  return STEP_HELP[title] ?? [];
}
