import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

export interface TrainerProfileData {
  trainer_video_url: string | null;
  trainer_bio: string | null;
}

export function useTrainerProfile(profileId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trainer-profile', profileId],
    queryFn: async (): Promise<TrainerProfileData | null> => {
      if (!profileId) return null;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await thermocheckClient.auth.setSession(session);

      const { data, error } = await thermocheckClient
        .from('contractor_onboarding')
        .select('trainer_video_url, trainer_bio')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        console.warn('[TrainerProfile] Error loading:', error);
        return null;
      }

      return data || null;
    },
    enabled: !!profileId,
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<TrainerProfileData>) => {
      if (!profileId) throw new Error('Keine Profile-ID');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await thermocheckClient.auth.setSession(session);

      const { error } = await thermocheckClient
        .from('contractor_onboarding')
        .update(updates)
        .eq('profile_id', profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-profile', profileId] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateTrainerProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
