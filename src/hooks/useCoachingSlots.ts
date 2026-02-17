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
}

async function syncSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await thermocheckClient.auth.setSession(session);
  }
}

/**
 * Lädt verfügbare Coaching-Rides (Aufträge mit Trainer + Terminvorschläge, noch nicht gebucht)
 */
export function useAvailableCoachingRides() {
  return useQuery({
    queryKey: ['coaching-rides', 'available'],
    queryFn: async (): Promise<DbCoachingRide[]> => {
      await syncSession();

      // 1. Alle Trainer-IDs laden
      const { data: trainers, error: trainerErr } = await thermocheckClient
        .from('contractor_onboarding')
        .select('profile_id, trainer_video_url, trainer_bio')
        .eq('is_trainer', true);

      if (trainerErr || !trainers || trainers.length === 0) {
        console.warn('[CoachingRides] No trainers found:', trainerErr);
        return [];
      }

      const trainerIds = trainers.map(t => t.profile_id);
      const trainerMap = new Map(trainers.map(t => [t.profile_id, t]));

      // 2. Aufträge mit zugewiesenem Trainer laden (noch nicht gebucht)
      const { data: auftraege, error: auftraegeErr } = await thermocheckClient
        .from('thermocheck_auftraege')
        .select('id, lead_id, zugewiesener_techniker_id')
        .in('zugewiesener_techniker_id', trainerIds)
        .is('coaching_gebucht_von', null);

      if (auftraegeErr || !auftraege || auftraege.length === 0) {
        console.warn('[CoachingRides] No available rides:', auftraegeErr);
        return [];
      }

      const auftragIds = auftraege.map(a => a.id);
      const leadIds = [...new Set(auftraege.map(a => a.lead_id).filter(Boolean))];

      // 3. Terminvorschläge laden
      const { data: termine } = await thermocheckClient
        .from('thermocheck_terminvorschlaege')
        .select('thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung')
        .in('thermocheck_auftrag_id', auftragIds)
        .order('sortierung', { ascending: true });

      // Nur Aufträge MIT Terminvorschlägen anzeigen
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

      // 4. Trainer-Profile (Name + Avatar) aus public schema laden
      const trainerProfileIds = [...new Set(auftraege.map(a => a.zugewiesener_techniker_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .in('id', trainerProfileIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // 5. Lead-Daten für Region laden (public schema)
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

      // 6. Zusammenbauen
      const results: DbCoachingRide[] = [];
      for (const auftrag of auftraege) {
        const auftragTermine = termineByAuftrag.get(auftrag.id);
        if (!auftragTermine || auftragTermine.length === 0) continue; // Skip ohne Termine

        const trainer = profileMap.get(auftrag.zugewiesener_techniker_id);
        const trainerOnb = trainerMap.get(auftrag.zugewiesener_techniker_id);

        results.push({
          auftrag_id: auftrag.id,
          trainer_profile_id: auftrag.zugewiesener_techniker_id,
          termine: auftragTermine,
          region: regionMap.get(auftrag.lead_id) || 'Region',
          trainer_vorname: trainer?.vorname || '',
          trainer_nachname: trainer?.nachname || '',
          trainer_avatar_url: trainer?.avatar_url || undefined,
          trainer_video_url: trainerOnb?.trainer_video_url || undefined,
          trainer_bio: trainerOnb?.trainer_bio || undefined,
        });
      }

      return results;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Lädt den gebuchten Ride des aktuellen Users
 */
export function useMyBookedRide(profileId: string | null) {
  return useQuery({
    queryKey: ['coaching-rides', 'my-booked', profileId],
    queryFn: async (): Promise<DbCoachingRide | null> => {
      if (!profileId) return null;
      await syncSession();

      // Auftrag finden wo coaching_gebucht_von = profileId
      const { data: auftrag, error } = await thermocheckClient
        .from('thermocheck_auftraege')
        .select('id, lead_id, zugewiesener_techniker_id')
        .eq('coaching_gebucht_von', profileId)
        .limit(1)
        .maybeSingle();

      if (error || !auftrag) return null;

      // Termine laden
      const { data: termine } = await thermocheckClient
        .from('thermocheck_terminvorschlaege')
        .select('datum, ganztaegig, zeit_von, zeit_bis, sortierung')
        .eq('thermocheck_auftrag_id', auftrag.id)
        .order('sortierung', { ascending: true });

      // Trainer-Profile
      const { data: trainer } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .eq('id', auftrag.zugewiesener_techniker_id)
        .maybeSingle();

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

      // Trainer Video/Bio
      const { data: trainerOnb } = await thermocheckClient
        .from('contractor_onboarding')
        .select('trainer_video_url, trainer_bio')
        .eq('profile_id', auftrag.zugewiesener_techniker_id)
        .maybeSingle();

      return {
        auftrag_id: auftrag.id,
        trainer_profile_id: auftrag.zugewiesener_techniker_id,
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
