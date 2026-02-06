// Onboarding Step IDs - die 7 Hauptschritte
export type OnboardingStepId = 
  | 'profil'
  | 'dokumente'
  | 'bestellungen'
  | 'equipment'
  | 'akademie'
  | 'nachweise'
  | 'coaching';

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepId, string> = {
  profil: 'Profil prüfen',
  dokumente: 'Dokumente',
  bestellungen: 'Bestellungen',
  equipment: 'Equipment',
  akademie: 'Akademie',
  nachweise: 'Nachweise',
  coaching: 'Coaching',
};

export type OnboardingStepStatus = 'locked' | 'current' | 'completed';

export interface OnboardingStepConfig {
  id: OnboardingStepId;
  label: string;
  description: string;
  icon: string;
}

// Profil-Daten aus Bewerbung
export interface ApplicantProfile {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  avatarUrl?: string;
}

// Produkt für Pflichtbestellungen
export type PricingType = 'einmalig' | 'monatlich';
export type ProductType = 'lizenz' | 'kleidung' | 'equipment';

// Kleidungsvariante für Auswahl-Produkte (T-Shirt/Poloshirt)
export interface ClothingVariant {
  id: string;
  name: string;
  bildUrls: string[]; // [vorne, hinten]
  externLink: string;
}

export interface OnboardingProduct {
  id: string;
  name: string;
  beschreibung: string;
  preisNetto: number;
  preisBrutto: number;
  preisTyp: PricingType;
  produktTyp: ProductType;
  bildUrl?: string;
  bildUrls?: string[]; // Array für Slideshow (vorne, hinten)
  externLink: string; // Buchungslink zum Shop (Pflicht!)
  pflicht: boolean;
  reihenfolge: number;
  varianten?: ClothingVariant[]; // Für Auswahl-Produkte wie Oberteil
}

// Equipment-Status
export interface EquipmentItem {
  id: string;
  name: string;
  beschreibung: string;
  hatEigenes: boolean;
  nachweisPflicht: boolean;
  nachweisUrl?: string;
  mietLink?: string;
  kaufLink?: string;
}

// Akademie-Modul (Legacy - wird durch hierarchische Struktur ersetzt)
export interface AkademieModul {
  id: string;
  titel: string;
  beschreibung: string;
  videoUrl: string;
  dauerMinuten: number;
  reihenfolge: number;
  abgeschlossen: boolean;
  abgeschlossenAt?: string;
}

// NEU: Hierarchische Akademie-Struktur
export interface AkademieUnterpunkt {
  id: string;
  code: string;           // z.B. "6-3", "6-3-1"
  titel: string;
  beschreibung: string;
  videoUrl: string;
  dauerMinuten: number;
  reihenfolge: number;
  abgeschlossen: boolean;
  abgeschlossenAt?: string;
  isGroup?: boolean;       // true wenn Kinder vorhanden (z.B. 6-3 hat 6-3-1, 6-3-2)
  children?: AkademieUnterpunkt[]; // Sub-Lektionen
}

export interface AkademieHauptmodul {
  id: string;
  code: string;            // z.B. "modul-6-datenerhebung"
  displayNummer: number;   // Extrahiert: 6 (aus code)
  titel: string;
  beschreibung: string;
  reihenfolge: number;
  unterpunkte: AkademieUnterpunkt[];
}

// Coaching-Slot (basiert auf echten Thermochecks von berechtigten Coaches)
export interface CoachingSlot {
  id: string;
  thermocheckId?: string; // ID des echten Thermochecks (optional für Mock)
  coachId?: string;
  coachName: string;
  coachAvatarUrl?: string;
  datum: string;
  uhrzeitVon: string;
  uhrzeitBis: string;
  objektAdresse?: string; // Vollständige Adresse (nur nach Buchung sichtbar!)
  objektPlz?: string; // PLZ (vor Buchung sichtbar)
  objektOrt?: string; // Stadt (vor Buchung sichtbar)
  objektTyp?: string; // z.B. "Einfamilienhaus"
  ort: string;
  region: string;
  gebucht: boolean;
  preis: number;
}

// Typ für Oberteil-Auswahl (T-Shirt, Poloshirt oder beides)
export type OberteilAuswahl = 'tshirt' | 'poloshirt' | 'beides' | null;

// Gesamter Onboarding-State
export interface OnboardingState {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  
  // Schritt 1: Profil
  profil: ApplicantProfile;
  profilBestaetigt: boolean;
  
  // Schritt 2: Dokumente
  gewerbescheinUrl?: string;
  gewerbescheinSpaeter?: boolean; // User wählt "später nachreichen"
  versicherungUrl?: string;
  
  // Schritt 3: Bestellungen
  bestellungenBestaetigt: string[]; // Produkt-IDs die bestellt wurden
  oberteilAuswahl: OberteilAuswahl; // Persistierte Auswahl für Oberteil
  
  // Schritt 4: Equipment
  equipmentStatus: Record<string, { hatEigenes: boolean; nachweisUrl?: string }>;
  
  // Schritt 5: Akademie
  akademieModule: AkademieModul[]; // Legacy
  akademieHauptmodule: AkademieHauptmodul[]; // NEU: Hierarchische Struktur
  akademieTestBestanden: boolean;
  zertifikatUrl?: string;
  
  // Schritt 6: Nachweise
  ausstattungCheckliste: Record<string, boolean>;
  gesamtfotoUrl?: string;
  
  // Schritt 7: Coaching
  gebuchterCoachingSlot?: string; // Slot-ID
  coachingAbgeschlossen: boolean;
  
  // Meta
  startedAt: string;
  completedAt?: string;
}

// Helper um den nächsten Schritt zu berechnen
export const STEP_ORDER: OnboardingStepId[] = [
  'profil',
  'dokumente', 
  'bestellungen',
  'equipment',
  'akademie',
  'nachweise',
  'coaching',
];

export function getStepIndex(stepId: OnboardingStepId): number {
  return STEP_ORDER.indexOf(stepId);
}

export function getNextStep(currentStep: OnboardingStepId): OnboardingStepId | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex < STEP_ORDER.length - 1) {
    return STEP_ORDER[currentIndex + 1];
  }
  return null;
}

export function getPreviousStep(currentStep: OnboardingStepId): OnboardingStepId | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return STEP_ORDER[currentIndex - 1];
  }
  return null;
}

export function isStepCompleted(step: OnboardingStepId, completedSteps: OnboardingStepId[]): boolean {
  return completedSteps.includes(step);
}

export function isStepAccessible(step: OnboardingStepId, currentStep: OnboardingStepId, completedSteps: OnboardingStepId[]): boolean {
  const stepIndex = getStepIndex(step);
  const currentIndex = getStepIndex(currentStep);
  
  // Aktueller Schritt ist immer zugänglich
  if (step === currentStep) return true;
  
  // Abgeschlossene Schritte sind zugänglich
  if (completedSteps.includes(step)) return true;
  
  // Zukünftige Schritte sind gesperrt
  return stepIndex < currentIndex;
}
