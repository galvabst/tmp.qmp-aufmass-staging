import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingCountdownProps {
  /** ISO timestamp when the onboarding record was created */
  erstelltAm: string;
  /** Deadline in days from creation */
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

export function OnboardingCountdown({ erstelltAm, deadlineDays = 7 }: OnboardingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(erstelltAm, deadlineDays));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(erstelltAm, deadlineDays));
    }, 1000);

    return () => clearInterval(timer);
  }, [erstelltAm, deadlineDays]);

  const isUrgent = timeLeft.days < 2;
  const isExpired = timeLeft.totalMs <= 0;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold',
        isExpired
          ? 'bg-destructive text-destructive-foreground'
          : isUrgent
            ? 'bg-destructive/90 text-destructive-foreground animate-pulse'
            : 'bg-amber-500 text-white'
      )}
    >
      {isExpired ? (
        <>
          <AlertTriangle className="w-4 h-4" />
          <span>Frist abgelaufen – bitte kontaktiere deinen Ansprechpartner!</span>
        </>
      ) : (
        <>
          <Clock className="w-4 h-4 shrink-0" />
          <span>Verbleibende Zeit:</span>
          <div className="flex items-center gap-1 font-mono tabular-nums">
            <span className="bg-black/20 rounded px-1.5 py-0.5">{timeLeft.days}T</span>
            <span>:</span>
            <span className="bg-black/20 rounded px-1.5 py-0.5">{pad(timeLeft.hours)}h</span>
            <span>:</span>
            <span className="bg-black/20 rounded px-1.5 py-0.5">{pad(timeLeft.minutes)}m</span>
            <span>:</span>
            <span className="bg-black/20 rounded px-1.5 py-0.5">{pad(timeLeft.seconds)}s</span>
          </div>
        </>
      )}
    </div>
  );
}
