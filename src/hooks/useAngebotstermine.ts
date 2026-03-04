import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AngebotsterminInfo {
  startDatetime: string;
  endDatetime: string;
}

/**
 * Fetches Angebotsbesprechung appointments from public.termine
 * matched by lead_id (title starts with "Angebotsbesprechung").
 */
export function useAngebotstermine(leadIds: string[]) {
  return useQuery({
    queryKey: ['angebotstermine', leadIds.sort().join(',')],
    enabled: leadIds.length > 0,
    queryFn: async (): Promise<Map<string, AngebotsterminInfo>> => {
      const { data, error } = await supabase
        .from('termine')
        .select('lead_id, start_datetime, end_datetime')
        .in('lead_id', leadIds)
        .ilike('title', 'Angebotsbesprechung%')
        .order('start_datetime', { ascending: true });

      if (error) {
        console.error('[useAngebotstermine] Error:', error);
        throw error;
      }

      // Map: lead_id → latest AG termin
      const map = new Map<string, AngebotsterminInfo>();
      for (const row of data || []) {
        if (row.lead_id) {
          map.set(row.lead_id, {
            startDatetime: row.start_datetime,
            endDatetime: row.end_datetime,
          });
        }
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}
