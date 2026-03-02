
-- ============================================================
-- 1. Add 6 new columns to thermocheck_auftraege
-- ============================================================
ALTER TABLE thermocheck.thermocheck_auftraege
  ADD COLUMN IF NOT EXISTS vor_ort_checkin_at timestamptz,
  ADD COLUMN IF NOT EXISTS vor_ort_checkout_at timestamptz,
  ADD COLUMN IF NOT EXISTS nachbearbeitung_checkin_at timestamptz,
  ADD COLUMN IF NOT EXISTS nachbearbeitung_checkout_at timestamptz,
  ADD COLUMN IF NOT EXISTS eingereicht_am timestamptz,
  ADD COLUMN IF NOT EXISTS eingereicht_von uuid;

-- ============================================================
-- 2. Recreate view with new columns
-- ============================================================
CREATE OR REPLACE VIEW thermocheck.v_thermocheck_auftraege AS
SELECT
  ta.id,
  ta.lead_id,
  ta.pipeline_status,
  ta.zugewiesener_techniker_id,
  ta.info_vertrieb_thc_aufmass,
  ta.info_vertrieb_pv_aufmass,
  ta.info_vertrieb_sonstiges,
  ta.storno_datum,
  ta.widerrufsbelehrung_url,
  ta.rechnungsnummer,
  ta.rechnungsdatum,
  ta.abgerechnet,
  ta.notizen,
  ta.created_at,
  ta.updated_at,
  ta.created_by,
  ta.quadratmeter,
  ta.wohneinheiten,
  ta.wc1_durchgefuehrt_am,
  ta.wc1_durchgefuehrt_von,
  ta.fussbodenheizung,
  l.lead_name,
  l.kunde_vorname,
  l.kunde_nachname,
  l.kunde_email,
  l.kunde_telefon,
  l.kunde_strasse,
  l.kunde_hausnummer,
  l.kunde_plz,
  l.kunde_ort,
  l.signier_datum_thc,
  l.kunde_anrede,
  l.referenz_nummer,
  l.mitarbeiter_id AS vertriebler_mitarbeiter_id,
  ta.buchung_bestaetigt_am,
  ta.vortag_bestaetigt_am,
  -- NEW: Check-in/out timestamps
  ta.vor_ort_checkin_at,
  ta.vor_ort_checkout_at,
  ta.nachbearbeitung_checkin_at,
  ta.nachbearbeitung_checkout_at,
  ta.eingereicht_am,
  ta.eingereicht_von
FROM thermocheck.thermocheck_auftraege ta
JOIN leads l ON l.id = ta.lead_id;

-- ============================================================
-- 3. RPC: thermocheck.checkin_thermocheck_auftrag
-- ============================================================
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
  -- Resolve contractor_onboarding.id for current user
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Contractor-Datensatz gefunden');
  END IF;

  -- Lock and fetch the order
  SELECT * INTO v_row
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auftrag nicht gefunden');
  END IF;

  -- Ownership check
  IF v_row.zugewiesener_techniker_id IS DISTINCT FROM v_contractor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nicht zugewiesen');
  END IF;

  -- Pipeline status check
  IF v_row.pipeline_status != 'wc1_durchfuehren' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pipeline-Status erlaubt kein Check-in (erwartet: wc1_durchfuehren, ist: ' || v_row.pipeline_status::text || ')');
  END IF;

  IF p_phase = 'vor_ort' THEN
    -- Idempotent: already checked in → success
    IF v_row.vor_ort_checkin_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true);
    END IF;
    UPDATE thermocheck.thermocheck_auftraege
    SET vor_ort_checkin_at = now()
    WHERE id = p_auftrag_id;

  ELSIF p_phase = 'nachbearbeitung' THEN
    -- Require vor_ort checkout first
    IF v_row.vor_ort_checkout_at IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vor-Ort-Checkout muss zuerst abgeschlossen sein');
    END IF;
    -- Idempotent
    IF v_row.nachbearbeitung_checkin_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true);
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

-- ============================================================
-- 4. RPC: thermocheck.checkout_thermocheck_auftrag
-- ============================================================
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
  v_contractor_id uuid;
  v_row thermocheck.thermocheck_auftraege%ROWTYPE;
BEGIN
  -- Resolve contractor_onboarding.id for current user
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Contractor-Datensatz gefunden');
  END IF;

  -- Lock and fetch the order
  SELECT * INTO v_row
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auftrag nicht gefunden');
  END IF;

  -- Ownership check
  IF v_row.zugewiesener_techniker_id IS DISTINCT FROM v_contractor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nicht zugewiesen');
  END IF;

  IF p_phase = 'vor_ort' THEN
    -- Must have checked in first
    IF v_row.vor_ort_checkin_at IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Vor-Ort-Check-in muss zuerst gestartet sein');
    END IF;
    -- Idempotent
    IF v_row.vor_ort_checkout_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true);
    END IF;
    UPDATE thermocheck.thermocheck_auftraege
    SET vor_ort_checkout_at = now()
    WHERE id = p_auftrag_id;

  ELSIF p_phase = 'nachbearbeitung' THEN
    -- Must have checked in first
    IF v_row.nachbearbeitung_checkin_at IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Nachbearbeitung-Check-in muss zuerst gestartet sein');
    END IF;
    -- Idempotent
    IF v_row.nachbearbeitung_checkout_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', true);
    END IF;
    UPDATE thermocheck.thermocheck_auftraege
    SET
      nachbearbeitung_checkout_at = now(),
      eingereicht_am = now(),
      eingereicht_von = v_contractor_id,
      pipeline_status = 'vot_formular_abfragen'
    WHERE id = p_auftrag_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ungültige Phase: ' || p_phase);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 5. Public wrappers (SECURITY DEFINER, search_path = public)
-- ============================================================
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

CREATE OR REPLACE FUNCTION public.checkout_thermocheck_auftrag(
  p_auftrag_id uuid,
  p_phase text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.checkout_thermocheck_auftrag(p_auftrag_id, p_phase);
END;
$$;
