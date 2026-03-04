
-- 1. Add new enum values
ALTER TYPE thermocheck.coaching_bewertung_enum ADD VALUE IF NOT EXISTS 'abgesagt';
ALTER TYPE thermocheck.coaching_bewertung_enum ADD VALUE IF NOT EXISTS 'no_show';

-- 2. Add bewertung columns to thermocheck_auftraege (per-order history)
ALTER TABLE thermocheck.thermocheck_auftraege
  ADD COLUMN IF NOT EXISTS coaching_bewertung thermocheck.coaching_bewertung_enum DEFAULT 'ausstehend',
  ADD COLUMN IF NOT EXISTS coaching_bewertung_am timestamptz,
  ADD COLUMN IF NOT EXISTS coaching_bewertung_von uuid;

-- 3. Set existing booked orders to 'ausstehend' explicitly
UPDATE thermocheck.thermocheck_auftraege
SET coaching_bewertung = 'ausstehend'
WHERE coaching_gebucht_von IS NOT NULL AND coaching_bewertung IS NULL;

-- 4. Replace thermocheck RPC with 4-outcome version
CREATE OR REPLACE FUNCTION thermocheck.bewerte_coaching_mitfahrt(
  p_auftrag_id uuid,
  p_entscheidung text,
  p_notiz text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_trainer_onb_id uuid;
  v_trainee_profile_id uuid;
  v_caller_profile_id uuid;
BEGIN
  v_caller_profile_id := auth.uid();
  IF v_caller_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicht authentifiziert');
  END IF;

  -- Validate entscheidung (4 options now)
  IF p_entscheidung NOT IN ('bestanden', 'nicht_bestanden', 'abgesagt', 'no_show') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ungültige Entscheidung. Erlaubt: bestanden, nicht_bestanden, abgesagt, no_show');
  END IF;

  -- Get trainer's onboarding id
  SELECT id INTO v_trainer_onb_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = v_caller_profile_id AND is_trainer = true;

  IF v_trainer_onb_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Du bist kein Trainer');
  END IF;

  -- Verify auftrag belongs to trainer and has a booking
  SELECT coaching_gebucht_von INTO v_trainee_profile_id
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
    AND zugewiesener_techniker_id = v_trainer_onb_id
    AND coaching_gebucht_von IS NOT NULL
  FOR UPDATE;

  IF v_trainee_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auftrag nicht gefunden oder keine Buchung vorhanden');
  END IF;

  -- Check not already evaluated
  IF (SELECT coaching_bewertung FROM thermocheck.thermocheck_auftraege WHERE id = p_auftrag_id) NOT IN ('ausstehend') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dieser Auftrag wurde bereits bewertet');
  END IF;

  -- Write evaluation to the ORDER (history preserved)
  UPDATE thermocheck.thermocheck_auftraege
  SET coaching_bewertung = p_entscheidung::thermocheck.coaching_bewertung_enum,
      coaching_bewertung_am = now(),
      coaching_bewertung_von = v_caller_profile_id
  WHERE id = p_auftrag_id;

  IF p_entscheidung = 'bestanden' THEN
    -- Mark trainee as passed on onboarding
    UPDATE thermocheck.contractor_onboarding
    SET coaching_bewertung = 'bestanden',
        coaching_bewertung_am = now(),
        trainer_freigabe = true,
        trainer_freigabe_am = now(),
        trainer_freigabe_von = v_caller_profile_id
    WHERE profile_id = v_trainee_profile_id;

    RETURN jsonb_build_object('success', true, 'status', 'bestanden', 'message', 'Trainee als bestanden markiert und freigeschaltet');

  ELSE
    -- nicht_bestanden / abgesagt / no_show: reset onboarding step
    -- Do NOT null coaching_gebucht_von (preserve history on order)
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
$$;

-- 5. Replace public wrapper
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
