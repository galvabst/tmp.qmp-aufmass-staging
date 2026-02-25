
-- Die Spalten wurden bereits in der vorigen (fehlgeschlagenen aber teils ausgeführten) Migration angelegt.
-- Sicherheitshalber nochmal IF NOT EXISTS:
ALTER TABLE thermocheck.thermocheck_auftraege
  ADD COLUMN IF NOT EXISTS buchung_bestaetigt_am timestamptz,
  ADD COLUMN IF NOT EXISTS vortag_bestaetigt_am  timestamptz;

-- View muss gedroppt und neu erstellt werden, da neue Spalten hinzukommen
DROP VIEW IF EXISTS thermocheck.v_thermocheck_auftraege;

CREATE VIEW thermocheck.v_thermocheck_auftraege AS
SELECT
    ta.id,
    ta.lead_id,
    ta.pipeline_status,
    ta.zugewiesener_techniker_id,
    ta.info_vertrieb_thc_aufmass,
    ta.info_vertrieb_pv_aufmass,
    ta.info_vertrieb_sonstiges,
    ta.storno_datum,
    ta.widerrufsbelehrung_url,
    ta.rechnungsnummer,
    ta.rechnungsdatum,
    ta.abgerechnet,
    ta.notizen,
    ta.created_at,
    ta.updated_at,
    ta.created_by,
    ta.quadratmeter,
    ta.wohneinheiten,
    ta.wc1_durchgefuehrt_am,
    ta.wc1_durchgefuehrt_von,
    ta.fussbodenheizung,
    l.lead_name,
    l.kunde_vorname,
    l.kunde_nachname,
    l.kunde_email,
    l.kunde_telefon,
    l.kunde_strasse,
    l.kunde_hausnummer,
    l.kunde_plz,
    l.kunde_ort,
    l.signier_datum_thc,
    l.kunde_anrede,
    l.referenz_nummer,
    l.mitarbeiter_id AS vertriebler_mitarbeiter_id,
    ta.buchung_bestaetigt_am,
    ta.vortag_bestaetigt_am
FROM thermocheck.thermocheck_auftraege ta
JOIN leads l ON l.id = ta.lead_id;

-- RPC: confirm_thermocheck_booking (thermocheck schema)
CREATE OR REPLACE FUNCTION thermocheck.confirm_thermocheck_booking(p_auftrag_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'thermocheck'
AS $$
DECLARE
  v_contractor_id uuid;
  v_assigned_id uuid;
  v_pipeline text;
BEGIN
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid()
  LIMIT 1;

  IF v_contractor_id IS NULL THEN
    RAISE EXCEPTION 'Kein Contractor-Profil gefunden';
  END IF;

  SELECT zugewiesener_techniker_id, pipeline_status
  INTO v_assigned_id, v_pipeline
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF v_assigned_id IS NULL THEN
    RAISE EXCEPTION 'Auftrag nicht gefunden';
  END IF;

  IF v_assigned_id != v_contractor_id THEN
    RAISE EXCEPTION 'Nicht berechtigt';
  END IF;

  IF v_pipeline != 'wc1_durchfuehren' THEN
    RAISE EXCEPTION 'Auftrag hat falschen Status: %', v_pipeline;
  END IF;

  UPDATE thermocheck.thermocheck_auftraege
  SET buchung_bestaetigt_am = now()
  WHERE id = p_auftrag_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: confirm_thermocheck_vortag (thermocheck schema)
CREATE OR REPLACE FUNCTION thermocheck.confirm_thermocheck_vortag(p_auftrag_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'thermocheck'
AS $$
DECLARE
  v_contractor_id uuid;
  v_assigned_id uuid;
  v_pipeline text;
BEGIN
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid()
  LIMIT 1;

  IF v_contractor_id IS NULL THEN
    RAISE EXCEPTION 'Kein Contractor-Profil gefunden';
  END IF;

  SELECT zugewiesener_techniker_id, pipeline_status
  INTO v_assigned_id, v_pipeline
  FROM thermocheck.thermocheck_auftraege
  WHERE id = p_auftrag_id
  FOR UPDATE;

  IF v_assigned_id IS NULL THEN
    RAISE EXCEPTION 'Auftrag nicht gefunden';
  END IF;

  IF v_assigned_id != v_contractor_id THEN
    RAISE EXCEPTION 'Nicht berechtigt';
  END IF;

  IF v_pipeline != 'wc1_durchfuehren' THEN
    RAISE EXCEPTION 'Auftrag hat falschen Status: %', v_pipeline;
  END IF;

  UPDATE thermocheck.thermocheck_auftraege
  SET vortag_bestaetigt_am = now()
  WHERE id = p_auftrag_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Public Wrapper: confirm_thermocheck_booking
CREATE OR REPLACE FUNCTION public.confirm_thermocheck_booking(p_auftrag_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN thermocheck.confirm_thermocheck_booking(p_auftrag_id);
END;
$$;

-- Public Wrapper: confirm_thermocheck_vortag
CREATE OR REPLACE FUNCTION public.confirm_thermocheck_vortag(p_auftrag_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN thermocheck.confirm_thermocheck_vortag(p_auftrag_id);
END;
$$;
