import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { subMonths, format, parseISO, isSameMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export interface MonthlyAggregatedPoint {
  month: string;
  checks: number;
  einweisungen: number;
  avgRating: number | null;
  lateCount: number;
  totalFee: number;
  onTimePercent: number | null;
  avgVorOrtMin: number | null;
  avgNachbearbeitungMin: number | null;
  avgGesamtMin: number | null;
}

export interface AggregatedPerformance {
  monthly: MonthlyAggregatedPoint[];
  overallAvgRating: number | null;
  overallRatingCount: number;
  totalChecksLast6: number;
  totalEinweisungenLast6: number;
  overallOnTimePercent: number | null;
  overallLateFees: number;
  totalLateCount: number;
  overallAvgVorOrtMin: number | null;
  overallAvgNachbearbeitungMin: number | null;
  overallAvgGesamtMin: number | null;
}

export function useAdminAggregatedStats() {
  return useQuery({
    queryKey: ['admin-aggregated-performance'],
    queryFn: async (): Promise<AggregatedPerformance> => {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);
      const sinceDate = format(sixMonthsAgo, 'yyyy-MM-dd');

      const [termineRes, bewertungenRes, verspaetungenRes, durchlaufRes, auftraegeRes] = await Promise.all([
        supabaseTC
          .from('thermocheck_terminvorschlaege')
          .select('thermocheck_auftrag_id,datum')
          .eq('status', 'angenommen')
          .gte('datum', sinceDate),
        supabaseTC
          .from('techniker_bewertungen')
          .select('bewertung, created_at')
          .gte('created_at', sinceDate),
        supabaseTC
          .from('contractor_verspaetungen')
          .select('created_at, gebuehr')
          .gte('created_at', sinceDate),
        supabaseTC
          .from('v_thermocheck_auftraege')
          .select('vor_ort_checkin_at,vor_ort_checkout_at,nachbearbeitung_checkin_at,nachbearbeitung_checkout_at')
          .not('vor_ort_checkin_at', 'is', null)
          .gte('vor_ort_checkin_at', sinceDate),
        supabaseTC
          .from('v_thermocheck_auftraege')
          .select('id,auftragstyp'),
      ]);

      const termine = termineRes.data ?? [];
      const bewertungen = bewertungenRes.data ?? [];
      const verspaetungen = verspaetungenRes.data ?? [];
      const durchlauf = durchlaufRes.data ?? [];
      const auftraege = auftraegeRes.data ?? [];

      // Build auftragstyp lookup
      const auftragstypMap = new Map<string, string>();
      auftraege.forEach((a: any) => auftragstypMap.set(a.id, a.auftragstyp ?? 'thermocheck'));

      const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

      // Helper: diff in minutes between two ISO timestamps
      const diffMin = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 60000;
      const avgOrNull = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;

      const monthly: MonthlyAggregatedPoint[] = months.map(m => {
        const monthTermine = termine.filter(t => t.datum && isSameMonth(parseISO(t.datum), m));
        const checks = monthTermine.filter(t => (auftragstypMap.get(t.thermocheck_auftrag_id) ?? 'thermocheck') !== 'einweisung').length;
        const einweisungen = monthTermine.filter(t => auftragstypMap.get(t.thermocheck_auftrag_id) === 'einweisung').length;
        const monthRatings = bewertungen.filter(b => b.created_at && isSameMonth(parseISO(b.created_at), m));
        const avg = monthRatings.length > 0
          ? Math.round((monthRatings.reduce((s, r) => s + (r.bewertung ?? 0), 0) / monthRatings.length) * 10) / 10
          : null;

        const monthLate = verspaetungen.filter(v => v.created_at && isSameMonth(parseISO(v.created_at), m));
        const lateCount = monthLate.length;
        const totalFee = monthLate.reduce((s, v) => s + (v.gebuehr ?? 0), 0);
        const onTimePercent = checks > 0 ? Math.round(((checks - lateCount) / checks) * 100) : null;

        // Durchlaufzeiten für diesen Monat
        const monthDurchlauf = durchlauf.filter(d => d.vor_ort_checkin_at && isSameMonth(parseISO(d.vor_ort_checkin_at), m));
        const vorOrtMins = monthDurchlauf
          .filter(d => d.vor_ort_checkin_at && d.vor_ort_checkout_at)
          .map(d => diffMin(d.vor_ort_checkin_at!, d.vor_ort_checkout_at!))
          .filter(v => v > 0);
        const nachbMins = monthDurchlauf
          .filter(d => d.nachbearbeitung_checkin_at && d.nachbearbeitung_checkout_at)
          .map(d => diffMin(d.nachbearbeitung_checkin_at!, d.nachbearbeitung_checkout_at!))
          .filter(v => v > 0);
        const gesamtMins = monthDurchlauf
          .filter(d => d.vor_ort_checkin_at && d.nachbearbeitung_checkout_at)
          .map(d => diffMin(d.vor_ort_checkin_at!, d.nachbearbeitung_checkout_at!))
          .filter(v => v > 0);

        return {
          month: format(m, 'MMM', { locale: de }), checks, einweisungen, avgRating: avg, lateCount, totalFee, onTimePercent,
          avgVorOrtMin: avgOrNull(vorOrtMins),
          avgNachbearbeitungMin: avgOrNull(nachbMins),
          avgGesamtMin: avgOrNull(gesamtMins),
        };
      });

      const totalChecksLast6 = termine.filter(t => (auftragstypMap.get(t.thermocheck_auftrag_id) ?? 'thermocheck') !== 'einweisung').length;
      const totalEinweisungenLast6 = termine.filter(t => auftragstypMap.get(t.thermocheck_auftrag_id) === 'einweisung').length;
      const overallRatingCount = bewertungen.length;
      const overallAvgRating = overallRatingCount > 0
        ? Math.round((bewertungen.reduce((s, r) => s + (r.bewertung ?? 0), 0) / overallRatingCount) * 10) / 10
        : null;

      const totalLateCount = verspaetungen.length;
      const overallLateFees = verspaetungen.reduce((s, v) => s + (v.gebuehr ?? 0), 0);
      const overallOnTimePercent = totalChecksLast6 > 0
        ? Math.round(((totalChecksLast6 - totalLateCount) / totalChecksLast6) * 100)
        : null;

      // Overall durchlaufzeiten
      const allVorOrt = durchlauf.filter(d => d.vor_ort_checkin_at && d.vor_ort_checkout_at).map(d => diffMin(d.vor_ort_checkin_at!, d.vor_ort_checkout_at!)).filter(v => v > 0);
      const allNachb = durchlauf.filter(d => d.nachbearbeitung_checkin_at && d.nachbearbeitung_checkout_at).map(d => diffMin(d.nachbearbeitung_checkin_at!, d.nachbearbeitung_checkout_at!)).filter(v => v > 0);
      const allGesamt = durchlauf.filter(d => d.vor_ort_checkin_at && d.nachbearbeitung_checkout_at).map(d => diffMin(d.vor_ort_checkin_at!, d.nachbearbeitung_checkout_at!)).filter(v => v > 0);

      return {
        monthly, overallAvgRating, overallRatingCount, totalChecksLast6, totalEinweisungenLast6, overallOnTimePercent, overallLateFees, totalLateCount,
        overallAvgVorOrtMin: avgOrNull(allVorOrt),
        overallAvgNachbearbeitungMin: avgOrNull(allNachb),
        overallAvgGesamtMin: avgOrNull(allGesamt),
      };
    },
    staleTime: 5 * 60_000,
  });
}
