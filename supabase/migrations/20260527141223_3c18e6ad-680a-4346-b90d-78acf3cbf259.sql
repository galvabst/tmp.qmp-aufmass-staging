
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN IF NOT EXISTS stripe_customer_ids text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_contractor_onboarding_stripe_customer_ids
  ON thermocheck.contractor_onboarding USING GIN (stripe_customer_ids);

COMMENT ON COLUMN thermocheck.contractor_onboarding.stripe_customer_ids IS
  'Alle Stripe-Customer-IDs, die je für diesen Techniker beobachtet wurden. Wird vom stripe-sync-contractor Edge-Function gepflegt. Mehrwert: Live-Sync findet alle parallelen Subscriptions auch wenn DB-Subscriptions veraltet sind.';
