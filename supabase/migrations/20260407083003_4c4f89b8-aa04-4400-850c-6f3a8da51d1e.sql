UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now()
WHERE id = '9a500253-73d0-4596-91d1-58f04dc382e8'
  AND produkt_key = 'scanner-lizenz'
  AND stripe_payment_status = 'pending';