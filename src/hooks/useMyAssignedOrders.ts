import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TechnicianOrder } from "@/types/technician";

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
  lead_id: string | null;
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
  buchung_bestaetigt_am: string | null;
  vortag_bestaetigt_am: string | null;
  vor_ort_checkin_at: string | null;
  vor_ort_checkout_at: string | null;
  nachbearbeitung_checkin_at: string | null;
  nachbearbeitung_checkout_at: string | null;
  eingereicht_am: string | null;
  eingereicht_von: string | null;
  vereinbarter_preis: number | null;
  quadratmeter: number | null;
  wohneinheiten: number | null;
  fussbodenheizung: boolean | null;
}

interface BewertungRow {
  thermocheck_auftrag_id: string;
  bewertung: number;
  created_at: string;
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

// Pipeline statuses that indicate the order is past the VOT work phase (submitted/review)
const SUBMITTED_PIPELINE_STATUSES = [
  'vot_auswertung_ag',
  'ergebnis_abwarten',
  'ergebnis_ausstehend',
  'gewonnen',
  'angebotstermin_abfragen',
  'angebotstermin_abwarten',
  'angebotstermin_vereinbart',
  'angebot_erstellt',
  'angebot_versendet',
  'nachfassen',
  'widerruf',
];

/** Derive frontend status from DB timestamps + pipeline_status + bewertung */
function deriveStatus(
  auftrag: AuftragRow,
  hasBewertung: boolean,
): 'booked' | 'in_progress' | 'submitted' | 'approved' {
  // Priority 1: Bewertung exists → approved
  if (hasBewertung) {
    return 'approved';
  }

  // Priority 2: Submitted / in review pipeline
  if (
    auftrag.eingereicht_am ||
    (auftrag.pipeline_status && SUBMITTED_PIPELINE_STATUSES.includes(auftrag.pipeline_status))
  ) {
    return 'submitted';
  }

  // Priority 3: In progress (vor_ort_checkin started but not yet submitted)
  if (auftrag.vor_ort_checkin_at) {
    return 'in_progress';
  }

  return 'booked';
}

/** Derive current checkin phase from timestamps */
function deriveCheckinPhase(auftrag: AuftragRow): 'vor_ort' | 'nachbearbeitung' | undefined {
  if (auftrag.nachbearbeitung_checkin_at && !auftrag.nachbearbeitung_checkout_at) {
    return 'nachbearbeitung';
  }
  if (auftrag.vor_ort_checkin_at && !auftrag.vor_ort_checkout_at) {
    return 'vor_ort';
  }
  return undefined;
}

export function useMyAssignedOrders() {
  return useQuery({
    queryKey: ["my-assigned-orders"],
    queryFn: async (): Promise<TechnicianOrder[]> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return [];

      const headers = await getAuthHeaders();

      // Step 1: Resolve contractor_onboarding.id for current user
      const onboardingRes = await fetch(
        `${SUPABASE_URL}/rest/v1/contractor_onboarding?profile_id=eq.${userId}&select=id`,
        { headers }
      );

      if (!onboardingRes.ok) {
        console.error("[useMyAssignedOrders] Failed to fetch contractor_onboarding:", onboardingRes.status);
        throw new Error("Failed to fetch contractor onboarding record");
      }

      const onboardingRows: { id: string }[] = await onboardingRes.json();
      if (!onboardingRows.length) {
        console.log("[useMyAssignedOrders] No contractor_onboarding record found for user");
        return [];
      }

      const contractorId = onboardingRows[0].id;

      // Step 2: Fetch auftraege assigned to contractor_onboarding.id
      const auftraegeRes = await fetch(
        `${SUPABASE_URL}/rest/v1/v_thermocheck_auftraege?zugewiesener_techniker_id=eq.${contractorId}&select=id,lead_id,kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,kunde_telefon,kunde_email,pipeline_status,auftragstyp,buchung_bestaetigt_am,vortag_bestaetigt_am,vor_ort_checkin_at,vor_ort_checkout_at,nachbearbeitung_checkin_at,nachbearbeitung_checkout_at,eingereicht_am,eingereicht_von,vereinbarter_preis,quadratmeter,wohneinheiten,fussbodenheizung`,
        { headers }
      );

      if (!auftraegeRes.ok) {
        console.error("[useMyAssignedOrders] Failed to fetch auftraege:", auftraegeRes.status);
        throw new Error("Failed to fetch assigned auftraege");
      }

      const auftraege: AuftragRow[] = await auftraegeRes.json();
      if (!auftraege.length) return [];

      const auftragIds = auftraege.map(a => a.id);

      // Step 3: Fetch termine for those auftraege
      const termineRes = await fetch(
        `${SUPABASE_URL}/rest/v1/thermocheck_terminvorschlaege?thermocheck_auftrag_id=in.(${auftragIds.join(",")})&status=eq.angenommen&select=id,thermocheck_auftrag_id,datum,zeit_von,zeit_bis,ganztaegig,created_at&order=datum.asc`,
        { headers }
      );

      if (!termineRes.ok) {
        console.error("[useMyAssignedOrders] Failed to fetch termine:", termineRes.status);
        throw new Error("Failed to fetch termine");
      }

      // Step 4: Fetch bewertungen for those auftraege
      const bewertungenRes = await fetch(
        `${SUPABASE_URL}/rest/v1/techniker_bewertungen?thermocheck_auftrag_id=in.(${auftragIds.join(",")})&select=thermocheck_auftrag_id,bewertung,created_at`,
        { headers }
      );

      if (!bewertungenRes.ok) {
        console.error("[useMyAssignedOrders] Failed to fetch bewertungen:", bewertungenRes.status);
        // Non-fatal: continue without bewertungen
      }

      const termine: TerminRow[] = await termineRes.json();
      const bewertungen: BewertungRow[] = bewertungenRes.ok ? await bewertungenRes.json() : [];

      // Step 5: Fetch contractor grundpreise as fallback for orders without vereinbarter_preis
      let grundpreisFallback: number | null = null;
      try {
        const { data: gpData } = await supabase.rpc("get_contractor_grundpreise", {
          p_contractor_id: contractorId,
        } as any);
        const prices = (gpData as { auftragstyp: string; betrag_netto: number }[]) || [];
        const tc = prices.find(p => p.auftragstyp === 'thermocheck');
        grundpreisFallback = tc?.betrag_netto ?? null;
      } catch (e) {
        console.warn("[useMyAssignedOrders] Failed to fetch grundpreise fallback:", e);
      }

      // Build lookup maps
      const auftragMap = new Map(auftraege.map(a => [a.id, a]));
      const bewertungMap = new Map(bewertungen.map(b => [b.thermocheck_auftrag_id, b]));

      const orders: TechnicianOrder[] = termine.map(termin => {
        const auftrag = auftragMap.get(termin.thermocheck_auftrag_id);
        const bewertung = bewertungMap.get(termin.thermocheck_auftrag_id);
        const hasBewertung = !!bewertung;

        const customerName = auftrag
          ? `${auftrag.kunde_vorname || ""} ${auftrag.kunde_nachname || ""}`.trim() || "–"
          : "–";
        const address = auftrag
          ? `${auftrag.kunde_strasse || ""} ${auftrag.kunde_hausnummer || ""}`.trim()
          : "";
        const timeStr = termin.ganztaegig
          ? "Ganztägig"
          : `${termin.zeit_von?.slice(0, 5) || ""} – ${termin.zeit_bis?.slice(0, 5) || ""}`;

        const derivedStatus = auftrag ? deriveStatus(auftrag, hasBewertung) : 'booked';
        const derivedPhase = auftrag ? deriveCheckinPhase(auftrag) : undefined;

        // Use vereinbarter_preis if available, otherwise fall back to contractor grundpreis
        const billableAmount = auftrag?.vereinbarter_preis ?? grundpreisFallback ?? undefined;

        return {
          id: termin.id,
          auftragId: termin.thermocheck_auftrag_id,
          leadId: auftrag?.lead_id || undefined,
          zeitBis: termin.zeit_bis || undefined,
          customerName,
          address,
          city: auftrag?.kunde_ort || "",
          postalCode: auftrag?.kunde_plz || "",
          scheduledDate: termin.datum,
          scheduledTime: timeStr,
          description: "Thermocheck-Termin",
          status: derivedStatus,
          auftragstyp: "thermocheck" as const,
          createdAt: termin.created_at,
          contactPhone: auftrag?.kunde_telefon || undefined,
          contactEmail: auftrag?.kunde_email || undefined,
          buchungBestaetigtAm: auftrag?.buchung_bestaetigt_am || undefined,
          vortagBestaetigtAm: auftrag?.vortag_bestaetigt_am || undefined,
          checkinPhase: derivedPhase,
          vorOrtCheckinAt: auftrag?.vor_ort_checkin_at || undefined,
          vorOrtCheckoutAt: auftrag?.vor_ort_checkout_at || undefined,
          nachbearbeitungCheckinAt: auftrag?.nachbearbeitung_checkin_at || undefined,
          nachbearbeitungCheckoutAt: auftrag?.nachbearbeitung_checkout_at || undefined,
          submittedAt: auftrag?.eingereicht_am || undefined,
          approvedAt: bewertung?.created_at || undefined,
          billableAmount,
          quadratmeter: auftrag?.quadratmeter ?? undefined,
          wohneinheiten: auftrag?.wohneinheiten ?? undefined,
          fussbodenheizung: auftrag?.fussbodenheizung ?? undefined,
        };
      });

      console.log("[useMyAssignedOrders] Loaded", orders.length, "assigned orders, bewertungen:", bewertungen.length);
      return orders;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
