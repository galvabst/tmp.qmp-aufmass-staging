
-- RPC: Trainer bewertet eine Coaching-Mitfahrt (bestanden / nicht_bestanden)
CREATE OR REPLACE FUNCTION thermocheck.bewerte_coaching_mitfahrt(
  p_auftrag_id uuid,
  p_entscheidung text,
  p_notiz text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_trainer_onb_id uuid;
  v_trainee_profile_id uuid;
  v_caller_profile_id uuid;
BEGIN
  -- Caller profile
  v_caller_profile_id := auth.uid();
  IF v_caller_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicht authentifiziert');
  END IF;

  -- Validate entscheidung
  IF p_entscheidung NOT IN ('bestanden', 'nicht_bestanden') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ungültige Entscheidung. Erlaubt: bestanden, nicht_bestanden');
  END IF;

  -- Get trainer's onboarding id
  SELECT id INTO v_trainer_onb_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = v_caller_profile_id AND is_trainer = true;

  IF v_trainer_onb_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Du bist kein Trainer');
  END IF;

  -- Verify this auftrag belongs to trainer and has a booking
  SELECT coaching_gebucht_von INTO v_trainee_profile_id
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
    AND zugewiesener_techniker_id = v_trainer_onb_id
    AND coaching_gebucht_von IS NOT NULL
  FOR UPDATE;

  IF v_trainee_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auftrag nicht gefunden oder keine Buchung vorhanden');
  END IF;

  IF p_entscheidung = 'bestanden' THEN
    -- Mark trainee as passed
    UPDATE thermocheck.contractor_onboarding
    SET coaching_bewertung = 'bestanden',
        coaching_bewertung_am = now(),
        trainer_freigabe = true,
        trainer_freigabe_am = now(),
        trainer_freigabe_von = v_caller_profile_id
    WHERE profile_id = v_trainee_profile_id;

    RETURN jsonb_build_object('success', true, 'status', 'bestanden', 'message', 'Trainee als bestanden markiert');

  ELSE
    -- Mark trainee as failed
    UPDATE thermocheck.contractor_onboarding
    SET coaching_bewertung = 'nicht_bestanden',
        coaching_bewertung_am = now(),
        trainer_freigabe = false,
        current_step = 'coaching',
        completed_steps = array_remove(completed_steps, 'coaching')
    WHERE profile_id = v_trainee_profile_id;

    -- Free up the booking slot
    UPDATE thermocheck.thermocheck_auftraege
    SET coaching_gebucht_von = NULL,
        coaching_gebucht_am = NULL
    WHERE id = p_auftrag_id;

    RETURN jsonb_build_object('success', true, 'status', 'nicht_bestanden', 'message', 'Trainee muss neue Mitfahrt buchen');
  END IF;
END;
$$;

-- Public wrapper for frontend access
CREATE OR REPLACE FUNCTION public.bewerte_coaching_mitfahrt(
  p_auftrag_id uuid,
  p_entscheidung text,
  p_notiz text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.bewerte_coaching_mitfahrt(p_auftrag_id, p_entscheidung, p_notiz);
$$;
