
-- Fix checkin RPC: allow check-in at vot_formular_abfragen/vot_formular_in_verzug instead of wc1_durchfuehren
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
  v_row thermocheck.thermocheck_auftraege%ROWTYPE;
  v_contractor_id uuid;
BEGIN
  -- Resolve contractor_onboarding.id for current user
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Contractor-Profil gefunden');
  END IF;

  -- Lock row
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

  -- Pipeline status check: only allow at vot_formular_abfragen or vot_formular_in_verzug
  IF v_row.pipeline_status NOT IN ('vot_formular_abfragen', 'vot_formular_in_verzug') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pipeline-Status erlaubt keinen Check-in (erwartet: vot_formular_abfragen oder vot_formular_in_verzug, ist: ' || coalesce(v_row.pipeline_status, 'NULL') || ')');
  END IF;

  IF p_phase = 'vor_ort' THEN
    -- Idempotent
    IF v_row.vor_ort_checkin_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Bereits eingecheckt');
    END IF;
    UPDATE thermocheck.thermocheck_auftraege
    SET vor_ort_checkin_at = now()
    WHERE id = p_auftrag_id;
  ELSIF p_phase = 'nachbearbeitung' THEN
    -- Vor-Ort must be completed first
    IF v_row.vor_ort_checkout_at IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vor-Ort-Phase muss zuerst abgeschlossen werden');
    END IF;
    -- Idempotent
    IF v_row.nachbearbeitung_checkin_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Bereits eingecheckt');
    END IF;
    UPDATE thermocheck.thermocheck_auftraege
    SET nachbearbeitung_checkin_at = now()
    WHERE id = p_auftrag_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ungültige Phase: ' || p_phase);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Fix checkout RPC: nachbearbeitung checkout sets pipeline_status to vot_auswertung_ag
CREATE OR REPLACE FUNCTION thermocheck.checkout_thermocheck_auftrag(
  p_auftrag_id uuid,
  p_phase text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_row thermocheck.thermocheck_auftraege%ROWTYPE;
  v_contractor_id uuid;
BEGIN
  -- Resolve contractor_onboarding.id for current user
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Contractor-Profil gefunden');
  END IF;

  -- Lock row
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

  IF p_phase = 'vor_ort' THEN
    IF v_row.vor_ort_checkin_at IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Noch nicht eingecheckt');
    END IF;
    -- Idempotent
    IF v_row.vor_ort_checkout_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Bereits ausgecheckt');
    END IF;
    UPDATE thermocheck.thermocheck_auftraege
    SET vor_ort_checkout_at = now()
    WHERE id = p_auftrag_id;
  ELSIF p_phase = 'nachbearbeitung' THEN
    IF v_row.nachbearbeitung_checkin_at IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Noch nicht eingecheckt');
    END IF;
    -- Idempotent
    IF v_row.nachbearbeitung_checkout_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'message', 'Bereits ausgecheckt');
    END IF;
    UPDATE thermocheck.thermocheck_auftraege
    SET nachbearbeitung_checkout_at = now(),
        eingereicht_am = now(),
        eingereicht_von = auth.uid(),
        pipeline_status = 'vot_auswertung_ag'
    WHERE id = p_auftrag_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ungültige Phase: ' || p_phase);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Recreate public wrappers
CREATE OR REPLACE FUNCTION public.checkin_thermocheck_auftrag(
  p_auftrag_id uuid,
  p_phase text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.checkin_thermocheck_auftrag(p_auftrag_id, p_phase);
$$;

CREATE OR REPLACE FUNCTION public.checkout_thermocheck_auftrag(
  p_auftrag_id uuid,
  p_phase text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.checkout_thermocheck_auftrag(p_auftrag_id, p_phase);
$$;
