import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface TechnikerBenachrichtigung {
  id: string;
  techniker_id: string;
  auftrag_id: string | null;
  typ: string;
  titel: string;
  nachricht: string;
  gelesen_am: string | null;
  erstellt_am: string;
}

/**
 * Reads in-app notifications for the current technician.
 * RLS scopes by contractor_onboarding.profile_id = auth.uid().
 */
export function useTechnikerBenachrichtigungen() {
  return useQuery({
    queryKey: ['techniker-benachrichtigungen'],
    queryFn: async (): Promise<TechnikerBenachrichtigung[]> => {
      const { data, error } = await supabaseTC
        .from('techniker_benachrichtigungen' as any)
        .select('*')
        .order('erstellt_am', { ascending: false })
        .limit(50);
      if (error) {
        console.error('[useTechnikerBenachrichtigungen]', error);
        throw error;
      }
      return (data as any) ?? [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkBenachrichtigungGelesen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseTC
        .from('techniker_benachrichtigungen' as any)
        .update({ gelesen_am: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['techniker-benachrichtigungen'] }),
  });
}
