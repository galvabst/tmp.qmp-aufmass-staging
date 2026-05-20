
CREATE OR REPLACE FUNCTION thermocheck.set_contractor_austritt(
  p_onboarding_id uuid,
  p_status text,
  p_grund text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_new_status thermocheck.contractor_onboarding_status_enum;
  v_unassigned_thc int := 0;
  v_unassigned_ew int := 0;
BEGIN
  -- Authorization
  IF NOT thermocheck.is_innendienst() THEN
    RAISE EXCEPTION 'Nicht autorisiert' USING ERRCODE = '42501';
  END IF;

  -- Validate status
  IF p_status NOT IN ('inaktiv','ausgestiegen','gefeuert','in_progress') THEN
    RAISE EXCEPTION 'Ungültiger Status: %', p_status USING ERRCODE = '22023';
  END IF;

  v_new_status := p_status::thermocheck.contractor_onboarding_status_enum;

  -- Update onboarding (trigger handles austritts_datum)
  UPDATE thermocheck.contractor_onboarding
     SET onboarding_status = v_new_status,
         austritts_grund   = CASE WHEN p_status = 'in_progress' THEN NULL ELSE COALESCE(p_grund, austritts_grund) END,
         aktualisiert_am   = now()
   WHERE id = p_onboarding_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Onboarding nicht gefunden: %', p_onboarding_id USING ERRCODE = 'P0002';
  END IF;

  -- For hard exits: release open orders back to pool
  IF p_status IN ('ausgestiegen','gefeuert') THEN
    UPDATE thermocheck.thermocheck_auftraege
       SET zugewiesener_techniker_id = NULL
     WHERE zugewiesener_techniker_id = p_onboarding_id
       AND pipeline_status NOT IN (
         'gewonnen','verloren','widerruf','zahlung_erhalten',
         'widerruf_ohne_nachweis','widerruf_nicht_fristgerecht'
       );
    GET DIAGNOSTICS v_unassigned_thc = ROW_COUNT;

    UPDATE thermocheck.einweisungs_auftraege
       SET zugewiesener_techniker_id = NULL
     WHERE zugewiesener_techniker_id = p_onboarding_id
       AND status NOT IN ('abgeschlossen','storniert');
    GET DIAGNOSTICS v_unassigned_ew = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'unassigned_thermochecks', v_unassigned_thc,
    'unassigned_einweisungen', v_unassigned_ew
  );
END;
$$;

REVOKE ALL ON FUNCTION thermocheck.set_contractor_austritt(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION thermocheck.set_contractor_austritt(uuid, text, text) TO authenticated;

-- Public wrapper for PostgREST exposure
CREATE OR REPLACE FUNCTION public.set_contractor_austritt(
  p_onboarding_id uuid,
  p_status text,
  p_grund text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
  SELECT thermocheck.set_contractor_austritt(p_onboarding_id, p_status, p_grund);
$$;

REVOKE ALL ON FUNCTION public.set_contractor_austritt(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_contractor_austritt(uuid, text, text) TO authenticated;
