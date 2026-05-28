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
  SELECT DISTINCT
    p.id,
    p.vorname,
    p.nachname,
    p.email,
    p.telefon,
    p.avatar_url,
    p.created_at AS erstellt_am
  FROM public.profiles p
  WHERE thermocheck.is_innendienst()
    AND NOT EXISTS (
      SELECT 1
      FROM thermocheck.contractor_onboarding o
      WHERE o.profile_id = p.id
    )
    AND EXISTS (
      SELECT 1
      FROM iam.user_access_groups uag
      JOIN iam.access_groups ag ON ag.id = uag.access_group_id
      LEFT JOIN iam.applications app ON app.id = ag.application_id
      WHERE uag.user_id = p.id
        AND (
          app.code::text = 'aufmass_meister'
          OR ag.name ILIKE '%thermocheck%'
          OR ag.name ILIKE '%thermo-check%'
          OR ag.name ILIKE '%feinaufmaß%'
          OR ag.name ILIKE '%feinaufmass%'
          OR ag.name ILIKE '%aufmaß dienstleister%'
          OR ag.name ILIKE '%aufmass dienstleister%'
        )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM iam.user_system_roles r
      WHERE r.user_id = p.id
        AND r.role::text IN ('admin', 'superadmin', 'manager')
    );
$$;

GRANT EXECUTE ON FUNCTION thermocheck.get_potential_technicians() TO authenticated;

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
SET search_path = public, thermocheck, iam
AS $$
  SELECT * FROM thermocheck.get_potential_technicians();
$$;

GRANT EXECUTE ON FUNCTION public.get_potential_technicians() TO authenticated;