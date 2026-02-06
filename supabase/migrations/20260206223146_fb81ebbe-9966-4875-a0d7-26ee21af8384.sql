
-- Nur den User-Trigger deaktivieren (nicht System-Trigger)
ALTER TABLE thermocheck.contractor_bestellungen DISABLE TRIGGER trigger_bestellung_paid;

-- Bestehende tshirt-Bestellung auf paid
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid', paid_at = now()
WHERE onboarding_id = '17ef2646-e455-4d99-88ad-443b44ed9594' AND produkt_key = 'tshirt';

-- Fehlende Pflichtprodukte einfügen
INSERT INTO thermocheck.contractor_bestellungen (onboarding_id, produkt_key, produkt_typ, stripe_payment_status, paid_at, betrag_netto)
VALUES
  ('17ef2646-e455-4d99-88ad-443b44ed9594', 'poloshirt', 'kleidung', 'paid', now(), 0),
  ('17ef2646-e455-4d99-88ad-443b44ed9594', 'schlappen', 'kleidung', 'paid', now(), 0),
  ('17ef2646-e455-4d99-88ad-443b44ed9594', 'pullover', 'kleidung', 'paid', now(), 0),
  ('17ef2646-e455-4d99-88ad-443b44ed9594', 'ausweiskarte', 'zubehoer', 'paid', now(), 0),
  ('17ef2646-e455-4d99-88ad-443b44ed9594', 'scanner-lizenz', 'lizenz', 'paid', now(), 19900),
  ('17ef2646-e455-4d99-88ad-443b44ed9594', 'google-workspace', 'lizenz', 'paid', now(), 3499);

-- Trigger wieder aktivieren
ALTER TABLE thermocheck.contractor_bestellungen ENABLE TRIGGER trigger_bestellung_paid;

-- Akademie-Fortschritt
INSERT INTO thermocheck.contractor_akademie_lektions_fortschritt (contractor_id, lektion_id, status, completed_at)
SELECT 
  '17ef2646-e455-4d99-88ad-443b44ed9594',
  l.id,
  'completed',
  now()
FROM thermocheck.contractor_akademie_lektionen l
WHERE l.ist_aktiv = true
ON CONFLICT (contractor_id, lektion_id) DO UPDATE SET status = 'completed', completed_at = now();
