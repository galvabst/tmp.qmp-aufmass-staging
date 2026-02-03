import { 
  OnboardingStepConfig, 
  OnboardingProduct, 
  EquipmentItem, 
  AkademieModul,
  AkademieHauptmodul,
  CoachingSlot,
  ApplicantProfile,
  OnboardingState,
  STEP_ORDER,
} from '@/types/onboarding';

// Schritt-Konfigurationen
export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'profil',
    label: 'Profil prüfen',
    description: 'Überprüfe deine Daten und lade dein Profilfoto hoch',
    icon: 'user',
  },
  {
    id: 'dokumente',
    label: 'Dokumente',
    description: 'Lade deinen Gewerbeschein hoch',
    icon: 'file-text',
  },
  {
    id: 'bestellungen',
    label: 'Bestellungen',
    description: 'Bestelle deine Pflichtausrüstung',
    icon: 'shopping-cart',
  },
  {
    id: 'equipment',
    label: 'Equipment',
    description: 'Prüfe dein Equipment: Drohne & iPhone',
    icon: 'smartphone',
  },
  {
    id: 'akademie',
    label: 'Akademie',
    description: 'Absolviere die Pflichtschulungen',
    icon: 'graduation-cap',
  },
  {
    id: 'nachweise',
    label: 'Nachweise',
    description: 'Bestätige den Erhalt deiner Ausstattung',
    icon: 'check-square',
  },
  {
    id: 'coaching',
    label: 'Coaching',
    description: 'Buche deine Praxis-Begleitung',
    icon: 'users',
  },
];

// Mock-Produkte (später aus DB: thermocheck.onboarding_products)
export const MOCK_PRODUCTS: OnboardingProduct[] = [
  {
    id: 'oberteil',
    name: 'Thermocheck Oberteil',
    beschreibung: 'Wähle dein Oberteil: T-Shirt, Poloshirt oder beides',
    preisNetto: 0,
    preisBrutto: 0, // Preis aus DB
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    bildUrl: '/placeholder.svg',
    externLink: 'https://shop.thermocheck.de/oberteil',
    pflicht: true,
    reihenfolge: 1,
  },
  {
    id: 'schlappen',
    name: 'Thermocheck Hausschuhe',
    beschreibung: 'Bequeme Hausschuhe für Kundenbesuche',
    preisNetto: 0,
    preisBrutto: 0,
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    bildUrl: '/placeholder.svg',
    externLink: 'https://shop.thermocheck.de/schlappen',
    pflicht: true,
    reihenfolge: 2,
  },
  {
    id: 'pullover',
    name: 'Thermocheck Pullover',
    beschreibung: 'Warme Arbeitskleidung für kalte Tage',
    preisNetto: 0,
    preisBrutto: 0,
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    bildUrl: '/placeholder.svg',
    // bildUrls werden dynamisch in OrdersStep gesetzt (wegen ES6 Import)
    externLink: 'https://shop.thermocheck.de/pullover',
    pflicht: true,
    reihenfolge: 3,
  },
  {
    id: 'ausweiskarte',
    name: 'Thermocheck Ausweiskarte',
    beschreibung: 'Offizielle Ausweiskarte für Kundenbesuche',
    preisNetto: 0,
    preisBrutto: 0,
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    bildUrl: '/placeholder.svg',
    externLink: 'https://shop.thermocheck.de/ausweiskarte',
    pflicht: true,
    reihenfolge: 4,
  },
  {
    id: 'scanner-lizenz',
    name: 'Room Scanner Lizenz',
    beschreibung: 'Professional 3D-Scanning Software für iPhone LiDAR',
    preisNetto: 167.23,
    preisBrutto: 199.00,
    preisTyp: 'monatlich',
    produktTyp: 'lizenz',
    bildUrl: '/placeholder.svg',
    externLink: 'https://shop.thermocheck.de/scanner-lizenz',
    pflicht: true,
    reihenfolge: 5,
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    beschreibung: 'Deine @galvanic-bau.de E-Mail-Adresse',
    preisNetto: 29.40,
    preisBrutto: 34.99,
    preisTyp: 'monatlich',
    produktTyp: 'lizenz',
    bildUrl: '/placeholder.svg',
    externLink: 'https://shop.thermocheck.de/workspace',
    pflicht: true,
    reihenfolge: 6,
  },
];

// Mock-Equipment Items
export const MOCK_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'drohne',
    name: 'Drohne mit Kamera',
    beschreibung: 'Für Dachaufnahmen und Luftbilder',
    hatEigenes: false,
    nachweisPflicht: true,
    mietLink: 'https://drohnen-mieten.de', // Placeholder - später anpassen
    kaufLink: 'https://drohnen-kaufen.de', // Placeholder - später anpassen
  },
  {
    id: 'iphone-lidar',
    name: 'iPhone mit LiDAR',
    beschreibung: 'iPhone 12 Pro oder neuer für 3D-Scans',
    hatEigenes: false,
    nachweisPflicht: false, // Nur Bestätigung
    mietLink: 'https://iphone-mieten.de', // Placeholder - später anpassen
    kaufLink: 'https://apple.com/de/shop/buy-iphone', // Placeholder - später anpassen
  },
];

// Mock-Akademie Module (Legacy - für Abwärtskompatibilität)
export const MOCK_AKADEMIE_MODULE: AkademieModul[] = [
  {
    id: 'modul-1',
    titel: 'Einführung in Thermocheck',
    beschreibung: 'Grundlagen und Unternehmenskultur',
    videoUrl: 'https://example.com/video1',
    dauerMinuten: 15,
    reihenfolge: 1,
    abgeschlossen: false,
  },
];

// NEU: Hierarchische Akademie-Struktur mit 13 Hauptmodulen (0-12)
export const MOCK_AKADEMIE_HAUPTMODULE: AkademieHauptmodul[] = [
  {
    id: 'modul-0',
    titel: 'Willkommen & Orientierung',
    beschreibung: 'Ziel der Akademie und Lernpfad',
    reihenfolge: 0,
    unterpunkte: [
      { id: 'up-0-1', titel: 'Ziel der Akademie', beschreibung: 'Wofür qualifizieren wir?', videoUrl: '', dauerMinuten: 5, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-0-2', titel: 'Rolle im Gesamtprozess', beschreibung: 'Schnittstellen und Erwartungen', videoUrl: '', dauerMinuten: 5, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-0-3', titel: 'Lernpfad & Prüfungen', beschreibung: 'Ablauf und Freigaben (Level-Modell)', videoUrl: '', dauerMinuten: 5, reihenfolge: 3, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-1',
    titel: 'Grundlagen: Thermocheck verstehen',
    beschreibung: 'Was ist Thermocheck und was nicht',
    reihenfolge: 1,
    unterpunkte: [
      { id: 'up-1-1', titel: 'Was ist ein Thermocheck?', beschreibung: 'Definition und Abgrenzung', videoUrl: '', dauerMinuten: 8, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-1-2', titel: 'Einsatzbereiche & Nutzen', beschreibung: 'Wo und warum Thermochecks?', videoUrl: '', dauerMinuten: 7, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-1-3', titel: 'Grenzen erkennen', beschreibung: 'Wann ist ein Thermocheck nicht geeignet?', videoUrl: '', dauerMinuten: 6, reihenfolge: 3, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-2',
    titel: 'Service-Professionalität',
    beschreibung: 'Auftreten, Kommunikation, Erwartungsmanagement',
    reihenfolge: 2,
    unterpunkte: [
      { id: 'up-2-1', titel: 'Kundenkommunikation', beschreibung: 'Professionelle Gesprächsführung', videoUrl: '', dauerMinuten: 10, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-2-2', titel: 'Auftreten & Erscheinung', beschreibung: 'Der erste Eindruck zählt', videoUrl: '', dauerMinuten: 8, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-2-3', titel: 'Erwartungsmanagement', beschreibung: 'Versprechen einhalten', videoUrl: '', dauerMinuten: 7, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-2-4', titel: 'Umgang mit schwierigen Situationen', beschreibung: 'Beschwerden professionell lösen', videoUrl: '', dauerMinuten: 12, reihenfolge: 4, abgeschlossen: false },
      { id: 'up-2-5', titel: 'Feedback annehmen', beschreibung: 'Konstruktive Kritik nutzen', videoUrl: '', dauerMinuten: 5, reihenfolge: 5, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-3',
    titel: 'Sicherheit, Regeln & Compliance',
    beschreibung: 'Arbeitssicherheit, Datenschutz, Eskalation',
    reihenfolge: 3,
    unterpunkte: [
      { id: 'up-3-1', titel: 'Arbeitssicherheit Basics', beschreibung: 'Gefahren erkennen und vermeiden', videoUrl: '', dauerMinuten: 10, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-3-2', titel: 'Datenschutz (DSGVO)', beschreibung: 'Kundendaten schützen', videoUrl: '', dauerMinuten: 8, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-3-3', titel: 'Drohnen-Regeln', beschreibung: 'Rechtliche Grundlagen Drohnenflug', videoUrl: '', dauerMinuten: 12, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-3-4', titel: 'Eskalationspfade', beschreibung: 'Wann und wie eskalieren?', videoUrl: '', dauerMinuten: 6, reihenfolge: 4, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-4',
    titel: 'Terminvorbereitung',
    beschreibung: 'Briefing, Equipment-Check, Zeitplanung',
    reihenfolge: 4,
    unterpunkte: [
      { id: 'up-4-1', titel: 'Auftragsbriefing', beschreibung: 'Informationen vorab sammeln', videoUrl: '', dauerMinuten: 8, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-4-2', titel: 'Equipment-Checkliste', beschreibung: 'Alles dabei? Funktionscheck', videoUrl: '', dauerMinuten: 6, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-4-3', titel: 'Routenplanung', beschreibung: 'Pünktlich ankommen', videoUrl: '', dauerMinuten: 5, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-4-4', titel: 'Zeitplanung', beschreibung: 'Realistische Zeitfenster', videoUrl: '', dauerMinuten: 7, reihenfolge: 4, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-5',
    titel: 'Ablauf vor Ort',
    beschreibung: 'Phasenmodell, Zeitmanagement',
    reihenfolge: 5,
    unterpunkte: [
      { id: 'up-5-1', titel: 'Ankunft & Begrüßung', beschreibung: 'Die ersten Minuten', videoUrl: '', dauerMinuten: 6, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-5-2', titel: 'Begehung & Orientierung', beschreibung: 'Objekt kennenlernen', videoUrl: '', dauerMinuten: 8, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-5-3', titel: 'Zeitmanagement vor Ort', beschreibung: 'Effizient arbeiten', videoUrl: '', dauerMinuten: 7, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-5-4', titel: 'Phasenmodell Thermocheck', beschreibung: 'Strukturierter Ablauf', videoUrl: '', dauerMinuten: 10, reihenfolge: 4, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-6',
    titel: 'Datenerhebung',
    beschreibung: 'Qualität, Vollständigkeit, Dokumentation',
    reihenfolge: 6,
    unterpunkte: [
      { id: 'up-6-1', titel: 'Thermografiebilder erstellen', beschreibung: 'Professionelle Wärmebilder', videoUrl: '', dauerMinuten: 15, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-6-2', titel: '3D-Scan mit LiDAR', beschreibung: 'Raumerfassung iPhone', videoUrl: '', dauerMinuten: 12, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-6-3', titel: 'Drohnenaufnahmen', beschreibung: 'Dach und Außenbereich', videoUrl: '', dauerMinuten: 10, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-6-4', titel: 'Messwerte dokumentieren', beschreibung: 'Temperaturen, Feuchtigkeit', videoUrl: '', dauerMinuten: 8, reihenfolge: 4, abgeschlossen: false },
      { id: 'up-6-5', titel: 'Qualitätskriterien', beschreibung: 'Wann sind Daten gut genug?', videoUrl: '', dauerMinuten: 7, reihenfolge: 5, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-7',
    titel: 'Tool- & Dokumentationsworkflow',
    beschreibung: 'Datenerfassung, Upload, Versionierung',
    reihenfolge: 7,
    unterpunkte: [
      { id: 'up-7-1', titel: 'App-Workflow', beschreibung: 'Thermocheck-App richtig nutzen', videoUrl: '', dauerMinuten: 10, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-7-2', titel: 'Daten-Upload', beschreibung: 'Bilder und Scans hochladen', videoUrl: '', dauerMinuten: 8, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-7-3', titel: 'Checklisten abarbeiten', beschreibung: 'Nichts vergessen', videoUrl: '', dauerMinuten: 6, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-7-4', titel: 'Fehlerbehebung', beschreibung: 'Häufige Probleme lösen', videoUrl: '', dauerMinuten: 7, reihenfolge: 4, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-8',
    titel: 'Abschluss beim Kunden',
    beschreibung: 'Zusammenfassung, Next Steps, Verabschiedung',
    reihenfolge: 8,
    unterpunkte: [
      { id: 'up-8-1', titel: 'Ergebnisse zusammenfassen', beschreibung: 'Was wurde erfasst?', videoUrl: '', dauerMinuten: 8, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-8-2', titel: 'Nächste Schritte erklären', beschreibung: 'Was passiert nach dem Termin?', videoUrl: '', dauerMinuten: 6, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-8-3', titel: 'Fragen beantworten', beschreibung: 'Häufige Kundenfragen', videoUrl: '', dauerMinuten: 7, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-8-4', titel: 'Professionelle Verabschiedung', beschreibung: 'Positiver Abschluss', videoUrl: '', dauerMinuten: 5, reihenfolge: 4, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-9',
    titel: 'Sonderfälle & Eskalationen',
    beschreibung: 'Problemsituationen, Konflikte, Abbruchkriterien',
    reihenfolge: 9,
    unterpunkte: [
      { id: 'up-9-1', titel: 'Kunde nicht anwesend', beschreibung: 'Was tun bei No-Show?', videoUrl: '', dauerMinuten: 6, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-9-2', titel: 'Zugang verwehrt', beschreibung: 'Räume nicht zugänglich', videoUrl: '', dauerMinuten: 7, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-9-3', titel: 'Technische Probleme', beschreibung: 'Equipment-Ausfall vor Ort', videoUrl: '', dauerMinuten: 8, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-9-4', titel: 'Konflikte deeskalieren', beschreibung: 'Ruhe bewahren', videoUrl: '', dauerMinuten: 10, reihenfolge: 4, abgeschlossen: false },
      { id: 'up-9-5', titel: 'Abbruchkriterien', beschreibung: 'Wann ist Schluss?', videoUrl: '', dauerMinuten: 6, reihenfolge: 5, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-10',
    titel: 'Qualitätssicherung',
    beschreibung: 'K.O.-Kriterien, Selbstcheck, Feedback',
    reihenfolge: 10,
    unterpunkte: [
      { id: 'up-10-1', titel: 'Qualitäts-Checkliste', beschreibung: 'Selbstkontrolle vor Abgabe', videoUrl: '', dauerMinuten: 8, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-10-2', titel: 'K.O.-Kriterien', beschreibung: 'Was führt zur Ablehnung?', videoUrl: '', dauerMinuten: 7, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-10-3', titel: 'Nachbesserungen', beschreibung: 'Fehler korrigieren', videoUrl: '', dauerMinuten: 6, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-10-4', titel: 'Kontinuierliche Verbesserung', beschreibung: 'Aus Fehlern lernen', videoUrl: '', dauerMinuten: 5, reihenfolge: 4, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-11',
    titel: 'Praxisphase: Training on the Job',
    beschreibung: 'Shadowing, Feedback-Routine',
    reihenfolge: 11,
    unterpunkte: [
      { id: 'up-11-1', titel: 'Shadowing-Termin', beschreibung: 'Erfahrenem Techniker folgen', videoUrl: '', dauerMinuten: 5, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-11-2', titel: 'Begleiteter Einsatz', beschreibung: 'Selbst durchführen mit Begleitung', videoUrl: '', dauerMinuten: 5, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-11-3', titel: 'Feedback-Gespräch', beschreibung: 'Stärken und Verbesserungspotenziale', videoUrl: '', dauerMinuten: 5, reihenfolge: 3, abgeschlossen: false },
    ],
  },
  {
    id: 'modul-12',
    titel: 'Prüfung & Zertifizierung',
    beschreibung: 'Theorie-Test, Praxis-Prüfung, Freigabe',
    reihenfolge: 12,
    unterpunkte: [
      { id: 'up-12-1', titel: 'Theorie-Prüfung', beschreibung: 'Wissenstest zu allen Modulen', videoUrl: '', dauerMinuten: 5, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-12-2', titel: 'Praxis-Prüfung', beschreibung: 'Live-Thermocheck mit Bewertung', videoUrl: '', dauerMinuten: 5, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-12-3', titel: 'Ergebnisbesprechung', beschreibung: 'Feedback und nächste Schritte', videoUrl: '', dauerMinuten: 5, reihenfolge: 3, abgeschlossen: false },
      { id: 'up-12-4', titel: 'Zertifikat & Freigabe', beschreibung: 'Offizielle Berechtigung', videoUrl: '', dauerMinuten: 5, reihenfolge: 4, abgeschlossen: false },
    ],
  },
];

// Mock-Coaching Slots (basiert auf echten Thermochecks von berechtigten Coaches)
export const MOCK_COACHING_SLOTS: CoachingSlot[] = [
  {
    id: 'slot-1',
    thermocheckId: 'tc-001',
    coachId: 'coach-1',
    coachName: 'Thomas Müller',
    coachAvatarUrl: '/placeholder.svg',
    datum: '2026-01-28',
    uhrzeitVon: '09:00',
    uhrzeitBis: '11:00',
    objektAdresse: 'Musterstraße 12, 80331 München',
    objektPlz: '80331',
    objektOrt: 'München',
    objektTyp: 'Einfamilienhaus',
    ort: 'München',
    region: 'Bayern',
    gebucht: false,
    preis: 149,
  },
  {
    id: 'slot-2',
    thermocheckId: 'tc-002',
    coachId: 'coach-1',
    coachName: 'Thomas Müller',
    coachAvatarUrl: '/placeholder.svg',
    datum: '2026-01-29',
    uhrzeitVon: '14:00',
    uhrzeitBis: '16:00',
    objektAdresse: 'Hauptstraße 45, 80333 München',
    objektPlz: '80333',
    objektOrt: 'München',
    objektTyp: 'Mehrfamilienhaus',
    ort: 'München',
    region: 'Bayern',
    gebucht: false,
    preis: 149,
  },
  {
    id: 'slot-3',
    thermocheckId: 'tc-003',
    coachId: 'coach-2',
    coachName: 'Stefan Weber',
    coachAvatarUrl: '/placeholder.svg',
    datum: '2026-01-30',
    uhrzeitVon: '09:00',
    uhrzeitBis: '11:30',
    objektAdresse: 'Bahnhofstraße 8, 86150 Augsburg',
    objektPlz: '86150',
    objektOrt: 'Augsburg',
    objektTyp: 'Einfamilienhaus',
    ort: 'Augsburg',
    region: 'Bayern',
    gebucht: false,
    preis: 149,
  },
];

// Mock-Bewerber Profil
export const MOCK_APPLICANT_PROFILE: ApplicantProfile = {
  id: '1',
  vorname: 'Max',
  nachname: 'Mustermann',
  email: 'max.mustermann@email.de',
  telefon: '+49 151 12345678',
  strasse: 'Musterstraße',
  hausnummer: '42',
  plz: '80331',
  ort: 'München',
};

// Initial Onboarding State
export function createInitialOnboardingState(profile: ApplicantProfile): OnboardingState {
  return {
    currentStep: 'profil',
    completedSteps: [],
    
    profil: profile,
    profilBestaetigt: false,
    
    gewerbescheinSpaeter: false,
    
    bestellungenBestaetigt: [],
    oberteilAuswahl: null,
    
    equipmentStatus: {},
    
    akademieModule: MOCK_AKADEMIE_MODULE,
    akademieHauptmodule: MOCK_AKADEMIE_HAUPTMODULE,
    akademieTestBestanden: false,
    
    ausstattungCheckliste: {
      'kleidung-erhalten': false,
      'utensilien-komplett': false,
      'drohnen-fuehrerschein': false,
    },
    
    coachingAbgeschlossen: false,
    
    startedAt: new Date().toISOString(),
  };
}

// Fortschritt berechnen
export function calculateOnboardingProgress(state: OnboardingState): number {
  const totalSteps = STEP_ORDER.length;
  const completedSteps = state.completedSteps.length;
  return Math.round((completedSteps / totalSteps) * 100);
}
