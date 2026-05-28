CREATE OR REPLACE FUNCTION thermocheck.get_potential_technicians()
RETURNS TABLE (
  id uuid,
  vorname text,
  nachname text,
  email text,
  telefon text,
  avatar_url text,
  erstellt_am timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, thermocheck, iam
AS $$
  SELECT p.id, p.vorname, p.nachname, p.email, p.telefon, p.avatar_url, p.created_at AS erstellt_am
  FROM public.profiles p
  WHERE p.email ILIKE '%@galvanek-bau.de'
    AND NOT EXISTS (
      SELECT 1 FROM thermocheck.contractor_onboarding o WHERE o.profile_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM iam.user_system_roles r
      WHERE r.user_id = p.id AND r.role::text IN ('admin','superadmin','manager')
    )
    AND thermocheck.is_innendienst();
$$;

GRANT EXECUTE ON FUNCTION thermocheck.get_potential_technicians() TO authenticated;

-- Expose via public wrapper so PostgREST can call it without schema header
CREATE OR REPLACE FUNCTION public.get_potential_technicians()
RETURNS TABLE (
  id uuid,
  vorname text,
  nachname text,
  email text,
  telefon text,
  avatar_url text,
  erstellt_am timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
  SELECT * FROM thermocheck.get_potential_technicians();
$$;

GRANT EXECUTE ON FUNCTION public.get_potential_technicians() TO authenticated;