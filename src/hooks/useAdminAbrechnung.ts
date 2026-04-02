import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';
import { AbrechnungStatusEnum } from './useAbrechnungStatus';

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

export interface AdminAbrechnungItem {
  id: string;
  auftragId: string;
  customerName: string;
  technikerName: string;
  betrag: number | null;
  status: AbrechnungStatusEnum;
  rechnungEingegangenAm: string | null;
  geprueftAm: string | null;
  bezahltAm: string | null;
}

async function getAuthHeaders() {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session?.session?.access_token;
  return {
    apikey: SUPABASE_KEY,
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
    "Accept-Profile": "thermocheck",
    "Content-Profile": "thermocheck",
    "Content-Type": "application/json",
  };
}

/**
 * Loads all approved orders with their billing status for admin management.
 */
export function useAdminAbrechnungen() {
  return useQuery({
    queryKey: ['admin-abrechnungen'],
    queryFn: async (): Promise<AdminAbrechnungItem[]> => {
      // 1. Get approved orders
      const { data: auftraege, error: aufErr } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,zugewiesener_techniker_id,status,vereinbarter_preis')
        .eq('status', 'approved')
        .order('aktualisiert_am', { ascending: false })
        .limit(500);

      if (aufErr) throw aufErr;
      if (!auftraege?.length) return [];

      // 2. Get billing records
      const headers = await getAuthHeaders();
      const ids = auftraege.map(a => a.id);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contractor_abrechnungen?thermocheck_auftrag_id=in.(${ids.join(',')})&select=id,thermocheck_auftrag_id,status,betrag,rechnung_eingegangen_am,geprueft_am,bezahlt_am`,
        { headers }
      );
      
      const abrechnungen: Array<{
        id: string;
        thermocheck_auftrag_id: string;
        status: AbrechnungStatusEnum;
        betrag: number | null;
        rechnung_eingegangen_am: string | null;
        geprueft_am: string | null;
        bezahlt_am: string | null;
      }> = res.ok ? await res.json() : [];

      const abrMap = new Map(abrechnungen.map(a => [a.thermocheck_auftrag_id, a]));

      // 3. Resolve technician names
      const techIds = [...new Set(auftraege.map(a => a.zugewiesener_techniker_id).filter(Boolean))];
      let nameMap = new Map<string, string>();
      if (techIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id,vorname,nachname')
          .in('id', techIds);
        if (profiles) {
          nameMap = new Map(profiles.map(p => [p.id, `${p.vorname || ''} ${p.nachname || ''}`.trim() || '–']));
        }
      }

      return auftraege.map((a): AdminAbrechnungItem => {
        const abr = abrMap.get(a.id);
        return {
          id: abr?.id || a.id,
          auftragId: a.id,
          customerName: `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–',
          technikerName: nameMap.get(a.zugewiesener_techniker_id || '') || '–',
          betrag: abr?.betrag ?? a.vereinbarter_preis ?? null,
          status: abr?.status || 'offen',
          rechnungEingegangenAm: abr?.rechnung_eingegangen_am || null,
          geprueftAm: abr?.geprueft_am || null,
          bezahltAm: abr?.bezahlt_am || null,
        };
      });
    },
    staleTime: 30_000,
  });
}

/**
 * Admin mutation to advance billing status (in_pruefung / bezahlt).
 * Uses direct REST API with thermocheck schema.
 */
export function useUpdateAbrechnungStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auftragId, newStatus }: { auftragId: string; newStatus: AbrechnungStatusEnum }) => {
      const headers = await getAuthHeaders();

      // Build update body based on status
      const body: Record<string, unknown> = {
        status: newStatus,
        aktualisiert_am: new Date().toISOString(),
      };
      if (newStatus === 'in_pruefung') body.geprueft_am = new Date().toISOString();
      if (newStatus === 'bezahlt') body.bezahlt_am = new Date().toISOString();

      // Try UPDATE first
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contractor_abrechnungen?thermocheck_auftrag_id=eq.${auftragId}`,
        {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Update failed: ${res.status} ${text}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-abrechnungen'] });
    },
  });
}
