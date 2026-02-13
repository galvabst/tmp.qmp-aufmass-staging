// =============================================================================
// ZENTRALE ENUM-DEFINITIONEN
// Alle Dropdown-/Status-Werte MÜSSEN hier definiert sein!
// =============================================================================

// -----------------------------------------------------------------------------
// 1. AUFTRAGNEHMER STATUS
// -----------------------------------------------------------------------------
export const CONTRACTOR_STATUS_VALUES = [
  'onboarding',
  'active',
  'suspended',
  'exit_mode'
] as const;

export type ContractorStatusEnum = typeof CONTRACTOR_STATUS_VALUES[number];

export const CONTRACTOR_STATUS_LABELS: Record<ContractorStatusEnum, string> = {
  'onboarding': 'Onboarding',
  'active': 'Aktiv',
  'suspended': 'Gesperrt',
  'exit_mode': 'Exit'
};

// -----------------------------------------------------------------------------
// 2. OBJEKTAUFTRAG STATUS
// -----------------------------------------------------------------------------
export const OBJECT_ORDER_STATUS_VALUES = [
  'draft',
  'published',
  'booked',
  'in_progress',
  'submitted',
  'in_review',
  'rework_required',
  'approved',
  'rejected_ko',
  'cancelled'
] as const;

export type ObjectOrderStatusEnum = typeof OBJECT_ORDER_STATUS_VALUES[number];

export const OBJECT_ORDER_STATUS_LABELS: Record<ObjectOrderStatusEnum, string> = {
  'draft': 'Entwurf',
  'published': 'Im Pool',
  'booked': 'Gebucht',
  'in_progress': 'In Bearbeitung',
  'submitted': 'Eingereicht',
  'in_review': 'In Prüfung',
  'rework_required': 'Nacharbeit',
  'approved': 'Abgenommen',
  'rejected_ko': 'K.O.-Mangel',
  'cancelled': 'Storniert'
};

// -----------------------------------------------------------------------------
// 3. AUFTRAGSTYP
// -----------------------------------------------------------------------------
export const AUFTRAGSTYP_VALUES = [
  'thermocheck',
  'pv',
  'einweisung'
] as const;

export type AuftragstypEnum = typeof AUFTRAGSTYP_VALUES[number];

export const AUFTRAGSTYP_LABELS: Record<AuftragstypEnum, string> = {
  'thermocheck': 'Thermocheck',
  'pv': 'PV-Anlage',
  'einweisung': 'Einweisung'
};

// -----------------------------------------------------------------------------
// 4. QG DECISION (Quality Gate Entscheidung)
// -----------------------------------------------------------------------------
export const QG_DECISION_VALUES = ['approved', 'rework', 'ko'] as const;

export type QGDecisionEnum = typeof QG_DECISION_VALUES[number];

export const QG_DECISION_LABELS: Record<QGDecisionEnum, string> = {
  'approved': 'Abgenommen',
  'rework': 'Nacharbeit',
  'ko': 'K.O.-Mangel'
};

// -----------------------------------------------------------------------------
// 5. BUCHUNGS-STATUS
// -----------------------------------------------------------------------------
export const BOOKING_STATUS_VALUES = [
  'pending',
  'confirmed',
  'cancelled'
] as const;

export type BookingStatusEnum = typeof BOOKING_STATUS_VALUES[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatusEnum, string> = {
  'pending': 'Ausstehend',
  'confirmed': 'Bestätigt',
  'cancelled': 'Storniert'
};

// -----------------------------------------------------------------------------
// 6. CHECKIN STATUS
// -----------------------------------------------------------------------------
export const CHECKIN_STATUS_VALUES = [
  'checked_in',
  'checked_out',
  'no_show'
] as const;

export type CheckinStatusEnum = typeof CHECKIN_STATUS_VALUES[number];

export const CHECKIN_STATUS_LABELS: Record<CheckinStatusEnum, string> = {
  'checked_in': 'Eingecheckt',
  'checked_out': 'Ausgecheckt',
  'no_show': 'Nicht erschienen'
};

// -----------------------------------------------------------------------------
// 7. COACHING BEWERTUNG
// -----------------------------------------------------------------------------
export const COACHING_BEWERTUNG_VALUES = [
  'ausstehend',
  'bestanden',
  'nicht_bestanden'
] as const;

export type CoachingBewertungEnum = typeof COACHING_BEWERTUNG_VALUES[number];

export const COACHING_BEWERTUNG_LABELS: Record<CoachingBewertungEnum, string> = {
  'ausstehend': 'Ausstehend',
  'bestanden': 'Bestanden',
  'nicht_bestanden': 'Nicht bestanden'
};

// =============================================================================
// GENERIC HELPERS
// =============================================================================

/**
 * Konvertiert ENUM-Werte zu Select/MultiSelect Options
 * @example
 * const options = enumToOptions(CONTRACTOR_STATUS_VALUES, CONTRACTOR_STATUS_LABELS);
 * // → [{ value: 'active', label: 'Aktiv' }, ...]
 */
export const enumToOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>
): { value: T; label: string }[] =>
  values.map(v => ({ value: v, label: labels[v] }));

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isContractorStatus = (v: string): v is ContractorStatusEnum =>
  CONTRACTOR_STATUS_VALUES.includes(v as ContractorStatusEnum);

export const isObjectOrderStatus = (v: string): v is ObjectOrderStatusEnum =>
  OBJECT_ORDER_STATUS_VALUES.includes(v as ObjectOrderStatusEnum);

export const isAuftragstyp = (v: string): v is AuftragstypEnum =>
  AUFTRAGSTYP_VALUES.includes(v as AuftragstypEnum);

export const isQGDecision = (v: string): v is QGDecisionEnum =>
  QG_DECISION_VALUES.includes(v as QGDecisionEnum);

export const isBookingStatus = (v: string): v is BookingStatusEnum =>
  BOOKING_STATUS_VALUES.includes(v as BookingStatusEnum);

export const isCheckinStatus = (v: string): v is CheckinStatusEnum =>
  CHECKIN_STATUS_VALUES.includes(v as CheckinStatusEnum);
