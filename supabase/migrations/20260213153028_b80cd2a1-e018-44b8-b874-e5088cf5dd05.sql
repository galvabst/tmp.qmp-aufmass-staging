
DROP FUNCTION IF EXISTS public.get_contractor_onboarding_state(uuid);

CREATE FUNCTION public.get_contractor_onboarding_state(p_profile_id uuid)
RETURNS TABLE (
  anschrift_strasse text,
  anschrift_plz text,
  anschrift_ort text,
  gewerbeschein_url text,
  gewerbeschein_spaeter boolean,
  current_step text,
  completed_steps text[],
  equipment_status jsonb,
  akademie_test_bestanden boolean,
  intro_video_watched boolean,
  coaching_bewertung text,
  gebuchter_coaching_termin date,
  gebuchter_coach_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    co.akademie_test_bestanden,
    co.intro_video_watched,
    co.coaching_bewertung::text,
    co.gebuchter_coaching_termin,
    co.gebuchter_coach_name
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id;
END;
$$;
