import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { AufmassDraftData, FORM_DB_FIELDS } from '../data/aufmass-schema';
import { toast } from 'sonner';

/** Eine dokumentierte Begründung zu einem Soft-Plausibilitäts-Befund (fürs Büro). */
export interface PlausiBegruendung {
  field: string;
  message: string;
  begruendung: string;
  erfasst_am: string;
}

/**
 * Minimaler Typ-Vertrag für die ID-Spalte von thermocheck_vot_formulare.
 * Die thermocheck-Schema-Tabellen fehlen in den generierten Supabase-Typen
 * (`.from(... as any)` bleibt deshalb am Tabellennamen). Diese Schnittstelle
 * typisiert NUR den ID-Lese-Pfad (existing/insert/update-readback), damit
 * `existingId` nicht still `undefined` werden kann und ein Tippfehler im
 * Feldnamen `id` vom Compiler gefangen wird. */
interface VotFormularIdRow {
  id: string;
}

/** Spalte evtl. noch nicht migriert / PostgREST-Cache stale → defensiv erkennen. */
function isMissingColumn(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return !!e && (e.code === 'PGRST204' || e.code === '42703' || /column .* does not exist/i.test(e.message ?? ''));
}

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
      plausiBegruendungen,
    }: {
      thermocheckAuftragId: string;
      formData: Partial<AufmassDraftData>;
      userId: string;
      isSubmit?: boolean;
      silent?: boolean;
      /** Pflicht-Begründungen zu Soft-Befunden (nur beim Einreichen, separat persistiert). */
      plausiBegruendungen?: PlausiBegruendung[];
    }) => {
      // Filter to only DB fields
      const dbPayload: Record<string, any> = {};
      for (const key of FORM_DB_FIELDS) {
        if (formData[key] !== undefined) dbPayload[key] = formData[key];
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

      // Begründungen NACH dem FORM_DB_FIELDS-Filter anhängen (sonst verworfen).
      if (plausiBegruendungen && plausiBegruendungen.length > 0) {
        dbPayload.plausi_begruendungen = plausiBegruendungen;
      }

      const { data: existing } = await supabaseTC
        .from('thermocheck_vot_formulare' as any)
        .select('id')
        .eq('thermocheck_auftrag_id', thermocheckAuftragId)
        .maybeSingle<VotFormularIdRow>();
      // Typsicher: existing ist VotFormularIdRow | null → id ist string (kein stilles any).
      const existingId: string | undefined = existing?.id;

      const writeOnce = async (payload: Record<string, any>) => {
        if (existingId) {
          return supabaseTC
            .from('thermocheck_vot_formulare' as any)
            .update(payload)
            .eq('id', existingId)
            .select()
            .single();
        }
        return supabaseTC
          .from('thermocheck_vot_formulare' as any)
          .insert({ thermocheck_auftrag_id: thermocheckAuftragId, eingereicht_von: userId, ...payload })
          .select()
          .single();
      };

      let { data, error } = await writeOnce(dbPayload);
      // Resilienz: Wenn die Begründungs-Spalte (noch) fehlt, denselben Submit OHNE sie retryen.
      if (error && isMissingColumn(error) && 'plausi_begruendungen' in dbPayload) {
        const { plausi_begruendungen, ...ohneBegruendungen } = dbPayload;
        void plausi_begruendungen;
        console.warn('plausi_begruendungen-Spalte fehlt – Submit ohne Begründungen gespeichert. Migration einspielen.');
        ({ data, error } = await writeOnce(ohneBegruendungen));
      }
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vot-formular', variables.thermocheckAuftragId] });
      if (variables.silent) return;
      toast.success(variables.isSubmit ? 'Formular eingereicht!' : 'Entwurf gespeichert');
    },
    onError: (error) => {
      console.error('VOT Formular Fehler:', error);
      toast.error('Fehler beim Speichern');
    },
  });
}
