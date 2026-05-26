
-- 1) bewerte_coaching_mitfahrt: bei 'bestanden' Step + current_step nachziehen
CREATE OR REPLACE FUNCTION thermocheck.bewerte_coaching_mitfahrt(p_auftrag_id uuid, p_entscheidung text, p_notiz text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'thermocheck', 'public'
AS $function$
DECLARE
  v_trainer_onb_id uuid;
  v_trainee_profile_id uuid;
  v_caller_profile_id uuid;
BEGIN
  v_caller_profile_id := auth.uid();
  IF v_caller_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicht authentifiziert');
  END IF;

  IF p_entscheidung NOT IN ('bestanden', 'nicht_bestanden', 'abgesagt', 'no_show') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ungültige Entscheidung. Erlaubt: bestanden, nicht_bestanden, abgesagt, no_show');
  END IF;

  SELECT id INTO v_trainer_onb_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = v_caller_profile_id AND is_trainer = true;

  IF v_trainer_onb_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Du bist kein Trainer');
  END IF;

  SELECT coaching_gebucht_von INTO v_trainee_profile_id
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
    AND zugewiesener_techniker_id = v_trainer_onb_id
    AND coaching_gebucht_von IS NOT NULL
  FOR UPDATE;

  IF v_trainee_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auftrag nicht gefunden oder keine Buchung vorhanden');
  END IF;

  IF (SELECT coaching_bewertung FROM thermocheck.thermocheck_auftraege WHERE id = p_auftrag_id) NOT IN ('ausstehend') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dieser Auftrag wurde bereits bewertet');
  END IF;

  UPDATE thermocheck.thermocheck_auftraege
  SET coaching_bewertung = p_entscheidung::thermocheck.coaching_bewertung_enum,
      coaching_bewertung_am = now(),
      coaching_bewertung_von = v_caller_profile_id
  WHERE id = p_auftrag_id;

  IF p_entscheidung = 'bestanden' THEN
    UPDATE thermocheck.contractor_onboarding
    SET coaching_bewertung = 'bestanden',
        coaching_bewertung_am = now(),
        trainer_freigabe = true,
        trainer_freigabe_am = now(),
        trainer_freigabe_von = v_caller_profile_id,
        completed_steps = CASE
          WHEN 'coaching' = ANY(COALESCE(completed_steps, ARRAY[]::text[]))
            THEN completed_steps
          ELSE array_append(COALESCE(completed_steps, ARRAY[]::text[]), 'coaching')
        END,
        current_step = CASE
          WHEN current_step IN ('coaching', 'akademie', 'mitfahrt') THEN 'nachweise'
          ELSE current_step
        END
    WHERE profile_id = v_trainee_profile_id;

    RETURN jsonb_build_object('success', true, 'status', 'bestanden', 'message', 'Trainee als bestanden markiert und freigeschaltet');

  ELSE
    UPDATE thermocheck.contractor_onboarding
    SET coaching_bewertung = 'nicht_bestanden',
        coaching_bewertung_am = now(),
        trainer_freigabe = false,
        current_step = 'coaching',
        completed_steps = array_remove(array_remove(completed_steps, 'coaching'), 'nachweise')
    WHERE profile_id = v_trainee_profile_id;

    RETURN jsonb_build_object('success', true, 'status', p_entscheidung, 'message',
      CASE p_entscheidung
        WHEN 'nicht_bestanden' THEN 'Trainee muss neue Mitfahrt buchen'
        WHEN 'abgesagt' THEN 'Mitfahrt als abgesagt markiert'
        WHEN 'no_show' THEN 'Trainee als No-Show markiert'
      END
    );
  END IF;
END;
$function$;

-- 2) sync_onboarding_status: Mitfahrt-Bezahlung ist kein Ready-Gate mehr, sobald Trainer freigegeben hat
CREATE OR REPLACE FUNCTION thermocheck.sync_onboarding_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_step_count   int;
  v_status       text;
  v_substatus    text;
BEGIN
  IF NEW.onboarding_status IN ('blocked', 'deaktiviert', 'inaktiv', 'gefeuert') THEN
    RETURN NEW;
  END IF;

  v_step_count := coalesce(array_length(NEW.completed_steps, 1), 0);

  -- Priority 2: Coaching gebucht + nicht bezahlt + Trainer hat NOCH NICHT freigegeben
  IF NEW.gebuchter_coaching_termin IS NOT NULL
     AND NEW.mitfahrt_bezahlt_am IS NULL
     AND coalesce(NEW.trainer_freigabe, false) = false THEN
    v_status := 'mitfahrt';
    IF NEW.mitfahrt_rechnung_datum IS NOT NULL THEN
      v_substatus := 'mitfahrt_in_rechnung';
    ELSE
      v_substatus := 'mitfahrt_gebucht';
    END IF;

  ELSIF NEW.akademie_test_bestanden = true AND NEW.gebuchter_coaching_termin IS NULL AND NEW.mitfahrt_bezahlt_am IS NULL THEN
    v_status := 'mitfahrt';
    v_substatus := 'buchung_ausstehend';

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

  ELSIF NEW.vertrag_geprueft_intern = true OR v_step_count >= 3 THEN
    v_status := 'in_progress';
    IF 'akademie' = ANY(NEW.completed_steps) THEN
      v_substatus := 'akademie_abgeschlossen';
    ELSIF 'profil' = ANY(NEW.completed_steps) THEN
      v_substatus := 'stammdaten_erfasst';
    ELSE
      v_substatus := 'stammdaten_erfasst';
    END IF;

  ELSIF v_step_count >= 1 THEN
    v_status := 'started';
    IF 'profil' = ANY(NEW.completed_steps) THEN
      v_substatus := 'stammdaten_erfasst';
    ELSE
      v_substatus := 'neu_angelegt';
    END IF;

  ELSE
    v_status := 'invited';
    v_substatus := 'neu_angelegt';
  END IF;

  NEW.onboarding_status := v_status;
  NEW.onboarding_substatus := v_substatus;
  RETURN NEW;
END;
$function$;

-- 3) Backfill: bestehende bestandene Trainees nachziehen
UPDATE thermocheck.contractor_onboarding
SET completed_steps = CASE
      WHEN 'coaching' = ANY(COALESCE(completed_steps, ARRAY[]::text[])) THEN completed_steps
      ELSE array_append(COALESCE(completed_steps, ARRAY[]::text[]), 'coaching')
    END,
    current_step = CASE
      WHEN current_step IN ('coaching', 'akademie', 'mitfahrt') THEN 'nachweise'
      ELSE current_step
    END
WHERE coaching_bewertung = 'bestanden'
  AND trainer_freigabe = true
  AND onboarding_status NOT IN ('blocked', 'deaktiviert', 'inaktiv', 'gefeuert');
