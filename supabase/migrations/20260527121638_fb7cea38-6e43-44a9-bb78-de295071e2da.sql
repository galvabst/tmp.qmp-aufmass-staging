
-- Step transition history derived from contractor_audit_log
CREATE OR REPLACE VIEW thermocheck.v_contractor_step_history AS
WITH transitions AS (
  SELECT
    (object_id)::uuid AS onboarding_id,
    timestamp AS changed_at,
    NULLIF(payload->'old'->>'current_step', '') AS from_step,
    NULLIF(payload->'new'->>'current_step', '') AS to_step
  FROM thermocheck.contractor_audit_log
  WHERE action_type = 'contractor_onboarding_updated'
    AND object_type IS NOT DISTINCT FROM object_type
    AND COALESCE(payload->'old'->>'current_step','') IS DISTINCT FROM COALESCE(payload->'new'->>'current_step','')
),
inserts AS (
  SELECT
    (object_id)::uuid AS onboarding_id,
    timestamp AS changed_at,
    NULL::text AS from_step,
    NULLIF(payload->'new'->>'current_step', '') AS to_step
  FROM thermocheck.contractor_audit_log
  WHERE action_type = 'contractor_onboarding_insertd'
),
all_events AS (
  SELECT * FROM inserts
  UNION ALL
  SELECT * FROM transitions
),
ordered AS (
  SELECT
    e.*,
    LEAD(e.changed_at) OVER (PARTITION BY e.onboarding_id ORDER BY e.changed_at) AS next_changed_at
  FROM all_events e
)
SELECT
  onboarding_id,
  from_step,
  to_step,
  changed_at,
  next_changed_at,
  EXTRACT(EPOCH FROM (COALESCE(next_changed_at, now()) - changed_at))::bigint AS duration_seconds,
  (next_changed_at IS NULL) AS is_current
FROM ordered
WHERE to_step IS NOT NULL;

GRANT SELECT ON thermocheck.v_contractor_step_history TO authenticated, service_role;

-- Aggregated summary per (onboarding, step)
CREATE OR REPLACE VIEW thermocheck.v_contractor_step_summary AS
SELECT
  onboarding_id,
  to_step AS step,
  SUM(duration_seconds)::bigint AS total_seconds,
  COUNT(*)::int AS entered_count,
  MAX(changed_at) AS last_entered_at,
  bool_or(is_current) AS is_current
FROM thermocheck.v_contractor_step_history
GROUP BY onboarding_id, to_step;

GRANT SELECT ON thermocheck.v_contractor_step_summary TO authenticated, service_role;

-- RPC: timeline for one technician
CREATE OR REPLACE FUNCTION thermocheck.get_contractor_step_timeline(_onboarding_id uuid)
RETURNS TABLE (
  step text,
  total_seconds bigint,
  entered_count int,
  last_entered_at timestamptz,
  is_current boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  IF NOT thermocheck.is_innendienst() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT s.step, s.total_seconds, s.entered_count, s.last_entered_at, s.is_current
  FROM thermocheck.v_contractor_step_summary s
  WHERE s.onboarding_id = _onboarding_id
  ORDER BY s.last_entered_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION thermocheck.get_contractor_step_timeline(uuid) TO authenticated;

-- Public wrapper for PostgREST
CREATE OR REPLACE FUNCTION public.get_contractor_step_timeline(_onboarding_id uuid)
RETURNS TABLE (
  step text,
  total_seconds bigint,
  entered_count int,
  last_entered_at timestamptz,
  is_current boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
  SELECT * FROM thermocheck.get_contractor_step_timeline(_onboarding_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_contractor_step_timeline(uuid) TO authenticated;
