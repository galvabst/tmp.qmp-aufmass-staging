import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Grundpreis {
  auftragstyp: string;
  betrag_netto: number;
}

/**
 * Fetches contractor base prices via RPC.
 * Contractors see their own; admins can pass any contractor_id.
 */
export function useContractorGrundpreise(contractorId: string | undefined) {
  return useQuery({
    queryKey: ["contractor-grundpreise", contractorId],
    enabled: !!contractorId,
    queryFn: async (): Promise<Grundpreis[]> => {
      const { data, error } = await supabase.rpc("get_contractor_grundpreise", {
        p_contractor_id: contractorId!,
      } as any);

      if (error) {
        console.error("[useContractorGrundpreise]", error);
        throw error;
      }

      return (data as any[]) || [];
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Returns all grundpreise for the current contractor as a Map<auftragstyp, betrag_netto>.
 */
export function useMyGrundpreise() {
  return useQuery({
    queryKey: ["my-grundpreise"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) return {};

      const { data: onboarding, error: obErr } = await supabase
        .from("contractor_onboarding" as any)
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (obErr || !onboarding) return {};

      const { data, error } = await supabase.rpc("get_contractor_grundpreise", {
        p_contractor_id: (onboarding as any).id,
      } as any);

      if (error) {
        console.error("[useMyGrundpreise]", error);
        return {};
      }

      const prices = (data as Grundpreis[]) || [];
      const map: Record<string, number> = {};
      prices.forEach((p) => {
        map[p.auftragstyp] = p.betrag_netto;
      });
      return map;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Returns a single grundpreis for a given auftragstyp.
 * Useful for Pool view to show thermocheck price.
 */
export function useMyThermocheckGrundpreis() {
  const { data: preise, ...rest } = useMyGrundpreise();
  return {
    ...rest,
    data: preise?.thermocheck ?? null,
  };
}

/**
 * Admin mutation to update a contractor's grundpreis.
 */
export function useUpdateContractorGrundpreis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractorId,
      auftragstyp,
      betrag,
    }: {
      contractorId: string;
      auftragstyp: string;
      betrag: number;
    }) => {
      const { error } = await supabase.rpc("update_contractor_grundpreis", {
        p_contractor_id: contractorId,
        p_auftragstyp: auftragstyp,
        p_betrag: betrag,
      } as any);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contractor-grundpreise", variables.contractorId],
      });
    },
  });
}
