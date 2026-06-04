
CREATE OR REPLACE FUNCTION thermocheck.get_my_subscription_access()
 RETURNS TABLE(access_state thermocheck.subscription_access_state, worst_subscription_id uuid, worst_status thermocheck.subscription_status, current_period_end timestamp with time zone, cancel_at_period_end boolean, last_payment_failed_at timestamp with time zone, produkt_key text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'thermocheck', 'public'
AS $function$
DECLARE v_onboarding_id UUID;
BEGIN
  SELECT id INTO v_onboarding_id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid() LIMIT 1;
  IF v_onboarding_id IS NULL THEN
    RETURN QUERY SELECT 'ok'::thermocheck.subscription_access_state, NULL::UUID, NULL::thermocheck.subscription_status, NULL::TIMESTAMPTZ, FALSE, NULL::TIMESTAMPTZ, NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY
  WITH eff AS (
    SELECT
      cs.id,
      cs.status,
      cs.current_period_end,
      cs.cancel_at_period_end,
      cs.last_payment_failed_at,
      cs.last_payment_succeeded_at,
      cs.produkt_key,
      cs.aktualisiert_am,
      CASE
        WHEN cs.manuell_bestaetigt_am IS NOT NULL THEN 'ok'::thermocheck.subscription_access_state
        WHEN cs.access_state = 'blocked'::thermocheck.subscription_access_state THEN 'blocked'::thermocheck.subscription_access_state
        WHEN cs.current_period_end IS NOT NULL
             AND cs.current_period_end < (now() - interval '1 day')
             AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_succeeded_at < cs.current_period_end)
          THEN 'blocked'::thermocheck.subscription_access_state
        WHEN cs.current_period_end IS NOT NULL
             AND cs.current_period_end < now()
             AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_succeeded_at < cs.current_period_end)
          THEN 'warning'::thermocheck.subscription_access_state
        ELSE cs.access_state
      END AS eff_state
    FROM thermocheck.contractor_subscriptions cs
    WHERE cs.onboarding_id = v_onboarding_id
  )
  SELECT eff.eff_state, eff.id, eff.status, eff.current_period_end, eff.cancel_at_period_end, eff.last_payment_failed_at, eff.produkt_key
    FROM eff
   ORDER BY CASE eff.eff_state WHEN 'blocked' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
            eff.aktualisiert_am DESC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'ok'::thermocheck.subscription_access_state, NULL::UUID, NULL::thermocheck.subscription_status, NULL::TIMESTAMPTZ, FALSE, NULL::TIMESTAMPTZ, NULL::TEXT;
  END IF;
END;
$function$;

CREATE OR REPLACE VIEW thermocheck.v_subscription_health AS
 WITH last_paid_orders AS (
         SELECT cb.onboarding_id,
            cb.produkt_key,
            max(cb.paid_at) AS last_paid_at
           FROM thermocheck.contractor_bestellungen cb
          WHERE cb.stripe_payment_status = 'paid'::thermocheck.stripe_payment_status_enum
          GROUP BY cb.onboarding_id, cb.produkt_key
        ), last_orders AS (
         SELECT DISTINCT ON (cb.onboarding_id, cb.produkt_key) cb.onboarding_id,
            cb.produkt_key,
            cb.stripe_payment_status AS last_order_status
           FROM thermocheck.contractor_bestellungen cb
          ORDER BY cb.onboarding_id, cb.produkt_key, cb.created_at DESC
        )
 SELECT cs.id AS subscription_id,
    cs.onboarding_id,
    co.profile_id,
    COALESCE(p.vorname, co.vorname) AS vorname,
    COALESCE(p.nachname, co.nachname) AS nachname,
    COALESCE(p.email, co.ag_domain_email) AS email,
    co.onboarding_status::text AS onboarding_status,
        CASE
            WHEN co.is_trainer = true THEN 'ready'::text
            ELSE co.onboarding_status::text
        END AS effective_onboarding_status,
    co.current_step,
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
            WHEN cs.manuell_bestaetigt_am IS NOT NULL THEN 'ok'::text
            WHEN cs.current_period_end IS NOT NULL
                 AND cs.current_period_end < (now() - interval '1 day')
                 AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_succeeded_at < cs.current_period_end)
              THEN 'action_required'::text
            WHEN (cs.status::text = ANY (ARRAY['unpaid'::text, 'past_due'::text, 'incomplete_expired'::text])) OR cs.access_state::text = 'blocked'::text AND cs.status::text <> 'canceled'::text OR cs.consecutive_failures >= 1 OR cs.last_payment_failed_at IS NOT NULL AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_failed_at > cs.last_payment_succeeded_at) THEN 'action_required'::text
            WHEN cs.status::text = 'canceled'::text AND (cs.latest_invoice_status = 'paid'::text OR lpo.last_paid_at IS NOT NULL) THEN 'attention'::text
            WHEN cs.cancel_at_period_end = true THEN 'attention'::text
            WHEN cs.status::text = ANY (ARRAY['canceled'::text, 'incomplete'::text, 'paused'::text]) THEN 'attention'::text
            ELSE 'ok'::text
        END AS health_level,
        CASE
            WHEN cs.manuell_bestaetigt_am IS NOT NULL THEN 'Manuell bestätigt vom Innendienst'::text || COALESCE(' — '::text || cs.manuell_bestaetigt_notiz, ''::text)
            WHEN cs.current_period_end IS NOT NULL
                 AND cs.current_period_end < (now() - interval '1 day')
                 AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_succeeded_at < cs.current_period_end)
              THEN 'Periodenende überschritten — kein Webhook-Update von Stripe (Live-Sync nötig)'::text
            WHEN cs.status::text = ANY (ARRAY['unpaid'::text, 'past_due'::text]) THEN 'Zahlung offen — Abo droht zu sperren'::text
            WHEN cs.status::text = 'incomplete_expired'::text THEN 'Checkout nie abgeschlossen — Abo abgelaufen'::text
            WHEN cs.consecutive_failures >= 1 OR cs.last_payment_failed_at IS NOT NULL AND (cs.last_payment_succeeded_at IS NULL OR cs.last_payment_failed_at > cs.last_payment_succeeded_at) THEN 'Letzte Zahlung fehlgeschlagen'::text
            WHEN cs.status::text = 'canceled'::text AND (cs.latest_invoice_status = 'paid'::text OR lpo.last_paid_at IS NOT NULL) THEN 'Abo in Stripe gekündigt — letzte Rechnung bezahlt'::text
            WHEN cs.cancel_at_period_end = true THEN 'Abo läuft zum Periodenende aus'::text
            WHEN cs.status::text = 'canceled'::text THEN 'Abo gekündigt — keine bezahlte Rechnung hinterlegt'::text
            WHEN cs.status::text = 'incomplete'::text THEN 'Checkout begonnen, aber nicht abgeschlossen'::text
            WHEN cs.status::text = 'paused'::text THEN 'Abo pausiert'::text
            ELSE NULL::text
        END AS health_reason,
    cs.manuell_bestaetigt_am,
    cs.manuell_bestaetigt_von,
    cs.manuell_bestaetigt_notiz
   FROM thermocheck.contractor_subscriptions cs
     JOIN thermocheck.contractor_onboarding co ON co.id = cs.onboarding_id
     LEFT JOIN public.profiles p ON p.id = co.profile_id
     LEFT JOIN last_paid_orders lpo ON lpo.onboarding_id = cs.onboarding_id AND lpo.produkt_key = cs.produkt_key
     LEFT JOIN last_orders lo ON lo.onboarding_id = cs.onboarding_id AND lo.produkt_key = cs.produkt_key
  WHERE co.profile_id IS NOT NULL AND (co.onboarding_status::text <> ALL (ARRAY['gefeuert'::text, 'abgelehnt'::text, 'ausgestiegen'::text, 'deaktiviert'::text, 'inaktiv'::text]));
