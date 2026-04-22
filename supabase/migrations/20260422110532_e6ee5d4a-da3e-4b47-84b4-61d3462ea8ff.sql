UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = COALESCE(paid_at, now())
WHERE id IN (
  'c5cfde81-5439-4957-b45b-f6f04c9158dd',
  '7e18e3d6-be98-4efd-941c-f2ee28c2238a'
);