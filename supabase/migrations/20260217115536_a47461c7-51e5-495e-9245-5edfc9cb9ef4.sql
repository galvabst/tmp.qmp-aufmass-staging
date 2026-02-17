
-- 1a) Trainer-Video und Bio auf contractor_onboarding
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN IF NOT EXISTS trainer_video_url TEXT,
ADD COLUMN IF NOT EXISTS trainer_bio TEXT;

-- 1b) Coaching-Buchung auf thermocheck_auftraege
ALTER TABLE thermocheck.thermocheck_auftraege
ADD COLUMN IF NOT EXISTS coaching_gebucht_von UUID,
ADD COLUMN IF NOT EXISTS coaching_gebucht_am TIMESTAMPTZ;

-- 1c) Atomare RPC: book_coaching_ride
CREATE OR REPLACE FUNCTION thermocheck.book_coaching_ride(p_auftrag_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_auftrag thermocheck.thermocheck_auftraege%ROWTYPE;
  v_trainer_vorname TEXT;
  v_trainer_nachname TEXT;
  v_erstes_datum DATE;
  v_caller_id UUID := auth.uid();
BEGIN
  -- 1. Lock + prüfen ob Auftrag noch frei ist
  SELECT * INTO v_auftrag
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auftrag nicht gefunden');
  END IF;

  IF v_auftrag.coaching_gebucht_von IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dieser Coaching-Termin ist bereits vergeben');
  END IF;

  -- 2. Prüfe ob Trainer zugewiesen und is_trainer
  IF v_auftrag.zugewiesener_techniker_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kein Trainer zugewiesen');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM thermocheck.contractor_onboarding
    WHERE profile_id = v_auftrag.zugewiesener_techniker_id AND is_trainer = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Zugewiesener Techniker ist kein Trainer');
  END IF;

  -- 3. Prüfe ob Onboarder nicht bereits eine Buchung hat
  IF EXISTS (
    SELECT 1 FROM thermocheck.thermocheck_auftraege
    WHERE coaching_gebucht_von = v_caller_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Du hast bereits einen Coaching-Termin gebucht');
  END IF;

  -- 4. Buchen
  UPDATE thermocheck.thermocheck_auftraege
  SET coaching_gebucht_von = v_caller_id,
      coaching_gebucht_am = now()
  WHERE id = p_auftrag_id;

  -- 5. Trainer-Name laden
  SELECT vorname, nachname INTO v_trainer_vorname, v_trainer_nachname
  FROM public.profiles
  WHERE id = v_auftrag.zugewiesener_techniker_id;

  -- 6. Erstes Datum laden
  SELECT datum INTO v_erstes_datum
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE thermocheck_auftrag_id = p_auftrag_id
  ORDER BY sortierung ASC
  LIMIT 1;

  -- 7. Onboarding-Record des Buchenden aktualisieren
  UPDATE thermocheck.contractor_onboarding
  SET gebuchter_coaching_termin = v_erstes_datum,
      gebuchter_coach_name = COALESCE(v_trainer_vorname, '') || ' ' || COALESCE(v_trainer_nachname, '')
  WHERE profile_id = v_caller_id;

  RETURN jsonb_build_object(
    'success', true,
    'coach_name', COALESCE(v_trainer_vorname, '') || ' ' || COALESCE(v_trainer_nachname, ''),
    'datum', v_erstes_datum
  );
END;
$$;
