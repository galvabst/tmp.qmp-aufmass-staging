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

// NEU: Hierarchische Akademie-Struktur mit 4 Hauptmodulen
export const MOCK_AKADEMIE_HAUPTMODULE: AkademieHauptmodul[] = [
  {
    id: 'hauptmodul-1',
    titel: 'Einführung und Grundlagen',
    beschreibung: 'Grundlagen für erfolgreiche Thermochecks',
    reihenfolge: 1,
    unterpunkte: [
      {
        id: 'up-1-1',
        titel: 'Einführung und Begrüßung',
        beschreibung: 'Willkommen bei Thermocheck',
        videoUrl: 'https://example.com/video1-1',
        dauerMinuten: 5,
        reihenfolge: 1,
        abgeschlossen: false,
      },
      {
        id: 'up-1-2',
        titel: 'Kleidung und Verhalten beim Kunden',
        beschreibung: 'Professionelles Auftreten',
        videoUrl: 'https://example.com/video1-2',
        dauerMinuten: 8,
        reihenfolge: 2,
        abgeschlossen: false,
      },
      {
        id: 'up-1-3',
        titel: 'Sicherheitsdatenblatt',
        beschreibung: 'Wichtige Sicherheitshinweise',
        videoUrl: 'https://example.com/video1-3',
        dauerMinuten: 10,
        reihenfolge: 3,
        abgeschlossen: false,
      },
      {
        id: 'up-1-4',
        titel: 'Außenbereich',
        beschreibung: 'Arbeiten im Außenbereich',
        videoUrl: 'https://example.com/video1-4',
        dauerMinuten: 7,
        reihenfolge: 4,
        abgeschlossen: false,
      },
    ],
  },
  {
    id: 'hauptmodul-2',
    titel: 'Ausrüstung und Vorbereitung',
    beschreibung: 'Deine Werkzeuge im Überblick',
    reihenfolge: 2,
    unterpunkte: [
      {
        id: 'up-2-1',
        titel: 'Ausrüstungsübersicht',
        beschreibung: 'Alle Tools die du brauchst',
        videoUrl: 'https://example.com/video2-1',
        dauerMinuten: 12,
        reihenfolge: 1,
        abgeschlossen: false,
      },
    ],
  },
  {
    id: 'hauptmodul-3',
    titel: 'Durchführung Thermocheck',
    beschreibung: 'Der praktische Ablauf vor Ort',
    reihenfolge: 3,
    unterpunkte: [
      {
        id: 'up-3-1',
        titel: 'Verschiedene Heizkreise',
        beschreibung: 'Heizkreise verstehen',
        videoUrl: 'https://example.com/video3-1',
        dauerMinuten: 15,
        reihenfolge: 1,
        abgeschlossen: false,
      },
      {
        id: 'up-3-2',
        titel: 'Autark',
        beschreibung: 'Autarke Systeme',
        videoUrl: 'https://example.com/video3-2',
        dauerMinuten: 10,
        reihenfolge: 2,
        abgeschlossen: false,
      },
      {
        id: 'up-3-3',
        titel: 'Fußbodenheizung',
        beschreibung: 'Thermografie bei Fußbodenheizung',
        videoUrl: 'https://example.com/video3-3',
        dauerMinuten: 12,
        reihenfolge: 3,
        abgeschlossen: false,
      },
      {
        id: 'up-3-4',
        titel: 'Heizkörper',
        beschreibung: 'Analyse von Heizkörpern',
        videoUrl: 'https://example.com/video3-4',
        dauerMinuten: 8,
        reihenfolge: 4,
        abgeschlossen: false,
      },
      {
        id: 'up-3-5',
        titel: 'Raumweise Gebäude',
        beschreibung: 'Systematische Raumerfassung',
        videoUrl: 'https://example.com/video3-5',
        dauerMinuten: 10,
        reihenfolge: 5,
        abgeschlossen: false,
      },
      {
        id: 'up-3-6',
        titel: 'Datenerfassung',
        beschreibung: 'Korrekte Datenaufnahme',
        videoUrl: 'https://example.com/video3-6',
        dauerMinuten: 15,
        reihenfolge: 6,
        abgeschlossen: false,
      },
      {
        id: 'up-3-7',
        titel: 'Thermografiebilder richtig erstellen',
        beschreibung: 'Professionelle Wärmebilder',
        videoUrl: 'https://example.com/video3-7',
        dauerMinuten: 20,
        reihenfolge: 7,
        abgeschlossen: false,
      },
      {
        id: 'up-3-8',
        titel: 'Besonderheiten bei Dachausbau und Keller',
        beschreibung: 'Spezialfälle meistern',
        videoUrl: 'https://example.com/video3-8',
        dauerMinuten: 12,
        reihenfolge: 8,
        abgeschlossen: false,
      },
    ],
  },
  {
    id: 'hauptmodul-4',
    titel: 'Nachbearbeitung und Dokumentation',
    beschreibung: 'Nach dem Thermocheck',
    reihenfolge: 4,
    unterpunkte: [
      {
        id: 'up-4-1',
        titel: 'Bilddokumentation',
        beschreibung: 'Bilder richtig dokumentieren',
        videoUrl: 'https://example.com/video4-1',
        dauerMinuten: 10,
        reihenfolge: 1,
        abgeschlossen: false,
      },
      {
        id: 'up-4-2',
        titel: 'Zahlmodell',
        beschreibung: 'Provisionen und Abrechnungen',
        videoUrl: 'https://example.com/video4-2',
        dauerMinuten: 8,
        reihenfolge: 2,
        abgeschlossen: false,
      },
      {
        id: 'up-4-3',
        titel: 'Rechnungsstellung',
        beschreibung: 'Rechnungen erstellen',
        videoUrl: 'https://example.com/video4-3',
        dauerMinuten: 10,
        reihenfolge: 3,
        abgeschlossen: false,
      },
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
