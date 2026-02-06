
-- 1. Menge-Spalte auf contractor_bestellungen
ALTER TABLE thermocheck.contractor_bestellungen
ADD COLUMN menge integer NOT NULL DEFAULT 1;

-- 2. UNIQUE Constraint entfernen (erlaubt mehrere Bestellungen pro Produkt)
ALTER TABLE thermocheck.contractor_bestellungen
DROP CONSTRAINT IF EXISTS unique_onboarding_product;

-- 3. Neuer UNIQUE Constraint auf stripe_session_id (1 Bestellung pro Checkout)
ALTER TABLE thermocheck.contractor_bestellungen
ADD CONSTRAINT unique_stripe_session UNIQUE (stripe_session_id);

-- 4. Mehrfach-Flag auf contractor_produkte
ALTER TABLE thermocheck.contractor_produkte
ADD COLUMN erlaubt_mehrfach boolean NOT NULL DEFAULT false;

-- 5. Kleidung als mehrfach bestellbar markieren
UPDATE thermocheck.contractor_produkte
SET erlaubt_mehrfach = true
WHERE produkt_key IN ('tshirt', 'poloshirt', 'pullover', 'schlappen');
