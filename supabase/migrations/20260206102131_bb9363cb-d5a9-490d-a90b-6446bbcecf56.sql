-- Add stripe_event_id column to contractor_audit_log for webhook idempotency
ALTER TABLE thermocheck.contractor_audit_log 
ADD COLUMN IF NOT EXISTS stripe_event_id TEXT UNIQUE;

-- Add index for fast idempotency lookups
CREATE INDEX IF NOT EXISTS idx_contractor_audit_log_stripe_event_id 
ON thermocheck.contractor_audit_log(stripe_event_id) 
WHERE stripe_event_id IS NOT NULL;