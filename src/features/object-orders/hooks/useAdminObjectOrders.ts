import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { ObjectOrderStatusEnum, AuftragstypEnum } from '@/lib/enums';

export interface AdminObjectOrder {
  id: string;
  address: string;
  city: string;
  postalCode: string;
  status: ObjectOrderStatusEnum;
  type: AuftragstypEnum;
  amount: number;
  customerName: string;
  pipelineStatus: string | null;
  technikerId: string | null;
  createdAt: string;
  scheduledDate: string | null;
}

const SUBMITTED_PIPELINE_STATUSES = [
  'vot_auswertung_ag', 'ergebnis_abwarten', 'ergebnis_ausstehend',
  'angebotstermin_abfragen', 'angebotstermin_abwarten',
  'angebot_erstellt', 'angebot_versendet',
  'thermocheck_auswertung', 'angebotserstellung',
  'angebotstermin_terminieren', 'angebotstermin_stattgefunden',
  'auswertung_mit_ag_termin', 'auswertung_ohne_ag_termin',
  'offene_punkte', 'bedenkzeit',
];

function deriveObjectOrderStatus(
  auftrag: any,
  hasBewertung: boolean,
  hasAngenommenerTermin: boolean,
): ObjectOrderStatusEnum {
  if (auftrag.storno_datum) return 'cancelled';
  if (hasBewertung) return 'approved';
  if (auftrag.eingereicht_am || (auftrag.pipeline_status && SUBMITTED_PIPELINE_STATUSES.includes(auftrag.pipeline_status))) return 'submitted';
  if (auftrag.vor_ort_checkin_at) return 'in_progress';
  if (hasAngenommenerTermin && auftrag.zugewiesener_techniker_id) return 'booked';
  if (auftrag.pipeline_status === 'termin_abwarten' && !auftrag.zugewiesener_techniker_id) return 'published';
  if (auftrag.pipeline_status === 'neuer_thermocheck_auftrag' || auftrag.pipeline_status === 'wc1_durchfuehren') return 'draft';
  if (hasAngenommenerTermin) return 'booked';
  return 'draft';
}

export function useAdminObjectOrders() {
  return useQuery({
    queryKey: ['admin-object-orders'],
    queryFn: async (): Promise<AdminObjectOrder[]> => {
      const [auftraegeRes, termineRes, bewertungenRes] = await Promise.all([
        supabaseTC.from('v_thermocheck_auftraege').select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,pipeline_status,zugewiesener_techniker_id,eingereicht_am,vor_ort_checkin_at,vereinbarter_preis,auftragstyp,created_at,storno_datum'),
        supabaseTC.from('thermocheck_terminvorschlaege').select('thermocheck_auftrag_id,datum,status'),
        supabaseTC.from('techniker_bewertungen').select('thermocheck_auftrag_id'),
      ]);

      const auftraege = auftraegeRes.data || [];
      const termine = termineRes.data || [];
      const bewertungen = bewertungenRes.data || [];

      // Build lookup sets
      const bewertungSet = new Set(bewertungen.map(b => b.thermocheck_auftrag_id));
      const angenommeneTermine = new Map<string, string>();
      termine.forEach(t => {
        if (t.status === 'angenommen') angenommeneTermine.set(t.thermocheck_auftrag_id, t.datum);
      });

      return auftraege.map((a): AdminObjectOrder => {
        const customerName = `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–';
        const address = `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}`.trim();
        const status = deriveObjectOrderStatus(a, bewertungSet.has(a.id), angenommeneTermine.has(a.id));

        return {
          id: a.id,
          address: address || '–',
          city: a.kunde_ort || '',
          postalCode: a.kunde_plz || '',
          status,
          type: (a.auftragstyp as AuftragstypEnum) || 'thermocheck',
          amount: a.vereinbarter_preis ?? 0,
          customerName,
          pipelineStatus: a.pipeline_status,
          technikerId: a.zugewiesener_techniker_id,
          createdAt: a.created_at,
          scheduledDate: angenommeneTermine.get(a.id) ?? null,
        };
      });
    },
    staleTime: 30_000,
  });
}
