-- =====================================================
-- Public Wrapper Function für thermocheck.get_my_contractor_onboarding()
-- =====================================================
-- Diese Funktion ermöglicht den Zugriff auf die thermocheck-Function
-- über das public-Schema, das standardmäßig von PostgREST exponiert wird.

CREATE OR REPLACE FUNCTION public.get_my_contractor_onboarding()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  onboarding_status text,
  onboarding_substatus text,
  trainer_freigabe boolean,
  trainer_freigabe_am timestamptz,
  trainer_freigabe_von uuid,
  ag_domain_email text,
  lektionen_abgeschlossen bigint,
  bestellungen_bezahlt bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
  SELECT * FROM thermocheck.get_my_contractor_onboarding();
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.get_my_contractor_onboarding() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_contractor_onboarding() TO authenticated;

COMMENT ON FUNCTION public.get_my_contractor_onboarding() IS 
'Public wrapper for thermocheck.get_my_contractor_onboarding(). 
Returns contractor onboarding data for the currently authenticated user.';