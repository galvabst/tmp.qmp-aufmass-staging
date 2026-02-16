
-- =============================================================================
-- 1. Trigger-Funktion: Automatische Status-Transitionen
-- =============================================================================
CREATE OR REPLACE FUNCTION thermocheck.sync_onboarding_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_completed_count INT;
  v_new_status thermocheck.contractor_onboarding_status_enum;
  v_new_substatus thermocheck.contractor_onboarding_substatus_enum;
BEGIN
  -- blocked/deaktiviert werden NICHT automatisch überschrieben
  IF NEW.onboarding_status IN ('blocked', 'deaktiviert') THEN
    -- Wenn Admin manuell blocked/deaktiviert setzt, beibehalten
    IF OLD.onboarding_status IN ('blocked', 'deaktiviert') 
       OR (TG_OP = 'UPDATE' AND NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status) THEN
      RETURN NEW;
    END IF;
  END IF;

  v_completed_count := coalesce(array_length(NEW.completed_steps, 1), 0);

  -- === STATUS berechnen ===
  IF v_completed_count = 7
     AND NEW.trainer_freigabe = true
     AND NEW.vertrag_geprueft_intern = true
     AND NEW.kleidung_bestellt_intern = true
     AND NEW.lizenzen_bereitgestellt_intern = true
  THEN
    v_new_status := 'ready';
  ELSIF v_completed_count >= 3 THEN
    v_new_status := 'in_progress';
  ELSIF v_completed_count >= 1 OR NEW.current_step IS NOT NULL THEN
    v_new_status := 'started';
  ELSE
    v_new_status := 'invited';
  END IF;

  -- === SUBSTATUS berechnen (höchster erreichter Meilenstein) ===
  IF NEW.akademie_test_bestanden = true THEN
    v_new_substatus := 'akademie_abgeschlossen';
  ELSIF NEW.current_step = 'akademie' OR 'akademie' = ANY(NEW.completed_steps) THEN
    v_new_substatus := 'akademie_gestartet';
  ELSIF NEW.lizenzen_bereitgestellt_intern = true THEN
    v_new_substatus := 'lizenzen_bereitstellen';
  ELSIF 'bestellungen' = ANY(NEW.completed_steps) OR NEW.kleidung_bestellt_intern = true THEN
    v_new_substatus := 'kleidung_bestellen';
  ELSIF NEW.vertrag_geprueft_intern = true THEN
    v_new_substatus := 'vertrag_geprueft';
  ELSIF 'profil' = ANY(NEW.completed_steps) THEN
    v_new_substatus := 'stammdaten_erfasst';
  ELSE
    v_new_substatus := 'neu_angelegt';
  END IF;

  NEW.onboarding_status := v_new_status;
  NEW.onboarding_substatus := v_new_substatus;

  RETURN NEW;
END;
$$;

-- Trigger auf INSERT und UPDATE
DROP TRIGGER IF EXISTS trg_sync_onboarding_status ON thermocheck.contractor_onboarding;
CREATE TRIGGER trg_sync_onboarding_status
  BEFORE INSERT OR UPDATE ON thermocheck.contractor_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.sync_onboarding_status();

-- =============================================================================
-- 2. Till Ibendorf als Trainer markieren
-- =============================================================================
UPDATE thermocheck.contractor_onboarding 
SET is_trainer = true 
WHERE profile_id = 'c0893b68-bc58-4694-94dc-9d991efdec12';

-- =============================================================================
-- 3. Bestehende Daten korrigieren (Trigger feuert automatisch bei UPDATE)
--    Wir machen ein harmloses UPDATE auf jede Zeile, damit der Trigger die
--    korrekten Status berechnet.
-- =============================================================================
UPDATE thermocheck.contractor_onboarding
SET current_step = current_step;
