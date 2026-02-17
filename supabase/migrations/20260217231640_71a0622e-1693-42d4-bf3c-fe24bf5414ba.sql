
-- =============================================================================
-- accept_pool_order RPC erweitern: pipeline_status + terminvorschlaege Status
-- =============================================================================

CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order(p_termin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
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

  -- 2. Angenommenen Termin markieren
  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'angenommen',
      angenommen_von = v_contractor_id,
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

-- =============================================================================
-- Bestehende Dirty Data bereinigen
-- =============================================================================

-- Alle Termine zu bereits zugewiesenen Auftraegen als 'angenommen' markieren
-- (da jeder Auftrag aktuell nur 1 Termin hat, ist das korrekt)
UPDATE thermocheck.thermocheck_terminvorschlaege t
SET status = 'angenommen',
    angenommen_am = now()
FROM thermocheck.thermocheck_auftraege a
WHERE t.thermocheck_auftrag_id = a.id
  AND a.zugewiesener_techniker_id IS NOT NULL
  AND t.status = 'vorgeschlagen';

-- Pipeline-Status der zugewiesenen Auftraege korrigieren
UPDATE thermocheck.thermocheck_auftraege
SET pipeline_status = 'wc1_durchfuehren'
WHERE zugewiesener_techniker_id IS NOT NULL
  AND pipeline_status = 'termin_abwarten';
