CREATE OR REPLACE FUNCTION thermocheck.sync_stripe_payment_from_live(
  p_onboarding_id uuid,
  p_produkt_key text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_payment_intent_id text,
  p_betrag_brutto numeric,
  p_paid_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_existing_id uuid;
  v_produkt thermocheck.contractor_produkte%ROWTYPE;
  v_idem text;
  v_new_id uuid;
  v_action text;
BEGIN
  -- Idempotenz: Subscription bevorzugt, sonst PI
  v_idem := 'live-sync:' || COALESCE(p_stripe_subscription_id, p_stripe_payment_intent_id, '');
  IF v_idem = 'live-sync:' THEN
    RAISE EXCEPTION 'sync_stripe_payment_from_live: weder subscription_id noch payment_intent_id übergeben';
  END IF;

  -- Produkt-Stammdaten laden (für produkt_typ, Preise)
  SELECT * INTO v_produkt
  FROM thermocheck.contractor_produkte
  WHERE produkt_key = p_produkt_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unbekannter produkt_key: %', p_produkt_key;
  END IF;

  -- 1) Bereits eine paid-Zeile mit derselben Sub/PI? → idempotent no-op
  SELECT id INTO v_existing_id
  FROM thermocheck.contractor_bestellungen
  WHERE onboarding_id = p_onboarding_id
    AND (
      (p_stripe_subscription_id IS NOT NULL AND stripe_subscription_id = p_stripe_subscription_id)
      OR (p_stripe_payment_intent_id IS NOT NULL AND stripe_payment_intent_id = p_stripe_payment_intent_id)
    )
    AND stripe_payment_status = 'paid'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('action', 'noop_already_paid', 'order_id', v_existing_id);
  END IF;

  -- 2) Bestehende pending/failed Zeile für dieses Onboarding + Produkt? → updaten
  SELECT id INTO v_existing_id
  FROM thermocheck.contractor_bestellungen
  WHERE onboarding_id = p_onboarding_id
    AND produkt_key = p_produkt_key
    AND stripe_payment_status IN ('pending', 'failed')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE thermocheck.contractor_bestellungen
    SET stripe_payment_status = 'paid',
        paid_at = COALESCE(p_paid_at, now()),
        stripe_customer_id = COALESCE(stripe_customer_id, p_stripe_customer_id),
        stripe_subscription_id = COALESCE(stripe_subscription_id, p_stripe_subscription_id),
        stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, p_stripe_payment_intent_id),
        webhook_received_at = now()
    WHERE id = v_existing_id;
    v_action := 'updated';
    v_new_id := v_existing_id;
  ELSE
    -- 3) Keine Zeile vorhanden → neu anlegen (idempotent via idempotency_key)
    INSERT INTO thermocheck.contractor_bestellungen (
      onboarding_id, produkt_typ, produkt_key,
      stripe_customer_id, stripe_subscription_id, stripe_payment_intent_id,
      stripe_payment_status, paid_at, webhook_received_at,
      betrag_netto, betrag_brutto, menge, idempotency_key
    )
    VALUES (
      p_onboarding_id, v_produkt.produkt_typ, p_produkt_key,
      p_stripe_customer_id, p_stripe_subscription_id, p_stripe_payment_intent_id,
      'paid', COALESCE(p_paid_at, now()), now(),
      v_produkt.preis_netto, COALESCE(p_betrag_brutto, v_produkt.preis_brutto), 1, v_idem
    )
    ON CONFLICT (idempotency_key) DO UPDATE
      SET stripe_payment_status = 'paid',
          paid_at = COALESCE(thermocheck.contractor_bestellungen.paid_at, EXCLUDED.paid_at)
    RETURNING id INTO v_new_id;
    v_action := 'inserted';
  END IF;

  -- Audit-Log
  INSERT INTO thermocheck.contractor_audit_log (
    action_type, object_type, object_id, payload, actor_type, actor_name
  ) VALUES (
    'live_sync_paid', 'contractor_bestellung', v_new_id,
    jsonb_build_object(
      'matched_via', CASE WHEN p_stripe_subscription_id IS NOT NULL THEN 'subscription' ELSE 'payment_intent' END,
      'stripe_subscription_id', p_stripe_subscription_id,
      'stripe_payment_intent_id', p_stripe_payment_intent_id,
      'stripe_customer_id', p_stripe_customer_id,
      'produkt_key', p_produkt_key,
      'betrag_brutto', p_betrag_brutto,
      'action', v_action
    ),
    'system', 'stripe-live-sync'
  );

  RETURN jsonb_build_object('action', v_action, 'order_id', v_new_id);
END;
$$;

REVOKE ALL ON FUNCTION thermocheck.sync_stripe_payment_from_live(uuid, text, text, text, text, numeric, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION thermocheck.sync_stripe_payment_from_live(uuid, text, text, text, text, numeric, timestamptz) TO service_role;