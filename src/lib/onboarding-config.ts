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
    id: 'coaching',
    label: 'Coaching',
    description: 'Buche deine Praxis-Begleitung',
    icon: 'users',
  },
  {
    id: 'nachweise',
    label: 'Nachweise',
    description: 'Bestätige den Erhalt deiner Ausstattung',
    icon: 'check-square',
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
    name: 'Drohne mit 4K Kamera',
    beschreibung: 'Für Dachaufnahmen und Luftbilder',
    hatEigenes: false,
    nachweisPflicht: true,
    mietLink: 'https://drohnen-mieten.de', // Placeholder - später anpassen
    kaufLink: 'https://amzn.to/46kuuoo',
  },
  {
    id: 'iphone-lidar',
    name: 'iPhone mit LiDAR',
    beschreibung: 'iPhone 12 Pro oder neuer für 3D-Scans',
    hatEigenes: false,
    nachweisPflicht: false,
    mietLink: 'https://iphone-mieten.de', // Placeholder - später anpassen
    kaufLink: 'https://apple.com/de/shop/buy-iphone', // Placeholder - später anpassen
  },
  {
    id: 'massband',
    name: 'Maßband',
    beschreibung: 'Empfohlene Länge: mindestens 5m',
    hatEigenes: false,
    nachweisPflicht: false,
    kaufLink: 'https://amzn.to/4afYToT',
  },
];

// Mock-Akademie Module (Legacy - für Abwärtskompatibilität)
export const MOCK_AKADEMIE_MODULE: AkademieModul[] = [];

// Akademie-Struktur wird jetzt aus der DB geladen (thermocheck.techniker_akademie_module/lektionen)
// Mock-Daten entfernt - thermocheck Schema ist SSOT
export const MOCK_AKADEMIE_HAUPTMODULE: AkademieHauptmodul[] = [];

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
    
    introVideoWatched: false,
    
    startedAt: new Date().toISOString(),
  };
}

// Fortschritt berechnen
export function calculateOnboardingProgress(state: OnboardingState): number {
  const totalSteps = STEP_ORDER.length;
  const completedSteps = state.completedSteps.length;
  return Math.round((completedSteps / totalSteps) * 100);
}
