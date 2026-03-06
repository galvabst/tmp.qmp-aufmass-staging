import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, parseISO, isSameMonth } from 'date-fns';
import { de } from 'date-fns/locale';

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

export interface MonthlyActivityPoint {
  month: string;       // "Jan", "Feb", …
  checks: number;      // Anzahl angenommener Termine
  avgRating: number | null;
  umsatz: number;      // vereinbarter_preis + boni
}

async function tcFetch<T>(path: string, accessToken: string | undefined): Promise<T[]> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: accessToken ? `Bearer ${accessToken}` : '',
    'Accept-Profile': 'thermocheck',
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  return res.ok ? res.json() : [];
}

export function useContractorActivityStats(contractorOnboardingId: string | null | undefined) {
  return useQuery({
    queryKey: ['contractor-activity-stats', contractorOnboardingId],
    enabled: !!contractorOnboardingId,
    queryFn: async (): Promise<MonthlyActivityPoint[]> => {
      const id = contractorOnboardingId!;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Step 1: Fetch all aufträge for this techniker
      const auftraege = await tcFetch<{ id: string; vereinbarter_preis: number | null }>(
        `v_thermocheck_auftraege?zugewiesener_techniker_id=eq.${id}&select=id,vereinbarter_preis`,
        accessToken
      );

      if (auftraege.length === 0) return buildEmptyMonths();

      const auftragIds = auftraege.map(a => a.id);
      const preisMap = new Map(auftraege.map(a => [a.id, a.vereinbarter_preis ?? 0]));
      const idsParam = auftragIds.join(',');

      // Step 2: Parallel fetch termine, bewertungen, boni
      const [termine, bewertungen, boni] = await Promise.all([
        tcFetch<{ thermocheck_auftrag_id: string; datum: string }>(
          `thermocheck_terminvorschlaege?thermocheck_auftrag_id=in.(${idsParam})&status=eq.angenommen&select=thermocheck_auftrag_id,datum`,
          accessToken
        ),
        tcFetch<{ thermocheck_auftrag_id: string; bewertung: number; created_at: string }>(
          `techniker_bewertungen?thermocheck_auftrag_id=in.(${idsParam})&select=thermocheck_auftrag_id,bewertung,created_at`,
          accessToken
        ),
        tcFetch<{ betrag: number; created_at: string }>(
          `contractor_boni?contractor_onboarding_id=eq.${id}&select=betrag,created_at`,
          accessToken
        ),
      ]);

      // Build 6-month buckets
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

      return months.map((m): MonthlyActivityPoint => {
        // Count termine by datum month
        const monthTermine = termine.filter(t => isSameMonth(parseISO(t.datum), m));
        const checks = monthTermine.length;

        // Umsatz: sum vereinbarter_preis for termine in this month + boni
        const terminUmsatz = monthTermine.reduce((sum, t) => sum + (preisMap.get(t.thermocheck_auftrag_id) ?? 0), 0);
        const boniUmsatz = boni
          .filter(b => isSameMonth(parseISO(b.created_at), m))
          .reduce((sum, b) => sum + b.betrag, 0);

        // Avg rating: bewertungen matched to termine in this month
        const terminAuftragIds = new Set(monthTermine.map(t => t.thermocheck_auftrag_id));
        const monthRatings = bewertungen.filter(b => terminAuftragIds.has(b.thermocheck_auftrag_id));
        const avg = monthRatings.length > 0
          ? Math.round((monthRatings.reduce((s, r) => s + r.bewertung, 0) / monthRatings.length) * 10) / 10
          : null;

        return {
          month: format(m, 'MMM', { locale: de }),
          checks,
          avgRating: avg,
          umsatz: terminUmsatz + boniUmsatz,
        };
      });
    },
    staleTime: 5 * 60_000,
  });
}

function buildEmptyMonths(): MonthlyActivityPoint[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => ({
    month: format(subMonths(now, 5 - i), 'MMM', { locale: de }),
    checks: 0,
    avgRating: null,
    umsatz: 0,
  }));
}
