
-- Fix Bug 1: enum cast error + Bug 2: add termin_abwarten to allowed stages
CREATE OR REPLACE FUNCTION thermocheck.checkin_thermocheck_auftrag(
  p_auftrag_id uuid,
  p_phase text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_contractor_id uuid;
  v_row thermocheck.thermocheck_auftraege%ROWTYPE;
BEGIN
  -- Resolve contractor_onboarding.id from auth.uid()
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE user_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Contractor-Profil gefunden');
  END IF;

  -- Lock the row
  SELECT * INTO v_row
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auftrag nicht gefunden');
  END IF;

  -- Ownership check
  IF v_row.zugewiesener_techniker_id != v_contractor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nicht zugewiesen');
  END IF;

  -- Pipeline status check (fixed enum cast + added termin_abwarten)
  IF coalesce(v_row.pipeline_status::text, 'NULL') NOT IN ('vot_formular_abfragen', 'vot_formular_in_verzug', 'termin_abwarten') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Status Pipeline: ' || coalesce(v_row.pipeline_status::text, 'NULL'));
  END IF;

  IF p_phase = 'vor_ort' THEN
    -- Idempotent
    IF v_row.vor_ort_checkin_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'already', true);
    END IF;

    UPDATE thermocheck.thermocheck_auftraege
    SET vor_ort_checkin_at = now(),
        updated_at = now()
    WHERE id = p_auftrag_id;

  ELSIF p_phase = 'nachbearbeitung' THEN
    -- Must complete vor_ort first
    IF v_row.vor_ort_checkout_at IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vor-Ort Phase noch nicht abgeschlossen');
    END IF;

    -- Idempotent
    IF v_row.nachbearbeitung_checkin_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'already', true);
    END IF;

    UPDATE thermocheck.thermocheck_auftraege
    SET nachbearbeitung_checkin_at = now(),
        updated_at = now()
    WHERE id = p_auftrag_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ungueltige Phase: ' || p_phase);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Recreate public wrapper
CREATE OR REPLACE FUNCTION public.checkin_thermocheck_auftrag(
  p_auftrag_id uuid,
  p_phase text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.checkin_thermocheck_auftrag(p_auftrag_id, p_phase);
END;
$$;
