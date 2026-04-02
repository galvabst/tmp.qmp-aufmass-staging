
CREATE OR REPLACE FUNCTION public.mark_rechnung_gestellt(p_auftrag_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contractor_id uuid;
  v_onboarding_id uuid;
  v_existing_status text;
BEGIN
  -- Get the caller's contractor onboarding ID
  SELECT id, profile_id INTO v_onboarding_id, v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_onboarding_id IS NULL THEN
    RAISE EXCEPTION 'Kein Contractor-Profil gefunden';
  END IF;

  -- Verify the caller is the assigned technician for this order
  IF NOT EXISTS (
    SELECT 1 FROM thermocheck.v_thermocheck_auftraege
    WHERE id = p_auftrag_id
      AND zugewiesener_techniker_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Nicht berechtigt: Auftrag gehört nicht zu Ihnen';
  END IF;

  -- Check if record already exists
  SELECT status INTO v_existing_status
  FROM thermocheck.contractor_abrechnungen
  WHERE thermocheck_auftrag_id = p_auftrag_id;

  IF v_existing_status IS NOT NULL AND v_existing_status <> 'offen' THEN
    RAISE EXCEPTION 'Status ist bereits "%", kann nicht mehr auf "rechnung_eingegangen" gesetzt werden', v_existing_status;
  END IF;

  -- UPSERT
  INSERT INTO thermocheck.contractor_abrechnungen (
    contractor_id, thermocheck_auftrag_id, status, rechnung_eingegangen_am
  ) VALUES (
    v_onboarding_id, p_auftrag_id, 'rechnung_eingegangen'::thermocheck.abrechnung_status, now()
  )
  ON CONFLICT (thermocheck_auftrag_id)
  DO UPDATE SET
    status = 'rechnung_eingegangen'::thermocheck.abrechnung_status,
    rechnung_eingegangen_am = now(),
    aktualisiert_am = now();
END;
$$;
