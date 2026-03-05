import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface AdminPoolTermin {
  id: string;
  auftragId: string;
  datum: string | null;
  zeitVon: string | null;
  zeitBis: string | null;
  ganztaegig: boolean;
  customerName: string;
  address: string;
  postalCode: string;
  city: string;
  kategorie: 'terminiert' | 'nicht_terminiert';
}

export function useAdminPoolTermine() {
  return useQuery({
    queryKey: ['admin-pool-termine'],
    queryFn: async (): Promise<AdminPoolTermin[]> => {
      // 1. Fetch open orders (pipeline_status = termin_abwarten, no technician)
      const { data: auftraege, error: aErr } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,pipeline_status')
        .is('zugewiesener_techniker_id', null)
        .not('pipeline_status', 'in', '("wc1_durchfuehren","termin_bestaetigt","vot_formular_abfragen","vot_formular_in_verzug","storniert")');
      if (aErr) throw aErr;
      if (!auftraege?.length) return [];

      const auftragIds = auftraege.map(a => a.id);

      // 2. Fetch vorgeschlagene Termine for these orders
      const { data: termine, error: tErr } = await supabaseTC
        .from('thermocheck_terminvorschlaege')
        .select('id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,status')
        .in('thermocheck_auftrag_id', auftragIds)
        .in('status', ['vorgeschlagen', 'angenommen'])
        .order('datum', { ascending: true });
      if (tErr) throw tErr;

      // Build sets for categorization
      const scheduledAuftragIds = new Set((termine || []).map(t => t.thermocheck_auftrag_id));
      const auftragMap = new Map(auftraege.map(a => [a.id, a]));

      const results: AdminPoolTermin[] = [];

      // Terminierte Aufträge (with proposals)
      (termine || []).filter(t => t.status === 'vorgeschlagen').forEach(t => {
        const a = auftragMap.get(t.thermocheck_auftrag_id);
        results.push({
          id: t.id,
          auftragId: t.thermocheck_auftrag_id,
          datum: t.datum,
          zeitVon: t.zeit_von,
          zeitBis: t.zeit_bis,
          ganztaegig: t.ganztaegig,
          customerName: a ? `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–' : '–',
          address: a ? `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}`.trim() || '–' : '–',
          postalCode: a?.kunde_plz || '',
          city: a?.kunde_ort || '',
          kategorie: 'terminiert',
        });
      });

      // Nicht terminierte Aufträge (no proposals at all)
      auftraege.forEach(a => {
        if (!scheduledAuftragIds.has(a.id)) {
          results.push({
            id: `unscheduled-${a.id}`,
            auftragId: a.id,
            datum: null,
            zeitVon: null,
            zeitBis: null,
            ganztaegig: false,
            customerName: `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–',
            address: `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}`.trim() || '–',
            postalCode: a.kunde_plz || '',
            city: a.kunde_ort || '',
            kategorie: 'nicht_terminiert',
          });
        }
      });

      return results;
    },
    staleTime: 30_000,
  });
}
