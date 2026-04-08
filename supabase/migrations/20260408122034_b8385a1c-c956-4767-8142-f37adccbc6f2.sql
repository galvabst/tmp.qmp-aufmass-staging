UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now()
WHERE id = '0004b9cc-da18-4aa4-b200-5796633a562c'
  AND produkt_key = 'google-workspace'
  AND stripe_payment_status = 'pending';