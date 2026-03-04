
-- 1) Add column
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN IF NOT EXISTS outro_video_watched boolean NOT NULL DEFAULT false;

-- 2) Backfill
UPDATE thermocheck.contractor_onboarding
SET outro_video_watched = true
WHERE current_step IN ('coaching', 'nachweise')
   OR completed_steps @> ARRAY['coaching']
   OR completed_steps @> ARRAY['akademie']
   OR onboarding_status = 'ready';

-- 3) Drop + recreate RPC with new column
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
  outro_video_watched boolean,
  coaching_bewertung text,
  gebuchter_coaching_termin text,
  gebuchter_coach_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    co.gebuchter_coach_name
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id;
$$;

-- 4) New RPC
CREATE OR REPLACE FUNCTION public.update_contractor_outro_video_watched()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET outro_video_watched = true
  WHERE profile_id = auth.uid();
END;
$$;
