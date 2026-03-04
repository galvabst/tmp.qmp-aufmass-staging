import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface AdminCheckin {
  id: string;
  customerName: string;
  address: string;
  vorOrtCheckinAt: string;
  vorOrtCheckoutAt: string | null;
  nachbearbeitungCheckinAt: string | null;
  nachbearbeitungCheckoutAt: string | null;
  technikerId: string | null;
  status: 'vor_ort' | 'nachbearbeitung' | 'completed';
}

export function useAdminCheckins() {
  return useQuery({
    queryKey: ['admin-checkins'],
    queryFn: async (): Promise<AdminCheckin[]> => {
      const { data, error } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,zugewiesener_techniker_id,vor_ort_checkin_at,vor_ort_checkout_at,nachbearbeitung_checkin_at,nachbearbeitung_checkout_at')
        .not('vor_ort_checkin_at', 'is', null)
        .order('vor_ort_checkin_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!data?.length) return [];

      return data.map((a): AdminCheckin => {
        const customerName = `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–';
        const address = `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}, ${a.kunde_plz || ''} ${a.kunde_ort || ''}`.trim();

        let status: AdminCheckin['status'] = 'completed';
        if (a.nachbearbeitung_checkin_at && !a.nachbearbeitung_checkout_at) status = 'nachbearbeitung';
        else if (a.vor_ort_checkin_at && !a.vor_ort_checkout_at) status = 'vor_ort';

        return {
          id: a.id,
          customerName,
          address,
          vorOrtCheckinAt: a.vor_ort_checkin_at!,
          vorOrtCheckoutAt: a.vor_ort_checkout_at,
          nachbearbeitungCheckinAt: a.nachbearbeitung_checkin_at,
          nachbearbeitungCheckoutAt: a.nachbearbeitung_checkout_at,
          technikerId: a.zugewiesener_techniker_id,
          status,
        };
      });
    },
    staleTime: 30_000,
  });
}
