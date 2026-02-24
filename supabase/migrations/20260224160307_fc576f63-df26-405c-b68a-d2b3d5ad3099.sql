
-- 1. Trigger-Funktion: Sync is_trainer aus IAM
CREATE OR REPLACE FUNCTION thermocheck.sync_is_trainer_from_iam()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_code text;
BEGIN
  -- Rolle ermitteln
  IF TG_OP = 'INSERT' THEN
    SELECT ar.role_code INTO v_role_code
    FROM iam.app_roles ar
    WHERE ar.id = NEW.app_role_id;

    IF v_role_code = 'aufmass_trainer' THEN
      UPDATE thermocheck.contractor_onboarding
      SET is_trainer = true
      WHERE profile_id = NEW.user_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT ar.role_code INTO v_role_code
    FROM iam.app_roles ar
    WHERE ar.id = OLD.app_role_id;

    IF v_role_code = 'aufmass_trainer' THEN
      UPDATE thermocheck.contractor_onboarding
      SET is_trainer = false
      WHERE profile_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- 2. Trigger auf iam.user_app_roles
CREATE TRIGGER trg_sync_is_trainer
AFTER INSERT OR DELETE ON iam.user_app_roles
FOR EACH ROW
EXECUTE FUNCTION thermocheck.sync_is_trainer_from_iam();

-- 3. Backfill: Bestehende Trainer sofort setzen
UPDATE thermocheck.contractor_onboarding co
SET is_trainer = true
FROM iam.user_app_roles uar
JOIN iam.app_roles ar ON ar.id = uar.app_role_id
WHERE ar.role_code = 'aufmass_trainer'
  AND uar.user_id = co.profile_id
  AND co.is_trainer = false;
