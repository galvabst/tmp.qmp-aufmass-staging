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
 * Contractors who already completed the academy must not be blocked again at app entry.
 */
export function usePflichtVideos(
  contractorId: string | null | undefined,
  onboardingStatus: string | null | undefined,
  isTrainer: boolean = false,
  hasCompletedAkademie: boolean = false
) {
  return useQuery<PflichtVideo[]>({
    queryKey: ['pflicht-videos', contractorId, onboardingStatus, isTrainer, hasCompletedAkademie],
    queryFn: async () => {
      // Einsatzbereite Techniker werden NICHT mehr durch nachträglich als Pflicht
      // markierte Akademie-Lektionen blockiert. Pflicht-Videos sind ausschließlich
      // ein Onboarding-Konstrukt und gelten für ready-Techniker nicht mehr.
      return [];
    },
    enabled: false,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });
}
