-- Größen-Spalten für Onboarding hinzufügen
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN IF NOT EXISTS tshirt_groesse text,
ADD COLUMN IF NOT EXISTS poloshirt_groesse text,  
ADD COLUMN IF NOT EXISTS pullover_groesse text,
ADD COLUMN IF NOT EXISTS schuh_groesse text;

-- Kommentar für Dokumentation
COMMENT ON COLUMN thermocheck.contractor_onboarding.tshirt_groesse IS 'Kleidergröße für T-Shirt: XS, S, M, L, XL, XXL, 3XL';
COMMENT ON COLUMN thermocheck.contractor_onboarding.poloshirt_groesse IS 'Kleidergröße für Poloshirt: XS, S, M, L, XL, XXL, 3XL';
COMMENT ON COLUMN thermocheck.contractor_onboarding.pullover_groesse IS 'Kleidergröße für Pullover: XS, S, M, L, XL, XXL, 3XL';
COMMENT ON COLUMN thermocheck.contractor_onboarding.schuh_groesse IS 'Schuhgröße: 36-47';