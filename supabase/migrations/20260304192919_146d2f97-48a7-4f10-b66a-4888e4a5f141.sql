
-- 1. Bonus-Typ Enum
CREATE TYPE thermocheck.contractor_bonus_typ_enum AS ENUM (
  'lead_conversion',
  'bewertung_google',
  'bewertung_trustpilot'
);

-- 2. Bonus-Status Enum
CREATE TYPE thermocheck.contractor_bonus_status_enum AS ENUM (
  'ausstehend',
  'freigegeben',
  'ausgezahlt',
  'abgelehnt'
);

-- 3. Add bewertung_nachweis to vot_bild_kategorie_enum
ALTER TYPE thermocheck.vot_bild_kategorie_enum ADD VALUE IF NOT EXISTS 'bewertung_nachweis';

-- 4. Contractor Boni Tabelle
CREATE TABLE thermocheck.contractor_boni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_onboarding_id uuid NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  thermocheck_auftrag_id uuid NOT NULL REFERENCES thermocheck.thermocheck_auftraege(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL,
  bonus_typ thermocheck.contractor_bonus_typ_enum NOT NULL,
  betrag numeric NOT NULL,
  nachweis_storage_path text,
  status thermocheck.contractor_bonus_status_enum NOT NULL DEFAULT 'ausstehend',
  freigegeben_von uuid,
  freigegeben_am timestamptz,
  auszahlungsmonat date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(thermocheck_auftrag_id, bonus_typ)
);

-- 5. RLS aktivieren
ALTER TABLE thermocheck.contractor_boni ENABLE ROW LEVEL SECURITY;

-- Techniker sieht eigene Boni (über contractor_onboarding_id)
CREATE POLICY "contractor_boni_select_own"
ON thermocheck.contractor_boni
FOR SELECT
TO authenticated
USING (
  contractor_onboarding_id IN (
    SELECT id FROM thermocheck.contractor_onboarding
    WHERE profile_id = auth.uid()
  )
);

-- Admin kann alle sehen
CREATE POLICY "contractor_boni_select_admin"
ON thermocheck.contractor_boni
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admin kann Boni freigeben/ändern
CREATE POLICY "contractor_boni_update_admin"
ON thermocheck.contractor_boni
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Insert nur via RPC (SECURITY DEFINER) oder Admin
CREATE POLICY "contractor_boni_insert_admin"
ON thermocheck.contractor_boni
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 6. RPC: Bewertungsbonus erstellen (Techniker darf für eigenen Auftrag)
CREATE OR REPLACE FUNCTION thermocheck.erstelle_bewertungs_bonus(
  p_auftrag_id uuid,
  p_bonus_typ thermocheck.contractor_bonus_typ_enum,
  p_nachweis_path text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_onb_id uuid;
  v_lead_id uuid;
  v_betrag numeric;
  v_existing_count int;
BEGIN
  -- Nur bewertung_google oder bewertung_trustpilot erlaubt
  IF p_bonus_typ NOT IN ('bewertung_google', 'bewertung_trustpilot') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ungültiger Bonus-Typ');
  END IF;

  -- Prüfe ob User Techniker dieses Auftrags ist
  SELECT ta.zugewiesener_techniker_id, ta.lead_id
  INTO v_onb_id, v_lead_id
  FROM thermocheck.thermocheck_auftraege ta
  JOIN thermocheck.contractor_onboarding co ON co.id = ta.zugewiesener_techniker_id
  WHERE ta.id = p_auftrag_id
  AND co.profile_id = auth.uid();

  IF v_onb_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicht berechtigt');
  END IF;

  -- Duplikatsprüfung
  SELECT COUNT(*) INTO v_existing_count
  FROM thermocheck.contractor_boni
  WHERE thermocheck_auftrag_id = p_auftrag_id AND bonus_typ = p_bonus_typ;

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Bonus wurde bereits beantragt');
  END IF;

  -- Betrag bestimmen: 10€ für einzeln, wird auf 50€ erhöht wenn beides vorhanden
  v_betrag := 10;

  INSERT INTO thermocheck.contractor_boni (
    contractor_onboarding_id, thermocheck_auftrag_id, lead_id,
    bonus_typ, betrag, nachweis_storage_path, status
  ) VALUES (
    v_onb_id, p_auftrag_id, v_lead_id,
    p_bonus_typ, v_betrag, p_nachweis_path, 'ausstehend'
  );

  -- Prüfe ob jetzt BEIDE Bewertungen für diesen Auftrag vorhanden sind
  SELECT COUNT(*) INTO v_existing_count
  FROM thermocheck.contractor_boni
  WHERE thermocheck_auftrag_id = p_auftrag_id
  AND bonus_typ IN ('bewertung_google', 'bewertung_trustpilot');

  IF v_existing_count = 2 THEN
    -- Beide vorhanden → auf je 25€ setzen (gesamt 50€)
    UPDATE thermocheck.contractor_boni
    SET betrag = 25, updated_at = now()
    WHERE thermocheck_auftrag_id = p_auftrag_id
    AND bonus_typ IN ('bewertung_google', 'bewertung_trustpilot');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Bewertungsbonus beantragt');
END;
$$;

-- 7. Public wrapper for erstelle_bewertungs_bonus
CREATE OR REPLACE FUNCTION public.erstelle_bewertungs_bonus(
  p_auftrag_id uuid,
  p_bonus_typ text,
  p_nachweis_path text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.erstelle_bewertungs_bonus(
    p_auftrag_id,
    p_bonus_typ::thermocheck.contractor_bonus_typ_enum,
    p_nachweis_path
  );
END;
$$;

-- 8. Public RPC: Meine Boni laden
CREATE OR REPLACE FUNCTION public.get_my_contractor_boni()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT 
      cb.id, cb.thermocheck_auftrag_id, cb.lead_id,
      cb.bonus_typ::text, cb.betrag, cb.status::text,
      cb.nachweis_storage_path, cb.freigegeben_am,
      cb.auszahlungsmonat, cb.created_at,
      l.lead_name
    FROM thermocheck.contractor_boni cb
    JOIN thermocheck.contractor_onboarding co ON co.id = cb.contractor_onboarding_id
    LEFT JOIN public.leads l ON l.id = cb.lead_id
    WHERE co.profile_id = auth.uid()
    ORDER BY cb.created_at DESC
  ) b;

  RETURN v_result;
END;
$$;
