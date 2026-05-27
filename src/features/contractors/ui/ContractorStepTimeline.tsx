import { useContractorStepTimeline, formatDuration, getDurationTone } from '../hooks/useContractorStepTimeline';
import { STEP_LABELS } from '../hooks/useAdminContractorList';
import { Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  onboardingId: string;
  erstelltAm: string;
}

/**
 * Zeigt eine kompakte Timeline aller Onboarding-Schritte mit Verweildauer.
 * Datenquelle: Audit-Log (rekonstruiert via DB-View + RPC).
 */
export function ContractorStepTimeline({ onboardingId, erstelltAm }: Props) {
  const { data, isLoading, isError } = useContractorStepTimeline(onboardingId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-2">Onboarding-Verlauf</p>
        <div className="h-16 animate-pulse bg-muted/40 rounded-lg" />
      </div>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">Onboarding-Verlauf</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Noch keine Schritt-Wechsel im Audit-Log erfasst.
        </p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.last_entered_at.localeCompare(b.last_entered_at));
  const current = sorted.find(e => e.is_current);
  const completed = sorted.filter(e => !e.is_current);
  const totalSeconds = Math.max(0, (Date.now() - new Date(erstelltAm).getTime()) / 1000);

  const toneClasses: Record<'ok' | 'warn' | 'alert', string> = {
    ok: 'bg-green-500/10 text-green-700 dark:text-green-300 ring-green-500/20',
    warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20',
    alert: 'bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20',
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Onboarding-Verlauf</p>
        <span className="text-[10px] text-muted-foreground">
          gesamt {formatDuration(totalSeconds)}
        </span>
      </div>

      {current && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ring-1 ${toneClasses[getDurationTone(current.total_seconds)]} mb-3`}>
          <Clock className="w-4 h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight">
              {STEP_LABELS[current.step] ?? current.step}
            </p>
            <p className="text-[10px] opacity-80 leading-tight">
              aktuell — seit {formatDuration(current.total_seconds)}
            </p>
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <ul className="space-y-1.5">
          {completed.map(entry => (
            <li
              key={entry.step}
              className="flex items-center justify-between text-xs px-1"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                {STEP_LABELS[entry.step] ?? entry.step}
                {entry.entered_count > 1 && (
                  <span className="text-[9px] text-muted-foreground/70">
                    ({entry.entered_count}×)
                  </span>
                )}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {formatDuration(entry.total_seconds)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
