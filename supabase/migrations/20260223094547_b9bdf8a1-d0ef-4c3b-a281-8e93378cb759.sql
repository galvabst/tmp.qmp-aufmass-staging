CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order(p_termin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_auftrag_id UUID;
  v_contractor_id UUID;
  v_current_techniker UUID;
  v_pipeline_status TEXT;
BEGIN
  -- contractor_onboarding-ID fuer aktuellen User ermitteln
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 
      'Kein Contractor-Profil gefunden');
  END IF;

  -- Termin -> Auftrag-ID
  SELECT thermocheck_auftrag_id INTO v_auftrag_id
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE id = p_termin_id;

  IF v_auftrag_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Termin nicht gefunden');
  END IF;

  -- Auftrag sperren + validieren
  SELECT zugewiesener_techniker_id, pipeline_status
  INTO v_current_techniker, v_pipeline_status
  FROM thermocheck.thermocheck_auftraege
  WHERE id = v_auftrag_id
  FOR UPDATE;

  IF v_pipeline_status != 'termin_abwarten' THEN
    RETURN json_build_object('success', false, 'error', 
      'Auftrag ist nicht mehr im Pool');
  END IF;

  IF v_current_techniker IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 
      'Auftrag bereits vergeben');
  END IF;

  -- 1. Auftrag zuweisen + pipeline_status auf naechsten Schritt setzen
  UPDATE thermocheck.thermocheck_auftraege
  SET zugewiesener_techniker_id = v_contractor_id,
      pipeline_status = 'wc1_durchfuehren'
  WHERE id = v_auftrag_id;

  -- 2. Angenommenen Termin markieren (auth.uid() statt v_contractor_id fuer FK auf auth.users)
  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'angenommen',
      angenommen_von = auth.uid(),
      angenommen_am = now()
  WHERE id = p_termin_id;

  -- 3. Konkurrierende Termine als abgelehnt markieren
  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'abgelehnt'
  WHERE thermocheck_auftrag_id = v_auftrag_id
    AND id != p_termin_id
    AND status = 'vorgeschlagen';

  RETURN json_build_object(
    'success', true,
    'auftrag_id', v_auftrag_id,
    'contractor_id', v_contractor_id
  );
END;
$$;