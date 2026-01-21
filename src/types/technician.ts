import { ObjectOrderStatusEnum, AuftragstypEnum } from '@/lib/enums';

// Check-in Phase per Order
export type CheckinPhase = 'vor_ort' | 'nachbearbeitung';

export const CHECKIN_PHASE_LABELS: Record<CheckinPhase, string> = {
  vor_ort: 'Vor-Ort',
  nachbearbeitung: 'Nachbearbeitung',
};

// Onboarding Step Status
export type OnboardingStepStatus = 'pending' | 'in_progress' | 'completed';

// Onboarding Step IDs - korrigierte Werte
export type OnboardingStepId = 
  | 'gewerbeschein'
  | 'pflichtutensilien'
  | 'drohne'
  | 'kleidung'
  | 'akademie_zertifikat';

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepId, string> = {
  gewerbeschein: 'Gewerbeschein hochladen',
  pflichtutensilien: 'Pflichtutensilien-Nachweise',
  drohne: 'Drohnen-Nachweis',
  kleidung: 'Arbeitskleidung bestellt',
  akademie_zertifikat: 'Akademie-Schulungszertifikat',
};

export interface OnboardingStep {
  id: OnboardingStepId;
  label: string;
  status: OnboardingStepStatus;
  completedAt?: string;
}

export interface OnboardingProgress {
  isCompleted: boolean;
  currentStep: OnboardingStepId;
  steps: OnboardingStep[];
  progressPercent: number;
}

// Zertifikate - korrigierte Werte
export type CertificateType = 
  | 'thermocheck'
  | 'pv'
  | 'abnahmeprotokoll';

export const CERTIFICATE_LABELS: Record<CertificateType, string> = {
  thermocheck: 'Thermocheck-Zertifikat',
  pv: 'PV-Zertifikat',
  abnahmeprotokoll: 'Abnahmeprotokoll-Zertifikat',
};

export interface Certificate {
  type: CertificateType;
  name: string;
  completedAt: string;
}

// Quartal-Kontingent
export interface QuartalKontingent {
  quartal: string;          // "Q1/2026"
  abgenommen: number;       // aktuell abgenommene Auftraege
  minimum: number;          // 24
}

// Extended Order for Technician View
export interface TechnicianOrder {
  id: string;
  customerName: string;
  address: string;
  city: string;
  postalCode: string;
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  status: ObjectOrderStatusEnum;
  auftragstyp: AuftragstypEnum;
  createdAt: string;
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
  lat?: number;
  lng?: number;
  // Check-in/out tracking
  checkinPhase?: CheckinPhase;
  vorOrtCheckinAt?: string;
  vorOrtCheckoutAt?: string;
  nachbearbeitungCheckinAt?: string;
  nachbearbeitungCheckoutAt?: string;
  // Billing
  billableAmount?: number;
  submittedAt?: string;
  approvedAt?: string;
}

// Technician Profile
export interface TechnicianProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  avatarUrl?: string;
  memberSince: string;
  stats: {
    totalOrders: number;
    acceptanceRate: number;
    rating: number;
  };
  certificates: Certificate[];
  onboarding: OnboardingProgress;
  kontingent: QuartalKontingent;
}
