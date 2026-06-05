
ALTER TABLE thermocheck.thermocheck_auftraege
  ADD COLUMN IF NOT EXISTS abgesprochene_uhrzeit time;

CREATE OR REPLACE FUNCTION thermocheck.confirm_thermocheck_booking(
  p_auftrag_id uuid,
  p_uhrzeit time DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'thermocheck'
AS $function$
DECLARE
  v_contractor_id uuid;
  v_assigned_id uuid;
  v_pipeline thermocheck.thermocheck_auftrags_pipeline_status;
BEGIN
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid()
  LIMIT 1;

  IF v_contractor_id IS NULL THEN
    RAISE EXCEPTION 'Kein Contractor-Profil gefunden';
  END IF;

  SELECT zugewiesener_techniker_id, pipeline_status
  INTO v_assigned_id, v_pipeline
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF v_assigned_id IS NULL THEN
    RAISE EXCEPTION 'Auftrag nicht gefunden';
  END IF;

  IF v_assigned_id != v_contractor_id THEN
    RAISE EXCEPTION 'Nicht berechtigt';
  END IF;

  -- Allow confirmation for both 'wc1_durchfuehren' (initial call) and
  -- 'termin_bestaetigt' (re-confirmation / time correction). Status is NOT changed here.
  IF v_pipeline NOT IN ('wc1_durchfuehren', 'termin_bestaetigt') THEN
    RAISE EXCEPTION 'Auftrag hat falschen Status: %', v_pipeline;
  END IF;

  UPDATE thermocheck.thermocheck_auftraege
  SET buchung_bestaetigt_am = COALESCE(buchung_bestaetigt_am, now()),
      abgesprochene_uhrzeit = COALESCE(p_uhrzeit, abgesprochene_uhrzeit)
  WHERE id = p_auftrag_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_thermocheck_booking(
  p_auftrag_id uuid,
  p_uhrzeit time DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN thermocheck.confirm_thermocheck_booking(p_auftrag_id, p_uhrzeit);
END;
$function$;
