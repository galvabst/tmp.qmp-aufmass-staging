import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface AdminBooking {
  id: string;
  auftragId: string;
  customerName: string;
  address: string;
  datum: string;
  zeitVon: string | null;
  zeitBis: string | null;
  ganztaegig: boolean;
  technikerId: string | null;
  angenommenAm: string | null;
  buchungBestaetigtAm: string | null;
  vortagBestaetigtAm: string | null;
}

export function useAdminBookings() {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async (): Promise<AdminBooking[]> => {
      // Fetch angenommene Termine
      const { data: termine, error: tErr } = await supabaseTC
        .from('thermocheck_terminvorschlaege')
        .select('id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,angenommen_am,angenommen_von')
        .eq('status', 'angenommen')
        .order('datum', { ascending: true });
      if (tErr) throw tErr;
      if (!termine?.length) return [];

      const auftragIds = [...new Set(termine.map(t => t.thermocheck_auftrag_id))];
      const { data: auftraege } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,zugewiesener_techniker_id,buchung_bestaetigt_am,vortag_bestaetigt_am')
        .in('id', auftragIds);

      const auftragMap = new Map((auftraege || []).map(a => [a.id, a]));

      return termine.map((t): AdminBooking => {
        const a = auftragMap.get(t.thermocheck_auftrag_id);
        const customerName = a ? `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–' : '–';
        const address = a ? `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}, ${a.kunde_plz || ''} ${a.kunde_ort || ''}`.trim() : '–';

        return {
          id: t.id,
          auftragId: t.thermocheck_auftrag_id,
          customerName,
          address,
          datum: t.datum,
          zeitVon: t.zeit_von,
          zeitBis: t.zeit_bis,
          ganztaegig: t.ganztaegig,
          technikerId: a?.zugewiesener_techniker_id ?? null,
          angenommenAm: t.angenommen_am,
          buchungBestaetigtAm: a?.buchung_bestaetigt_am ?? null,
          vortagBestaetigtAm: a?.vortag_bestaetigt_am ?? null,
        };
      });
    },
    staleTime: 30_000,
  });
}
