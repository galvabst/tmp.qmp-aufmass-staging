
-- 1. BEFORE INSERT Trigger auf contractor_onboarding: Race Condition fixen
CREATE OR REPLACE FUNCTION thermocheck.sync_is_trainer_on_onboarding_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM iam.user_app_roles uar
    JOIN iam.app_roles ar ON ar.id = uar.app_role_id
    WHERE uar.user_id = NEW.profile_id
      AND ar.role_code = 'aufmass_trainer'
  ) THEN
    NEW.is_trainer := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_is_trainer_on_insert
  BEFORE INSERT ON thermocheck.contractor_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.sync_is_trainer_on_onboarding_insert();

-- 2. Bestehenden IAM-Trigger erweitern: INSERT + UPDATE + DELETE
DROP TRIGGER IF EXISTS trg_sync_is_trainer ON iam.user_app_roles;

CREATE OR REPLACE FUNCTION thermocheck.sync_is_trainer_from_iam()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_code text;
  v_user_id uuid;
BEGIN
  -- INSERT: neue Rolle zugewiesen
  IF TG_OP = 'INSERT' THEN
    SELECT ar.role_code INTO v_role_code
    FROM iam.app_roles ar WHERE ar.id = NEW.app_role_id;

    IF v_role_code = 'aufmass_trainer' THEN
      UPDATE thermocheck.contractor_onboarding
      SET is_trainer = true
      WHERE profile_id = NEW.user_id;
    END IF;
    RETURN NEW;

  -- DELETE: Rolle entzogen
  ELSIF TG_OP = 'DELETE' THEN
    SELECT ar.role_code INTO v_role_code
    FROM iam.app_roles ar WHERE ar.id = OLD.app_role_id;

    IF v_role_code = 'aufmass_trainer' THEN
      UPDATE thermocheck.contractor_onboarding
      SET is_trainer = false
      WHERE profile_id = OLD.user_id;
    END IF;
    RETURN OLD;

  -- UPDATE: Rollenwechsel (alte Rolle entfernen, neue prüfen)
  ELSIF TG_OP = 'UPDATE' THEN
    -- Alte Rolle war aufmass_trainer → false setzen
    SELECT ar.role_code INTO v_role_code
    FROM iam.app_roles ar WHERE ar.id = OLD.app_role_id;

    IF v_role_code = 'aufmass_trainer' THEN
      UPDATE thermocheck.contractor_onboarding
      SET is_trainer = false
      WHERE profile_id = OLD.user_id;
    END IF;

    -- Neue Rolle ist aufmass_trainer → true setzen
    SELECT ar.role_code INTO v_role_code
    FROM iam.app_roles ar WHERE ar.id = NEW.app_role_id;

    IF v_role_code = 'aufmass_trainer' THEN
      UPDATE thermocheck.contractor_onboarding
      SET is_trainer = true
      WHERE profile_id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_is_trainer
  AFTER INSERT OR UPDATE OR DELETE ON iam.user_app_roles
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.sync_is_trainer_from_iam();

-- 3. Backfill: Bestehende Inkonsistenzen korrigieren
UPDATE thermocheck.contractor_onboarding co
SET is_trainer = true
FROM iam.user_app_roles uar
JOIN iam.app_roles ar ON ar.id = uar.app_role_id
WHERE ar.role_code = 'aufmass_trainer'
  AND uar.user_id = co.profile_id
  AND co.is_trainer = false;
