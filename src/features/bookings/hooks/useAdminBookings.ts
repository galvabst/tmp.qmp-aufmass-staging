import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

export interface AdminBooking {
  id: string;
  auftragId: string;
  customerName: string;
  address: string;
  datum: string;
  zeitVon: string | null;
  zeitBis: string | null;
  ganztaegig: boolean;
  technikerId: string | null;
  technikerName: string;
  technikerProfileId: string | null;
  technikerAvatarUrl: string | null;
  angenommenAm: string | null;
  buchungBestaetigtAm: string | null;
  vortagBestaetigtAm: string | null;
}

export function useAdminBookings() {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async (): Promise<AdminBooking[]> => {
      // Fetch angenommene Termine
      const { data: termine, error: tErr } = await supabaseTC
        .from('thermocheck_terminvorschlaege')
        .select('id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,angenommen_am,angenommen_von')
        .eq('status', 'angenommen')
        .order('datum', { ascending: true });
      if (tErr) throw tErr;
      if (!termine?.length) return [];

      const auftragIds = [...new Set(termine.map(t => t.thermocheck_auftrag_id))];
      const { data: auftraege } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,zugewiesener_techniker_id,buchung_bestaetigt_am,vortag_bestaetigt_am')
        .in('id', auftragIds);

      const auftragMap = new Map((auftraege || []).map(a => [a.id, a]));

      // Resolve techniker IDs (contractor_onboarding.id → profile_id)
      const technikerIds = [...new Set((auftraege || []).map(a => a.zugewiesener_techniker_id).filter(Boolean))] as string[];
      
      let profileIdMap = new Map<string, string>(); // onboarding_id → profile_id
      let profileMap = new Map<string, { vorname: string; nachname: string; avatar_url: string | null }>(); // profile_id → profile

      if (technikerIds.length > 0) {
        const { data: onboardings } = await supabaseTC
          .from('contractor_onboarding')
          .select('id,profile_id')
          .in('id', technikerIds);

        if (onboardings?.length) {
          onboardings.forEach(o => { if (o.profile_id) profileIdMap.set(o.id, o.profile_id); });

          const profileIds = [...new Set(onboardings.map(o => o.profile_id).filter(Boolean))] as string[];
          if (profileIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id,vorname,nachname,avatar_url')
              .in('id', profileIds);
            (profiles || []).forEach(p => profileMap.set(p.id, p));
          }
        }
      }

      return termine.map((t): AdminBooking => {
        const a = auftragMap.get(t.thermocheck_auftrag_id);
        const customerName = a ? `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–' : '–';
        const address = a ? `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}, ${a.kunde_plz || ''} ${a.kunde_ort || ''}`.trim() : '–';

        const onboardingId = a?.zugewiesener_techniker_id;
        const profileId = onboardingId ? profileIdMap.get(onboardingId) ?? null : null;
        const profile = profileId ? profileMap.get(profileId) : null;
        const technikerName = profile ? `${profile.vorname || ''} ${profile.nachname || ''}`.trim() : '–';

        return {
          id: t.id,
          auftragId: t.thermocheck_auftrag_id,
          customerName,
          address,
          datum: t.datum,
          zeitVon: t.zeit_von,
          zeitBis: t.zeit_bis,
          ganztaegig: t.ganztaegig,
          technikerId: onboardingId ?? null,
          technikerName,
          technikerProfileId: profileId,
          technikerAvatarUrl: profile?.avatar_url ?? null,
          angenommenAm: t.angenommen_am,
          buchungBestaetigtAm: a?.buchung_bestaetigt_am ?? null,
          vortagBestaetigtAm: a?.vortag_bestaetigt_am ?? null,
        };
      });
    },
    staleTime: 30_000,
  });
}
