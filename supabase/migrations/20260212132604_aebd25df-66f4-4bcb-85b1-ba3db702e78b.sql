
-- Add intro_video_watched column to contractor_onboarding
ALTER TABLE thermocheck.contractor_onboarding 
ADD COLUMN IF NOT EXISTS intro_video_watched boolean DEFAULT false;

-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS public.get_contractor_onboarding_state(uuid);

-- Recreate with intro_video_watched
CREATE OR REPLACE FUNCTION public.get_contractor_onboarding_state(p_profile_id uuid)
RETURNS TABLE(
  anschrift_strasse text,
  anschrift_plz text,
  anschrift_ort text,
  gewerbeschein_url text,
  gewerbeschein_spaeter boolean,
  current_step text,
  completed_steps text[],
  equipment_status jsonb,
  akademie_test_bestanden boolean,
  intro_video_watched boolean
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
    co.akademie_test_bestanden,
    co.intro_video_watched
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id;
END;
$$;

-- RPC to mark intro video as watched
CREATE OR REPLACE FUNCTION public.update_contractor_intro_video_watched()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET intro_video_watched = true
  WHERE profile_id = auth.uid();
END;
$$;
