
-- 1. Add akademie_test_bestanden column
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN IF NOT EXISTS akademie_test_bestanden boolean NOT NULL DEFAULT false;

-- 2. Set it to true for Anton
UPDATE thermocheck.contractor_onboarding
SET akademie_test_bestanden = true
WHERE id = '17ef2646-e455-4d99-88ad-443b44ed9594';

-- 3. Drop old function signature, then recreate with new return type
DROP FUNCTION IF EXISTS public.get_contractor_onboarding_state(uuid);

CREATE FUNCTION public.get_contractor_onboarding_state(p_profile_id uuid)
RETURNS TABLE(
  anschrift_strasse text,
  anschrift_plz text,
  anschrift_ort text,
  gewerbeschein_url text,
  gewerbeschein_spaeter boolean,
  current_step text,
  completed_steps text[],
  equipment_status jsonb,
  akademie_test_bestanden boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  RETURN QUERY
  SELECT
    co.anschrift_strasse,
    co.anschrift_plz,
    co.anschrift_ort,
    co.gewerbeschein_url,
    co.gewerbeschein_spaeter,
    co.current_step,
    co.completed_steps,
    co.equipment_status,
    co.akademie_test_bestanden
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id;
END;
$$;
