import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

// ── Types ──

export interface TrainerOption {
  onboardingId: string;
  profileId: string;
  name: string;
}

export interface TrainerAuftragOption {
  auftragId: string;
  customerName: string;
  ort: string | null;
  termine: { datum: string; ganztaegig: boolean; zeitVon: string | null; zeitBis: string | null }[];
  gebuchtVonProfileId: string | null;
  coachingBewertung: string | null;
}

// ── Queries ──

/** Liste aller aktiven Trainer (is_trainer = true). */
export function useTrainerList() {
  return useQuery({
    queryKey: ['admin-trainer-list'],
    queryFn: async (): Promise<TrainerOption[]> => {
      const { data, error } = await supabaseTC
        .from('contractor_onboarding')
        .select('id, profile_id')
        .eq('is_trainer', true);
      if (error) throw error;
      const onbs = data ?? [];
      if (onbs.length === 0) return [];
      const profileIds = onbs.map(o => o.profile_id).filter(Boolean) as string[];
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, vorname, nachname')
        .in('id', profileIds);
      if (pErr) throw pErr;
      const pmap = new Map((profs ?? []).map(p => [p.id, p]));
      return onbs
        .map(o => {
          const p = pmap.get(o.profile_id as string);
          return {
            onboardingId: o.id,
            profileId: o.profile_id as string,
            name: p ? `${p.vorname ?? ''} ${p.nachname ?? ''}`.trim() || 'Unbenannt' : 'Unbekannt',
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 60_000,
  });
}

/** Alle Coaching-Aufträge eines Trainers (inkl. vergangener Termine = Nacherfassung). */
export function useTrainerAuftraege(trainerOnboardingId: string | null) {
  return useQuery({
    queryKey: ['admin-trainer-auftraege', trainerOnboardingId],
    queryFn: async (): Promise<TrainerAuftragOption[]> => {
      if (!trainerOnboardingId) return [];
      const { data: auftraege, error } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id, kunde_vorname, kunde_nachname, kunde_ort, coaching_gebucht_von, coaching_bewertung')
        .eq('zugewiesener_techniker_id', trainerOnboardingId);
      if (error) throw error;
      if (!auftraege || auftraege.length === 0) return [];
      const ids = auftraege.map(a => a.id);
      const { data: termine, error: tErr } = await supabaseTC
        .from('thermocheck_terminvorschlaege')
        .select('thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung')
        .in('thermocheck_auftrag_id', ids)
        .order('sortierung', { ascending: true });
      if (tErr) throw tErr;
      const tmap = new Map<string, TrainerAuftragOption['termine']>();
      for (const t of termine ?? []) {
        const list = tmap.get(t.thermocheck_auftrag_id) ?? [];
        list.push({ datum: t.datum, ganztaegig: t.ganztaegig, zeitVon: t.zeit_von, zeitBis: t.zeit_bis });
        tmap.set(t.thermocheck_auftrag_id, list);
      }
      return auftraege
        .map((a): TrainerAuftragOption => ({
          auftragId: a.id,
          customerName: `${a.kunde_vorname ?? ''} ${a.kunde_nachname ?? ''}`.trim() || '–',
          ort: a.kunde_ort ?? null,
          termine: tmap.get(a.id) ?? [],
          gebuchtVonProfileId: a.coaching_gebucht_von ?? null,
          coachingBewertung: a.coaching_bewertung ?? null,
        }))
        .sort((a, b) => {
          const da = a.termine[0]?.datum ?? '9999';
          const db = b.termine[0]?.datum ?? '9999';
          return db.localeCompare(da); // neueste zuerst
        });
    },
    enabled: !!trainerOnboardingId,
    staleTime: 30_000,
  });
}

// ── Mutations ──

interface RpcResult {
  success: boolean;
  error?: string;
  message?: string;
  [k: string]: unknown;
}

export function useAdminBookCoachingRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { traineeProfileId: string; auftragId: string }) => {
      const { data, error } = await supabase.rpc('admin_book_coaching_ride' as never, {
        p_trainee_profile_id: p.traineeProfileId,
        p_auftrag_id: p.auftragId,
      } as never);
      if (error) throw new Error(error.message);
      const res = data as unknown as RpcResult;
      if (!res?.success) throw new Error(res?.error ?? 'Buchung fehlgeschlagen');
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contractors'] });
      qc.invalidateQueries({ queryKey: ['admin-trainer-auftraege'] });
      qc.invalidateQueries({ queryKey: ['coaching-ride-alongs'] });
    },
  });
}

export function useAdminSetOnboardingStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { profileId: string; targetStep: string }) => {
      const { data, error } = await supabase.rpc('admin_set_onboarding_step' as never, {
        p_profile_id: p.profileId,
        p_target_step: p.targetStep,
      } as never);
      if (error) throw new Error(error.message);
      const res = data as unknown as RpcResult;
      if (!res?.success) throw new Error(res?.error ?? 'Step-Update fehlgeschlagen');
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contractors'] });
    },
  });
}

export function useAdminRejectPraxistest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { onboardingId: string; notiz?: string }) => {
      const { data, error } = await supabase.rpc('admin_reject_praxistest' as never, {
        p_onboarding_id: p.onboardingId,
        p_notiz: p.notiz ?? null,
      } as never);
      if (error) throw new Error(error.message);
      const res = data as unknown as RpcResult;
      if (!res?.success) throw new Error(res?.error ?? 'Ablehnung fehlgeschlagen');
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contractors'] });
      qc.invalidateQueries({ queryKey: ['admin-qg-praxistests'] });
    },
  });
}
