import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { PvAufmassDraftData, PV_FORM_DB_FIELDS } from '../data/pv-aufmass-schema';
import { toast } from 'sonner';

/** Load existing PV formular for a VOT formular (or null) */
export function usePvFormular(votFormularId: string | undefined) {
  return useQuery({
    queryKey: ['pv-formular', votFormularId],
    enabled: !!votFormularId,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from('thermocheck_pv_formulare' as any)
        .select('*')
        .eq('vot_formular_id', votFormularId!)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, any> | null;
    },
  });
}

/** Upsert (create or update) PV formular */
export function useUpsertPvFormular() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      votFormularId,
      formData,
      userId,
      isSubmit = false,
      silent = false,
    }: {
      votFormularId: string;
      formData: Partial<PvAufmassDraftData>;
      userId: string;
      isSubmit?: boolean;
      silent?: boolean;
    }) => {
      const dbPayload: Record<string, any> = {};
      for (const key of PV_FORM_DB_FIELDS) {
        if (formData[key] !== undefined) {
          dbPayload[key] = formData[key];
        }
      }
      // Sanitize empty strings to null (prevents DB date parse errors)
      for (const key of Object.keys(dbPayload)) {
        if (dbPayload[key] === '') dbPayload[key] = null;
      }

      if (isSubmit) {
        dbPayload.status = 'abgeschlossen';
      } else {
        dbPayload.status = 'entwurf';
      }

      // Check if exists
      const { data: existing } = await supabaseTC
        .from('thermocheck_pv_formulare' as any)
        .select('id')
        .eq('vot_formular_id', votFormularId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabaseTC
          .from('thermocheck_pv_formulare' as any)
          .update(dbPayload)
          .eq('id', (existing as any).id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabaseTC
          .from('thermocheck_pv_formulare' as any)
          .insert({
            vot_formular_id: votFormularId,
            eingereicht_von: userId,
            ...dbPayload,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pv-formular', variables.votFormularId] });
      if (variables.silent) return;
      if (variables.isSubmit) {
        toast.success('PV-Formular eingereicht!');
      } else {
        toast.success('PV-Entwurf gespeichert');
      }
    },
    onError: (error) => {
      console.error('PV Formular Fehler:', error);
      toast.error('Fehler beim Speichern des PV-Formulars');
    },
  });
}
