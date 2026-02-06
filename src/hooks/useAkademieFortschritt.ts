import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

// Same thermocheck client as useAkademieContent
const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

/**
 * Hook to fetch completed lektion IDs from contractor_akademie_lektions_fortschritt.
 * Returns a Set<string> of lektion_ids with status 'completed'.
 */
export function useAkademieFortschritt(onboardingId: string | null) {
  return useQuery({
    queryKey: ['akademie-fortschritt', onboardingId],
    queryFn: async (): Promise<Set<string>> => {
      if (!onboardingId) return new Set();

      const { data, error } = await thermocheckClient
        .from('contractor_akademie_lektions_fortschritt')
        .select('lektion_id')
        .eq('onboarding_id', onboardingId)
        .eq('status', 'completed');

      if (error) {
        console.warn('[AkademieFortschritt] Error fetching progress:', error);
        return new Set();
      }

      const ids = new Set((data || []).map((row: { lektion_id: string }) => row.lektion_id));
      console.log(`[AkademieFortschritt] Loaded ${ids.size} completed lektionen`);
      return ids;
    },
    enabled: !!onboardingId,
    staleTime: 2 * 60 * 1000,
  });
}
