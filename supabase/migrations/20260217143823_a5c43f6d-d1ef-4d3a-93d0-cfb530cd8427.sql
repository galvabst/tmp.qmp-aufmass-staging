
-- =============================================================================
-- accept_pool_order RPC: Atomare Auftragsannahme mit FOR UPDATE Locking
-- =============================================================================

-- Schritt 1: Funktion im thermocheck-Schema (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order(p_termin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_auftrag_id UUID;
  v_current_techniker UUID;
  v_pipeline_status TEXT;
BEGIN
  -- 1. Termin -> Auftrag-ID ermitteln
  SELECT thermocheck_auftrag_id INTO v_auftrag_id
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE id = p_termin_id;

  IF v_auftrag_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Termin nicht gefunden');
  END IF;

  -- 2. Auftrag mit FOR UPDATE sperren (Race Condition Prevention)
  SELECT zugewiesener_techniker_id, pipeline_status
  INTO v_current_techniker, v_pipeline_status
  FROM thermocheck.thermocheck_auftraege
  WHERE id = v_auftrag_id
  FOR UPDATE;

  -- 3. Validierungen
  IF v_pipeline_status != 'termin_abwarten' THEN
    RETURN json_build_object('success', false, 'error', 'Auftrag ist nicht mehr im Pool');
  END IF;

  IF v_current_techniker IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Auftrag wurde bereits von einem anderen Techniker angenommen');
  END IF;

  -- 4. Techniker zuweisen (auth.uid() = korrekte profile_id!)
  UPDATE thermocheck.thermocheck_auftraege
  SET zugewiesener_techniker_id = auth.uid()
  WHERE id = v_auftrag_id;

  RETURN json_build_object(
    'success', true,
    'auftrag_id', v_auftrag_id,
    'techniker_id', auth.uid()
  );
END;
$$;

-- Schritt 2: Public Wrapper (damit Frontend ueber PostgREST/supabase-js zugreifen kann)
CREATE OR REPLACE FUNCTION public.accept_pool_order(p_termin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.accept_pool_order(p_termin_id);
END;
$$;
