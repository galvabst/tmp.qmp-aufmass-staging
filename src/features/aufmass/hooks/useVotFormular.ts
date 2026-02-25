import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { AufmassDraftData, FORM_DB_FIELDS } from '../data/aufmass-schema';
import { toast } from 'sonner';

/** Load existing VOT formular for a thermocheck auftrag (or null) */
export function useVotFormular(thermocheckAuftragId: string | undefined) {
  return useQuery({
    queryKey: ['vot-formular', thermocheckAuftragId],
    enabled: !!thermocheckAuftragId,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from('thermocheck_vot_formulare' as any)
        .select('*')
        .eq('thermocheck_auftrag_id', thermocheckAuftragId!)
        .maybeSingle();

      if (error) throw error;
      return data as Record<string, any> | null;
    },
  });
}

/** Upsert (create or update) VOT formular draft */
export function useUpsertVotFormular() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      thermocheckAuftragId,
      formData,
      userId,
      isSubmit = false,
      silent = false,
    }: {
      thermocheckAuftragId: string;
      formData: Partial<AufmassDraftData>;
      userId: string;
      isSubmit?: boolean;
      silent?: boolean;
    }) => {
      // Filter to only DB fields
      const dbPayload: Record<string, any> = {};
      for (const key of FORM_DB_FIELDS) {
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
        dbPayload.eingereicht_am = new Date().toISOString();
        dbPayload.eingereicht_von = userId;
      } else {
        dbPayload.status = 'entwurf';
      }

      // Check if exists
      const { data: existing } = await supabaseTC
        .from('thermocheck_vot_formulare' as any)
        .select('id')
        .eq('thermocheck_auftrag_id', thermocheckAuftragId)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabaseTC
          .from('thermocheck_vot_formulare' as any)
          .update(dbPayload)
          .eq('id', (existing as any).id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabaseTC
          .from('thermocheck_vot_formulare' as any)
          .insert({
            thermocheck_auftrag_id: thermocheckAuftragId,
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
      queryClient.invalidateQueries({ queryKey: ['vot-formular', variables.thermocheckAuftragId] });
      if (variables.silent) return;
      if (variables.isSubmit) {
        toast.success('Formular eingereicht!');
      } else {
        toast.success('Entwurf gespeichert');
      }
    },
    onError: (error) => {
      console.error('VOT Formular Fehler:', error);
      toast.error('Fehler beim Speichern');
    },
  });
}
