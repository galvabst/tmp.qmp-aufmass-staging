import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

export interface PendingProposal {
  terminId: string;
  auftragId: string;
  customerName: string;
  datum: string;
  zeitVon: string | null;
  zeitBis: string | null;
  ganztaegig: boolean;
}

export interface PendingReschedule {
  auftragId: string;
  customerName: string;
  plz: string;
  ort: string;
  proposals: PendingProposal[];
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

export function useMyPendingProposals() {
  return useQuery({
    queryKey: ["my-pending-proposals"],
    queryFn: async (): Promise<PendingReschedule[]> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return [];

      const headers = await getAuthHeaders();

      // Step 1: Get contractor_onboarding.id
      const onboardingRes = await fetch(
        `${SUPABASE_URL}/rest/v1/contractor_onboarding?profile_id=eq.${userId}&select=id`,
        { headers }
      );
      if (!onboardingRes.ok) return [];

      const onboardingRows: { id: string }[] = await onboardingRes.json();
      if (!onboardingRows.length) return [];

      const contractorId = onboardingRows[0].id;

      // Step 2: Fetch auftraege assigned to me with pipeline_status = termin_abwarten
      const auftraegeRes = await fetch(
        `${SUPABASE_URL}/rest/v1/v_thermocheck_auftraege?zugewiesener_techniker_id=eq.${contractorId}&pipeline_status=eq.termin_abwarten&select=id,kunde_vorname,kunde_nachname,kunde_plz,kunde_ort`,
        { headers }
      );
      if (!auftraegeRes.ok) return [];

      const auftraege: { id: string; kunde_vorname: string | null; kunde_nachname: string | null; kunde_plz: string | null; kunde_ort: string | null }[] = await auftraegeRes.json();
      if (!auftraege.length) return [];

      const auftragIds = auftraege.map(a => a.id);

      // Step 3: Fetch terminvorschlaege with status = 'vorgeschlagen' for those auftraege
      const termineRes = await fetch(
        `${SUPABASE_URL}/rest/v1/thermocheck_terminvorschlaege?thermocheck_auftrag_id=in.(${auftragIds.join(",")})&status=eq.vorgeschlagen&select=id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig&order=datum.asc`,
        { headers }
      );
      if (!termineRes.ok) return [];

      const termine: {
        id: string;
        thermocheck_auftrag_id: string;
        datum: string;
        zeit_von: string | null;
        zeit_bis: string | null;
        ganztaegig: boolean;
      }[] = await termineRes.json();

      if (!termine.length) return [];

      // Group by auftragId
      const auftragMap = new Map(auftraege.map(a => [a.id, a]));
      const grouped = new Map<string, PendingProposal[]>();

      for (const t of termine) {
        const list = grouped.get(t.thermocheck_auftrag_id) || [];
        const auftrag = auftragMap.get(t.thermocheck_auftrag_id);
        list.push({
          terminId: t.id,
          auftragId: t.thermocheck_auftrag_id,
          customerName: auftrag
            ? `${auftrag.kunde_vorname || ""} ${auftrag.kunde_nachname || ""}`.trim() || "–"
            : "–",
          datum: t.datum,
          zeitVon: t.zeit_von,
          zeitBis: t.zeit_bis,
          ganztaegig: t.ganztaegig,
        });
        grouped.set(t.thermocheck_auftrag_id, list);
      }

      return Array.from(grouped.entries()).map(([auftragId, proposals]) => {
        const auftrag = auftragMap.get(auftragId);
        return {
          auftragId,
          customerName: proposals[0].customerName,
          plz: auftrag?.kunde_plz || "",
          ort: auftrag?.kunde_ort || "",
          proposals,
        };
      });
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
