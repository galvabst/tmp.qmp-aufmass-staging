import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, parseISO, isSameMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export interface MonthlyActivityPoint {
  month: string;   // "Jan", "Feb", …
  checks: number;
  avgRating: number | null;
}

export function useContractorActivityStats(contractorOnboardingId: string | null | undefined) {
  return useQuery({
    queryKey: ['contractor-activity-stats', contractorOnboardingId],
    enabled: !!contractorOnboardingId,
    queryFn: async (): Promise<MonthlyActivityPoint[]> => {
      const id = contractorOnboardingId!;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
      const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

      const headers: Record<string, string> = {
        apikey: SUPABASE_KEY,
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
        'Accept-Profile': 'thermocheck',
        'Content-Type': 'application/json',
      };

      // Parallel fetch: checks + ratings
      const [checksRes, ratingsRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/v_thermocheck_auftraege?zugewiesener_techniker_id=eq.${id}&vor_ort_checkin_at=not.is.null&select=vor_ort_checkin_at`,
          { headers }
        ),
        fetch(
          `${SUPABASE_URL}/rest/v1/techniker_bewertungen?techniker_id=eq.${id}&select=bewertung,created_at`,
          { headers }
        ),
      ]);

      const checks: { vor_ort_checkin_at: string }[] = checksRes.ok ? await checksRes.json() : [];
      const ratings: { bewertung: number; created_at: string }[] = ratingsRes.ok ? await ratingsRes.json() : [];

      // Build 6-month buckets
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

      return months.map((m): MonthlyActivityPoint => {
        const monthChecks = checks.filter(c => isSameMonth(parseISO(c.vor_ort_checkin_at), m));
        const monthRatings = ratings.filter(r => isSameMonth(parseISO(r.created_at), m));
        const avg = monthRatings.length > 0
          ? Math.round((monthRatings.reduce((s, r) => s + r.bewertung, 0) / monthRatings.length) * 10) / 10
          : null;

        return {
          month: format(m, 'MMM', { locale: de }),
          checks: monthChecks.length,
          avgRating: avg,
        };
      });
    },
    staleTime: 5 * 60_000,
  });
}
