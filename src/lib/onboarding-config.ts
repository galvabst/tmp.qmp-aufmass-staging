import { 
  OnboardingStepConfig, 
  OnboardingProduct, 
  EquipmentItem, 
  AkademieModul,
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

// Mock-Produkte (später aus DB)
export const MOCK_PRODUCTS: OnboardingProduct[] = [
  {
    id: 'raumscanner-lizenz',
    name: 'Raumscanner-Lizenz',
    beschreibung: 'Monatliche Lizenz für die 3D-Raumscanner App',
    preisNetto: 167.23,
    preisBrutto: 199.00,
    preisTyp: 'monatlich',
    produktTyp: 'lizenz',
    bildUrl: '/placeholder.svg',
    pflicht: true,
    reihenfolge: 1,
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    beschreibung: 'Deine @thermocheck.de E-Mail-Adresse',
    preisNetto: 29.40,
    preisBrutto: 34.99,
    preisTyp: 'monatlich',
    produktTyp: 'lizenz',
    bildUrl: '/placeholder.svg',
    pflicht: true,
    reihenfolge: 2,
  },
  {
    id: 'kleidung-paket',
    name: 'Kleidung-Paket',
    beschreibung: 'Zipper, Hausschuhe, Ausweiskarte',
    preisNetto: 84.03,
    preisBrutto: 99.99,
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    bildUrl: '/placeholder.svg',
    pflicht: true,
    reihenfolge: 3,
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
    mietLink: 'https://drohnen-mieten.de',
  },
  {
    id: 'iphone-lidar',
    name: 'iPhone mit LiDAR',
    beschreibung: 'iPhone 12 Pro oder neuer für 3D-Scans',
    hatEigenes: false,
    nachweisPflicht: false, // Nur Bestätigung
    kaufLink: 'https://apple.com/de/shop/buy-iphone',
  },
];

// Mock-Akademie Module
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
  {
    id: 'modul-2',
    titel: 'Vor-Ort-Prozess',
    beschreibung: 'Check-in, Durchführung, Check-out',
    videoUrl: 'https://example.com/video2',
    dauerMinuten: 20,
    reihenfolge: 2,
    abgeschlossen: false,
  },
  {
    id: 'modul-3',
    titel: 'Datenerfassung & Tools',
    beschreibung: '3D-Scan, Thermografie, Dokumentation',
    videoUrl: 'https://example.com/video3',
    dauerMinuten: 25,
    reihenfolge: 3,
    abgeschlossen: false,
  },
  {
    id: 'modul-4',
    titel: 'Auftreten & Branding',
    beschreibung: 'Professionelles Auftreten beim Kunden',
    videoUrl: 'https://example.com/video4',
    dauerMinuten: 10,
    reihenfolge: 4,
    abgeschlossen: false,
  },
];

// Mock-Coaching Slots
export const MOCK_COACHING_SLOTS: CoachingSlot[] = [
  {
    id: 'slot-1',
    coachName: 'Thomas Müller',
    datum: '2026-01-28',
    uhrzeitVon: '09:00',
    uhrzeitBis: '13:00',
    ort: 'München',
    region: 'Bayern',
    gebucht: false,
    preis: 149,
  },
  {
    id: 'slot-2',
    coachName: 'Thomas Müller',
    datum: '2026-01-29',
    uhrzeitVon: '14:00',
    uhrzeitBis: '18:00',
    ort: 'München',
    region: 'Bayern',
    gebucht: false,
    preis: 149,
  },
  {
    id: 'slot-3',
    coachName: 'Stefan Weber',
    datum: '2026-01-30',
    uhrzeitVon: '09:00',
    uhrzeitBis: '13:00',
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
    
    bestellungenBestaetigt: [],
    
    equipmentStatus: {},
    
    akademieModule: MOCK_AKADEMIE_MODULE,
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
