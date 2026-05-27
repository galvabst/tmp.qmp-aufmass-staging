DROP VIEW IF EXISTS thermocheck.v_subscription_health;

CREATE VIEW thermocheck.v_subscription_health
WITH (security_invoker=on) AS
WITH last_paid_orders AS (
  SELECT
    cb.onboarding_id,
    cb.produkt_key,
    MAX(cb.paid_at) AS last_paid_at
  FROM thermocheck.contractor_bestellungen cb
  WHERE cb.stripe_payment_status = 'paid'
  GROUP BY cb.onboarding_id, cb.produkt_key
),
last_orders AS (
  SELECT DISTINCT ON (cb.onboarding_id, cb.produkt_key)
    cb.onboarding_id,
    cb.produkt_key,
    cb.stripe_payment_status AS last_order_status
  FROM thermocheck.contractor_bestellungen cb
  ORDER BY cb.onboarding_id, cb.produkt_key, cb.created_at DESC
)
SELECT
  cs.id AS subscription_id,
  cs.onboarding_id,
  co.profile_id,
  COALESCE(p.vorname, co.vorname) AS vorname,
  COALESCE(p.nachname, co.nachname) AS nachname,
  COALESCE(p.email, co.ag_domain_email) AS email,
  co.onboarding_status::text AS onboarding_status,
  CASE
    WHEN co.is_trainer = true THEN 'ready'
    ELSE co.onboarding_status::text
  END AS effective_onboarding_status,
  co.current_step::text AS current_step,
  COALESCE(co.is_trainer, false) AS is_trainer,
  cs.stripe_subscription_id,
  cs.stripe_customer_id,
  cs.produkt_key,
  cs.status::text AS status,
  cs.access_state::text AS access_state,
  cs.latest_invoice_status,
  cs.current_period_start,
  cs.current_period_end,
  cs.cancel_at_period_end,
  cs.canceled_at,
  cs.last_payment_failed_at,
  cs.last_payment_failed_reason,
  cs.last_payment_succeeded_at,
  cs.consecutive_failures,
  cs.aktualisiert_am,
  lpo.last_paid_at AS last_paid_order_at,
  lo.last_order_status,
  CASE
    WHEN cs.status::text IN ('unpaid','past_due','incomplete_expired')
      OR cs.access_state::text = 'blocked' AND cs.status::text NOT IN ('canceled')
      OR cs.consecutive_failures >= 1
      OR cs.last_payment_failed_at IS NOT NULL
        AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_failed_at > cs.last_payment_succeeded_at)
      THEN 'action_required'
    WHEN cs.status::text = 'canceled'
      AND (cs.latest_invoice_status = 'paid' OR lpo.last_paid_at IS NOT NULL)
      THEN 'attention'
    WHEN cs.cancel_at_period_end = true
      THEN 'attention'
    WHEN cs.status::text IN ('canceled','incomplete','paused')
      THEN 'attention'
    ELSE 'ok'
  END AS health_level,
  CASE
    WHEN cs.status::text IN ('unpaid','past_due')
      THEN 'Zahlung offen — Abo droht zu sperren'
    WHEN cs.status::text = 'incomplete_expired'
      THEN 'Checkout nie abgeschlossen — Abo abgelaufen'
    WHEN cs.consecutive_failures >= 1
      OR (cs.last_payment_failed_at IS NOT NULL
          AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_failed_at > cs.last_payment_succeeded_at))
      THEN 'Letzte Zahlung fehlgeschlagen'
    WHEN cs.status::text = 'canceled'
      AND (cs.latest_invoice_status = 'paid' OR lpo.last_paid_at IS NOT NULL)
      THEN 'Abo in Stripe gekündigt — letzte Rechnung bezahlt'
    WHEN cs.cancel_at_period_end = true
      THEN 'Abo läuft zum Periodenende aus'
    WHEN cs.status::text = 'canceled'
      THEN 'Abo gekündigt — keine bezahlte Rechnung hinterlegt'
    WHEN cs.status::text = 'incomplete'
      THEN 'Checkout begonnen, aber nicht abgeschlossen'
    WHEN cs.status::text = 'paused'
      THEN 'Abo pausiert'
    ELSE NULL
  END AS health_reason
FROM thermocheck.contractor_subscriptions cs
JOIN thermocheck.contractor_onboarding co ON co.id = cs.onboarding_id
LEFT JOIN public.profiles p ON p.id = co.profile_id
LEFT JOIN last_paid_orders lpo
  ON lpo.onboarding_id = cs.onboarding_id AND lpo.produkt_key = cs.produkt_key
LEFT JOIN last_orders lo
  ON lo.onboarding_id = cs.onboarding_id AND lo.produkt_key = cs.produkt_key
WHERE co.profile_id IS NOT NULL
  AND co.onboarding_status::text NOT IN
      ('gefeuert','abgelehnt','ausgestiegen','deaktiviert','inaktiv');

GRANT SELECT ON thermocheck.v_subscription_health TO authenticated;
GRANT SELECT ON thermocheck.v_subscription_health TO service_role;