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
  const totalMs = Math.max(0, deadline.getTime() - Date.now());

  const days = Math.floor(totalMs / 86400000);
  const hours = Math.floor((totalMs % 86400000) / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  return { days, hours, minutes, seconds, totalMs };
}

function getDeadlineLabel(erstelltAm: string, deadlineDays: number): string {
  const d = new Date(erstelltAm);
  d.setDate(d.getDate() + deadlineDays);
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getElapsedPercent(erstelltAm: string, deadlineDays: number): number {
  const elapsed = Date.now() - new Date(erstelltAm).getTime();
  return Math.min(100, Math.max(0, (elapsed / (deadlineDays * 86400000)) * 100));
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
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(erstelltAm, deadlineDays)), 1000);
    return () => clearInterval(timer);
  }, [erstelltAm, deadlineDays]);

  const isExpired = timeLeft.totalMs <= 0;
  const urgency = getUrgency(timeLeft.days, isExpired);
  const elapsed = getElapsedPercent(erstelltAm, deadlineDays);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (isExpired) {
    return (
      <div className="sticky top-0 z-50 bg-red-900 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold">
        <AlertTriangle className="w-4 h-4" />
        <span>Frist abgelaufen – bitte kontaktiere deinen Ansprechpartner!</span>
      </div>
    );
  }

  const tiles = [
    { v: pad(timeLeft.days), l: 'T' },
    { v: pad(timeLeft.hours), l: 'h' },
    { v: pad(timeLeft.minutes), l: 'm' },
    { v: pad(timeLeft.seconds), l: 's' },
  ];

  return (
    <div className={cn('sticky top-0 z-50 bg-slate-900 text-white px-4 py-2', urgency === 'critical' && 'animate-pulse')}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="text-slate-300 truncate">bis {getDeadlineLabel(erstelltAm, deadlineDays)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {tiles.map((t, i) => (
            <div key={t.l} className="flex items-center">
              <span className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-sm font-bold font-mono tabular-nums">
                {t.v}
              </span>
              <span className="text-[10px] text-slate-500 ml-0.5">{t.l}</span>
              {i < tiles.length - 1 && <span className="text-slate-600 mx-0.5 text-xs">:</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', BAR_COLORS[urgency])}
          style={{ width: `${100 - elapsed}%` }}
        />
      </div>
    </div>
  );
}
