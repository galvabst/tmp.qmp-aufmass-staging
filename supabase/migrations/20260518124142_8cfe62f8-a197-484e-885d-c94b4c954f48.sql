
-- Drop defective 2-arg overload (referenced non-existent column updated_at)
DROP FUNCTION IF EXISTS public.update_contractor_praxistest(text, text);

-- Harden 3-arg version: set aktualisiert_am and raise on missing record
CREATE OR REPLACE FUNCTION public.update_contractor_praxistest(
  p_scan_url text,
  p_video_url text,
  p_target_profile_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'thermocheck'
AS $function$
DECLARE
  v_profile_id UUID;
BEGIN
  IF p_target_profile_id IS NOT NULL THEN
    IF NOT thermocheck.is_innendienst() THEN
      RAISE EXCEPTION 'Nur Admins können Praxistests für andere Techniker einreichen';
    END IF;
    v_profile_id := p_target_profile_id;
  ELSE
    v_profile_id := auth.uid();
  END IF;

  UPDATE thermocheck.contractor_onboarding
  SET praxistest_scan_url       = p_scan_url,
      praxistest_video_url      = p_video_url,
      praxistest_eingereicht_am = NOW(),
      aktualisiert_am           = NOW()
  WHERE profile_id = v_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kein Onboarding-Datensatz für profile_id % gefunden', v_profile_id;
  END IF;
END;
$function$;
