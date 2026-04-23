CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, iam
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM iam.user_system_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_superadmin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO service_role, authenticated;

CREATE OR REPLACE FUNCTION public.log_impersonation(
  _admin_user_id uuid,
  _target_user_id uuid,
  _reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, iam
AS $$
DECLARE
  _id uuid;
BEGIN
  IF NOT public.is_superadmin(_admin_user_id) THEN
    RAISE EXCEPTION 'Forbidden: only superadmins can impersonate';
  END IF;

  INSERT INTO iam.impersonation_log (admin_user_id, target_user_id, reason)
  VALUES (_admin_user_id, _target_user_id, _reason)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_impersonation(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_impersonation(uuid, uuid, text) TO service_role;