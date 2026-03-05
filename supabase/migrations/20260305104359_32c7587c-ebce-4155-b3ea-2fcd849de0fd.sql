
DROP FUNCTION IF EXISTS public.get_contractor_onboarding_state(UUID);

CREATE FUNCTION public.get_contractor_onboarding_state(p_profile_id UUID)
RETURNS TABLE(
  anschrift_strasse TEXT,
  anschrift_plz TEXT,
  anschrift_ort TEXT,
  gewerbeschein_url TEXT,
  gewerbeschein_spaeter BOOLEAN,
  current_step TEXT,
  completed_steps TEXT[],
  equipment_status JSONB,
  akademie_test_bestanden BOOLEAN,
  intro_video_watched BOOLEAN,
  outro_video_watched BOOLEAN,
  coaching_bewertung TEXT,
  gebuchter_coaching_termin TEXT,
  gebuchter_coach_name TEXT,
  praxistest_scan_url TEXT,
  praxistest_video_url TEXT,
  praxistest_eingereicht BOOLEAN,
  praxistest_freigabe BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
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
    co.outro_video_watched,
    co.coaching_bewertung,
    co.gebuchter_coaching_termin,
    co.gebuchter_coach_name,
    co.praxistest_scan_url,
    co.praxistest_video_url,
    (co.praxistest_eingereicht_am IS NOT NULL)::BOOLEAN AS praxistest_eingereicht,
    COALESCE(co.praxistest_freigabe, FALSE) AS praxistest_freigabe
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id
  LIMIT 1;
$$;
