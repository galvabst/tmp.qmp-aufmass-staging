import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RejectComponentPayload } from '../types';

interface RejectArgs {
  onboardingId: string;
  components: RejectComponentPayload[];
}

interface RpcResponse {
  feedback_ids: string[];
  runde: number;
}

const BUCKET = 'praxistest-feedback';

/**
 * Lädt alle Annotations-Bilder hoch, dann ruft RPC reject_contractor_praxistest auf.
 * Bei RPC-Fehler werden hochgeladene Bilder defensiv aus dem Bucket entfernt.
 */
export function useRejectPraxistest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ onboardingId, components }: RejectArgs): Promise<RpcResponse> => {
      if (components.length === 0) {
        throw new Error('Keine Komponente ausgewählt');
      }

      const stamp = Date.now();
      const uploadedPaths: string[] = [];
      const componentsWithPaths: Array<{
        komponente: 'scan' | 'video';
        kommentar: string;
        bild_pfade: string[];
      }> = [];

      try {
        for (const comp of components) {
          const trimmed = comp.kommentar.trim();
          if (!trimmed) throw new Error(`Kommentar für ${comp.komponente} fehlt`);

          const compPaths: string[] = [];
          for (let i = 0; i < comp.bildBlobs.length; i++) {
            const blob = comp.bildBlobs[i];
            const path = `${onboardingId}/${stamp}/${comp.komponente}/${i}.png`;
            const { error } = await supabase.storage
              .from(BUCKET)
              .upload(path, blob, { contentType: 'image/png', upsert: true });
            if (error) throw new Error(`Bild-Upload fehlgeschlagen: ${error.message}`);
            uploadedPaths.push(path);
            compPaths.push(path);
          }
          componentsWithPaths.push({
            komponente: comp.komponente,
            kommentar: trimmed,
            bild_pfade: compPaths,
          });
        }

        const { data, error } = await (supabase.rpc as unknown as (
          fn: string,
          params: Record<string, unknown>,
        ) => Promise<{ data: RpcResponse | null; error: { message: string } | null }>)(
          'reject_contractor_praxistest',
          { p_onboarding_id: onboardingId, p_components: componentsWithPaths },
        );

        if (error || !data) {
          throw new Error(error?.message ?? 'Ablehnung fehlgeschlagen');
        }

        return data;
      } catch (err) {
        // Defensive cleanup: remove orphaned uploads
        if (uploadedPaths.length > 0) {
          try {
            await supabase.storage.from(BUCKET).remove(uploadedPaths);
          } catch (cleanupErr) {
            console.warn('[useRejectPraxistest] Cleanup failed:', cleanupErr);
          }
        }
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-qg-praxistests'] });
      qc.invalidateQueries({ queryKey: ['admin-contractors'] });
      qc.invalidateQueries({ queryKey: ['contractor-onboarding-state'] });
      qc.invalidateQueries({ queryKey: ['praxistest-feedback'] });
    },
  });
}
