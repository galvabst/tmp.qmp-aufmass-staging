
-- Seed Grundpreise fuer alle 20 bestehenden Contractors
INSERT INTO thermocheck.contractor_grundpreise (contractor_id, auftragstyp, betrag_netto)
SELECT co.id, ap.auftragstyp, ap.default_betrag_netto
FROM thermocheck.contractor_onboarding co
CROSS JOIN thermocheck.auftragstyp_preise ap
ON CONFLICT (contractor_id, auftragstyp) DO NOTHING;
