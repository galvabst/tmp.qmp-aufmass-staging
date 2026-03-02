
-- =============================================
-- GRUNDPREIS 3-STUFEN-MODELL
-- =============================================

-- =============================================
-- STUFE 1: KATALOG-TABELLE
-- =============================================
CREATE TABLE thermocheck.auftragstyp_preise (
  auftragstyp text PRIMARY KEY,
  default_betrag_netto numeric(10,2) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE thermocheck.auftragstyp_preise ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alle authentifizierten User koennen Katalog-Preise lesen"
  ON thermocheck.auftragstyp_preise FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Nur Admins koennen Katalog-Preise aendern"
  ON thermocheck.auftragstyp_preise FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed data
INSERT INTO thermocheck.auftragstyp_preise (auftragstyp, default_betrag_netto)
VALUES
  ('thermocheck', 140.00),
  ('einweisung', 50.00),
  ('pv', 100.00);

-- =============================================
-- STUFE 2: CONTRACTOR-GRUNDPREISE
-- =============================================
CREATE TABLE thermocheck.contractor_grundpreise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  auftragstyp text NOT NULL,
  betrag_netto numeric(10,2) NOT NULL,
  erstellt_am timestamptz NOT NULL DEFAULT now(),
  aktualisiert_am timestamptz NOT NULL DEFAULT now(),
  aktualisiert_von uuid REFERENCES auth.users(id),
  UNIQUE(contractor_id, auftragstyp)
);

ALTER TABLE thermocheck.contractor_grundpreise ENABLE ROW LEVEL SECURITY;

-- SELECT: eigene oder Admin
CREATE POLICY "Contractor sieht eigene Grundpreise"
  ON thermocheck.contractor_grundpreise FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid()
    )
    OR public.is_admin()
  );

-- INSERT/UPDATE/DELETE: nur Admin
CREATE POLICY "Nur Admins koennen Grundpreise verwalten"
  ON thermocheck.contractor_grundpreise FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- updated_at trigger
CREATE TRIGGER update_contractor_grundpreise_updated_at
  BEFORE UPDATE ON thermocheck.contractor_grundpreise
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.update_updated_at_column();

-- =============================================
-- STUFE 3: NEUE SPALTEN AUF AUFTRAEGE
-- =============================================
ALTER TABLE thermocheck.thermocheck_auftraege
  ADD COLUMN IF NOT EXISTS auftragstyp text NOT NULL DEFAULT 'thermocheck',
  ADD COLUMN IF NOT EXISTS vereinbarter_preis numeric(10,2);

-- =============================================
-- VIEW NEU ERSTELLEN (alle bestehenden + neue Spalten)
-- =============================================
CREATE OR REPLACE VIEW thermocheck.v_thermocheck_auftraege AS
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
  ta.vortag_bestaetigt_am,
  ta.vor_ort_checkin_at,
  ta.vor_ort_checkout_at,
  ta.nachbearbeitung_checkin_at,
  ta.nachbearbeitung_checkout_at,
  ta.eingereicht_am,
  ta.eingereicht_von,
  -- NEW columns
  ta.auftragstyp,
  ta.vereinbarter_preis
FROM thermocheck.thermocheck_auftraege ta
JOIN leads l ON l.id = ta.lead_id;

-- =============================================
-- TRIGGER: Auto-copy Katalog-Preise bei neuem Contractor
-- =============================================
CREATE OR REPLACE FUNCTION thermocheck.trg_copy_katalog_preise()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
BEGIN
  INSERT INTO thermocheck.contractor_grundpreise (contractor_id, auftragstyp, betrag_netto)
  SELECT NEW.id, ap.auftragstyp, ap.default_betrag_netto
  FROM thermocheck.auftragstyp_preise ap;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_copy_katalog_preise
  AFTER INSERT ON thermocheck.contractor_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.trg_copy_katalog_preise();

-- =============================================
-- ACCEPT_POOL_ORDER: Preis-Snapshot einbauen
-- =============================================
CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order(p_termin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_auftrag_id UUID;
  v_contractor_id UUID;
  v_current_techniker UUID;
  v_pipeline_status TEXT;
  v_auftragstyp TEXT;
  v_preis NUMERIC(10,2);
BEGIN
  -- contractor_onboarding-ID fuer aktuellen User ermitteln
  SELECT id INTO v_contractor_id
  FROM thermocheck.contractor_onboarding
  WHERE profile_id = auth.uid();

  IF v_contractor_id IS NULL THEN
    RETURN json_build_object('success', false, 'error',
      'Kein Contractor-Profil gefunden');
  END IF;

  -- Termin -> Auftrag-ID
  SELECT thermocheck_auftrag_id INTO v_auftrag_id
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE id = p_termin_id;

  IF v_auftrag_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Termin nicht gefunden');
  END IF;

  -- Auftrag sperren + validieren
  SELECT zugewiesener_techniker_id, pipeline_status, auftragstyp
  INTO v_current_techniker, v_pipeline_status, v_auftragstyp
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

  -- Preis aus contractor_grundpreise lesen (Stufe 2 → Stufe 3 Snapshot)
  SELECT betrag_netto INTO v_preis
  FROM thermocheck.contractor_grundpreise
  WHERE contractor_id = v_contractor_id
    AND auftragstyp = COALESCE(v_auftragstyp, 'thermocheck');

  IF v_preis IS NULL THEN
    RETURN json_build_object('success', false, 'error',
      'Kein Grundpreis fuer Auftragstyp ' || COALESCE(v_auftragstyp, 'thermocheck') || ' hinterlegt');
  END IF;

  -- 1. Auftrag zuweisen + pipeline_status + Preis-Snapshot
  UPDATE thermocheck.thermocheck_auftraege
  SET zugewiesener_techniker_id = v_contractor_id,
      pipeline_status = 'wc1_durchfuehren',
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

-- Public wrapper (already exists, recreate to ensure it delegates correctly)
CREATE OR REPLACE FUNCTION public.accept_pool_order(p_termin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.accept_pool_order(p_termin_id);
END;
$$;

-- =============================================
-- RPCs: Grundpreise lesen/schreiben
-- =============================================

-- GET contractor grundpreise
CREATE OR REPLACE FUNCTION thermocheck.get_contractor_grundpreise(p_contractor_id uuid)
RETURNS TABLE(auftragstyp text, betrag_netto numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_is_own BOOLEAN;
BEGIN
  -- Check: eigener Contractor oder Admin
  SELECT EXISTS(
    SELECT 1 FROM thermocheck.contractor_onboarding
    WHERE id = p_contractor_id AND profile_id = auth.uid()
  ) INTO v_is_own;

  IF NOT v_is_own AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Zugriff verweigert';
  END IF;

  RETURN QUERY
  SELECT cg.auftragstyp, cg.betrag_netto
  FROM thermocheck.contractor_grundpreise cg
  WHERE cg.contractor_id = p_contractor_id
  ORDER BY cg.auftragstyp;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contractor_grundpreise(p_contractor_id uuid)
RETURNS TABLE(auftragstyp text, betrag_netto numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM thermocheck.get_contractor_grundpreise(p_contractor_id);
END;
$$;

-- UPDATE contractor grundpreis (Admin only, UPSERT)
CREATE OR REPLACE FUNCTION thermocheck.update_contractor_grundpreis(
  p_contractor_id uuid,
  p_auftragstyp text,
  p_betrag numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Nur Admins koennen Grundpreise aendern';
  END IF;

  INSERT INTO thermocheck.contractor_grundpreise (contractor_id, auftragstyp, betrag_netto, aktualisiert_von)
  VALUES (p_contractor_id, p_auftragstyp, p_betrag, auth.uid())
  ON CONFLICT (contractor_id, auftragstyp)
  DO UPDATE SET
    betrag_netto = EXCLUDED.betrag_netto,
    aktualisiert_von = EXCLUDED.aktualisiert_von,
    aktualisiert_am = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contractor_grundpreis(
  p_contractor_id uuid,
  p_auftragstyp text,
  p_betrag numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM thermocheck.update_contractor_grundpreis(p_contractor_id, p_auftragstyp, p_betrag);
END;
$$;

-- GET Katalog-Preise
CREATE OR REPLACE FUNCTION thermocheck.get_auftragstyp_preise()
RETURNS TABLE(auftragstyp text, default_betrag_netto numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
BEGIN
  RETURN QUERY
  SELECT ap.auftragstyp, ap.default_betrag_netto
  FROM thermocheck.auftragstyp_preise ap
  ORDER BY ap.auftragstyp;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auftragstyp_preise()
RETURNS TABLE(auftragstyp text, default_betrag_netto numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM thermocheck.get_auftragstyp_preise();
END;
$$;

-- UPDATE Katalog-Preis (Admin only)
CREATE OR REPLACE FUNCTION thermocheck.update_auftragstyp_preis(
  p_auftragstyp text,
  p_betrag numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Nur Admins koennen Katalog-Preise aendern';
  END IF;

  UPDATE thermocheck.auftragstyp_preise
  SET default_betrag_netto = p_betrag,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE auftragstyp = p_auftragstyp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auftragstyp % nicht gefunden', p_auftragstyp;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_auftragstyp_preis(
  p_auftragstyp text,
  p_betrag numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM thermocheck.update_auftragstyp_preis(p_auftragstyp, p_betrag);
END;
$$;
