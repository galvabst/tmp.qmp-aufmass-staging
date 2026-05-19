
-- 1. Notification table
CREATE TABLE IF NOT EXISTS thermocheck.techniker_benachrichtigungen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  techniker_id UUID NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  auftrag_id UUID REFERENCES thermocheck.thermocheck_auftraege(id) ON DELETE SET NULL,
  typ TEXT NOT NULL,
  titel TEXT NOT NULL,
  nachricht TEXT NOT NULL,
  gelesen_am TIMESTAMPTZ,
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tech_benachr_techniker ON thermocheck.techniker_benachrichtigungen (techniker_id, gelesen_am, erstellt_am DESC);

ALTER TABLE thermocheck.techniker_benachrichtigungen ENABLE ROW LEVEL SECURITY;

-- Techniker sieht eigene
CREATE POLICY "Techniker liest eigene Benachrichtigungen"
  ON thermocheck.techniker_benachrichtigungen FOR SELECT
  USING (
    techniker_id IN (
      SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid()
    )
    OR thermocheck.is_innendienst()
  );

-- Techniker kann eigene als gelesen markieren
CREATE POLICY "Techniker markiert eigene als gelesen"
  ON thermocheck.techniker_benachrichtigungen FOR UPDATE
  USING (
    techniker_id IN (
      SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid()
    )
    OR thermocheck.is_innendienst()
  )
  WITH CHECK (
    techniker_id IN (
      SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid()
    )
    OR thermocheck.is_innendienst()
  );

-- Nur Innendienst direkt INSERT (sonst via Trigger Security Definer)
CREATE POLICY "Innendienst inserts benachrichtigungen"
  ON thermocheck.techniker_benachrichtigungen FOR INSERT
  WITH CHECK (thermocheck.is_innendienst());

-- 2. Trigger function: cancel termine + notify on lost/cancelled
CREATE OR REPLACE FUNCTION thermocheck.on_auftrag_lost_or_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_lost_now BOOLEAN := FALSE;
  v_storno_now BOOLEAN := FALSE;
  v_kunde TEXT;
  v_titel TEXT;
  v_nachricht TEXT;
  v_typ TEXT;
  v_lost_statuses TEXT[] := ARRAY['verloren','widerruf','widerruf_ohne_nachweis','widerruf_nicht_fristgerecht'];
BEGIN
  v_lost_now := NEW.pipeline_status::text = ANY(v_lost_statuses)
                AND (OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status);
  v_storno_now := NEW.storno_datum IS NOT NULL
                  AND OLD.storno_datum IS DISTINCT FROM NEW.storno_datum;

  IF NOT (v_lost_now OR v_storno_now) THEN
    RETURN NEW;
  END IF;

  -- Cancel any active terminvorschlaege for this auftrag
  UPDATE thermocheck.thermocheck_terminvorschlaege
     SET status = 'storniert'
   WHERE thermocheck_auftrag_id = NEW.id
     AND status IN ('vorgeschlagen','angenommen');

  -- Notify assigned technician (if any)
  IF NEW.zugewiesener_techniker_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', l.kunde_vorname, l.kunde_nachname)), ''),
                    l.kunde_firmenname, l.lead_name, l.kunde_email, NEW.id::text)
      INTO v_kunde
      FROM public.leads l WHERE l.id = NEW.lead_id;

    IF v_lost_now THEN
      v_typ := 'auftrag_verloren';
      v_titel := 'Auftrag entfernt: ' || COALESCE(v_kunde, 'Unbekannt');
      v_nachricht := 'Der Auftrag wurde vom Innendienst auf "' || NEW.pipeline_status::text
                     || '" gesetzt und ist aus deiner Auftragsliste entfernt worden. Bitte plane den Termin nicht mehr ein.';
    ELSE
      v_typ := 'auftrag_storniert';
      v_titel := 'Auftrag storniert: ' || COALESCE(v_kunde, 'Unbekannt');
      v_nachricht := 'Der Kunde hat den Termin am ' || to_char(NEW.storno_datum, 'DD.MM.YYYY')
                     || ' storniert. Der Auftrag ist aus deiner Liste entfernt — bitte fahre nicht hin.';
    END IF;

    INSERT INTO thermocheck.techniker_benachrichtigungen
      (techniker_id, auftrag_id, typ, titel, nachricht)
    VALUES
      (NEW.zugewiesener_techniker_id, NEW.id, v_typ, v_titel, v_nachricht);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auftrag_lost_or_cancelled ON thermocheck.thermocheck_auftraege;
CREATE TRIGGER trg_auftrag_lost_or_cancelled
  AFTER UPDATE OF pipeline_status, storno_datum ON thermocheck.thermocheck_auftraege
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.on_auftrag_lost_or_cancelled();

-- 3. Backfill: existing inconsistencies
DO $$
DECLARE
  r RECORD;
  v_kunde TEXT;
  v_typ TEXT;
  v_titel TEXT;
  v_nachricht TEXT;
  v_is_lost BOOLEAN;
BEGIN
  FOR r IN
    SELECT DISTINCT a.id, a.lead_id, a.pipeline_status, a.storno_datum, a.zugewiesener_techniker_id
      FROM thermocheck.thermocheck_auftraege a
      JOIN thermocheck.thermocheck_terminvorschlaege t ON t.thermocheck_auftrag_id = a.id
     WHERE a.zugewiesener_techniker_id IS NOT NULL
       AND t.status IN ('vorgeschlagen','angenommen')
       AND ( a.pipeline_status::text IN ('verloren','widerruf','widerruf_ohne_nachweis','widerruf_nicht_fristgerecht')
             OR a.storno_datum IS NOT NULL )
  LOOP
    UPDATE thermocheck.thermocheck_terminvorschlaege
       SET status = 'storniert'
     WHERE thermocheck_auftrag_id = r.id
       AND status IN ('vorgeschlagen','angenommen');

    v_is_lost := r.pipeline_status::text IN ('verloren','widerruf','widerruf_ohne_nachweis','widerruf_nicht_fristgerecht');

    SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ', l.kunde_vorname, l.kunde_nachname)), ''),
                    l.kunde_firmenname, l.lead_name, l.kunde_email, r.id::text)
      INTO v_kunde
      FROM public.leads l WHERE l.id = r.lead_id;

    IF v_is_lost THEN
      v_typ := 'auftrag_verloren';
      v_titel := 'Auftrag entfernt: ' || COALESCE(v_kunde,'Unbekannt');
      v_nachricht := 'Der Auftrag wurde auf "' || r.pipeline_status::text
                     || '" gesetzt und ist aus deiner Liste entfernt worden.';
    ELSE
      v_typ := 'auftrag_storniert';
      v_titel := 'Auftrag storniert: ' || COALESCE(v_kunde,'Unbekannt');
      v_nachricht := 'Der Kunde hat den Termin am ' || to_char(r.storno_datum,'DD.MM.YYYY')
                     || ' storniert. Bitte fahre nicht hin.';
    END IF;

    -- Avoid duplicate backfill notifications
    INSERT INTO thermocheck.techniker_benachrichtigungen
      (techniker_id, auftrag_id, typ, titel, nachricht)
    SELECT r.zugewiesener_techniker_id, r.id, v_typ, v_titel, v_nachricht
    WHERE NOT EXISTS (
      SELECT 1 FROM thermocheck.techniker_benachrichtigungen
       WHERE techniker_id = r.zugewiesener_techniker_id
         AND auftrag_id = r.id
         AND typ = v_typ
    );
  END LOOP;
END $$;
