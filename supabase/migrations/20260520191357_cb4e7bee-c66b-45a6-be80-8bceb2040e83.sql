
-- 1. Add 'ausgestiegen' to enum
ALTER TYPE thermocheck.contractor_onboarding_status_enum ADD VALUE IF NOT EXISTS 'ausgestiegen';

-- 2. Add tracking columns
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN IF NOT EXISTS austritts_datum timestamptz,
  ADD COLUMN IF NOT EXISTS austritts_grund text;

-- 3. Trigger: auto-set/clear austritts_datum based on status transitions
CREATE OR REPLACE FUNCTION thermocheck.set_austritts_datum_fn()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = thermocheck, public
AS $$
BEGIN
  IF NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status THEN
    IF NEW.onboarding_status IN ('inaktiv','ausgestiegen','gefeuert','deaktiviert') THEN
      IF NEW.austritts_datum IS NULL THEN
        NEW.austritts_datum := now();
      END IF;
    ELSE
      NEW.austritts_datum := NULL;
      NEW.austritts_grund := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_austritts_datum_trg ON thermocheck.contractor_onboarding;
CREATE TRIGGER set_austritts_datum_trg
  BEFORE UPDATE ON thermocheck.contractor_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.set_austritts_datum_fn();
