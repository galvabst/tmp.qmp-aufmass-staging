
-- =====================================================
-- ONBOARDING DATENPERSISTENZ: Komplette Schema-Migration
-- =====================================================

-- 1. ENUMs für Bestellungen erstellen
CREATE TYPE thermocheck.contractor_bestellung_produkt_typ_enum AS ENUM (
  'kleidung',
  'lizenz', 
  'coaching'
);

CREATE TYPE thermocheck.stripe_payment_status_enum AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- 2. Bestellungen-Tabelle (NEU)
CREATE TABLE thermocheck.contractor_bestellungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  produkt_typ thermocheck.contractor_bestellung_produkt_typ_enum NOT NULL,
  produkt_key text NOT NULL,
  stripe_session_id text,
  stripe_payment_status thermocheck.stripe_payment_status_enum NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  betrag_netto numeric(10,2),
  betrag_brutto numeric(10,2),
  groessen_info jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  
  CONSTRAINT unique_onboarding_product UNIQUE (onboarding_id, produkt_key)
);

COMMENT ON TABLE thermocheck.contractor_bestellungen IS 'Stripe-Bestellungen für Onboarding-Produkte';

-- Index für schnelle Abfragen
CREATE INDEX idx_contractor_bestellungen_onboarding ON thermocheck.contractor_bestellungen(onboarding_id);
CREATE INDEX idx_contractor_bestellungen_stripe_session ON thermocheck.contractor_bestellungen(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- 3. RLS für Bestellungen
ALTER TABLE thermocheck.contractor_bestellungen ENABLE ROW LEVEL SECURITY;

-- Techniker sieht nur eigene Bestellungen (via onboarding → profile)
CREATE POLICY "Techniker sieht eigene Bestellungen"
ON thermocheck.contractor_bestellungen
FOR SELECT
TO authenticated
USING (
  onboarding_id IN (
    SELECT id FROM thermocheck.contractor_onboarding 
    WHERE profile_id = auth.uid()
  )
);

-- Techniker kann eigene Bestellungen erstellen
CREATE POLICY "Techniker erstellt eigene Bestellungen"
ON thermocheck.contractor_bestellungen
FOR INSERT
TO authenticated
WITH CHECK (
  onboarding_id IN (
    SELECT id FROM thermocheck.contractor_onboarding 
    WHERE profile_id = auth.uid()
  )
);

-- Nur Admin kann Bestellungen aktualisieren (für Webhooks)
CREATE POLICY "Admin aktualisiert Bestellungen"
ON thermocheck.contractor_bestellungen
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM iam.user_system_roles usr
    WHERE usr.user_id = auth.uid() 
    AND usr.role IN ('superadmin', 'admin')
  )
);

-- 4. Trigger: Bei Zahlung automatisch Admin-Task erstellen
CREATE OR REPLACE FUNCTION thermocheck.on_bestellung_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck
AS $$
DECLARE
  v_task_title text;
BEGIN
  -- Nur bei Status-Wechsel zu 'paid'
  IF NEW.stripe_payment_status = 'paid' AND (OLD.stripe_payment_status IS NULL OR OLD.stripe_payment_status != 'paid') THEN
    
    -- Task-Titel basierend auf Produkt-Typ
    CASE NEW.produkt_typ
      WHEN 'kleidung' THEN v_task_title := 'Kleidung versenden';
      WHEN 'lizenz' THEN 
        CASE NEW.produkt_key
          WHEN 'roomscanner' THEN v_task_title := 'Room Scanner Lizenz einrichten';
          WHEN 'workspace' THEN v_task_title := 'Google Workspace einrichten';
          ELSE v_task_title := 'Lizenz einrichten: ' || NEW.produkt_key;
        END CASE;
      WHEN 'coaching' THEN v_task_title := 'Coaching-Termin koordinieren';
      ELSE v_task_title := 'Bestellung bearbeiten: ' || NEW.produkt_key;
    END CASE;
    
    -- Admin-Task erstellen
    INSERT INTO thermocheck.contractor_admin_tasks (
      contractor_id,
      task_key,
      titel,
      beschreibung,
      status,
      bestellung_details
    ) VALUES (
      NEW.onboarding_id,
      'bestellung_' || NEW.produkt_key,
      v_task_title,
      'Bezahlt am ' || to_char(COALESCE(NEW.paid_at, now()), 'DD.MM.YYYY HH24:MI'),
      'offen',
      jsonb_build_object(
        'bestellung_id', NEW.id,
        'produkt_typ', NEW.produkt_typ,
        'produkt_key', NEW.produkt_key,
        'groessen_info', NEW.groessen_info,
        'betrag_brutto', NEW.betrag_brutto
      )
    );
    
    -- paid_at setzen falls nicht gesetzt
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_bestellung_paid
BEFORE UPDATE ON thermocheck.contractor_bestellungen
FOR EACH ROW
EXECUTE FUNCTION thermocheck.on_bestellung_paid();

-- 5. RLS-Policy für Trainer-Freigabe (manager = Aufmaßtrainer)
CREATE POLICY "Manager kann Trainer-Freigabe setzen"
ON thermocheck.contractor_onboarding
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM iam.user_system_roles usr
    WHERE usr.user_id = auth.uid() 
    AND usr.role IN ('superadmin', 'admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM iam.user_system_roles usr
    WHERE usr.user_id = auth.uid() 
    AND usr.role IN ('superadmin', 'admin', 'manager')
  )
);
