
-- Trainer-Bypass: Trigger sync_onboarding_status aktualisieren
-- Trainer (is_trainer=true) brauchen KEINE internen Admin-Checks
-- (vertrag_geprueft_intern, kleidung_bestellt_intern, lizenzen_bereitgestellt_intern)
CREATE OR REPLACE FUNCTION thermocheck.sync_onboarding_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_completed_count INTEGER;
  v_new_status TEXT;
  v_new_substatus TEXT;
BEGIN
  -- Manuelle Overrides beibehalten
  IF NEW.onboarding_status IN ('blocked', 'deaktiviert') THEN
    RETURN NEW;
  END IF;

  -- Completed Steps zaehlen
  v_completed_count := COALESCE(array_length(NEW.completed_steps, 1), 0);

  -- Default: invited
  v_new_status := 'invited';
  v_new_substatus := NULL;

  -- in_progress ab 3 Steps
  IF v_completed_count >= 3 THEN
    v_new_status := 'in_progress';
  END IF;

  -- Substatus basierend auf Fortschritt
  IF NEW.completed_steps @> ARRAY['profil'] THEN
    v_new_substatus := 'stammdaten_erfasst';
  END IF;
  IF NEW.completed_steps @> ARRAY['akademie'] THEN
    v_new_substatus := 'akademie_abgeschlossen';
  END IF;

  -- Ready-Check: Trainer-Bypass oder alle internen Flags
  IF v_completed_count = 7
     AND (
       NEW.is_trainer = true
       OR (
         NEW.trainer_freigabe = true
         AND NEW.vertrag_geprueft_intern = true
         AND NEW.kleidung_bestellt_intern = true
         AND NEW.lizenzen_bereitgestellt_intern = true
       )
     )
  THEN
    v_new_status := 'ready';
    v_new_substatus := 'einsatzbereit';
  END IF;

  NEW.onboarding_status := v_new_status;
  NEW.onboarding_substatus := v_new_substatus;

  RETURN NEW;
END;
$$;
