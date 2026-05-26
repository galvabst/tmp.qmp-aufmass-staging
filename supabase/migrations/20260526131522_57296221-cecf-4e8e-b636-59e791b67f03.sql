
-- ENUMs
DO $$ BEGIN
  CREATE TYPE thermocheck.subscription_status AS ENUM (
    'active', 'past_due', 'unpaid', 'canceled',
    'incomplete', 'incomplete_expired', 'paused', 'trialing'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE thermocheck.subscription_access_state AS ENUM ('ok', 'warning', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- contractor_subscriptions
CREATE TABLE IF NOT EXISTS thermocheck.contractor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  produkt_key TEXT,
  status thermocheck.subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  latest_invoice_id TEXT,
  latest_invoice_status TEXT,
  last_payment_failed_at TIMESTAMPTZ,
  last_payment_failed_reason TEXT,
  last_payment_succeeded_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  access_state thermocheck.subscription_access_state NOT NULL DEFAULT 'ok',
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktualisiert_am TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csubs_onboarding ON thermocheck.contractor_subscriptions(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_csubs_status ON thermocheck.contractor_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_csubs_access ON thermocheck.contractor_subscriptions(access_state);

-- events
CREATE TABLE IF NOT EXISTS thermocheck.contractor_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES thermocheck.contractor_subscriptions(id) ON DELETE CASCADE,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  invoice_id TEXT,
  invoice_status TEXT,
  amount_brutto NUMERIC(10,2),
  failure_reason TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  raw_payload JSONB,
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_csub_events_subscription ON thermocheck.contractor_subscription_events(subscription_id, erstellt_am DESC);
CREATE INDEX IF NOT EXISTS idx_csub_events_type ON thermocheck.contractor_subscription_events(event_type);

-- aktualisiert_am trigger
CREATE OR REPLACE FUNCTION thermocheck.set_subscription_aktualisiert_am()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.aktualisiert_am := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_csubs_aktualisiert ON thermocheck.contractor_subscriptions;
CREATE TRIGGER trg_csubs_aktualisiert
  BEFORE UPDATE ON thermocheck.contractor_subscriptions
  FOR EACH ROW EXECUTE FUNCTION thermocheck.set_subscription_aktualisiert_am();

-- derive from event
CREATE OR REPLACE FUNCTION thermocheck.derive_subscription_state_from_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = thermocheck, public AS $$
DECLARE
  v_sub thermocheck.contractor_subscriptions%ROWTYPE;
  v_new_access thermocheck.subscription_access_state;
BEGIN
  SELECT * INTO v_sub FROM thermocheck.contractor_subscriptions WHERE id = NEW.subscription_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.event_type = 'invoice.paid' THEN
    UPDATE thermocheck.contractor_subscriptions
       SET last_payment_succeeded_at = COALESCE(NEW.erstellt_am, now()),
           consecutive_failures = 0,
           latest_invoice_id = COALESCE(NEW.invoice_id, latest_invoice_id),
           latest_invoice_status = 'paid'
     WHERE id = NEW.subscription_id;
  ELSIF NEW.event_type = 'invoice.payment_failed' THEN
    UPDATE thermocheck.contractor_subscriptions
       SET last_payment_failed_at = COALESCE(NEW.erstellt_am, now()),
           last_payment_failed_reason = NEW.failure_reason,
           consecutive_failures = consecutive_failures + 1,
           latest_invoice_id = COALESCE(NEW.invoice_id, latest_invoice_id),
           latest_invoice_status = COALESCE(NEW.invoice_status, 'open')
     WHERE id = NEW.subscription_id;
  END IF;

  SELECT * INTO v_sub FROM thermocheck.contractor_subscriptions WHERE id = NEW.subscription_id;
  v_new_access := CASE
    WHEN v_sub.status IN ('unpaid','canceled','incomplete_expired') THEN 'blocked'::thermocheck.subscription_access_state
    WHEN v_sub.status = 'past_due' OR v_sub.cancel_at_period_end = TRUE OR v_sub.consecutive_failures >= 1 THEN 'warning'::thermocheck.subscription_access_state
    ELSE 'ok'::thermocheck.subscription_access_state
  END;
  IF v_new_access IS DISTINCT FROM v_sub.access_state THEN
    UPDATE thermocheck.contractor_subscriptions SET access_state = v_new_access WHERE id = NEW.subscription_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_csub_events_derive ON thermocheck.contractor_subscription_events;
CREATE TRIGGER trg_csub_events_derive
  AFTER INSERT ON thermocheck.contractor_subscription_events
  FOR EACH ROW EXECUTE FUNCTION thermocheck.derive_subscription_state_from_event();

-- recompute access_state on row change
CREATE OR REPLACE FUNCTION thermocheck.recompute_subscription_access_state()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.access_state := CASE
    WHEN NEW.status IN ('unpaid','canceled','incomplete_expired') THEN 'blocked'::thermocheck.subscription_access_state
    WHEN NEW.status = 'past_due' OR NEW.cancel_at_period_end = TRUE OR NEW.consecutive_failures >= 1 THEN 'warning'::thermocheck.subscription_access_state
    ELSE 'ok'::thermocheck.subscription_access_state
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_csubs_access ON thermocheck.contractor_subscriptions;
CREATE TRIGGER trg_csubs_access
  BEFORE INSERT OR UPDATE OF status, cancel_at_period_end, consecutive_failures
  ON thermocheck.contractor_subscriptions
  FOR EACH ROW EXECUTE FUNCTION thermocheck.recompute_subscription_access_state();

-- RLS
ALTER TABLE thermocheck.contractor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thermocheck.contractor_subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Techniker sehen eigene Subscriptions" ON thermocheck.contractor_subscriptions;
CREATE POLICY "Techniker sehen eigene Subscriptions"
  ON thermocheck.contractor_subscriptions FOR SELECT TO authenticated
  USING (
    onboarding_id IN (SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid())
    OR thermocheck.is_innendienst()
  );

DROP POLICY IF EXISTS "Innendienst verwaltet Subscriptions" ON thermocheck.contractor_subscriptions;
CREATE POLICY "Innendienst verwaltet Subscriptions"
  ON thermocheck.contractor_subscriptions FOR ALL TO authenticated
  USING (thermocheck.is_innendienst())
  WITH CHECK (thermocheck.is_innendienst());

DROP POLICY IF EXISTS "Techniker sehen eigene Subscription-Events" ON thermocheck.contractor_subscription_events;
CREATE POLICY "Techniker sehen eigene Subscription-Events"
  ON thermocheck.contractor_subscription_events FOR SELECT TO authenticated
  USING (
    subscription_id IN (
      SELECT cs.id FROM thermocheck.contractor_subscriptions cs
      JOIN thermocheck.contractor_onboarding co ON co.id = cs.onboarding_id
      WHERE co.profile_id = auth.uid()
    ) OR thermocheck.is_innendienst()
  );

DROP POLICY IF EXISTS "Innendienst verwaltet Subscription-Events" ON thermocheck.contractor_subscription_events;
CREATE POLICY "Innendienst verwaltet Subscription-Events"
  ON thermocheck.contractor_subscription_events FOR ALL TO authenticated
  USING (thermocheck.is_innendienst())
  WITH CHECK (thermocheck.is_innendienst());

-- RPC für Techniker-Gate
CREATE OR REPLACE FUNCTION thermocheck.get_my_subscription_access()
RETURNS TABLE (
  access_state thermocheck.subscription_access_state,
  worst_subscription_id UUID,
  worst_status thermocheck.subscription_status,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  last_payment_failed_at TIMESTAMPTZ,
  produkt_key TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = thermocheck, public AS $$
DECLARE v_onboarding_id UUID;
BEGIN
  SELECT id INTO v_onboarding_id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid() LIMIT 1;
  IF v_onboarding_id IS NULL THEN
    RETURN QUERY SELECT 'ok'::thermocheck.subscription_access_state, NULL::UUID, NULL::thermocheck.subscription_status, NULL::TIMESTAMPTZ, FALSE, NULL::TIMESTAMPTZ, NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT cs.access_state, cs.id, cs.status, cs.current_period_end, cs.cancel_at_period_end, cs.last_payment_failed_at, cs.produkt_key
    FROM thermocheck.contractor_subscriptions cs
   WHERE cs.onboarding_id = v_onboarding_id
   ORDER BY CASE cs.access_state WHEN 'blocked' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
            cs.aktualisiert_am DESC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'ok'::thermocheck.subscription_access_state, NULL::UUID, NULL::thermocheck.subscription_status, NULL::TIMESTAMPTZ, FALSE, NULL::TIMESTAMPTZ, NULL::TEXT;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION thermocheck.get_my_subscription_access() TO authenticated;

-- Admin view
CREATE OR REPLACE VIEW thermocheck.v_subscription_health AS
SELECT
  cs.id AS subscription_id,
  cs.onboarding_id,
  co.profile_id,
  co.vorname,
  co.nachname,
  co.ag_domain_email AS email,
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
JOIN thermocheck.contractor_onboarding co ON co.id = cs.onboarding_id;

GRANT SELECT ON thermocheck.v_subscription_health TO authenticated;
