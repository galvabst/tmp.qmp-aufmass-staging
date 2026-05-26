DROP VIEW IF EXISTS thermocheck.v_subscription_health;

CREATE VIEW thermocheck.v_subscription_health
WITH (security_invoker=on) AS
SELECT
  cs.id AS subscription_id,
  cs.onboarding_id,
  co.profile_id,
  COALESCE(p.vorname, co.vorname) AS vorname,
  COALESCE(p.nachname, co.nachname) AS nachname,
  COALESCE(p.email, co.ag_domain_email) AS email,
  co.onboarding_status::text AS onboarding_status,
  co.current_step::text AS current_step,
  cs.stripe_subscription_id,
  cs.stripe_customer_id,
  cs.produkt_key,
  cs.status,
  cs.access_state,
  cs.current_period_start,
  cs.current_period_end,
  cs.cancel_at_period_end,
  cs.canceled_at,
  cs.last_payment_failed_at,
  cs.last_payment_failed_reason,
  cs.last_payment_succeeded_at,
  cs.consecutive_failures,
  cs.aktualisiert_am
FROM thermocheck.contractor_subscriptions cs
JOIN thermocheck.contractor_onboarding co ON co.id = cs.onboarding_id
LEFT JOIN public.profiles p ON p.id = co.profile_id
WHERE co.profile_id IS NOT NULL
  AND co.onboarding_status::text NOT IN ('gefeuert','abgelehnt');

GRANT SELECT ON thermocheck.v_subscription_health TO authenticated;
GRANT SELECT ON thermocheck.v_subscription_health TO service_role;