
-- Table to persist late submissions
CREATE TABLE thermocheck.contractor_verspaetungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thermocheck_auftrag_id uuid NOT NULL REFERENCES thermocheck.thermocheck_auftraege(id) ON DELETE CASCADE,
  contractor_onboarding_id uuid NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  termin_ende timestamptz NOT NULL,
  eingereicht_am timestamptz NOT NULL,
  verspaetung_minuten integer NOT NULL DEFAULT 0,
  grundgebuehr numeric NOT NULL DEFAULT 50,
  stundensatz numeric NOT NULL DEFAULT 4,
  gesamtbetrag numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(thermocheck_auftrag_id)
);

-- RLS
ALTER TABLE thermocheck.contractor_verspaetungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Techniker sieht eigene Verspätungen"
  ON thermocheck.contractor_verspaetungen
  FOR SELECT
  TO authenticated
  USING (
    contractor_onboarding_id IN (
      SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid()
    )
  );

-- Trigger function: auto-insert delay record when eingereicht_am is set
CREATE OR REPLACE FUNCTION thermocheck.check_verspaetung_on_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_termin RECORD;
  v_deadline timestamptz;
  v_delay_minutes integer;
  v_fee numeric;
BEGIN
  -- Only fire when eingereicht_am goes from NULL to a value
  IF OLD.eingereicht_am IS NOT NULL OR NEW.eingereicht_am IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the accepted termin for this auftrag
  SELECT datum, zeit_bis INTO v_termin
  FROM thermocheck.thermocheck_terminvorschlaege
  WHERE thermocheck_auftrag_id = NEW.id
    AND status = 'angenommen'
  ORDER BY datum DESC
  LIMIT 1;

  IF v_termin IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate deadline: termin date + zeit_bis + 24 hours
  v_deadline := (v_termin.datum + COALESCE(v_termin.zeit_bis, '18:00'::time))::timestamptz + interval '24 hours';

  -- Only record if late
  IF NEW.eingereicht_am > v_deadline THEN
    v_delay_minutes := EXTRACT(EPOCH FROM (NEW.eingereicht_am - v_deadline))::integer / 60;
    v_fee := 50 + CEIL(v_delay_minutes / 60.0) * 4;

    INSERT INTO thermocheck.contractor_verspaetungen (
      thermocheck_auftrag_id,
      contractor_onboarding_id,
      termin_ende,
      eingereicht_am,
      verspaetung_minuten,
      gesamtbetrag
    ) VALUES (
      NEW.id,
      NEW.zugewiesener_techniker_id,
      v_deadline,
      NEW.eingereicht_am,
      v_delay_minutes,
      v_fee
    )
    ON CONFLICT (thermocheck_auftrag_id) DO UPDATE SET
      eingereicht_am = EXCLUDED.eingereicht_am,
      verspaetung_minuten = EXCLUDED.verspaetung_minuten,
      gesamtbetrag = EXCLUDED.gesamtbetrag;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_verspaetung
  AFTER UPDATE OF eingereicht_am ON thermocheck.thermocheck_auftraege
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.check_verspaetung_on_submit();
