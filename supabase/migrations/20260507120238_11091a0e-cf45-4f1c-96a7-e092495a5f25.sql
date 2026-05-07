UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    stripe_payment_intent_id = 'pi_3TU67ELnjPqrEfxx1fGHBHI9',
    paid_at = COALESCE(paid_at, now()),
    webhook_received_at = COALESCE(webhook_received_at, now())
WHERE id = '43d642c1-0e7e-4144-a7fa-991d1acdc833';

INSERT INTO thermocheck.contractor_audit_log (action_type, object_type, object_id, payload, actor_type, actor_name)
VALUES ('reconciled_paid', 'contractor_bestellung', '43d642c1-0e7e-4144-a7fa-991d1acdc833',
  jsonb_build_object('payment_intent_id','pi_3TU67ELnjPqrEfxx1fGHBHI9','reason','manual_match_customer_pi','reconciler_version','manual-2026-05-07'),
  'system', 'admin-manual');