// =============================================================================
// ZENTRALE STATUS-KONFIGURATION
// Icons, Farben und Badge-Variants für alle Status-Typen
// =============================================================================

import { LucideIcon, UserCheck, UserX, Clock, Users, FileEdit, Globe, Calendar, Wrench, Send, Search, AlertCircle, CheckCircle, XCircle, Ban, HelpCircle, LogIn, LogOut, UserMinus } from 'lucide-react';
import {
  ContractorStatusEnum,
  ObjectOrderStatusEnum,
  BookingStatusEnum,
  CheckinStatusEnum,
  QGDecisionEnum,
} from './enums';

// Badge Variant Type (matching shadcn/ui Badge)
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// Status Config Interface
export interface StatusConfig {
  icon: LucideIcon;
  variant: BadgeVariant;
  bgColor: string; // Tailwind class for card/pipeline background
}

// -----------------------------------------------------------------------------
// CONTRACTOR STATUS CONFIG
// -----------------------------------------------------------------------------
export const CONTRACTOR_STATUS_CONFIG: Record<ContractorStatusEnum, StatusConfig> = {
  active: {
    icon: UserCheck,
    variant: 'default',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  onboarding: {
    icon: Clock,
    variant: 'secondary',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  suspended: {
    icon: UserX,
    variant: 'destructive',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  exit_mode: {
    icon: UserMinus,
    variant: 'outline',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
  },
};

// -----------------------------------------------------------------------------
// OBJECT ORDER STATUS CONFIG
// -----------------------------------------------------------------------------
export const OBJECT_ORDER_STATUS_CONFIG: Record<ObjectOrderStatusEnum, StatusConfig> = {
  draft: {
    icon: FileEdit,
    variant: 'outline',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
  },
  published: {
    icon: Globe,
    variant: 'default',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  booked: {
    icon: Calendar,
    variant: 'secondary',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  in_progress: {
    icon: Wrench,
    variant: 'default',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  submitted: {
    icon: Send,
    variant: 'secondary',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  in_review: {
    icon: Search,
    variant: 'secondary',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
  rework_required: {
    icon: AlertCircle,
    variant: 'destructive',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  approved: {
    icon: CheckCircle,
    variant: 'default',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  rejected_ko: {
    icon: XCircle,
    variant: 'destructive',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  cancelled: {
    icon: Ban,
    variant: 'outline',
    bgColor: 'bg-gray-50 dark:bg-gray-900/30',
  },
};

// -----------------------------------------------------------------------------
// BOOKING STATUS CONFIG
// -----------------------------------------------------------------------------
export const BOOKING_STATUS_CONFIG: Record<BookingStatusEnum, StatusConfig> = {
  pending: {
    icon: Clock,
    variant: 'secondary',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  confirmed: {
    icon: CheckCircle,
    variant: 'default',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  cancelled: {
    icon: XCircle,
    variant: 'destructive',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

// -----------------------------------------------------------------------------
// CHECKIN STATUS CONFIG
// -----------------------------------------------------------------------------
export const CHECKIN_STATUS_CONFIG: Record<CheckinStatusEnum, StatusConfig> = {
  checked_in: {
    icon: LogIn,
    variant: 'default',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  checked_out: {
    icon: LogOut,
    variant: 'secondary',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  no_show: {
    icon: HelpCircle,
    variant: 'destructive',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

// -----------------------------------------------------------------------------
// QG DECISION CONFIG
// -----------------------------------------------------------------------------
export const QG_DECISION_CONFIG: Record<QGDecisionEnum, StatusConfig> = {
  approved: {
    icon: CheckCircle,
    variant: 'default',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  rework: {
    icon: AlertCircle,
    variant: 'secondary',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  ko: {
    icon: XCircle,
    variant: 'destructive',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};
