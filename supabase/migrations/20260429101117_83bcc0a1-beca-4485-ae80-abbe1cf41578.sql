CREATE OR REPLACE FUNCTION thermocheck.accept_thermocheck_reschedule(p_termin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'thermocheck'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_contractor_id uuid;
  v_auftrag_id uuid;
  v_current_techniker uuid;
  v_pipeline_status text;
  v_termin_status text;
BEGIN
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = v_user_id;

  IF v_contractor_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Kein Contractor-Profil gefunden');
  END IF;

  SELECT thermocheck_auftrag_id, status::text
  INTO v_auftrag_id, v_termin_status
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE id = p_termin_id;

  IF v_auftrag_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Termin nicht gefunden');
  END IF;

  IF v_termin_status <> 'vorgeschlagen' THEN
    RETURN json_build_object('success', false, 'error', 'Termin nicht mehr verfügbar');
  END IF;

  SELECT zugewiesener_techniker_id, pipeline_status::text
  INTO v_current_techniker, v_pipeline_status
  FROM thermocheck.thermocheck_auftraege
  WHERE id = v_auftrag_id
  FOR UPDATE;

  IF v_current_techniker IS NULL OR v_current_techniker <> v_contractor_id THEN
    RETURN json_build_object('success', false, 'error', 'Auftrag nicht zugewiesen');
  END IF;

  IF v_pipeline_status <> 'termin_abwarten' THEN
    RETURN json_build_object('success', false, 'error', 'Auftrag nicht im Reschedule-Status');
  END IF;

  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'angenommen'::thermocheck.terminvorschlag_status,
      angenommen_von = v_user_id,
      angenommen_am = now()
  WHERE id = p_termin_id;

  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'abgelehnt'::thermocheck.terminvorschlag_status
  WHERE thermocheck_auftrag_id = v_auftrag_id
    AND id <> p_termin_id
    AND status = 'vorgeschlagen'::thermocheck.terminvorschlag_status;

  UPDATE thermocheck.thermocheck_auftraege
  SET pipeline_status = 'wc1_durchfuehren'::thermocheck.thermocheck_auftrags_pipeline_status
  WHERE id = v_auftrag_id;

  RETURN json_build_object('success', true);
END;
$$;