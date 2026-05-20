import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { subMonths, format, parseISO, isSameMonth, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';

export interface OnboardingDurationPoint {
  month: string;
  abgeschlossen: number;
  avgTage: number | null;
  minTage: number | null;
  maxTage: number | null;
}

export interface OnboardingDurationStats {
  monthly: OnboardingDurationPoint[];
  overallAvgTage: number | null;
  overallCount: number;
}

export function useOnboardingDurationStats() {
  return useQuery({
    queryKey: ['admin-onboarding-duration-stats'],
    queryFn: async (): Promise<OnboardingDurationStats> => {
      const now = new Date();
      const earliest = subMonths(now, 5);
      // Start of earliest month
      const earliestIso = new Date(earliest.getFullYear(), earliest.getMonth(), 1).toISOString();

      const { data, error } = await supabaseTC
        .from('contractor_onboarding')
        .select('erstellt_am, trainer_freigabe_am, trainer_freigabe')
        .eq('trainer_freigabe', true)
        .not('trainer_freigabe_am', 'is', null)
        .not('erstellt_am', 'is', null)
        .gte('trainer_freigabe_am', earliestIso);

      if (error) {
        console.error('[useOnboardingDurationStats] error:', error);
        return { monthly: buildEmpty(), overallAvgTage: null, overallCount: 0 };
      }

      const rows = (data ?? []).map(r => ({
        ready: parseISO(r.trainer_freigabe_am as string),
        start: parseISO(r.erstellt_am as string),
        tage: differenceInHours(parseISO(r.trainer_freigabe_am as string), parseISO(r.erstellt_am as string)) / 24,
      }));

      const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
      const monthly = months.map((m): OnboardingDurationPoint => {
        const bucket = rows.filter(r => isSameMonth(r.ready, m));
        if (bucket.length === 0) {
          return {
            month: format(m, 'MMM', { locale: de }),
            abgeschlossen: 0,
            avgTage: null,
            minTage: null,
            maxTage: null,
          };
        }
        const tageArr = bucket.map(b => b.tage);
        return {
          month: format(m, 'MMM', { locale: de }),
          abgeschlossen: bucket.length,
          avgTage: Math.round((tageArr.reduce((s, v) => s + v, 0) / tageArr.length) * 10) / 10,
          minTage: Math.round(Math.min(...tageArr) * 10) / 10,
          maxTage: Math.round(Math.max(...tageArr) * 10) / 10,
        };
      });

      const overallCount = rows.length;
      const overallAvgTage = overallCount > 0
        ? Math.round((rows.reduce((s, r) => s + r.tage, 0) / overallCount) * 10) / 10
        : null;

      return { monthly, overallAvgTage, overallCount };
    },
    staleTime: 5 * 60_000,
  });
}

function buildEmpty(): OnboardingDurationPoint[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => ({
    month: format(subMonths(now, 5 - i), 'MMM', { locale: de }),
    abgeschlossen: 0,
    avgTage: null,
    minTage: null,
    maxTage: null,
  }));
}
