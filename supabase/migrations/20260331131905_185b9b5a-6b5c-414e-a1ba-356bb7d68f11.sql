
-- Extend update_contractor_praxistest RPC to support admin targeting a specific contractor
CREATE OR REPLACE FUNCTION public.update_contractor_praxistest(
  p_scan_url TEXT,
  p_video_url TEXT,
  p_target_profile_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Determine target profile: admin can specify, otherwise use caller
  IF p_target_profile_id IS NOT NULL THEN
    -- Only admins (innendienst) can target other users
    IF NOT thermocheck.is_innendienst() THEN
      RAISE EXCEPTION 'Nur Admins können Praxistests für andere Techniker einreichen';
    END IF;
    v_profile_id := p_target_profile_id;
  ELSE
    v_profile_id := auth.uid();
  END IF;

  UPDATE thermocheck.contractor_onboarding
  SET
    praxistest_scan_url = p_scan_url,
    praxistest_video_url = p_video_url,
    praxistest_eingereicht_am = NOW()
  WHERE profile_id = v_profile_id;
END;
$$;
