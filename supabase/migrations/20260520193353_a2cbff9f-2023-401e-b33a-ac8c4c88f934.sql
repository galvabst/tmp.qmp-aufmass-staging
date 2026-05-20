
-- =========================================================
-- 1. admin_book_coaching_ride
-- =========================================================
CREATE OR REPLACE FUNCTION thermocheck.admin_book_coaching_ride(
  p_trainee_profile_id UUID,
  p_auftrag_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_auftrag thermocheck.thermocheck_auftraege%ROWTYPE;
  v_trainer_vorname TEXT;
  v_trainer_nachname TEXT;
  v_erstes_datum DATE;
  v_existing_auftrag_id UUID;
BEGIN
  IF NOT thermocheck.is_innendienst() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unzureichende Berechtigung');
  END IF;

  IF p_trainee_profile_id IS NULL OR p_auftrag_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trainee und Auftrag sind Pflicht');
  END IF;

  -- Lock auftrag
  SELECT * INTO v_auftrag
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auftrag nicht gefunden');
  END IF;

  IF v_auftrag.zugewiesener_techniker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Trainer zugewiesen');
  END IF;

  -- Trainer must be is_trainer (zugewiesener_techniker_id refs onboarding.id)
  IF NOT EXISTS (
    SELECT 1 FROM thermocheck.contractor_onboarding
    WHERE id = v_auftrag.zugewiesener_techniker_id AND is_trainer = TRUE
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zugewiesener Techniker ist kein Trainer');
  END IF;

  -- Auftrag darf nicht durch anderen Trainee belegt sein
  IF v_auftrag.coaching_gebucht_von IS NOT NULL AND v_auftrag.coaching_gebucht_von <> p_trainee_profile_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dieser Coaching-Termin ist bereits an einen anderen Trainee vergeben');
  END IF;

  -- Falls Trainee anderswo bereits eine offene (ausstehende) Buchung hat → freigeben (Admin-Override)
  SELECT id INTO v_existing_auftrag_id
  FROM thermocheck.thermocheck_auftraege
  WHERE coaching_gebucht_von = p_trainee_profile_id
    AND coaching_bewertung = 'ausstehend'
    AND id <> p_auftrag_id
  LIMIT 1;

  IF v_existing_auftrag_id IS NOT NULL THEN
    UPDATE thermocheck.thermocheck_auftraege
    SET coaching_gebucht_von = NULL,
        coaching_gebucht_am = NULL
    WHERE id = v_existing_auftrag_id;
  END IF;

  -- Buchen auf neuen Trainee
  UPDATE thermocheck.thermocheck_auftraege
  SET coaching_gebucht_von = p_trainee_profile_id,
      coaching_gebucht_am = now(),
      coaching_bewertung = 'ausstehend',
      coaching_bewertung_am = NULL,
      coaching_bewertung_von = NULL
  WHERE id = p_auftrag_id;

  -- Trainer-Name laden (über onboarding → profile)
  SELECT p.vorname, p.nachname INTO v_trainer_vorname, v_trainer_nachname
  FROM thermocheck.contractor_onboarding co
  JOIN public.profiles p ON p.id = co.profile_id
  WHERE co.id = v_auftrag.zugewiesener_techniker_id;

  -- Erstes Datum aus Terminvorschlägen
  SELECT datum INTO v_erstes_datum
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE thermocheck_auftrag_id = p_auftrag_id
  ORDER BY sortierung ASC
  LIMIT 1;

  -- Onboarding-Record des Trainees aktualisieren
  UPDATE thermocheck.contractor_onboarding
  SET gebuchter_coaching_termin = v_erstes_datum,
      gebuchter_coach_name = TRIM(COALESCE(v_trainer_vorname, '') || ' ' || COALESCE(v_trainer_nachname, ''))
  WHERE profile_id = p_trainee_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'coach_name', TRIM(COALESCE(v_trainer_vorname, '') || ' ' || COALESCE(v_trainer_nachname, '')),
    'datum', v_erstes_datum,
    'overridden_auftrag_id', v_existing_auftrag_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_book_coaching_ride(
  p_trainee_profile_id UUID,
  p_auftrag_id UUID
) RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.admin_book_coaching_ride(p_trainee_profile_id, p_auftrag_id);
$$;

REVOKE ALL ON FUNCTION public.admin_book_coaching_ride(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_book_coaching_ride(UUID, UUID) TO authenticated;

-- =========================================================
-- 2. admin_set_onboarding_step
-- =========================================================
CREATE OR REPLACE FUNCTION thermocheck.admin_set_onboarding_step(
  p_profile_id UUID,
  p_target_step TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_all_steps TEXT[] := ARRAY['profil','dokumente','bestellungen','equipment','akademie','coaching','nachweise'];
  v_completed TEXT[];
  v_idx INT;
BEGIN
  IF NOT thermocheck.is_innendienst() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unzureichende Berechtigung');
  END IF;

  IF p_profile_id IS NULL OR p_target_step IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_id und target_step sind Pflicht');
  END IF;

  IF p_target_step <> 'einsatzbereit' AND NOT (p_target_step = ANY(v_all_steps)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ungültiger Step: ' || p_target_step);
  END IF;

  IF p_target_step = 'einsatzbereit' THEN
    v_completed := v_all_steps;
    UPDATE thermocheck.contractor_onboarding
    SET current_step = 'nachweise',
        completed_steps = v_completed,
        onboarding_status = 'ready',
        updated_at = now()
    WHERE profile_id = p_profile_id;
  ELSE
    v_idx := array_position(v_all_steps, p_target_step);
    IF v_idx IS NULL OR v_idx = 1 THEN
      v_completed := ARRAY[]::TEXT[];
    ELSE
      v_completed := v_all_steps[1:v_idx-1];
    END IF;

    UPDATE thermocheck.contractor_onboarding
    SET current_step = p_target_step,
        completed_steps = v_completed,
        onboarding_status = CASE
          WHEN onboarding_status = 'ready' THEN 'in_progress'::thermocheck.contractor_onboarding_status_enum
          ELSE onboarding_status
        END,
        updated_at = now()
    WHERE profile_id = p_profile_id;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding nicht gefunden');
  END IF;

  RETURN jsonb_build_object('success', true, 'current_step', p_target_step, 'completed_steps', to_jsonb(v_completed));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_onboarding_step(
  p_profile_id UUID,
  p_target_step TEXT
) RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.admin_set_onboarding_step(p_profile_id, p_target_step);
$$;

REVOKE ALL ON FUNCTION public.admin_set_onboarding_step(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_onboarding_step(UUID, TEXT) TO authenticated;

-- =========================================================
-- 3. admin_reject_praxistest
-- =========================================================
CREATE OR REPLACE FUNCTION thermocheck.admin_reject_praxistest(
  p_onboarding_id UUID,
  p_notiz TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  IF NOT thermocheck.is_innendienst() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unzureichende Berechtigung');
  END IF;

  IF p_onboarding_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'onboarding_id ist Pflicht');
  END IF;

  UPDATE thermocheck.contractor_onboarding
  SET praxistest_freigabe = FALSE,
      praxistest_freigabe_am = NULL,
      praxistest_freigabe_von = NULL,
      praxistest_eingereicht_am = NULL,
      praxistest_scan_url = NULL,
      praxistest_video_url = NULL,
      updated_at = now()
  WHERE id = p_onboarding_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding nicht gefunden');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Praxistest zurückgewiesen — Techniker muss neu einreichen', 'notiz', p_notiz);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_praxistest(
  p_onboarding_id UUID,
  p_notiz TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.admin_reject_praxistest(p_onboarding_id, p_notiz);
$$;

REVOKE ALL ON FUNCTION public.admin_reject_praxistest(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_praxistest(UUID, TEXT) TO authenticated;
