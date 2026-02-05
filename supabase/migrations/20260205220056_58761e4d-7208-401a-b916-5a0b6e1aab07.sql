-- ============================================================
-- STRIPE ENTERPRISE - contractor_bestellungen erweitern
-- ============================================================

-- Fehlende Spalten für Stripe-Tracking hinzufügen
ALTER TABLE thermocheck.contractor_bestellungen
ADD COLUMN IF NOT EXISTS groesse TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique Constraint für Idempotency
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contractor_bestellungen_idempotency_key_unique') THEN
    ALTER TABLE thermocheck.contractor_bestellungen
    ADD CONSTRAINT contractor_bestellungen_idempotency_key_unique UNIQUE (idempotency_key);
  END IF;
END $$;

-- Index für schnelle Duplikat-Prüfung
CREATE INDEX IF NOT EXISTS idx_contractor_bestellungen_idempotency_key 
ON thermocheck.contractor_bestellungen(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Kommentar
COMMENT ON COLUMN thermocheck.contractor_bestellungen.groesse IS 'Größenauswahl für Kleidung (S, M, L, XL etc.)';
COMMENT ON COLUMN thermocheck.contractor_bestellungen.stripe_customer_id IS 'Stripe Customer ID für Wiederholungskäufe';
COMMENT ON COLUMN thermocheck.contractor_bestellungen.stripe_subscription_id IS 'Stripe Subscription ID für Abos';
COMMENT ON COLUMN thermocheck.contractor_bestellungen.webhook_received_at IS 'Zeitpunkt des Webhook-Empfangs (Idempotency)';
COMMENT ON COLUMN thermocheck.contractor_bestellungen.idempotency_key IS 'Stripe Event ID zur Duplikat-Vermeidung';