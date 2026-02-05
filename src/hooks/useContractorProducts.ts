import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContractorProdukt {
  id: string;
  produkt_key: string;
  name: string;
  beschreibung: string | null;
  preis_netto: number;
  preis_brutto: number;
  produkt_typ: "kleidung" | "lizenz" | "coaching";
  ist_aktiv: boolean;
  reihenfolge: number;
  stripe_price_id: string | null;
  stripe_test_price_id: string | null;
  verfuegbare_groessen: string[] | null;
  bild_url: string | null;
  ist_pflicht: boolean;
}

export function useContractorProducts() {
  return useQuery({
    queryKey: ["contractor-products"],
    queryFn: async (): Promise<ContractorProdukt[]> => {
      // Use fetch to access thermocheck schema directly (not in typed client)
      const response = await fetch(
        `https://keplsvhudmfaagixttql.supabase.co/rest/v1/contractor_produkte?ist_aktiv=eq.true&order=reihenfolge`,
        {
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY",
            "Accept-Profile": "thermocheck",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("[useContractorProducts] Failed to fetch products:", response.status);
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      return (data || []) as ContractorProdukt[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
