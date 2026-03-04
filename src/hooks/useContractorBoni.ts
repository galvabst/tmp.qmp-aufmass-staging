import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export type BonusTyp = 'lead_conversion' | 'bewertung_google' | 'bewertung_trustpilot';
export type BonusStatus = 'ausstehend' | 'freigegeben' | 'ausgezahlt' | 'abgelehnt';

export const BONUS_TYP_LABELS: Record<BonusTyp, string> = {
  lead_conversion: 'Lead-Conversion',
  bewertung_google: 'Google-Bewertung',
  bewertung_trustpilot: 'Trustpilot-Bewertung',
};

export interface ContractorBonus {
  id: string;
  thermocheck_auftrag_id: string;
  lead_id: string;
  bonus_typ: BonusTyp;
  betrag: number;
  status: BonusStatus;
  nachweis_storage_path: string | null;
  freigegeben_am: string | null;
  auszahlungsmonat: string | null;
  abgerechnet_am: string | null;
  created_at: string;
  lead_name: string | null;
}

export function useContractorBoni() {
  return useQuery({
    queryKey: ['contractor-boni'],
    queryFn: async (): Promise<ContractorBonus[]> => {
      const { data, error } = await supabase.rpc('get_my_contractor_boni');
      if (error) throw error;
      return (data as unknown as ContractorBonus[]) || [];
    },
    staleTime: 60 * 1000,
  });
}

export function useErstelleBewertungsBonus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auftragId,
      bonusTyp,
      nachweisPath,
    }: {
      auftragId: string;
      bonusTyp: 'bewertung_google' | 'bewertung_trustpilot';
      nachweisPath: string;
    }) => {
      const { data, error } = await supabase.rpc('erstelle_bewertungs_bonus', {
        p_auftrag_id: auftragId,
        p_bonus_typ: bonusTyp,
        p_nachweis_path: nachweisPath,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; message: string };
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-boni'] });
    },
  });
}

/** Aggregierte Bonus-Zusammenfassung */
export function useBoniSummary(boni: ContractorBonus[] | undefined) {
  const ausstehend = (boni || [])
    .filter(b => b.status === 'ausstehend')
    .reduce((s, b) => s + b.betrag, 0);
  const freigegeben = (boni || [])
    .filter(b => b.status === 'freigegeben')
    .reduce((s, b) => s + b.betrag, 0);
  const ausgezahlt = (boni || [])
    .filter(b => b.status === 'ausgezahlt')
    .reduce((s, b) => s + b.betrag, 0);
  const gesamt = ausstehend + freigegeben + ausgezahlt;

  return { ausstehend, freigegeben, ausgezahlt, gesamt, count: (boni || []).length };
}

/** Boni nach Monat gruppiert */
export interface BoniMonatsgruppe {
  monatKey: string; // "2026-03"
  monatLabel: string; // "März 2026"
  boni: ContractorBonus[];
  summe: number;
  abgerechnet: number;
  offen: number;
}

export function groupBoniByMonat(boni: ContractorBonus[]): BoniMonatsgruppe[] {
  const map = new Map<string, ContractorBonus[]>();

  for (const b of boni) {
    const key = b.auszahlungsmonat || format(parseISO(b.created_at), 'yyyy-MM');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }

  const gruppen: BoniMonatsgruppe[] = [];
  for (const [monatKey, items] of map) {
    const [y, m] = monatKey.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    const monatLabel = format(d, 'MMMM yyyy', { locale: de });
    const summe = items.reduce((s, b) => s + b.betrag, 0);
    const abgerechnet = items.filter(b => b.abgerechnet_am).reduce((s, b) => s + b.betrag, 0);
    gruppen.push({ monatKey, monatLabel, boni: items, summe, abgerechnet, offen: summe - abgerechnet });
  }

  return gruppen.sort((a, b) => b.monatKey.localeCompare(a.monatKey));
}
