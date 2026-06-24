import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface TechnikerProfil {
  name: string;
  telefon: string;
}

/**
 * Name + Telefon des dem Auftrag zugewiesenen Aufmaßtechnikers — für den
 * Prefill im Aufmaß-Formular.
 *
 * WICHTIG: `zugewiesener_techniker_id` = `contractor_onboarding.id` (NICHT die
 * profile_id, NICHT die auth-User-ID). Auflösung wie in useCoachingSlots:
 * contractor_onboarding → profile_id → profiles.
 */
export function useTechnikerProfil(zugewiesenerTechnikerId: string | null | undefined) {
  return useQuery({
    queryKey: ['techniker-profil', zugewiesenerTechnikerId],
    enabled: !!zugewiesenerTechnikerId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<TechnikerProfil | null> => {
      const { data: onb } = await supabaseTC
        .from('contractor_onboarding' as any)
        .select('profile_id, vorname, nachname')
        .eq('id', zugewiesenerTechnikerId!)
        .maybeSingle();
      if (!onb) return null;
      const o = onb as unknown as { profile_id: string | null; vorname: string | null; nachname: string | null };

      let vorname = o.vorname ?? '';
      let nachname = o.nachname ?? '';
      let telefon = '';

      if (o.profile_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('vorname, nachname, telefon')
          .eq('id', o.profile_id)
          .maybeSingle();
        if (prof) {
          vorname = prof.vorname || vorname;
          nachname = prof.nachname || nachname;
          telefon = prof.telefon || '';
        }
      }

      return { name: `${vorname} ${nachname}`.trim(), telefon };
    },
  });
}
