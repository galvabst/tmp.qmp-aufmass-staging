/** Labels und Mindestanzahl für VOT-Bild-Kategorien */

export type VotBildKategorie =
  | 'hausschuhe' | 'treppenabgang' | 'eingang_heizungsraum'
  | 'heizungsraum' | 'heizungsraum_extra' | 'heizanlage' | 'oeltank' | 'heizungsanlage'
  | 'heizkreisverteiler' | 'heizkoerper' | 'zaehlerschrank' | 'sicherungen' | 'zaehler'
  | 'erdung' | 'hausanschlusskasten' | 'aufstellort_option_1' | 'aufstellort_umgebung_1'
  | 'aufstellort_alt_1' | 'aufstellort_umgebung_alt_1' | 'aufstellort_alt_2'
  | 'aufstellort_umgebung_alt_2' | 'unterschrift_aufstellort' | 'unterschrift_techniker'
  | 'unterschrift_kunde_final' | 'pv_anlage' | 'unbegehbarer_raum'
  // U-Werte / Gebäudehülle (geschichteter Aufbau)
  | 'wanddicke_fenster_meterstab' | 'wandaufbau' | 'dachaufbau' | 'bodenaufbau' | 'fenster_originalrechnung'
  // PV-Aufmass Kategorien
  | 'pv_dach' | 'pv_drohne' | 'pv_sparrenabstand' | 'pv_dachziegel'
  | 'pv_hindernisse' | 'pv_geruest_oeffentlich' | 'pv_blitzschutz'
  // Bewertungsnachweis
  | 'bewertung_nachweis';

interface KategorieConfig {
  label: string;
  minAnzahl: number;
  hinweis?: string;
  /** Vertragsstrafe in € bei Verstoß (falsches/dupliziertes Foto). Nur dort
   *  gesetzt, wo ein Abzug vereinbart ist (z. B. Hausschuhe-Pflicht). */
  abzugEuro?: number;
}

export const BILD_KATEGORIEN: Record<VotBildKategorie, KategorieConfig> = {
  hausschuhe: { label: 'Galvanek-Hausschuhe', minAnzahl: 1, hinweis: 'Foto deiner Hausschuhe beim Kunden', abzugEuro: 10 },
  treppenabgang: { label: 'Treppenabgang', minAnzahl: 4, hinweis: 'Von oben, unten, links, rechts' },
  eingang_heizungsraum: { label: 'Eingang Heizungsraum', minAnzahl: 3, hinweis: 'Von außen, von innen, Türbreite mit Meterstab' },
  heizungsraum: { label: 'Heizungsraum', minAnzahl: 1, hinweis: 'Fotos in alle Himmelsrichtungen, 1 Bild mit Meterstab' },
  heizungsraum_extra: { label: 'Heizungsraum (Extra)', minAnzahl: 1 },
  heizanlage: { label: 'Heizanlage', minAnzahl: 2, hinweis: 'Heizanlage + Typenschild' },
  oeltank: { label: 'Öltank', minAnzahl: 3, hinweis: 'Typenschild, alle Öltanks, kompletter Raum' },
  heizungsanlage: { label: 'Heizungsanlage', minAnzahl: 3 },
  heizkreisverteiler: { label: 'Heizkreisverteiler', minAnzahl: 1 },
  heizkoerper: { label: 'Heizkörper', minAnzahl: 1, hinweis: 'Alle Heizkörper fotografieren!' },
  zaehlerschrank: { label: 'Zählerschrank', minAnzahl: 3, hinweis: 'Offen, geschlossen, mit Umgebung' },
  sicherungen: { label: 'Sicherungen', minAnzahl: 2, hinweis: 'Sicherungen im Detail' },
  zaehler: { label: 'Zähler', minAnzahl: 1, hinweis: 'Zählernummer muss erkennbar sein' },
  erdung: { label: 'Erdung', minAnzahl: 1, hinweis: 'Potentialausgleich' },
  hausanschlusskasten: { label: 'Hausanschlusskasten (HAK)', minAnzahl: 1 },
  aufstellort_option_1: { label: '1. Option Aufstellort', minAnzahl: 3 },
  aufstellort_umgebung_1: { label: 'Umgebung 1. Option', minAnzahl: 3 },
  aufstellort_alt_1: { label: '1. Alternative Aufstellort', minAnzahl: 3 },
  aufstellort_umgebung_alt_1: { label: 'Umgebung 1. Alternative', minAnzahl: 3 },
  aufstellort_alt_2: { label: '2. Alternative Aufstellort', minAnzahl: 3 },
  aufstellort_umgebung_alt_2: { label: 'Umgebung 2. Alternative', minAnzahl: 3 },
  unterschrift_aufstellort: { label: 'Unterschrift Aufstellort', minAnzahl: 1 },
  unterschrift_techniker: { label: 'Unterschrift Techniker', minAnzahl: 1 },
  unterschrift_kunde_final: { label: 'Unterschrift Kunde', minAnzahl: 1 },
  pv_anlage: { label: 'PV-Anlage', minAnzahl: 1 },
  unbegehbarer_raum: { label: 'Unbegehbarer Raum', minAnzahl: 1 },
  // U-Werte / Gebäudehülle — Nachweis-Fotos (Wanddicke/Aufbau/Fenster-Rechnung)
  wanddicke_fenster_meterstab: { label: 'Wanddicke (Meterstab im Fenster)', minAnzahl: 1, hinweis: 'Fenster öffnen, Meterstab/Zollstock in die Laibung halten, Wanddicke ablesbar fotografieren' },
  wandaufbau: { label: 'Wandaufbau (optional)', minAnzahl: 0, hinweis: 'Nur falls sichtbar — z. B. an offener Fensterlaibung oder in der Bauphase. Sonst überspringen (Wanddicke deckt der Meterstab-Nachweis ab, der Aufbau die Auswahl oben).' },
  dachaufbau: { label: 'Dachaufbau (optional)', minAnzahl: 0, hinweis: 'Nur falls zugänglich — Dachboden mit sichtbaren Sparren/Dämmung. Sonst überspringen.' },
  bodenaufbau: { label: 'Bodenaufbau (optional)', minAnzahl: 0, hinweis: 'Falls sichtbar: Bodenplatte / Kellerdecke' },
  fenster_originalrechnung: { label: 'Fenster-Originalrechnung', minAnzahl: 1, hinweis: 'Rechnung/Datenblatt der getauschten Fenster (U-Wert-Nachweis)' },
  // PV-Aufmass Kategorien
  pv_dach: { label: 'Bilder vom Dach', minAnzahl: 3, hinweis: 'Alle Hindernisse müssen gut zu sehen sein, Bilder müssen für Modulplanung nutzbar sein' },
  pv_drohne: { label: 'Drohnenfotos vom Dach', minAnzahl: 1 },
  pv_sparrenabstand: { label: 'Sparrenabstand-Messung', minAnzahl: 1, hinweis: 'Messung des Abstands zwischen den Sparren' },
  pv_dachziegel: { label: 'Dachziegel (vorne/hinten)', minAnzahl: 2, hinweis: 'Vorderseite und Rückseite, idealerweise mit Maßband' },
  pv_hindernisse: { label: 'Hindernisse Gerüst', minAnzahl: 1, hinweis: '1-2 Fotos der Hindernisse für die Gerüstplanung' },
  pv_geruest_oeffentlich: { label: 'Gerüst öffentl. Fläche', minAnzahl: 1, hinweis: 'Bilder vom geplanten Gerüststandort auf öffentlicher Fläche' },
  pv_blitzschutz: { label: 'Blitzschutzanlage', minAnzahl: 1, hinweis: 'Bilder von der Blitzschutzanlage' },
  // Bewertungsnachweis (optional)
  bewertung_nachweis: { label: 'Bewertungsnachweis', minAnzahl: 0, hinweis: 'Screenshot der positiven Google- oder Trustpilot-Bewertung des Kunden' },
};

