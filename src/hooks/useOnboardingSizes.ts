import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Kleidungsgroesse, Schuhgroesse, GROESSEN_SPALTEN_MAP } from '@/lib/onboarding-sizes';

interface SizeUpdateParams {
  produktId: string;
  groesse: string;
}

/**
 * Hook für Größen-Updates in contractor_onboarding
 * 
 * Speichert die ausgewählte Größe direkt in der Datenbank,
 * damit das Backoffice sie bei Bestellungen sehen kann.
 */
export function useOnboardingSizes() {
  const queryClient = useQueryClient();
  
  const updateSizeMutation = useMutation({
    mutationFn: async ({ produktId, groesse }: SizeUpdateParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const spaltenName = GROESSEN_SPALTEN_MAP[produktId];
      if (!spaltenName) {
        return;
      }
      
      // Update via RPC (dynamisches Feld-Update)
      const { error } = await (supabase.rpc as unknown as (
        fn: string,
        params: Record<string, string>
      ) => Promise<{ error: Error | null }>)('update_contractor_onboarding_size', {
        p_spalte: spaltenName,
        p_groesse: groesse,
      });
      
      if (error) {
        console.error('[useOnboardingSizes] Size update failed:', error);
        throw error;
      }
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-profile'] });
    },
  });
  
  return {
    updateSize: updateSizeMutation.mutateAsync,
    isUpdating: updateSizeMutation.isPending,
    error: updateSizeMutation.error,
  };
}
