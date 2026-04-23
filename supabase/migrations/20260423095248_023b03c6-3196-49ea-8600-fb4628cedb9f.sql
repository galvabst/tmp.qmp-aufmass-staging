
CREATE TABLE IF NOT EXISTS iam.impersonation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_impersonation_log_admin ON iam.impersonation_log(admin_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_log_target ON iam.impersonation_log(target_user_id, started_at DESC);

ALTER TABLE iam.impersonation_log ENABLE ROW LEVEL SECURITY;

-- Nur Superadmins dürfen lesen
DROP POLICY IF EXISTS "Superadmins can view impersonation log" ON iam.impersonation_log;
CREATE POLICY "Superadmins can view impersonation log"
ON iam.impersonation_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM iam.user_system_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- Schreiben passiert nur via Service-Role aus Edge Function — keine INSERT/UPDATE-Policy für Clients
