import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface AdminAuftrag {
  id: string;
  customerName: string;
  address: string;
  postalCode: string;
  city: string;
  pipelineStatus: string;
  technikerId: string | null;
  kategorie: 'mit_termin' | 'ohne_termin';
  terminCount: number;
  naechsterTermin: string | null;
  naechsteZeit: string | null;
}

export function useAdminPoolTermine() {
  return useQuery({
    queryKey: ['admin-pool-auftraege'],
    queryFn: async (): Promise<AdminAuftrag[]> => {
      // 1. ALL Thermocheck orders (no filters)
      const { data: auftraege, error: aErr } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,pipeline_status,zugewiesener_techniker_id')
        .is('zugewiesener_techniker_id', null);
      if (aErr) throw aErr;
      if (!auftraege?.length) return [];

      const auftragIds = auftraege.map(a => a.id);

      // 2. ALL Terminvorschläge for these orders (no status filter)
      const { data: termine, error: tErr } = await supabaseTC
        .from('thermocheck_terminvorschlaege')
        .select('id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,status')
        .in('thermocheck_auftrag_id', auftragIds)
        .order('datum', { ascending: true });
      if (tErr) throw tErr;

      // Group termine by auftrag
      const termineByAuftrag = new Map<string, typeof termine>();
      (termine || []).forEach(t => {
        const list = termineByAuftrag.get(t.thermocheck_auftrag_id) || [];
        list.push(t);
        termineByAuftrag.set(t.thermocheck_auftrag_id, list);
      });

      return auftraege.map((a): AdminAuftrag => {
        const aTermine = termineByAuftrag.get(a.id) || [];
        const naechster = aTermine.find(t => t.datum) || null;
        const timeStr = naechster
          ? (naechster.ganztaegig ? 'Ganztägig' : `${naechster.zeit_von?.slice(0, 5) || ''} – ${naechster.zeit_bis?.slice(0, 5) || ''}`)
          : null;

        return {
          id: a.id,
          customerName: `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–',
          address: `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}`.trim() || '–',
          postalCode: a.kunde_plz || '',
          city: a.kunde_ort || '',
          pipelineStatus: a.pipeline_status || '',
          technikerId: a.zugewiesener_techniker_id || null,
          kategorie: aTermine.length > 0 ? 'mit_termin' : 'ohne_termin',
          terminCount: aTermine.length,
          naechsterTermin: naechster?.datum || null,
          naechsteZeit: timeStr,
        };
      });
    },
    staleTime: 30_000,
  });
}
