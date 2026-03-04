import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

export type AbrechnungStatusEnum = 'offen' | 'rechnung_eingegangen' | 'in_pruefung' | 'bezahlt';

export const ABRECHNUNG_STATUS_LABELS: Record<AbrechnungStatusEnum, string> = {
  offen: 'Offen',
  rechnung_eingegangen: 'Rechnung eingegangen',
  in_pruefung: 'In Prüfung',
  bezahlt: 'Bezahlt',
};

export interface AbrechnungData {
  status: AbrechnungStatusEnum;
  betrag: number | null;
  rechnungEingegangenAm: string | null;
  geprueftAm: string | null;
  bezahltAm: string | null;
  zahlungsart: string | null;
  referenz: string | null;
}

interface AbrechnungRow {
  id: string;
  status: AbrechnungStatusEnum;
  betrag: number | null;
  rechnung_eingegangen_am: string | null;
  geprueft_am: string | null;
  bezahlt_am: string | null;
  zahlungsart: string | null;
  referenz: string | null;
}

async function getAuthHeaders() {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session?.session?.access_token;
  return {
    apikey: SUPABASE_KEY,
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
    "Accept-Profile": "thermocheck",
    "Content-Type": "application/json",
  };
}

/**
 * Fetches the abrechnung (billing/payout) status for a given thermocheck auftrag.
 * Returns default 'offen' status if no record exists yet.
 */
export function useAbrechnungStatus(auftragId: string | undefined) {
  return useQuery({
    queryKey: ["abrechnung-status", auftragId],
    enabled: !!auftragId,
    queryFn: async (): Promise<AbrechnungData> => {
      if (!auftragId) {
        return { status: 'offen', betrag: null, rechnungEingegangenAm: null, geprueftAm: null, bezahltAm: null, zahlungsart: null, referenz: null };
      }

      const headers = await getAuthHeaders();

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contractor_abrechnungen?thermocheck_auftrag_id=eq.${auftragId}&select=id,status,betrag,rechnung_eingegangen_am,geprueft_am,bezahlt_am,zahlungsart,referenz&limit=1`,
        { headers }
      );

      if (!res.ok) {
        console.error("[useAbrechnungStatus] fetch failed:", res.status);
        // Non-fatal: return default
        return { status: 'offen', betrag: null, rechnungEingegangenAm: null, geprueftAm: null, bezahltAm: null, zahlungsart: null, referenz: null };
      }

      const rows: AbrechnungRow[] = await res.json();

      if (!rows.length) {
        // No record yet → default offen
        return { status: 'offen', betrag: null, rechnungEingegangenAm: null, geprueftAm: null, bezahltAm: null, zahlungsart: null, referenz: null };
      }

      const row = rows[0];
      return {
        status: row.status,
        betrag: row.betrag,
        rechnungEingegangenAm: row.rechnung_eingegangen_am,
        geprueftAm: row.geprueft_am,
        bezahltAm: row.bezahlt_am,
        zahlungsart: row.zahlungsart,
        referenz: row.referenz,
      };
    },
    staleTime: 60 * 1000,
  });
}
