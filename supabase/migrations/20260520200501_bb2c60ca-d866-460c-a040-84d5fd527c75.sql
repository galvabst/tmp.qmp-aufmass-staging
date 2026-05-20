
DROP FUNCTION IF EXISTS public.get_contractor_onboarding_state(uuid);
CREATE FUNCTION public.get_contractor_onboarding_state(p_profile_id uuid)
RETURNS TABLE(
  onboarding_id uuid,
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
  outro_video_watched boolean,
  coaching_bewertung text,
  gebuchter_coaching_termin text,
  gebuchter_coach_name text,
  praxistest_scan_url text,
  praxistest_video_url text,
  praxistest_eingereicht boolean,
  praxistest_freigabe boolean,
  praxistest_scan_freigegeben boolean,
  praxistest_video_freigegeben boolean,
  praxistest_runde int
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public','thermocheck'
AS $$
  SELECT
    co.id,
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
    co.outro_video_watched,
    co.coaching_bewertung,
    co.gebuchter_coaching_termin,
    co.gebuchter_coach_name,
    co.praxistest_scan_url,
    co.praxistest_video_url,
    (co.praxistest_eingereicht_am IS NOT NULL)::boolean,
    COALESCE(co.praxistest_freigabe, false),
    COALESCE(co.praxistest_scan_freigegeben, false),
    COALESCE(co.praxistest_video_freigegeben, false),
    COALESCE(co.praxistest_runde, 1)
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_contractor_onboarding_state(uuid) TO authenticated;
