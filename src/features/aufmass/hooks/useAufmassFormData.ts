// Daten-Lade-Hook für die Aufmaß-Formularseite — herausgeschnitten aus
// AufmassFormPage (Verantwortung: Laden + Prefill, NICHT Submit/Render).
// Lädt Auftrag (typisiert als AuftragViewData), THC-Formular, PV-Formular, Bilder,
// legt bei Bedarf einen leeren Formular-Datensatz an und befüllt die Formulare
// nicht-destruktiv (nur leere Felder) vor. Spiegelt das vorherige Inline-Verhalten 1:1.
import { useCallback, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UseFormReturn } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import type { AufmassDraftData } from '../data/aufmass-schema';
import type { PvAufmassDraftData } from '../data/pv-aufmass-schema';
import type { AuftragViewData } from '../data/auftrag-view';
import { useVotFormular } from './useVotFormular';
import { usePvFormular } from './usePvFormular';
import { useVotBilder, type VotBild } from './useVotBilder';
import { useTechnikerProfil } from './useTechnikerProfil';

export interface AufmassFormDataResult {
  auftrag: AuftragViewData | null;
  formular: Record<string, unknown> | null;
  pvFormular: Record<string, unknown> | null;
  bilder: VotBild[];
  votFormularId?: string;
  isLoading: boolean;
  isReadOnly: boolean;
  leadName: string;
  leadId: string;
  kundenName: string;
}

export function useAufmassFormData(
  auftragId: string | undefined,
  userId: string | undefined,
  session: Session | null,
  form: UseFormReturn<AufmassDraftData>,
  pvForm: UseFormReturn<PvAufmassDraftData>,
): AufmassFormDataResult {
  // Load auftrag data (schmaler View-Typ statt Record<string, any> + as any)
  const { data: auftrag, isLoading: auftragLoading } = useQuery<AuftragViewData | null>({
    queryKey: ['thermocheck-auftrag-detail', auftragId],
    enabled: !!auftragId,
    queryFn: async () => {
      const { data, error } = await supabaseTC
        .from('v_thermocheck_auftraege' as never)
        .select('*')
        .eq('id', auftragId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as AuftragViewData | null;
    },
  });

  // Aufmaßtechniker (dem Auftrag zugewiesen) → Name+Telefon für den Prefill.
  const technikerProfil = useTechnikerProfil(auftrag?.zugewiesener_techniker_id);

  // Load existing formular
  const { data: formular, isLoading: formularLoading } = useVotFormular(auftragId);
  const votFormularId = (formular as { id?: string } | null)?.id;

  // Auto-create formular record if none exists
  const queryClient = useQueryClient();
  const autoCreatingRef = useRef(false);
  useEffect(() => {
    if (formularLoading || formular || !auftragId || !userId || autoCreatingRef.current) return;
    autoCreatingRef.current = true;
    supabaseTC
      .from('thermocheck_vot_formulare' as never)
      .insert({ thermocheck_auftrag_id: auftragId, eingereicht_von: userId, status: 'entwurf' } as never)
      .select()
      .single()
      .then(({ error }) => {
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['vot-formular', auftragId] });
        } else if (error.code === '23503') {
          if (import.meta.env.DEV) console.error('Auftrag existiert nicht (FK-Verletzung):', auftragId);
        } else if (import.meta.env.DEV) {
          console.warn('Auto-Create Formular fehlgeschlagen:', error.message);
        }
        autoCreatingRef.current = false;
      });
  }, [formularLoading, formular, auftragId, userId, queryClient]);

  // Load bilder + PV formular
  const { data: bilder = [] } = useVotBilder(votFormularId);
  const { data: pvFormular } = usePvFormular(votFormularId);

  // Prefill — only fill keys that are still empty in the current form state.
  // setValue() via buttons does NOT set the dirty flag, so a naive spread of
  // server values would overwrite user's Ja/Nein clicks after a refetch.
  // Stabile Identität (useCallback): hängt von keinem reaktiven Wert ab → kann
  // gefahrlos in den Dep-Arrays der Prefill-Effekte stehen.
  const mergePrefill = useCallback(<T extends Record<string, unknown>>(current: T, server: Record<string, unknown>): T => {
    const next = { ...current } as Record<string, unknown>;
    for (const [k, v] of Object.entries(server)) {
      if (next[k] === undefined || next[k] === null || next[k] === '') next[k] = v;
    }
    return next as T;
  }, []);

  useEffect(() => {
    if (!formular) return;
    form.reset(mergePrefill(form.getValues(), formular as Record<string, unknown>), { keepDirtyValues: true });
  }, [formular, form, mergePrefill]);

  useEffect(() => {
    if (!pvFormular) return;
    pvForm.reset(mergePrefill(pvForm.getValues(), pvFormular as Record<string, unknown>), { keepDirtyValues: true });
  }, [pvFormular, pvForm, mergePrefill]);

  // Prefill techniker data: bevorzugt der dem Auftrag ZUGEWIESENE Techniker (DB),
  // Fallback Login-Metadaten. Felder bleiben editierbar (nur setzen wenn leer).
  const technikerData = technikerProfil.data;
  useEffect(() => {
    if (!session?.user) return;
    const meta = session.user.user_metadata as { name?: string; telefon?: string } | undefined;
    const profil = technikerData;
    if (!form.getValues('techniker_name')) {
      const name = profil?.name || meta?.name;
      if (name) form.setValue('techniker_name', name);
    }
    if (!form.getValues('techniker_telefon')) {
      const telefon = profil?.telefon || meta?.telefon;
      if (telefon) form.setValue('techniker_telefon', telefon);
    }
    if (!form.getValues('thermocheck_datum')) {
      form.setValue('thermocheck_datum', new Date().toISOString().split('T')[0]);
    }
    // form bewusst nicht in den Deps (stabile RHF-Referenz; sonst Re-Run je Render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, technikerData]);

  const isReadOnly = (formular as { status?: string } | null)?.status === 'abgeschlossen';
  const leadName = auftrag?.lead_name || auftrag?.kunde_nachname || 'unbekannt';
  const leadId = auftrag?.lead_id || '';
  const kundenName = `${auftrag?.kunde_vorname || ''} ${auftrag?.kunde_nachname || ''}`.trim() || 'Unbekannt';

  return {
    auftrag: auftrag ?? null,
    formular: (formular as Record<string, unknown> | null) ?? null,
    pvFormular: (pvFormular as Record<string, unknown> | null) ?? null,
    bilder,
    votFormularId,
    isLoading: auftragLoading || formularLoading,
    isReadOnly,
    leadName,
    leadId,
    kundenName,
  };
}
