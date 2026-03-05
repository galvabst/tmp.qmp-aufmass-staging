import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface AdminPoolTermin {
  id: string;
  auftragId: string;
  datum: string;
  zeitVon: string | null;
  zeitBis: string | null;
  ganztaegig: boolean;
  customerName: string;
  address: string;
  postalCode: string;
  city: string;
}

export function useAdminPoolTermine() {
  return useQuery({
    queryKey: ['admin-pool-termine'],
    queryFn: async (): Promise<AdminPoolTermin[]> => {
      // 1. Fetch open orders (pipeline_status = termin_abwarten, no technician)
      const { data: auftraege, error: aErr } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort')
        .eq('pipeline_status', 'termin_abwarten')
        .is('zugewiesener_techniker_id', null);
      if (aErr) throw aErr;
      if (!auftraege?.length) return [];

      const auftragIds = auftraege.map(a => a.id);

      // 2. Fetch vorgeschlagene Termine for these orders
      const { data: termine, error: tErr } = await supabaseTC
        .from('thermocheck_terminvorschlaege')
        .select('id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,status')
        .in('thermocheck_auftrag_id', auftragIds)
        .eq('status', 'vorgeschlagen')
        .order('datum', { ascending: true });
      if (tErr) throw tErr;
      if (!termine?.length) return [];

      const auftragMap = new Map(auftraege.map(a => [a.id, a]));

      return termine.map((t): AdminPoolTermin => {
        const a = auftragMap.get(t.thermocheck_auftrag_id);
        const customerName = a ? `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–' : '–';
        const address = a ? `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}`.trim() || '–' : '–';

        return {
          id: t.id,
          auftragId: t.thermocheck_auftrag_id,
          datum: t.datum,
          zeitVon: t.zeit_von,
          zeitBis: t.zeit_bis,
          ganztaegig: t.ganztaegig,
          customerName,
          address,
          postalCode: a?.kunde_plz || '',
          city: a?.kunde_ort || '',
        };
      });
    },
    staleTime: 30_000,
  });
}
