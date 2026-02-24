import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AufmassDraftData, FORM_DB_FIELDS } from '../data/aufmass-schema';
import { toast } from 'sonner';

const THERMOCHECK_HEADERS = { 'Accept-Profile': 'thermocheck', 'Content-Profile': 'thermocheck' };

/** Load existing VOT formular for a thermocheck auftrag (or null) */
export function useVotFormular(thermocheckAuftragId: string | undefined) {
  return useQuery({
    queryKey: ['vot-formular', thermocheckAuftragId],
    enabled: !!thermocheckAuftragId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thermocheck_vot_formulare' as any)
        .select('*')
        .eq('thermocheck_auftrag_id', thermocheckAuftragId!)
        .maybeSingle()
        .setHeader('Accept-Profile', 'thermocheck');

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
    }: {
      thermocheckAuftragId: string;
      formData: Partial<AufmassDraftData>;
      userId: string;
      isSubmit?: boolean;
    }) => {
      // Filter to only DB fields
      const dbPayload: Record<string, any> = {};
      for (const key of FORM_DB_FIELDS) {
        if (formData[key] !== undefined) {
          dbPayload[key] = formData[key];
        }
      }

      if (isSubmit) {
        dbPayload.status = 'abgeschlossen';
        dbPayload.eingereicht_am = new Date().toISOString();
        dbPayload.eingereicht_von = userId;
      } else {
        dbPayload.status = 'entwurf';
      }

      // Check if exists
      const { data: existing } = await supabase
        .from('thermocheck_vot_formulare' as any)
        .select('id')
        .eq('thermocheck_auftrag_id', thermocheckAuftragId)
        .maybeSingle()
        .setHeader('Accept-Profile', 'thermocheck');

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('thermocheck_vot_formulare' as any)
          .update(dbPayload)
          .eq('id', (existing as any).id)
          .select()
          .single()
          .setHeader('Accept-Profile', 'thermocheck')
          .setHeader('Content-Profile', 'thermocheck');

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('thermocheck_vot_formulare' as any)
          .insert({
            thermocheck_auftrag_id: thermocheckAuftragId,
            eingereicht_von: userId,
            ...dbPayload,
          })
          .select()
          .single()
          .setHeader('Accept-Profile', 'thermocheck')
          .setHeader('Content-Profile', 'thermocheck');

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vot-formular', variables.thermocheckAuftragId] });
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
