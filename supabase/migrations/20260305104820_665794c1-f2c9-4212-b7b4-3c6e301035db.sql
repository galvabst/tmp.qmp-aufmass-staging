
-- RPC to fetch pending praxistests for admin
CREATE OR REPLACE FUNCTION public.get_pending_praxistests()
RETURNS TABLE(
  id UUID,
  profile_id UUID,
  vorname TEXT,
  nachname TEXT,
  avatar_url TEXT,
  praxistest_scan_url TEXT,
  praxistest_video_url TEXT,
  praxistest_eingereicht_am TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
  SELECT
    co.id,
    co.profile_id,
    p.vorname,
    p.nachname,
    p.avatar_url,
    co.praxistest_scan_url,
    co.praxistest_video_url,
    co.praxistest_eingereicht_am
  FROM thermocheck.contractor_onboarding co
  JOIN public.profiles p ON p.id = co.profile_id
  WHERE co.praxistest_eingereicht_am IS NOT NULL
    AND COALESCE(co.praxistest_freigabe, FALSE) = FALSE
  ORDER BY co.praxistest_eingereicht_am ASC;
$$;

-- RPC to approve a praxistest
CREATE OR REPLACE FUNCTION public.approve_contractor_praxistest(p_onboarding_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET
    praxistest_freigabe = TRUE,
    praxistest_freigabe_am = NOW(),
    praxistest_freigabe_von = auth.uid(),
    updated_at = NOW()
  WHERE id = p_onboarding_id;
END;
$$;
