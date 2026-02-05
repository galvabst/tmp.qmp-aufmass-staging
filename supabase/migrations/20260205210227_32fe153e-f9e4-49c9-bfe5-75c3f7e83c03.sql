-- Fix: get_contractor_address verwendet falsches Schema für is_admin()
-- Ändere thermocheck.is_admin() → public.is_admin()

CREATE OR REPLACE FUNCTION public.get_contractor_address(p_profile_id uuid)
RETURNS TABLE(
  anschrift_strasse text,
  anschrift_plz text,
  anschrift_ort text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  -- Nur eigene Adresse oder Admin darf andere sehen
  IF auth.uid() != p_profile_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    co.anschrift_strasse,
    co.anschrift_plz,
    co.anschrift_ort
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id
  LIMIT 1;
END;
$$;

-- Sicherstellen dass authenticated-User die Funktion aufrufen können
GRANT EXECUTE ON FUNCTION public.get_contractor_address(uuid) TO authenticated;