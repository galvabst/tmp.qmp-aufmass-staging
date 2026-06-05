CREATE OR REPLACE VIEW thermocheck.v_einmalige_order_health
WITH (security_invoker = on) AS
WITH base AS (
  SELECT
    cb.id AS order_id,
    cb.onboarding_id,
    co.profile_id,
    COALESCE(p.vorname, co.vorname) AS vorname,
    COALESCE(p.nachname, co.nachname) AS nachname,
    COALESCE(p.email, co.ag_domain_email) AS email,
    co.onboarding_status::text AS onboarding_status,
    CASE WHEN co.is_trainer = true THEN 'ready'::text
         ELSE co.onboarding_status::text END AS effective_onboarding_status,
    co.current_step,
    COALESCE(co.is_trainer, false) AS is_trainer,
    cb.produkt_key,
    cb.stripe_payment_status::text AS stripe_payment_status,
    cb.betrag_brutto,
    cb.paid_at,
    cb.created_at,
    cb.stripe_session_id,
    cb.stripe_customer_id,
    cb.stripe_payment_intent_id
  FROM thermocheck.contractor_bestellungen cb
  JOIN thermocheck.contractor_onboarding co ON co.id = cb.onboarding_id
  LEFT JOIN public.profiles p ON p.id = co.profile_id
  WHERE cb.stripe_subscription_id IS NULL
    AND cb.stripe_payment_status::text IN ('pending','failed')
    AND co.onboarding_status::text NOT IN ('gefeuert','inaktiv','deaktiviert')
)
SELECT
  b.*,
  CASE
    WHEN b.stripe_payment_status = 'failed' THEN 'action_required'
    WHEN b.stripe_payment_status = 'pending' AND b.created_at < now() - interval '24 hours' THEN 'action_required'
    WHEN b.stripe_payment_status = 'pending' THEN 'attention'
    ELSE 'ok'
  END AS health_level,
  CASE
    WHEN b.stripe_payment_status = 'failed' THEN 'Einmal-Bestellung fehlgeschlagen'
    WHEN b.stripe_payment_status = 'pending' AND b.created_at < now() - interval '24 hours' THEN 'Bestellung seit >24h offen — Checkout nie abgeschlossen?'
    WHEN b.stripe_payment_status = 'pending' THEN 'Checkout läuft — noch nicht bezahlt'
    ELSE NULL
  END AS health_level_reason
FROM base b;

GRANT SELECT ON thermocheck.v_einmalige_order_health TO authenticated;
GRANT ALL ON thermocheck.v_einmalige_order_health TO service_role;