
CREATE OR REPLACE FUNCTION public.update_contractor_praxistest(
  p_scan_url TEXT,
  p_video_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET
    praxistest_scan_url = p_scan_url,
    praxistest_video_url = p_video_url,
    praxistest_eingereicht_am = NOW(),
    updated_at = NOW()
  WHERE profile_id = auth.uid();
END;
$$;
