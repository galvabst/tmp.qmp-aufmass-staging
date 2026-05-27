import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StepTimelineEntry {
  step: string;
  total_seconds: number;
  entered_count: number;
  last_entered_at: string;
  is_current: boolean;
}

/**
 * Admin-only: liefert Verweildauer pro Onboarding-Schritt für einen Techniker.
 * Datenquelle: thermocheck.contractor_audit_log (rekonstruiert via View).
 */
export function useContractorStepTimeline(onboardingId: string | null | undefined) {
  return useQuery<StepTimelineEntry[]>({
    queryKey: ['contractor-step-timeline', onboardingId],
    enabled: !!onboardingId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_contractor_step_timeline', {
        _onboarding_id: onboardingId!,
      });
      if (error) {
        console.error('[useContractorStepTimeline] error:', error);
        throw error;
      }
      return (data ?? []) as StepTimelineEntry[];
    },
  });
}

/** Formatiert Sekunden als "2 d 4 h", "3 h 12 m", "45 m" oder "<1 m". */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return '<1 m';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return h > 0 ? `${d} d ${h} h` : `${d} d`;
  if (h > 0) return m > 0 ? `${h} h ${m} m` : `${h} h`;
  return `${m} m`;
}

/** Ampelfarbe für „seit X im aktuellen Schritt". */
export function getDurationTone(seconds: number): 'ok' | 'warn' | 'alert' {
  const days = seconds / 86400;
  if (days < 3) return 'ok';
  if (days < 7) return 'warn';
  return 'alert';
}
