
-- =============================================
-- 1. Coaching-Slots Tabelle
-- =============================================
CREATE TABLE thermocheck.contractor_coaching_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  datum DATE NOT NULL,
  region TEXT NOT NULL,
  preis NUMERIC(10,2) NOT NULL DEFAULT 149.00,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
  gebuchter_onboarder_id UUID REFERENCES public.profiles(id),
  gebucht_am TIMESTAMPTZ,
  notizen TEXT,
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktualisiert_am TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_coaching_slots_status ON thermocheck.contractor_coaching_slots(status);
CREATE INDEX idx_coaching_slots_trainer ON thermocheck.contractor_coaching_slots(trainer_profile_id);

-- RLS aktivieren
ALTER TABLE thermocheck.contractor_coaching_slots ENABLE ROW LEVEL SECURITY;

-- SELECT: Alle authentifizierten User
CREATE POLICY "Authentifizierte User können Coaching-Slots sehen"
  ON thermocheck.contractor_coaching_slots
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- INSERT: Nur Manager/Admin/Superadmin (über is_admin Helper)
CREATE POLICY "Admins können Coaching-Slots erstellen"
  ON thermocheck.contractor_coaching_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: Admins können alles ändern
CREATE POLICY "Admins können Coaching-Slots ändern"
  ON thermocheck.contractor_coaching_slots
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- DELETE: Nur Admins
CREATE POLICY "Admins können Coaching-Slots löschen"
  ON thermocheck.contractor_coaching_slots
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================
-- 2. RPC: update_contractor_akademie_test_bestanden
-- =============================================
CREATE OR REPLACE FUNCTION thermocheck.update_contractor_akademie_test_bestanden()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET akademie_test_bestanden = true,
      aktualisiert_am = now()
  WHERE profile_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No onboarding record found for current user';
  END IF;
END;
$$;

-- =============================================
-- 3. RPC: book_coaching_slot
-- =============================================
CREATE OR REPLACE FUNCTION thermocheck.book_coaching_slot(p_slot_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_slot thermocheck.contractor_coaching_slots%ROWTYPE;
  v_trainer_name TEXT;
  v_trainer_datum DATE;
BEGIN
  -- Slot atomar sperren + prüfen
  SELECT * INTO v_slot
  FROM thermocheck.contractor_coaching_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Slot nicht gefunden');
  END IF;

  IF v_slot.status != 'available' OR v_slot.gebuchter_onboarder_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Slot ist nicht mehr verfügbar');
  END IF;

  -- Trainer-Name aus profiles laden
  SELECT COALESCE(vorname || ' ' || nachname, 'Trainer')
  INTO v_trainer_name
  FROM public.profiles
  WHERE id = v_slot.trainer_profile_id;

  v_trainer_datum := v_slot.datum;

  -- Slot als gebucht markieren
  UPDATE thermocheck.contractor_coaching_slots
  SET gebuchter_onboarder_id = auth.uid(),
      status = 'booked',
      gebucht_am = now(),
      aktualisiert_am = now()
  WHERE id = p_slot_id;

  -- Onboarding-Record aktualisieren
  UPDATE thermocheck.contractor_onboarding
  SET gebuchter_coaching_termin = v_trainer_datum,
      gebuchter_coach_name = v_trainer_name,
      aktualisiert_am = now()
  WHERE profile_id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'coach_name', v_trainer_name,
    'datum', v_trainer_datum::text
  );
END;
$$;
