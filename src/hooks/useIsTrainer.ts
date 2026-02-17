import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

export function useIsTrainer(profileId: string | null) {
  return useQuery({
    queryKey: ['is-trainer', profileId],
    queryFn: async (): Promise<boolean> => {
      if (!profileId) return false;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await thermocheckClient.auth.setSession(session);

      const { data } = await thermocheckClient
        .from('contractor_onboarding')
        .select('is_trainer')
        .eq('profile_id', profileId)
        .maybeSingle();

      return data?.is_trainer === true;
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
  });
}
