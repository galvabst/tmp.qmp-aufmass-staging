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
 * Loads all billing records (contractor_abrechnungen) with order/customer/tech info.
 *
 * DIAGNOSE-STOPGAP (wird von TP1 ersetzt): Die alte Version filterte Aufträge auf
 * `status = 'approved'` — ein Wert, den im System nichts je setzt, weshalb die
 * Liste strukturell immer leer war. Diese Variante geht von den echten Abrechnungs-
 * Datensätzen aus (Source of Truth) statt über den toten Auftrags-Filter.
 */
export function useAdminAbrechnungen() {
  return useQuery({
    queryKey: ['admin-abrechnungen'],
    queryFn: async (): Promise<AdminAbrechnungItem[]> => {
      const headers = await getAuthHeaders();

      // 1. Alle Abrechnungs-Datensätze direkt laden (Source of Truth).
      //    Kein order-by auf aktualisiert_am/updated_at — Spaltenname ist zwischen
      //    Migrationen uneindeutig, ein falscher Name würde die Query 400en.
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contractor_abrechnungen?select=id,thermocheck_auftrag_id,status,betrag,rechnung_eingegangen_am,geprueft_am,bezahlt_am&limit=1000`,
        { headers }
      );
      if (!res.ok) {
        // Fehler NICHT verschlucken — sonst sieht ein 4xx wie "keine Daten" aus.
        throw new Error(`Abrechnungen laden fehlgeschlagen: ${res.status} ${await res.text()}`);
      }
      const abrechnungen: Array<{
        id: string;
        thermocheck_auftrag_id: string;
        status: AbrechnungStatusEnum;
        betrag: number | null;
        rechnung_eingegangen_am: string | null;
        geprueft_am: string | null;
        bezahlt_am: string | null;
      }> = await res.json();

      if (!abrechnungen.length) return [];

      // 2. Auftrags-Infos (Kunde, Techniker, Preis) für die referenzierten Aufträge.
      const auftragIds = [...new Set(abrechnungen.map(a => a.thermocheck_auftrag_id))];
      const { data: auftraege } = await supabaseTC
        .from('v_thermocheck_auftraege')
        .select('id,kunde_vorname,kunde_nachname,zugewiesener_techniker_id,vereinbarter_preis')
        .in('id', auftragIds);
      const auftragMap = new Map((auftraege ?? []).map(a => [a.id, a]));

      // 3. Techniker-Namen best-effort auflösen: zugewiesener_techniker_id verweist
      //    auf contractor_onboarding.id → profile_id → profiles. Schlägt etwas fehl,
      //    bleibt der Name '–', die Liste lädt trotzdem.
      const onbIds = [...new Set((auftraege ?? []).map(a => a.zugewiesener_techniker_id).filter(Boolean))];
      const nameByOnbId = new Map<string, string>();
      if (onbIds.length > 0) {
        try {
          const { data: onbs } = await supabaseTC
            .from('contractor_onboarding')
            .select('id,profile_id')
            .in('id', onbIds);
          const profIds = [...new Set((onbs ?? []).map(o => o.profile_id).filter(Boolean))];
          if (profIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id,vorname,nachname')
              .in('id', profIds);
            const nameByProfId = new Map(
              (profiles ?? []).map(p => [p.id, `${p.vorname || ''} ${p.nachname || ''}`.trim() || '–'])
            );
            (onbs ?? []).forEach(o => {
              if (o.profile_id) nameByOnbId.set(o.id, nameByProfId.get(o.profile_id) || '–');
            });
          }
        } catch {
          // Namen sind nicht kritisch für die Diagnose — still ignorieren.
        }
      }

      return abrechnungen.map((abr): AdminAbrechnungItem => {
        const a = auftragMap.get(abr.thermocheck_auftrag_id);
        return {
          id: abr.id,
          auftragId: abr.thermocheck_auftrag_id,
          customerName: a ? `${a.kunde_vorname || ''} ${a.kunde_nachname || ''}`.trim() || '–' : '–',
          technikerName: a?.zugewiesener_techniker_id ? (nameByOnbId.get(a.zugewiesener_techniker_id) || '–') : '–',
          betrag: abr.betrag ?? a?.vereinbarter_preis ?? null,
          status: abr.status,
          rechnungEingegangenAm: abr.rechnung_eingegangen_am,
          geprueftAm: abr.geprueft_am,
          bezahltAm: abr.bezahlt_am,
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
