import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

export type PoolKategorie = 'frei' | 'angenommen' | 'neubuchung' | 'alle';

export interface AdminAuftrag {
  id: string;
  customerName: string;
  address: string;
  postalCode: string;
  city: string;
  pipelineStatus: string;
  auftragstyp: 'thermocheck' | 'einweisung' | 'pv' | string;
  technikerId: string | null;
  technikerName: string | null;
  technikerAvatar: string | null;
  kategorie: PoolKategorie;
  hasVorschlag: boolean;
  terminCount: number;
  naechsterTermin: string | null;
  naechsteZeit: string | null;
  erstelltAm: string | null;
  ageDays: number | null;
}

// Active pool phases the command center cares about
const POOL_STATUSES = [
  'termin_abwarten',
  'termin_neubuchung',
  'wc1_durchfuehren',
  'termin_bestaetigt',
];

function categorize(row: { pipeline_status: string | null; zugewiesener_techniker_id: string | null }): PoolKategorie {
  if (row.pipeline_status === 'termin_neubuchung') return 'neubuchung';
  if (!row.zugewiesener_techniker_id) return 'frei';
  return 'angenommen';
}

export function useAdminPoolTermine() {
  return useQuery({
    queryKey: ['admin-pool-overview', 'v2'],
    queryFn: async (): Promise<AdminAuftrag[]> => {
      // 1. Auftraege in active pool phases
      const { data: auftraege, error: aErr } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,pipeline_status,zugewiesener_techniker_id,auftragstyp,created_at')
        .in('pipeline_status', POOL_STATUSES);
      if (aErr) throw aErr;
      if (!auftraege?.length) return [];

      const auftragIds = auftraege.map(a => a.id);
      const technikerIds = Array.from(
        new Set(auftraege.map(a => a.zugewiesener_techniker_id).filter(Boolean) as string[])
      );

      // 2. Terminvorschlaege
      const { data: termine, error: tErr } = await supabaseTC
        .from('thermocheck_terminvorschlaege')
        .select('id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,status')
        .in('thermocheck_auftrag_id', auftragIds)
        .order('datum', { ascending: true });
      if (tErr) throw tErr;

      // 3. Techniker-Namen via onboarding -> profiles
      const technikerMap = new Map<string, { name: string; avatar: string | null }>();
      if (technikerIds.length) {
        const { data: onboardings, error: oErr } = await supabaseTC
          .from('contractor_onboarding')
          .select('id,profile_id')
          .in('id', technikerIds);
        if (oErr) throw oErr;

        const profileIds = (onboardings || []).map(o => o.profile_id).filter(Boolean);
        const profilesMap = new Map<string, { vorname: string | null; nachname: string | null; avatar_url: string | null }>();
        if (profileIds.length) {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id,vorname,nachname,avatar_url')
            .in('id', profileIds);
          if (pErr) throw pErr;
          (profiles || []).forEach(p => profilesMap.set(p.id, p));
        }
        (onboardings || []).forEach(o => {
          const p = profilesMap.get(o.profile_id);
          const name = p ? `${p.vorname || ''} ${p.nachname || ''}`.trim() || '–' : '–';
          technikerMap.set(o.id, { name, avatar: p?.avatar_url || null });
        });
      }

      const termineByAuftrag = new Map<string, typeof termine>();
      (termine || []).forEach(t => {
        const list = termineByAuftrag.get(t.thermocheck_auftrag_id) || [];
        list.push(t);
        termineByAuftrag.set(t.thermocheck_auftrag_id, list);
      });

      const now = Date.now();

      return auftraege.map((a): AdminAuftrag => {
        const aTermine = termineByAuftrag.get(a.id) || [];
        const naechster = aTermine.find(t => t.datum) || null;
        const timeStr = naechster
          ? (naechster.ganztaegig ? 'Ganztägig' : `${naechster.zeit_von?.slice(0, 5) || ''} – ${naechster.zeit_bis?.slice(0, 5) || ''}`)
          : null;
        const tech = a.zugewiesener_techniker_id ? technikerMap.get(a.zugewiesener_techniker_id) : null;
        const ageDays = a.created_at ? Math.floor((now - new Date(a.created_at).getTime()) / 86_400_000) : null;

        return {
          id: a.id,
          customerName: `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–',
          address: `${a.kunde_strasse || ''} ${a.kunde_hausnummer || ''}`.trim() || '–',
          postalCode: a.kunde_plz || '',
          city: a.kunde_ort || '',
          pipelineStatus: a.pipeline_status || '',
          auftragstyp: (a.auftragstyp as string) || 'thermocheck',
          technikerId: a.zugewiesener_techniker_id || null,
          technikerName: tech?.name || null,
          technikerAvatar: tech?.avatar || null,
          kategorie: categorize(a),
          hasVorschlag: aTermine.length > 0,
          terminCount: aTermine.length,
          naechsterTermin: naechster?.datum || null,
          naechsteZeit: timeStr,
          erstelltAm: a.created_at || null,
          ageDays,
        };
      });
    },
    staleTime: 30_000,
  });
}
