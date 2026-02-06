-- Echte Preise sichern + Test-Preise setzen
UPDATE thermocheck.contractor_produkte
SET stripe_test_price_id = stripe_price_id,
    stripe_price_id = 'price_1SxpvhLnjPqrEfxxdZVQTgLm'
WHERE produkt_key = 'scanner-lizenz';

UPDATE thermocheck.contractor_produkte
SET stripe_test_price_id = stripe_price_id,
    stripe_price_id = 'price_1SxpwOLnjPqrEfxxWYh27lg2'
WHERE produkt_key = 'google-workspace';