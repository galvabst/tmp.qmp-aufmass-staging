import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

export interface Verspaetung {
  id: string;
  thermocheck_auftrag_id: string;
  verspaetung_minuten: number;
  gesamtbetrag: number;
  created_at: string;
}

export interface VerspaetungStats {
  total: number;
  totalFee: number;
  onTimeCount: number;
  lateCount: number;
  onTimePercent: number;
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

export function useContractorVerspaetungen() {
  return useQuery({
    queryKey: ['contractor-verspaetungen'],
    queryFn: async (): Promise<Verspaetung[]> => {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contractor_verspaetungen?select=id,thermocheck_auftrag_id,verspaetung_minuten,gesamtbetrag,created_at&order=created_at.desc`,
        { headers }
      );
      if (!res.ok) throw new Error('Failed to fetch verspaetungen');
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Compute punctuality stats from delays + total submitted orders count.
 */
export function useVerspaetungStats(
  verspaetungen: Verspaetung[] | undefined,
  totalSubmittedOrders: number
): VerspaetungStats {
  if (!verspaetungen) {
    return { total: totalSubmittedOrders, totalFee: 0, onTimeCount: totalSubmittedOrders, lateCount: 0, onTimePercent: 100 };
  }

  const lateCount = verspaetungen.length;
  const totalFee = verspaetungen.reduce((sum, v) => sum + v.gesamtbetrag, 0);
  const onTimeCount = Math.max(totalSubmittedOrders - lateCount, 0);
  const onTimePercent = totalSubmittedOrders > 0 ? Math.round((onTimeCount / totalSubmittedOrders) * 100) : 100;

  return { total: totalSubmittedOrders, totalFee, onTimeCount, lateCount, onTimePercent };
}
