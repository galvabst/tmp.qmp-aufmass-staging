UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now()
WHERE id = '14e5552e-c198-4677-a441-e110261b9ff2'
  AND produkt_key = 'scanner-lizenz'
  AND stripe_payment_status = 'pending';