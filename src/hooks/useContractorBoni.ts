import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BonusTyp = 'lead_conversion' | 'bewertung_google' | 'bewertung_trustpilot';
export type BonusStatus = 'ausstehend' | 'freigegeben' | 'ausgezahlt' | 'abgelehnt';

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
