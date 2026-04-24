UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid'
WHERE id = '771e2a19-851d-4ade-84db-64a0c6e93545'
  AND produkt_key = 'schlappen'
  AND paid_at IS NOT NULL
  AND stripe_payment_status = 'pending';