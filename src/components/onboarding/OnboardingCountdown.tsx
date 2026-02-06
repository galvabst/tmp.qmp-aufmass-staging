import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingCountdownProps {
  erstelltAm: string;
  deadlineDays?: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calculateTimeLeft(erstelltAm: string, deadlineDays: number): TimeLeft {
  const deadline = new Date(erstelltAm);
  deadline.setDate(deadline.getDate() + deadlineDays);
  
  const now = new Date();
  const totalMs = deadline.getTime() - now.getTime();
  
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }
  
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, totalMs };
}

function getDeadlineDate(erstelltAm: string, deadlineDays: number): string {
  const deadline = new Date(erstelltAm);
  deadline.setDate(deadline.getDate() + deadlineDays);
  return deadline.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getElapsedPercent(erstelltAm: string, deadlineDays: number): number {
  const start = new Date(erstelltAm).getTime();
  const totalDuration = deadlineDays * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - start;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}

function getUrgencyMessage(days: number, isExpired: boolean): string {
  if (isExpired) return 'Frist abgelaufen – bitte kontaktiere deinen Ansprechpartner!';
  if (days < 1) return '⚠️ LETZTE CHANCE – Frist läuft heute ab!';
  if (days < 3) return `Nur noch ${days} Tag${days > 1 ? 'e' : ''}! Bitte beeile dich.`;
  return 'Schließe dein Onboarding rechtzeitig ab';
}

type Urgency = 'relaxed' | 'warning' | 'critical' | 'expired';

function getUrgency(days: number, isExpired: boolean): Urgency {
  if (isExpired) return 'expired';
  if (days < 1) return 'critical';
  if (days < 3) return 'warning';
  return 'relaxed';
}

const BAR_COLORS: Record<Urgency, string> = {
  relaxed: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  expired: 'bg-red-600',
};

export function OnboardingCountdown({ erstelltAm, deadlineDays = 7 }: OnboardingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(erstelltAm, deadlineDays));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(erstelltAm, deadlineDays));
    }, 1000);
    return () => clearInterval(timer);
  }, [erstelltAm, deadlineDays]);

  const isExpired = timeLeft.totalMs <= 0;
  const urgency = getUrgency(timeLeft.days, isExpired);
  const deadlineDate = getDeadlineDate(erstelltAm, deadlineDays);
  const elapsed = getElapsedPercent(erstelltAm, deadlineDays);
  const message = getUrgencyMessage(timeLeft.days, isExpired);
  const pad = (n: number) => String(n).padStart(2, '0');

  const tiles: { value: string; label: string }[] = [
    { value: pad(timeLeft.days), label: 'Tage' },
    { value: pad(timeLeft.hours), label: 'Std' },
    { value: pad(timeLeft.minutes), label: 'Min' },
    { value: pad(timeLeft.seconds), label: 'Sek' },
  ];

  return (
    <div
      className={cn(
        'bg-slate-900 text-white px-4 py-4',
        urgency === 'critical' && 'animate-pulse',
      )}
    >
      {/* Urgency message + deadline */}
      <div className="text-center mb-3">
        <p className={cn(
          'text-sm font-semibold',
          urgency === 'expired' && 'text-red-400',
          urgency === 'critical' && 'text-red-400',
          urgency === 'warning' && 'text-amber-400',
        )}>
          {isExpired && <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5" />}
          {message}
        </p>
        {!isExpired && (
          <p className="text-xs text-slate-400 mt-0.5">
            Deadline: {deadlineDate}
          </p>
        )}
      </div>

      {/* Flip-clock tiles */}
      {!isExpired && (
        <div className="flex justify-center gap-2 mb-3">
          {tiles.map((tile, i) => (
            <div key={tile.label} className="flex flex-col items-center">
              <div className="bg-slate-800 rounded-lg w-14 h-14 flex items-center justify-center border border-slate-700">
                <span className="text-2xl font-bold font-mono tabular-nums">{tile.value}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{tile.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', BAR_COLORS[urgency])}
          style={{ width: `${100 - elapsed}%` }}
        />
      </div>
    </div>
  );
}
