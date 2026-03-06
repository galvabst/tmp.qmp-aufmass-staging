import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { subMonths, format, parseISO, isSameMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export interface MonthlyAggregatedPoint {
  month: string;
  checks: number;
  avgRating: number | null;
}

export interface AggregatedPerformance {
  monthly: MonthlyAggregatedPoint[];
  overallAvgRating: number | null;
  overallRatingCount: number;
  totalChecksLast6: number;
}

export function useAdminAggregatedStats() {
  return useQuery({
    queryKey: ['admin-aggregated-performance'],
    queryFn: async (): Promise<AggregatedPerformance> => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);
      const sinceDate = format(sixMonthsAgo, 'yyyy-MM-dd');

      // Parallel: fetch accepted termine + all bewertungen from last 6 months
      const [termineRes, bewertungenRes] = await Promise.all([
        supabaseTC
          .from('thermocheck_terminvorschlaege')
          .select('datum')
          .eq('status', 'angenommen')
          .gte('datum', sinceDate),
        supabaseTC
          .from('techniker_bewertungen')
          .select('bewertung, created_at')
          .gte('created_at', sinceDate),
      ]);

      const termine = termineRes.data ?? [];
      const bewertungen = bewertungenRes.data ?? [];

      // Build 6-month buckets
      const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

      const monthly: MonthlyAggregatedPoint[] = months.map(m => {
        const checks = termine.filter(t => t.datum && isSameMonth(parseISO(t.datum), m)).length;
        const monthRatings = bewertungen.filter(b => b.created_at && isSameMonth(parseISO(b.created_at), m));
        const avg = monthRatings.length > 0
          ? Math.round((monthRatings.reduce((s, r) => s + (r.bewertung ?? 0), 0) / monthRatings.length) * 10) / 10
          : null;

        return {
          month: format(m, 'MMM', { locale: de }),
          checks,
          avgRating: avg,
        };
      });

      // Overall stats
      const totalChecksLast6 = termine.length;
      const overallRatingCount = bewertungen.length;
      const overallAvgRating = overallRatingCount > 0
        ? Math.round((bewertungen.reduce((s, r) => s + (r.bewertung ?? 0), 0) / overallRatingCount) * 10) / 10
        : null;

      return { monthly, overallAvgRating, overallRatingCount, totalChecksLast6 };
    },
    staleTime: 5 * 60_000,
  });
}
