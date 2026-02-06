
-- Live-Preise sichern und Test-Preise (0 EUR) einsetzen
UPDATE thermocheck.contractor_produkte
SET stripe_test_price_id = stripe_price_id,
    stripe_price_id = CASE produkt_key
      WHEN 'schlappen' THEN 'price_1SxmacLnjPqrEfxxW060yeQC'
      WHEN 'poloshirt' THEN 'price_1Sxmc6LnjPqrEfxxi2Hw0T5P'
      WHEN 'ausweiskarte' THEN 'price_1Sxmd1LnjPqrEfxxxEDDkR8S'
      WHEN 'pullover' THEN 'price_1SxmdgLnjPqrEfxxOBY3UmMN'
    END
WHERE produkt_key IN ('schlappen', 'poloshirt', 'ausweiskarte', 'pullover');
