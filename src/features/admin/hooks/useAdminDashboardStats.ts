import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

export interface TechnikerAuslastung {
  name: string;
  auftraege: number;
}

export interface PipelineCount {
  status: string;
  count: number;
}

export interface DashboardStats {
  pipeline: PipelineCount[];
  auslastung: TechnikerAuslastung[];
  gesamtAuftraege: number;
  inVerzug: number;
  offenePool: number;
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // 1. Pipeline counts from v_thermocheck_auftraege
      const { data: auftraege, error: aErr } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('pipeline_status, zugewiesener_techniker_id');
      if (aErr) throw aErr;

      // Group by pipeline_status
      const statusCounts = new Map<string, number>();
      let inVerzug = 0;
      let offenePool = 0;
      const technikerCounts = new Map<string, number>();

      (auftraege || []).forEach(a => {
        const s = a.pipeline_status ?? 'unbekannt';
        statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);

        if (s === 'in_verzug') inVerzug++;
        if (s === 'termin_abwarten' && !a.zugewiesener_techniker_id) offenePool++;

        if (a.zugewiesener_techniker_id) {
          technikerCounts.set(
            a.zugewiesener_techniker_id,
            (technikerCounts.get(a.zugewiesener_techniker_id) ?? 0) + 1
          );
        }
      });

      const pipeline: PipelineCount[] = Array.from(statusCounts.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // 2. Resolve techniker names
      const technikerIds = [...technikerCounts.keys()];
      let auslastung: TechnikerAuslastung[] = [];

      if (technikerIds.length > 0) {
        const { data: onboardings } = await supabaseTC
          .from('contractor_onboarding')
          .select('id, profile_id')
          .in('id', technikerIds);

        const profileIdMap = new Map<string, string>();
        (onboardings || []).forEach(o => {
          if (o.profile_id) profileIdMap.set(o.id, o.profile_id);
        });

        const profileIds = [...new Set([...profileIdMap.values()])];
        let profileMap = new Map<string, string>();
        if (profileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, vorname, nachname')
            .in('id', profileIds);
          (profiles || []).forEach(p => {
            profileMap.set(p.id, `${p.vorname ?? ''} ${p.nachname ?? ''}`.trim() || '–');
          });
        }

        auslastung = technikerIds.map(tid => ({
          name: profileMap.get(profileIdMap.get(tid) ?? '') ?? '–',
          auftraege: technikerCounts.get(tid) ?? 0,
        })).sort((a, b) => b.auftraege - a.auftraege);
      }

      return {
        pipeline,
        auslastung,
        gesamtAuftraege: auftraege?.length ?? 0,
        inVerzug,
        offenePool,
      };
    },
    staleTime: 60_000,
  });
}
