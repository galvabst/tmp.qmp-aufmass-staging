import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface AdminQGItem {
  id: string;
  customerName: string;
  address: string;
  auftragstyp: string;
  eingereichtAm: string;
  technikerId: string | null;
  hasBewertung: boolean;
  bewertung: number | null;
  bewertungCreatedAt: string | null;
}

export function useAdminQGQueue() {
  return useQuery({
    queryKey: ['admin-qg-queue'],
    queryFn: async (): Promise<AdminQGItem[]> => {
      // Fetch submitted orders
      const { data: auftraege, error } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,auftragstyp,eingereicht_am,zugewiesener_techniker_id')
        .not('eingereicht_am', 'is', null)
        .order('eingereicht_am', { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!auftraege?.length) return [];

      const ids = auftraege.map(a => a.id);
      const { data: bewertungen } = await supabaseTC
        .from('techniker_bewertungen')
        .select('thermocheck_auftrag_id,bewertung,created_at')
        .in('thermocheck_auftrag_id', ids);

      const bewertungMap = new Map((bewertungen || []).map(b => [b.thermocheck_auftrag_id, b]));

      return auftraege.map((a): AdminQGItem => {
        const b = bewertungMap.get(a.id);
        return {
          id: a.id,
          customerName: `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–',
          address: `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}, ${a.kunde_plz || ''} ${a.kunde_ort || ''}`.trim(),
          auftragstyp: a.auftragstyp || 'thermocheck',
          eingereichtAm: a.eingereicht_am!,
          technikerId: a.zugewiesener_techniker_id,
          hasBewertung: !!b,
          bewertung: b?.bewertung ?? null,
          bewertungCreatedAt: b?.created_at ?? null,
        };
      });
    },
    staleTime: 30_000,
  });
}
