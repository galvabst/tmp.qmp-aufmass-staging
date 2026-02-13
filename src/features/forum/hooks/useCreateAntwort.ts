import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCreateAntwort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, inhalt }: { threadId: string; inhalt: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      // Check if user is trainer (server-side via DB)
      const { data: onboardingData } = await supabase
        .schema('thermocheck' as any)
        .from('contractor_onboarding')
        .select('is_trainer')
        .eq('profile_id', user.id)
        .single();

      const istTrainer = onboardingData?.is_trainer === true;

      const { data, error } = await supabase
        .schema('thermocheck' as any)
        .from('contractor_forum_antworten')
        .insert({
          thread_id: threadId,
          autor_profile_id: user.id,
          inhalt,
          ist_trainer_antwort: istTrainer,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-antworten', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
      toast.success('Antwort gesendet! ✓');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
