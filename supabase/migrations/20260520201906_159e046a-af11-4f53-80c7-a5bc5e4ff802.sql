DROP FUNCTION IF EXISTS thermocheck.admin_reject_praxistest(UUID, TEXT);
DROP FUNCTION IF EXISTS public.admin_reject_praxistest(UUID, TEXT);

CREATE OR REPLACE FUNCTION thermocheck.admin_reject_praxistest(
  p_profile_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  IF NOT thermocheck.is_innendienst() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unzureichende Berechtigung');
  END IF;

  UPDATE thermocheck.contractor_onboarding
  SET praxistest_eingereicht = false,
      praxistest_freigabe = 'pending'::thermocheck.praxistest_freigabe_enum,
      praxistest_scan_url = NULL,
      praxistest_video_url = NULL,
      praxistest_scan_freigegeben = false,
      praxistest_video_freigegeben = false,
      praxistest_runde = COALESCE(praxistest_runde, 1) + 1,
      aktualisiert_am = now()
  WHERE profile_id = p_profile_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding nicht gefunden');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_praxistest(
  p_profile_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.admin_reject_praxistest(p_profile_id, p_reason);
$$;

REVOKE ALL ON FUNCTION public.admin_reject_praxistest(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_praxistest(UUID, TEXT) TO authenticated;