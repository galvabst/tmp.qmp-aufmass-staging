
-- 1. Add einweisung_freigabe column
ALTER TABLE thermocheck.contractor_onboarding 
  ADD COLUMN einweisung_freigabe BOOLEAN NOT NULL DEFAULT false;

-- 2. Guard in accept_pool_order: check einweisung_freigabe before accepting einweisung orders
CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order(p_termin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_auftrag_id UUID;
  v_contractor_id UUID;
  v_current_techniker UUID;
  v_pipeline_status TEXT;
  v_auftragstyp TEXT;
  v_preis NUMERIC(10,2);
  v_wc1_done TIMESTAMPTZ;
  v_termin_datum DATE;
  v_new_status TEXT;
  v_einweisung_freigabe BOOLEAN;
BEGIN
  -- contractor_onboarding-ID fuer aktuellen User ermitteln
  SELECT id, einweisung_freigabe INTO v_contractor_id, v_einweisung_freigabe
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN json_build_object('success', false, 'error',
      'Kein Contractor-Profil gefunden');
  END IF;

  -- Termin -> Auftrag-ID + Termin-Datum
  SELECT thermocheck_auftrag_id, datum INTO v_auftrag_id, v_termin_datum
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE id = p_termin_id;

  IF v_auftrag_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Termin nicht gefunden');
  END IF;

  -- Auftrag sperren + validieren
  SELECT zugewiesener_techniker_id, pipeline_status, auftragstyp, wc1_durchgefuehrt_am
  INTO v_current_techniker, v_pipeline_status, v_auftragstyp, v_wc1_done
  FROM thermocheck.thermocheck_auftraege
  WHERE id = v_auftrag_id
  FOR UPDATE;

  IF v_pipeline_status != 'termin_abwarten' THEN
    RETURN json_build_object('success', false, 'error',
      'Auftrag ist nicht mehr im Pool');
  END IF;

  IF v_current_techniker IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error',
      'Auftrag bereits vergeben');
  END IF;

  -- Guard: Einweisung nur mit Freigabe
  IF COALESCE(v_auftragstyp, 'thermocheck') = 'einweisung' AND NOT COALESCE(v_einweisung_freigabe, false) THEN
    RETURN json_build_object('success', false, 'error',
      'Nicht für Einweisungen freigegeben');
  END IF;

  -- Preis aus contractor_grundpreise lesen
  SELECT betrag_netto INTO v_preis
  FROM thermocheck.contractor_grundpreise
  WHERE contractor_id = v_contractor_id
    AND auftragstyp = COALESCE(v_auftragstyp, 'thermocheck');

  IF v_preis IS NULL THEN
    RETURN json_build_object('success', false, 'error',
      'Kein Grundpreis fuer Auftragstyp ' || COALESCE(v_auftragstyp, 'thermocheck') || ' hinterlegt');
  END IF;

  -- Determine correct status based on WC1 completion
  IF v_wc1_done IS NOT NULL THEN
    IF v_termin_datum <= CURRENT_DATE THEN
      v_new_status := 'vot_formular_abfragen';
    ELSE
      v_new_status := 'termin_bestaetigt';
    END IF;
  ELSE
    v_new_status := 'wc1_durchfuehren';
  END IF;

  -- 1. Auftrag zuweisen + pipeline_status + Preis-Snapshot
  UPDATE thermocheck.thermocheck_auftraege
  SET zugewiesener_techniker_id = v_contractor_id,
      pipeline_status = v_new_status,
      vereinbarter_preis = v_preis
  WHERE id = v_auftrag_id;

  -- 2. Angenommenen Termin markieren
  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'angenommen',
      angenommen_von = auth.uid(),
      angenommen_am = now()
  WHERE id = p_termin_id;

  -- 3. Konkurrierende Termine als abgelehnt markieren
  UPDATE thermocheck.thermocheck_terminvorschlaege
  SET status = 'abgelehnt'
  WHERE thermocheck_auftrag_id = v_auftrag_id
    AND id != p_termin_id
    AND status = 'vorgeschlagen';

  RETURN json_build_object(
    'success', true,
    'auftrag_id', v_auftrag_id,
    'contractor_id', v_contractor_id,
    'vereinbarter_preis', v_preis
  );
END;
$$;

-- 3. Admin RPC to toggle einweisung_freigabe
CREATE OR REPLACE FUNCTION thermocheck.update_contractor_einweisung_freigabe(
  p_contractor_id UUID,
  p_freigabe BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Nur Admins dürfen Einweisungs-Freigaben ändern';
  END IF;

  UPDATE thermocheck.contractor_onboarding
  SET einweisung_freigabe = p_freigabe
  WHERE id = p_contractor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contractor nicht gefunden';
  END IF;
END;
$$;

-- 4. Public wrapper for the admin RPC
CREATE OR REPLACE FUNCTION public.update_contractor_einweisung_freigabe(
  p_contractor_id UUID,
  p_freigabe BOOLEAN
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thermocheck.update_contractor_einweisung_freigabe(p_contractor_id, p_freigabe);
$$;
