import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Thermocheck schema client
const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

export interface CoachingTermin {
  datum: string;
  ganztaegig: boolean;
  zeit_von?: string;
  zeit_bis?: string;
}

export interface DbCoachingRide {
  auftrag_id: string;
  trainer_profile_id: string;
  termine: CoachingTermin[];
  region: string;
  trainer_vorname: string;
  trainer_nachname: string;
  trainer_avatar_url?: string;
  trainer_video_url?: string;
  trainer_bio?: string;
  trainer_coaching_preis?: number;
  trainer_telefon?: string;
  trainer_email?: string;
  trainer_ort?: string;
}

async function syncSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await thermocheckClient.auth.setSession(session);
  }
}

/**
 * Lädt verfügbare Coaching-Rides (Aufträge mit Trainer + Terminvorschläge, noch nicht gebucht)
 * 
 * WICHTIG: zugewiesener_techniker_id = contractor_onboarding.id (NICHT profile_id)
 * Daher: Trainer über contractor_onboarding.id laden, Profile über profile_id auflösen
 */
export function useAvailableCoachingRides() {
  return useQuery({
    queryKey: ['coaching-rides', 'available'],
    queryFn: async (): Promise<DbCoachingRide[]> => {
      await syncSession();

      // 1. Alle Trainer laden (id = contractor_onboarding.id, profile_id = auth user id)
      const { data: trainers, error: trainerErr } = await thermocheckClient
        .from('contractor_onboarding')
        .select('id, profile_id, trainer_video_url, trainer_bio, trainer_coaching_preis')
        .eq('is_trainer', true);

      if (trainerErr || !trainers || trainers.length === 0) {
        console.warn('[CoachingRides] No trainers found:', trainerErr);
        return [];
      }

      // Map: contractor_onboarding.id -> trainer record
      const trainerByContractorId = new Map(trainers.map(t => [t.id, t]));
      const contractorIds = trainers.map(t => t.id);

      // 2. Aufträge filtern mit contractor_onboarding.id (NICHT profile_id)
      const { data: auftraege, error: auftraegeErr } = await thermocheckClient
        .from('thermocheck_auftraege')
        .select('id, lead_id, zugewiesener_techniker_id')
        .in('zugewiesener_techniker_id', contractorIds)
        .is('coaching_gebucht_von', null);

      if (auftraegeErr || !auftraege || auftraege.length === 0) {
        console.warn('[CoachingRides] No available rides:', auftraegeErr);
        return [];
      }

      const auftragIds = auftraege.map(a => a.id);
      const leadIds = [...new Set(auftraege.map(a => a.lead_id).filter(Boolean))];

      // 3. Terminvorschläge laden (nur zukünftige)
      const today = new Date().toISOString().slice(0, 10);
      const { data: termine } = await thermocheckClient
        .from('thermocheck_terminvorschlaege')
        .select('thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung')
        .in('thermocheck_auftrag_id', auftragIds)
        .gte('datum', today)
        .order('sortierung', { ascending: true });

      const termineByAuftrag = new Map<string, CoachingTermin[]>();
      for (const t of (termine || [])) {
        const list = termineByAuftrag.get(t.thermocheck_auftrag_id) || [];
        list.push({
          datum: t.datum,
          ganztaegig: t.ganztaegig,
          zeit_von: t.zeit_von || undefined,
          zeit_bis: t.zeit_bis || undefined,
        });
        termineByAuftrag.set(t.thermocheck_auftrag_id, list);
      }

      // 4. Trainer profile_ids sammeln und Profile aus public schema laden
      const profileIds = [...new Set(trainers.map(t => t.profile_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .in('id', profileIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // 5. Lead-Daten für Region laden
      let regionMap = new Map<string, string>();
      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, kunde_plz, kunde_ort')
          .in('id', leadIds);

        regionMap = new Map(
          (leads || []).map(l => [l.id, `${l.kunde_plz || ''} ${l.kunde_ort || ''}`.trim()])
        );
      }

      // 6. Zusammenbauen — nur Aufträge mit zukünftigen Terminen
      const results: DbCoachingRide[] = [];
      for (const auftrag of auftraege) {
        const auftragTermine = termineByAuftrag.get(auftrag.id) || [];
        if (auftragTermine.length === 0) continue;

        const trainerRecord = trainerByContractorId.get(auftrag.zugewiesener_techniker_id);
        if (!trainerRecord) continue;

        const profile = profileMap.get(trainerRecord.profile_id);

        results.push({
          auftrag_id: auftrag.id,
          trainer_profile_id: trainerRecord.profile_id,
          termine: auftragTermine,
          region: regionMap.get(auftrag.lead_id) || 'Region',
          trainer_vorname: profile?.vorname || '',
          trainer_nachname: profile?.nachname || '',
          trainer_avatar_url: profile?.avatar_url || undefined,
          trainer_video_url: trainerRecord.trainer_video_url || undefined,
          trainer_bio: trainerRecord.trainer_bio || undefined,
          trainer_coaching_preis: trainerRecord.trainer_coaching_preis ?? undefined,
        });
      }

      return results;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Lädt den gebuchten Ride des aktuellen Users
 * 
 * WICHTIG: zugewiesener_techniker_id = contractor_onboarding.id
 * Daher: erst contractor_onboarding laden, dann profile_id -> profiles
 */
export function useMyBookedRide(profileId: string | null) {
  return useQuery({
    queryKey: ['coaching-rides', 'my-booked', profileId],
    queryFn: async (): Promise<DbCoachingRide | null> => {
      if (!profileId) return null;
      await syncSession();

      // Auftrag finden wo coaching_gebucht_von = profileId AND noch ausstehend
      // (nicht_bestanden/abgesagt/no_show behalten coaching_gebucht_von für Historie)
      const { data: auftrag, error } = await thermocheckClient
        .from('thermocheck_auftraege')
        .select('id, lead_id, zugewiesener_techniker_id, coaching_bewertung')
        .eq('coaching_gebucht_von', profileId)
        .eq('coaching_bewertung', 'ausstehend')
        .limit(1)
        .maybeSingle();

      if (error || !auftrag) return null;

      // Termine laden
      const { data: termine } = await thermocheckClient
        .from('thermocheck_terminvorschlaege')
        .select('datum, ganztaegig, zeit_von, zeit_bis, sortierung')
        .eq('thermocheck_auftrag_id', auftrag.id)
        .order('sortierung', { ascending: true });

      // FIX: contractor_onboarding laden per id (= zugewiesener_techniker_id)
      const { data: trainerOnb } = await thermocheckClient
        .from('contractor_onboarding')
        .select('profile_id, trainer_video_url, trainer_bio, trainer_coaching_preis')
        .eq('id', auftrag.zugewiesener_techniker_id)
        .maybeSingle();

      // Dann profiles mit der aufgelösten profile_id laden
      let trainer: { vorname: string; nachname: string; avatar_url: string | null; telefon: string | null; email: string | null } | null = null;
      if (trainerOnb?.profile_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('vorname, nachname, avatar_url, telefon, email')
          .eq('id', trainerOnb.profile_id)
          .maybeSingle();
        trainer = profileData;
      }

      // Region aus Lead
      let region = 'Region';
      if (auftrag.lead_id) {
        const { data: lead } = await supabase
          .from('leads')
          .select('kunde_plz, kunde_ort')
          .eq('id', auftrag.lead_id)
          .maybeSingle();
        if (lead) {
          region = `${lead.kunde_plz || ''} ${lead.kunde_ort || ''}`.trim() || 'Region';
        }
      }

      // Trainer-Ort aus contractor_onboarding
      let trainerOrt: string | undefined;
      if (trainerOnb) {
        const { data: trainerOnbFull } = await thermocheckClient
          .from('contractor_onboarding')
          .select('anschrift_plz, anschrift_ort')
          .eq('id', auftrag.zugewiesener_techniker_id)
          .maybeSingle();
        if (trainerOnbFull) {
          trainerOrt = [trainerOnbFull.anschrift_plz, trainerOnbFull.anschrift_ort].filter(Boolean).join(' ').trim() || undefined;
        }
      }

      return {
        auftrag_id: auftrag.id,
        trainer_profile_id: trainerOnb?.profile_id || auftrag.zugewiesener_techniker_id,
        termine: (termine || []).map(t => ({
          datum: t.datum,
          ganztaegig: t.ganztaegig,
          zeit_von: t.zeit_von || undefined,
          zeit_bis: t.zeit_bis || undefined,
        })),
        region,
        trainer_vorname: trainer?.vorname || '',
        trainer_nachname: trainer?.nachname || '',
        trainer_avatar_url: trainer?.avatar_url || undefined,
        trainer_video_url: trainerOnb?.trainer_video_url || undefined,
        trainer_bio: trainerOnb?.trainer_bio || undefined,
        trainer_coaching_preis: trainerOnb?.trainer_coaching_preis ?? undefined,
        trainer_telefon: trainer?.telefon || undefined,
        trainer_email: trainer?.email || undefined,
        trainer_ort: trainerOrt,
      };
    },
    enabled: !!profileId,
    staleTime: 60 * 1000,
  });
}

/**
 * Bucht einen Coaching-Ride via RPC (atomar)
 */
export function useBookCoachingRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (auftragId: string) => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        params: { p_auftrag_id: string }
      ) => Promise<{ data: { success: boolean; error?: string; coach_name?: string; datum?: string } | null; error: Error | null }>)(
        'book_coaching_ride',
        { p_auftrag_id: auftragId }
      );

      if (error) throw error;
      if (!data || !data.success) {
        throw new Error(data?.error || 'Buchung fehlgeschlagen');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-rides'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-state'] });
    },
  });
}
