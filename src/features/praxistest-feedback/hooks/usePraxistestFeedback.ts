import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import type { PraxistestFeedbackEntry } from '../types';

interface FeedbackRow {
  id: string;
  onboarding_id: string;
  runde: number;
  komponente: 'scan' | 'video';
  kommentar: string;
  pruefer_profile_id: string | null;
  pruefer_rolle: 'trainer' | 'admin';
  erstellt_am: string;
}

interface BildRow {
  id: string;
  feedback_id: string;
  storage_path: string;
  position: number;
}

/**
 * Lädt das letzte Feedback (höchste Runde) für ein Onboarding,
 * gruppiert nach Komponente. Bilder werden als signed URLs geliefert.
 */
export function usePraxistestFeedback(onboardingId: string | null | undefined) {
  return useQuery({
    queryKey: ['praxistest-feedback', onboardingId],
    enabled: !!onboardingId,
    staleTime: 30_000,
    queryFn: async (): Promise<PraxistestFeedbackEntry[]> => {
      if (!onboardingId) return [];

      const { data: feedbacks, error } = await supabaseTC
        .from('praxistest_feedback')
        .select('id,onboarding_id,runde,komponente,kommentar,pruefer_profile_id,pruefer_rolle,erstellt_am')
        .eq('onboarding_id', onboardingId)
        .order('runde', { ascending: false })
        .order('erstellt_am', { ascending: false });

      if (error) throw new Error(error.message);
      const rows = (feedbacks ?? []) as FeedbackRow[];
      if (rows.length === 0) return [];

      // Only return entries from the most recent rejection round
      const maxRunde = Math.max(...rows.map((r) => r.runde));
      const latest = rows.filter((r) => r.runde === maxRunde);
      const ids = latest.map((r) => r.id);

      const { data: bilder, error: bilderErr } = await supabaseTC
        .from('praxistest_feedback_bilder')
        .select('id,feedback_id,storage_path,position')
        .in('feedback_id', ids)
        .order('position', { ascending: true });

      if (bilderErr) throw new Error(bilderErr.message);

      const bildRows = (bilder ?? []) as BildRow[];
      const pathsByFeedback = new Map<string, BildRow[]>();
      for (const b of bildRows) {
        const arr = pathsByFeedback.get(b.feedback_id) ?? [];
        arr.push(b);
        pathsByFeedback.set(b.feedback_id, arr);
      }

      // Sign all paths in one batch
      const allPaths = bildRows.map((b) => b.storage_path);
      const signedMap = new Map<string, string>();
      if (allPaths.length > 0) {
        const { data: signed, error: signErr } = await supabase.storage
          .from('praxistest-feedback')
          .createSignedUrls(allPaths, 60 * 60);
        if (signErr) {
          console.warn('[usePraxistestFeedback] Sign URLs failed:', signErr.message);
        } else {
          for (const s of signed ?? []) {
            if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
          }
        }
      }

      return latest.map<PraxistestFeedbackEntry>((r) => ({
        id: r.id,
        onboardingId: r.onboarding_id,
        runde: r.runde,
        komponente: r.komponente,
        kommentar: r.kommentar,
        pruefer_profile_id: r.pruefer_profile_id,
        pruefer_rolle: r.pruefer_rolle,
        erstelltAm: r.erstellt_am,
        bilder: (pathsByFeedback.get(r.id) ?? []).map((b) => ({
          id: b.id,
          storagePath: b.storage_path,
          signedUrl: signedMap.get(b.storage_path),
          position: b.position,
        })),
      }));
    },
  });
}
