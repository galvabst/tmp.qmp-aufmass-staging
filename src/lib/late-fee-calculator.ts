import { parseISO } from 'date-fns';

/**
 * Calculate the submission deadline: termin date + zeit_bis + 24h.
 * @param scheduledDate  ISO date string (YYYY-MM-DD)
 * @param zeitBis        Time string "HH:MM" or "HH:MM:SS", defaults to "18:00"
 */
export function calculateDeadline(scheduledDate: string, zeitBis?: string): Date {
  const timePart = zeitBis?.slice(0, 5) || '18:00';
  const base = new Date(`${scheduledDate}T${timePart}:00`);
  return new Date(base.getTime() + 24 * 60 * 60 * 1000);
}

export interface LateFeeResult {
  isOverdue: boolean;
  /** Total minutes past the 24h deadline (0 if not overdue) */
  minutesOverdue: number;
  /** Full hours overdue (ceiling) */
  hoursOverdue: number;
  /** Calculated fee: €50 base + €4/h */
  fee: number;
  /** Deadline timestamp */
  deadline: Date;
  /** Milliseconds remaining (negative if overdue) */
  msRemaining: number;
}

/**
 * Calculate late fee based on current time vs deadline.
 */
export function calculateLateFee(deadline: Date, now: Date = new Date()): LateFeeResult {
  const msRemaining = deadline.getTime() - now.getTime();
  const isOverdue = msRemaining < 0;

  if (!isOverdue) {
    return { isOverdue: false, minutesOverdue: 0, hoursOverdue: 0, fee: 0, deadline, msRemaining };
  }

  const minutesOverdue = Math.floor(Math.abs(msRemaining) / (60 * 1000));
  const hoursOverdue = Math.ceil(minutesOverdue / 60);
  const fee = 50 + hoursOverdue * 4;

  return { isOverdue, minutesOverdue, hoursOverdue, fee, deadline, msRemaining };
}

/**
 * Format remaining time as human-readable string.
 */
export function formatTimeRemaining(msRemaining: number): string {
  const totalSeconds = Math.abs(Math.floor(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 48) {
    const days = Math.floor(hours / 24);
    return `${days} Tage`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
