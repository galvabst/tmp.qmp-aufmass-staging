UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = COALESCE(paid_at, now()),
    webhook_received_at = COALESCE(webhook_received_at, now())
WHERE onboarding_id = '2c5709de-bda3-4b56-b626-46feaa1c2eb9'
  AND produkt_key = 'poloshirt';