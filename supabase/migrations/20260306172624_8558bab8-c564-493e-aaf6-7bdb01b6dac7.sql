
-- Function: Auto-create lead_conversion bonus when Anzahlung is received
CREATE OR REPLACE FUNCTION thermocheck.erstelle_lead_conversion_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_tc RECORD;
BEGIN
  -- Only fire when anzahlung_eingang_datum changes from NULL to a value
  IF OLD.anzahlung_eingang_datum IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.anzahlung_eingang_datum IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find thermocheck_auftraege linked to the same lead
  FOR v_tc IN
    SELECT ta.id AS auftrag_id,
           ta.zugewiesener_techniker_id,
           ta.lead_id
    FROM thermocheck.thermocheck_auftraege ta
    WHERE ta.lead_id = NEW.lead_id
      AND ta.zugewiesener_techniker_id IS NOT NULL
  LOOP
    INSERT INTO thermocheck.contractor_boni (
      thermocheck_auftrag_id,
      contractor_onboarding_id,
      lead_id,
      bonus_typ,
      betrag,
      status
    ) VALUES (
      v_tc.auftrag_id,
      v_tc.zugewiesener_techniker_id,
      v_tc.lead_id,
      'lead_conversion',
      50,
      'ausstehend'
    )
    ON CONFLICT (thermocheck_auftrag_id, bonus_typ) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger on public.auftraege (where anzahlung_eingang_datum lives)
DROP TRIGGER IF EXISTS trg_lead_conversion_bonus ON public.auftraege;
CREATE TRIGGER trg_lead_conversion_bonus
  AFTER UPDATE OF anzahlung_eingang_datum ON public.auftraege
  FOR EACH ROW
  WHEN (OLD.anzahlung_eingang_datum IS NULL AND NEW.anzahlung_eingang_datum IS NOT NULL)
  EXECUTE FUNCTION thermocheck.erstelle_lead_conversion_bonus();
