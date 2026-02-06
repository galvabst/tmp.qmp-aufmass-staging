
-- 1. Neue JSONB-Spalte für Equipment-Status
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN IF NOT EXISTS equipment_status JSONB DEFAULT '{}';

-- 2. Thermocheck-Schema RPC zum Speichern
CREATE OR REPLACE FUNCTION thermocheck.update_contractor_equipment_status(p_equipment JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET equipment_status = p_equipment,
      aktualisiert_am = now()
  WHERE profile_id = auth.uid();
END;
$$;

-- 3. Public Wrapper (gleicher Pattern wie Gewerbeschein/Progress)
CREATE OR REPLACE FUNCTION public.update_contractor_equipment_status(p_equipment JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM thermocheck.update_contractor_equipment_status(p_equipment);
END;
$$;

-- 4. get_contractor_onboarding_state erweitern (DROP + RECREATE)
DROP FUNCTION IF EXISTS thermocheck.get_contractor_onboarding_state(uuid);

CREATE OR REPLACE FUNCTION thermocheck.get_contractor_onboarding_state(p_profile_id uuid)
RETURNS TABLE (
  anschrift_strasse text,
  anschrift_plz text,
  anschrift_ort text,
  gewerbeschein_url text,
  gewerbeschein_spaeter boolean,
  current_step text,
  completed_steps text[],
  equipment_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
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
    co.equipment_status
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id;
END;
$$;

-- 5. Public Wrapper für get_contractor_onboarding_state ebenfalls aktualisieren
DROP FUNCTION IF EXISTS public.get_contractor_onboarding_state(uuid);

CREATE OR REPLACE FUNCTION public.get_contractor_onboarding_state(p_profile_id uuid)
RETURNS TABLE (
  anschrift_strasse text,
  anschrift_plz text,
  anschrift_ort text,
  gewerbeschein_url text,
  gewerbeschein_spaeter boolean,
  current_step text,
  completed_steps text[],
  equipment_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM thermocheck.get_contractor_onboarding_state(p_profile_id);
END;
$$;
