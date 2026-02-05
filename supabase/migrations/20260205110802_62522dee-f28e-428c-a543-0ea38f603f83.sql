-- Function to get contractor onboarding status for the current authenticated user
-- This is used by the frontend to determine if a user has completed onboarding

CREATE OR REPLACE FUNCTION thermocheck.get_my_contractor_onboarding()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  onboarding_status thermocheck.contractor_onboarding_status_enum,
  onboarding_substatus thermocheck.contractor_onboarding_substatus_enum,
  trainer_freigabe boolean,
  trainer_freigabe_am timestamptz,
  trainer_freigabe_von uuid,
  ag_domain_email text,
  lektionen_abgeschlossen bigint,
  bestellungen_bezahlt bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    co.id,
    co.profile_id,
    co.onboarding_status,
    co.onboarding_substatus,
    co.trainer_freigabe,
    co.trainer_freigabe_am,
    co.trainer_freigabe_von,
    co.ag_domain_email,
    -- Aggregated: completed lessons
    (SELECT COUNT(*) 
     FROM thermocheck.contractor_akademie_lektions_fortschritt calf 
     WHERE calf.contractor_id = co.id 
     AND calf.status = 'completed') as lektionen_abgeschlossen,
    -- Aggregated: paid orders
    (SELECT COUNT(*) 
     FROM thermocheck.contractor_bestellungen cb 
     WHERE cb.onboarding_id = co.id 
     AND cb.status = 'paid') as bestellungen_bezahlt
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION thermocheck.get_my_contractor_onboarding() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION thermocheck.get_my_contractor_onboarding() IS 
'Returns the contractor onboarding record for the currently authenticated user, including aggregated progress data. Used by the frontend to determine onboarding completion status.';