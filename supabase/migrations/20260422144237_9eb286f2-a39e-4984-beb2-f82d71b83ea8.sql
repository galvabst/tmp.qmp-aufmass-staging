CREATE OR REPLACE FUNCTION thermocheck.sync_onboarding_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_step_count   int;
  v_status       text;
  v_substatus    text;
BEGIN
  -- Manuelle Admin-Stati werden nicht automatisch überschrieben
  IF NEW.onboarding_status IN ('blocked', 'deaktiviert', 'inaktiv', 'gefeuert') THEN
    RETURN NEW;
  END IF;

  v_step_count := coalesce(array_length(NEW.completed_steps, 1), 0);

  -- Priority 2: Coaching gebucht + nicht bezahlt
  IF NEW.gebuchter_coaching_termin IS NOT NULL AND NEW.mitfahrt_bezahlt_am IS NULL THEN
    v_status := 'mitfahrt';
    IF NEW.mitfahrt_rechnung_datum IS NOT NULL THEN
      v_substatus := 'mitfahrt_in_rechnung';
    ELSE
      v_substatus := 'mitfahrt_gebucht';
    END IF;

  -- Priority 3: akademie_test_bestanden + kein Coaching
  ELSIF NEW.akademie_test_bestanden = true AND NEW.gebuchter_coaching_termin IS NULL AND NEW.mitfahrt_bezahlt_am IS NULL THEN
    v_status := 'mitfahrt';
    v_substatus := 'buchung_ausstehend';

  -- Priority 4: ready (7 steps + trainer OR all intern gates)
  ELSIF v_step_count >= 7 AND (
    NEW.is_trainer = true
    OR (
      coalesce(NEW.vertrag_geprueft_intern, false) = true
      AND coalesce(NEW.kleidung_bestellt_intern, false) = true
      AND coalesce(NEW.lizenzen_bereitgestellt_intern, false) = true
      AND coalesce(NEW.trainer_freigabe, false) = true
    )
  ) THEN
    v_status := 'ready';
    v_substatus := 'akademie_abgeschlossen';

  -- Priority 5: in_progress
  ELSIF NEW.vertrag_geprueft_intern = true OR v_step_count >= 3 THEN
    v_status := 'in_progress';
    IF 'akademie' = ANY(NEW.completed_steps) THEN
      v_substatus := 'akademie_abgeschlossen';
    ELSIF 'profil' = ANY(NEW.completed_steps) THEN
      v_substatus := 'stammdaten_erfasst';
    ELSE
      v_substatus := 'stammdaten_erfasst';
    END IF;

  -- Priority 6: started
  ELSIF v_step_count >= 1 THEN
    v_status := 'started';
    IF 'profil' = ANY(NEW.completed_steps) THEN
      v_substatus := 'stammdaten_erfasst';
    ELSE
      v_substatus := 'neu_angelegt';
    END IF;

  -- Priority 7: invited
  ELSE
    v_status := 'invited';
    v_substatus := 'neu_angelegt';
  END IF;

  NEW.onboarding_status := v_status;
  NEW.onboarding_substatus := v_substatus;
  RETURN NEW;
END;
$$;