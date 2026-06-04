CREATE OR REPLACE FUNCTION public.mark_rechnung_gestellt(p_auftrag_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
DECLARE
  v_contractor_id uuid;
  v_betrag numeric;
BEGIN
  SELECT a.zugewiesener_techniker_id, a.vereinbarter_preis
    INTO v_contractor_id, v_betrag
  FROM thermocheck.v_thermocheck_auftraege a
  WHERE a.id = p_auftrag_id;

  IF v_contractor_id IS NULL THEN
    RAISE EXCEPTION 'Auftrag nicht gefunden oder nicht zugewiesen';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM thermocheck.contractor_onboarding co
    WHERE co.id = v_contractor_id AND co.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Nur der zugewiesene Techniker darf die Rechnung melden';
  END IF;

  INSERT INTO thermocheck.contractor_abrechnungen (
    thermocheck_auftrag_id, contractor_id, status, betrag,
    rechnung_eingegangen_am, geprueft_am
  )
  VALUES (
    p_auftrag_id, v_contractor_id, 'in_pruefung'::thermocheck.abrechnung_status,
    v_betrag, now(), now()
  )
  ON CONFLICT (thermocheck_auftrag_id) DO UPDATE
    SET status = 'in_pruefung'::thermocheck.abrechnung_status,
        rechnung_eingegangen_am = COALESCE(thermocheck.contractor_abrechnungen.rechnung_eingegangen_am, now()),
        geprueft_am = COALESCE(thermocheck.contractor_abrechnungen.geprueft_am, now()),
        aktualisiert_am = now()
    WHERE thermocheck.contractor_abrechnungen.status = 'offen'::thermocheck.abrechnung_status
       OR thermocheck.contractor_abrechnungen.status = 'rechnung_eingegangen'::thermocheck.abrechnung_status;
END;
$$;