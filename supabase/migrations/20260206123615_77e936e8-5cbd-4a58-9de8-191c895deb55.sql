UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now(),
    webhook_received_at = now()
WHERE id = 'a096833d-2e7f-4f6c-9669-83c943c3ca75'
  AND stripe_payment_status = 'pending';