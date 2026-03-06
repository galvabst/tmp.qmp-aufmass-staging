import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TechnicianOrder } from "@/types/technician";
import { useMyGrundpreise } from "@/hooks/useContractorGrundpreise";

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

interface TerminRow {
  id: string;
  thermocheck_auftrag_id: string;
  datum: string;
  zeit_von: string | null;
  zeit_bis: string | null;
  ganztaegig: boolean;
  created_at: string;
}

interface AuftragRow {
  id: string;
  kunde_vorname: string | null;
  kunde_nachname: string | null;
  kunde_strasse: string | null;
  kunde_hausnummer: string | null;
  kunde_plz: string | null;
  kunde_ort: string | null;
  kunde_telefon: string | null;
  kunde_email: string | null;
  pipeline_status: string | null;
  zugewiesener_techniker_id: string | null;
  auftragstyp: string | null;
  quadratmeter: number | null;
  wohneinheiten: number | null;
  fussbodenheizung: boolean | null;
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

export function usePoolOrders() {
  const { data: grundpreise } = useMyGrundpreise();

  return useQuery({
    queryKey: ["pool-orders"],
    queryFn: async (): Promise<TechnicianOrder[]> => {
      const headers = await getAuthHeaders();

      // Step 1: Fetch own contractor_onboarding to check einweisung_freigabe
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      let einweisungFreigabe = false;

      if (userId) {
        const obRes = await fetch(
          `${SUPABASE_URL}/rest/v1/contractor_onboarding?profile_id=eq.${userId}&select=einweisung_freigabe`,
          { headers }
        );
        if (obRes.ok) {
          const obRows = await obRes.json();
          if (obRows.length > 0) {
            einweisungFreigabe = obRows[0].einweisung_freigabe === true;
          }
        }
      }

      // Step 2: Fetch auftraege with pipeline_status = termin_abwarten and no techniker assigned
      const auftraegeRes = await fetch(
        `${SUPABASE_URL}/rest/v1/v_thermocheck_auftraege?pipeline_status=eq.termin_abwarten&zugewiesener_techniker_id=is.null&select=id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,kunde_telefon,kunde_email,pipeline_status,auftragstyp,quadratmeter,wohneinheiten,fussbodenheizung`,
        { headers }
      );

      if (!auftraegeRes.ok) {
        console.error("[usePoolOrders] Failed to fetch auftraege:", auftraegeRes.status);
        throw new Error("Failed to fetch auftraege");
      }

      const auftraege: AuftragRow[] = await auftraegeRes.json();
      if (!auftraege.length) return [];

      const auftragIds = auftraege.map(a => a.id);

      // Step 3: Fetch terminvorschlaege for those auftraege
      const termineRes = await fetch(
        `${SUPABASE_URL}/rest/v1/thermocheck_terminvorschlaege?thermocheck_auftrag_id=in.(${auftragIds.join(",")})&select=id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,created_at&order=datum.asc`,
        { headers }
      );

      if (!termineRes.ok) {
        console.error("[usePoolOrders] Failed to fetch termine:", termineRes.status);
        throw new Error("Failed to fetch termine");
      }

      const termine: TerminRow[] = await termineRes.json();

      // Build a map of auftrag_id -> auftrag
      const auftragMap = new Map(auftraege.map(a => [a.id, a]));

      // Map each termin to a TechnicianOrder
      const orders: TechnicianOrder[] = termine.map(termin => {
        const auftrag = auftragMap.get(termin.thermocheck_auftrag_id);
        const auftragstyp = auftrag?.auftragstyp || 'thermocheck';
        const customerName = auftrag
          ? `${auftrag.kunde_vorname || ""} ${auftrag.kunde_nachname || ""}`.trim() || "–"
          : "–";
        const address = auftrag
          ? `${auftrag.kunde_strasse || ""} ${auftrag.kunde_hausnummer || ""}`.trim()
          : "";
        const timeStr = termin.ganztaegig
          ? "Ganztägig"
          : `${termin.zeit_von?.slice(0, 5) || ""} – ${termin.zeit_bis?.slice(0, 5) || ""}`;

        // Determine lock state
        const isLocked = auftragstyp === 'einweisung' && !einweisungFreigabe;

        // Get price from grundpreise map
        const preis = grundpreise?.[auftragstyp] ?? undefined;

        return {
          id: termin.id,
          auftragId: termin.thermocheck_auftrag_id,
          customerName,
          address,
          city: auftrag?.kunde_ort || "",
          postalCode: auftrag?.kunde_plz || "",
          scheduledDate: termin.datum,
          scheduledTime: timeStr,
          description: auftragstyp === 'einweisung' ? 'Einweisung' : 'Thermocheck-Termin',
          status: "published" as const,
          auftragstyp: auftragstyp as any,
          createdAt: termin.created_at,
          contactPhone: auftrag?.kunde_telefon || undefined,
          contactEmail: auftrag?.kunde_email || undefined,
          billableAmount: preis,
          quadratmeter: auftrag?.quadratmeter ?? undefined,
          wohneinheiten: auftrag?.wohneinheiten ?? undefined,
          fussbodenheizung: auftrag?.fussbodenheizung ?? undefined,
          isLocked,
          lockReason: isLocked ? 'Nicht für Einweisungen freigegeben' : undefined,
        };
      });

      console.log("[usePoolOrders] Loaded", orders.length, "pool orders (locked:", orders.filter(o => o.isLocked).length, ")");
      return orders;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
