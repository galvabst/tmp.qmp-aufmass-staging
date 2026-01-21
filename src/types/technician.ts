import { ObjectOrderStatusEnum, AuftragstypEnum } from '@/lib/enums';

// Check-in Phase per Order
export type CheckinPhase = 'vor_ort' | 'nachbearbeitung';

export const CHECKIN_PHASE_LABELS: Record<CheckinPhase, string> = {
  vor_ort: 'Vor-Ort',
  nachbearbeitung: 'Nachbearbeitung',
};

// Onboarding Step Status
export type OnboardingStepStatus = 'pending' | 'in_progress' | 'completed';

export interface OnboardingStep {
  id: string;
  label: string;
  status: OnboardingStepStatus;
  completedAt?: string;
}

export interface OnboardingProgress {
  isCompleted: boolean;
  currentStep: string;
  steps: OnboardingStep[];
  progressPercent: number;
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
  certificates: {
    name: string;
    completedAt: string;
  }[];
  onboarding: OnboardingProgress;
}
