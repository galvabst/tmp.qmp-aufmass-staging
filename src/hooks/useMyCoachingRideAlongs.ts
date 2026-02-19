import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

export interface RideAlongTrainee {
  auftragId: string;
  vorname: string;
  nachname: string;
  telefon: string;
  email: string;
  plz: string;
  ort: string;
  avatarUrl?: string;
  gebuchtAm?: string;
  termine: { datum: string; ganztaegig: boolean; zeitVon?: string; zeitBis?: string }[];
}

async function syncSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await thermocheckClient.auth.setSession(session);
}

/**
 * Für Trainer: Lädt alle gebuchten Mitfahrten mit Trainee-Kontaktdaten.
 * 
 * Datenfluss:
 * 1. Eigene contractor_onboarding.id ermitteln (profile_id = profileId)
 * 2. thermocheck_auftraege: zugewiesener_techniker_id = onboarding.id AND coaching_gebucht_von IS NOT NULL
 * 3. Trainee-Profile laden (profiles WHERE id = coaching_gebucht_von)
 * 4. Trainee-Adressen laden (contractor_onboarding WHERE profile_id = coaching_gebucht_von)
 * 5. Termine laden
 */
export function useMyCoachingRideAlongs(profileId: string | null) {
  return useQuery({
    queryKey: ['coaching-ride-alongs', profileId],
    queryFn: async (): Promise<RideAlongTrainee[]> => {
      if (!profileId) return [];
      await syncSession();

      // 1. Eigene contractor_onboarding.id
      const { data: myOnb } = await thermocheckClient
        .from('contractor_onboarding')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!myOnb) return [];

      // 2. Aufträge wo ich Trainer bin UND jemand gebucht hat
      const { data: auftraege } = await thermocheckClient
        .from('thermocheck_auftraege')
        .select('id, coaching_gebucht_von, coaching_gebucht_am')
        .eq('zugewiesener_techniker_id', myOnb.id)
        .not('coaching_gebucht_von', 'is', null);

      if (!auftraege || auftraege.length === 0) return [];

      const traineeProfileIds = [...new Set(auftraege.map(a => a.coaching_gebucht_von).filter(Boolean))] as string[];
      const auftragIds = auftraege.map(a => a.id);

      // 3. Trainee-Profile laden
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, telefon, email, avatar_url')
        .in('id', traineeProfileIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // 4. Trainee-Adressen laden
      const { data: traineeOnbs } = await thermocheckClient
        .from('contractor_onboarding')
        .select('profile_id, anschrift_plz, anschrift_ort')
        .in('profile_id', traineeProfileIds);

      const addressMap = new Map((traineeOnbs || []).map(o => [o.profile_id, o]));

      // 5. Termine laden
      const { data: termine } = await thermocheckClient
        .from('thermocheck_terminvorschlaege')
        .select('thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung')
        .in('thermocheck_auftrag_id', auftragIds)
        .order('sortierung', { ascending: true });

      const termineByAuftrag = new Map<string, RideAlongTrainee['termine']>();
      for (const t of (termine || [])) {
        const list = termineByAuftrag.get(t.thermocheck_auftrag_id) || [];
        list.push({
          datum: t.datum,
          ganztaegig: t.ganztaegig,
          zeitVon: t.zeit_von || undefined,
          zeitBis: t.zeit_bis || undefined,
        });
        termineByAuftrag.set(t.thermocheck_auftrag_id, list);
      }

      // 6. Zusammenbauen
      const results: RideAlongTrainee[] = [];
      for (const auftrag of auftraege) {
        const traineeId = auftrag.coaching_gebucht_von;
        if (!traineeId) continue;

        const profile = profileMap.get(traineeId);
        const address = addressMap.get(traineeId);

        results.push({
          auftragId: auftrag.id,
          vorname: profile?.vorname || '',
          nachname: profile?.nachname || '',
          telefon: profile?.telefon || '',
          email: profile?.email || '',
          plz: address?.anschrift_plz || '',
          ort: address?.anschrift_ort || '',
          avatarUrl: profile?.avatar_url || undefined,
          gebuchtAm: auftrag.coaching_gebucht_am || undefined,
          termine: termineByAuftrag.get(auftrag.id) || [],
        });
      }

      // Sortieren: nächster Termin zuerst
      results.sort((a, b) => {
        const dateA = a.termine[0]?.datum || '9999';
        const dateB = b.termine[0]?.datum || '9999';
        return dateA.localeCompare(dateB);
      });

      return results;
    },
    enabled: !!profileId,
    staleTime: 60 * 1000,
  });
}
