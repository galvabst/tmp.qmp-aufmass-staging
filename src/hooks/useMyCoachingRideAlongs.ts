import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export type CoachingBewertung = 'ausstehend' | 'bestanden' | 'nicht_bestanden' | 'abgesagt' | 'no_show';

export interface RideAlongTrainee {
  auftragId: string;
  traineeProfileId: string;
  vorname: string;
  nachname: string;
  telefon: string;
  email: string;
  plz: string;
  ort: string;
  avatarUrl?: string;
  gebuchtAm?: string;
  bewertung: CoachingBewertung;
  bewertungAm?: string;
  termine: { datum: string; ganztaegig: boolean; zeitVon?: string; zeitBis?: string }[];
  praxistestEingereicht?: boolean;
  praxistestFreigabe?: boolean;
  praxistestScanUrl?: string;
  praxistestVideoUrl?: string;
  onboardingId?: string;
}

async function syncSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await supabaseTC.auth.setSession(session);
}

export function useMyCoachingRideAlongs(profileId: string | null) {
  return useQuery({
    queryKey: ['coaching-ride-alongs', profileId],
    queryFn: async (): Promise<RideAlongTrainee[]> => {
      if (!profileId) return [];
      await syncSession();

      const { data: myOnb } = await supabaseTC
        .from('contractor_onboarding')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!myOnb) return [];

      // Load orders with bewertung from ORDER (not onboarding)
      const { data: auftraege } = await supabaseTC
        .from('thermocheck_auftraege')
        .select('id, coaching_gebucht_von, coaching_gebucht_am, coaching_bewertung, coaching_bewertung_am')
        .eq('zugewiesener_techniker_id', myOnb.id)
        .not('coaching_gebucht_von', 'is', null);

      if (!auftraege || auftraege.length === 0) return [];

      const traineeProfileIds = [...new Set(auftraege.map(a => a.coaching_gebucht_von).filter(Boolean))] as string[];
      const auftragIds = auftraege.map(a => a.id);

      const [profilesRes, traineeOnbsRes, termineRes] = await Promise.all([
        supabase.from('profiles').select('id, vorname, nachname, telefon, email, avatar_url').in('id', traineeProfileIds),
        supabaseTC.from('contractor_onboarding').select('id, profile_id, anschrift_plz, anschrift_ort, praxistest_scan_url, praxistest_video_url, praxistest_eingereicht_am, praxistest_freigabe').in('profile_id', traineeProfileIds),
        supabaseTC.from('thermocheck_terminvorschlaege').select('thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung').in('thermocheck_auftrag_id', auftragIds).order('sortierung', { ascending: true }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const onbMap = new Map((traineeOnbsRes.data || []).map(o => [o.profile_id, o]));

      const termineByAuftrag = new Map<string, RideAlongTrainee['termine']>();
      for (const t of (termineRes.data || [])) {
        const list = termineByAuftrag.get(t.thermocheck_auftrag_id) || [];
        list.push({ datum: t.datum, ganztaegig: t.ganztaegig, zeitVon: t.zeit_von || undefined, zeitBis: t.zeit_bis || undefined });
        termineByAuftrag.set(t.thermocheck_auftrag_id, list);
      }

      const results: RideAlongTrainee[] = [];
      for (const auftrag of auftraege) {
        const traineeId = auftrag.coaching_gebucht_von;
        if (!traineeId) continue;
        const profile = profileMap.get(traineeId);
        const onb = onbMap.get(traineeId);

        results.push({
          auftragId: auftrag.id,
          traineeProfileId: traineeId,
          vorname: profile?.vorname || '',
          nachname: profile?.nachname || '',
          telefon: profile?.telefon || '',
          email: profile?.email || '',
          plz: onb?.anschrift_plz || '',
          ort: onb?.anschrift_ort || '',
          avatarUrl: profile?.avatar_url || undefined,
          gebuchtAm: auftrag.coaching_gebucht_am || undefined,
          bewertung: (auftrag.coaching_bewertung as CoachingBewertung) || 'ausstehend',
          bewertungAm: auftrag.coaching_bewertung_am || undefined,
          termine: termineByAuftrag.get(auftrag.id) || [],
          praxistestEingereicht: !!onb?.praxistest_eingereicht_am,
          praxistestFreigabe: onb?.praxistest_freigabe ?? false,
          praxistestScanUrl: onb?.praxistest_scan_url || undefined,
          praxistestVideoUrl: onb?.praxistest_video_url || undefined,
          onboardingId: onb?.id || undefined,
        });
      }

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

export function useBewerteCoachingMitfahrt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auftragId, entscheidung, notiz }: { auftragId: string; entscheidung: 'bestanden' | 'nicht_bestanden' | 'abgesagt' | 'no_show'; notiz?: string }) => {
      const { data, error } = await supabase.rpc('bewerte_coaching_mitfahrt', {
        p_auftrag_id: auftragId,
        p_entscheidung: entscheidung,
        p_notiz: notiz || null,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; message: string; status: string };
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-ride-alongs'] });
    },
  });
}
