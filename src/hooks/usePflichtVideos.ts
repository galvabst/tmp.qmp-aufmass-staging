import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface PflichtVideo {
  id: string;
  titel: string;
  video_url: string;
  code: string;
  reihenfolge: number;
  modul_titel: string;
}

/**
 * Fetches mandatory videos that a "ready" contractor has not yet watched.
 * Only returns lessons where nur_fuer_neue = false, ist_aktiv = true, and video_url is set.
 * Compares against contractor_akademie_lektions_fortschritt to find unfinished ones.
 */
export function usePflichtVideos(contractorId: string | null | undefined, onboardingStatus: string | null | undefined) {
  return useQuery<PflichtVideo[]>({
    queryKey: ['pflicht-videos', contractorId, onboardingStatus],
    queryFn: async () => {
      if (!contractorId || onboardingStatus !== 'ready') return [];

      // 1. Fetch all active, mandatory-for-all lessons with video
      const { data: lektionen, error: lekErr } = await supabaseTC
        .from('contractor_akademie_lektionen')
        .select('id, titel, video_url, code, reihenfolge, modul_id, nur_fuer_neue')
        .eq('ist_aktiv', true)
        .eq('nur_fuer_neue', false)
        .not('video_url', 'is', null);

      if (lekErr) {
        console.warn('[PflichtVideos] Error fetching lektionen:', lekErr);
        return [];
      }

      if (!lektionen || lektionen.length === 0) return [];

      // 2. Fetch completed lektion IDs for this contractor
      const { data: fortschritt, error: fortErr } = await supabaseTC
        .from('contractor_akademie_lektions_fortschritt')
        .select('lektion_id')
        .eq('contractor_id', contractorId)
        .eq('status', 'completed');

      if (fortErr) {
        console.warn('[PflichtVideos] Error fetching fortschritt:', fortErr);
        return [];
      }

      const completedIds = new Set((fortschritt || []).map((f: any) => f.lektion_id));

      // 3. Filter out completed ones
      const pending = lektionen.filter((l: any) => !completedIds.has(l.id) && l.video_url);

      if (pending.length === 0) return [];

      // 4. Fetch module titles for display
      const modulIds = [...new Set(pending.map((l: any) => l.modul_id))];
      const { data: module } = await supabaseTC
        .from('contractor_akademie_module')
        .select('id, titel')
        .in('id', modulIds);

      const modulMap = new Map((module || []).map((m: any) => [m.id, m.titel]));

      return pending
        .map((l: any) => ({
          id: l.id,
          titel: l.titel,
          video_url: l.video_url!,
          code: l.code,
          reihenfolge: l.reihenfolge,
          modul_titel: modulMap.get(l.modul_id) || '',
        }))
        .sort((a, b) => a.reihenfolge - b.reihenfolge);
    },
    enabled: !!contractorId && onboardingStatus === 'ready',
    staleTime: 2 * 60 * 1000,
  });
}
