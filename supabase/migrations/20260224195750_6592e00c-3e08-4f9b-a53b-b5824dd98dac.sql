
-- RPC: Techniker lehnt alle verschobenen Terminvorschläge ab
-- Setzt alle Vorschläge auf 'abgelehnt' und entfernt die Techniker-Zuweisung,
-- damit der Auftrag zurück in den Pool fällt.

CREATE OR REPLACE FUNCTION thermocheck.decline_thermocheck_reschedule(
  p_auftrag_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_contractor_id UUID;
  v_auftrag_exists BOOLEAN;
  v_updated_count INT;
BEGIN
  -- Resolve contractor_onboarding.id for current user
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid()
  LIMIT 1;

  IF v_contractor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Contractor-Profil gefunden');
  END IF;

  -- Verify the order is assigned to this technician
  SELECT EXISTS(
    SELECT 1 FROM thermocheck.thermocheck_auftraege
    WHERE id = p_auftrag_id
      AND zugewiesener_techniker_id = v_contractor_id
  ) INTO v_auftrag_exists;

  IF NOT v_auftrag_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auftrag nicht gefunden oder nicht zugewiesen');
  END IF;

  -- Set all 'vorgeschlagen' proposals to 'abgelehnt'
  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'abgelehnt'
  WHERE thermocheck_auftrag_id = p_auftrag_id
    AND status = 'vorgeschlagen';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Unassign technician so order falls back to pool
  UPDATE thermocheck.thermocheck_auftraege
  SET zugewiesener_techniker_id = NULL
  WHERE id = p_auftrag_id;

  RETURN jsonb_build_object('success', true, 'declined_count', v_updated_count);
END;
$$;

-- Public wrapper for frontend access
CREATE OR REPLACE FUNCTION public.decline_thermocheck_reschedule(
  p_auftrag_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.decline_thermocheck_reschedule(p_auftrag_id);
END;
$$;
