import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

interface BewertungStats {
  average: number;
  count: number;
}

/**
 * Fetches rating stats (average + count) for a given contractor from
 * thermocheck.techniker_bewertungen.
 */
export function useTechnikerBewertungStats(contractorOnboardingId: string | null | undefined) {
  return useQuery({
    queryKey: ['techniker-bewertung-stats', contractorOnboardingId],
    enabled: !!contractorOnboardingId,
    queryFn: async (): Promise<BewertungStats> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const headers: Record<string, string> = {
        apikey: SUPABASE_KEY,
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
        'Accept-Profile': 'thermocheck',
        'Content-Type': 'application/json',
      };

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/techniker_bewertungen?techniker_id=eq.${contractorOnboardingId}&select=bewertung`,
        { headers }
      );

      if (!res.ok) {
        console.error('[useTechnikerBewertungStats] Failed:', res.status);
        return { average: 0, count: 0 };
      }

      const rows: { bewertung: number }[] = await res.json();
      if (!rows.length) return { average: 0, count: 0 };

      const sum = rows.reduce((s, r) => s + r.bewertung, 0);
      return {
        average: Math.round((sum / rows.length) * 10) / 10,
        count: rows.length,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
