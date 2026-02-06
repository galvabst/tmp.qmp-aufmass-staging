
-- Spalte für gesicherte Live-Preise hinzufügen
ALTER TABLE thermocheck.contractor_produkte
ADD COLUMN IF NOT EXISTS stripe_test_price_id text;

COMMENT ON COLUMN thermocheck.contractor_produkte.stripe_test_price_id
IS 'Backup der echten stripe_price_id, solange Testpreise aktiv sind';
