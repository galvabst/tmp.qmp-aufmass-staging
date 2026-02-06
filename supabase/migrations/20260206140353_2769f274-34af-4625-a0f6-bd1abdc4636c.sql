-- Erst public wrapper droppen (hat Abhängigkeit auf thermocheck Funktion)
DROP FUNCTION IF EXISTS public.get_my_contractor_onboarding();

-- Dann thermocheck Funktion droppen
DROP FUNCTION IF EXISTS thermocheck.get_my_contractor_onboarding();

-- Thermocheck-Funktion mit erstellt_am neu erstellen
CREATE FUNCTION thermocheck.get_my_contractor_onboarding()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  onboarding_status thermocheck.contractor_onboarding_status_enum,
  onboarding_substatus thermocheck.contractor_onboarding_substatus_enum,
  trainer_freigabe boolean,
  trainer_freigabe_am timestamptz,
  trainer_freigabe_von uuid,
  ag_domain_email text,
  erstellt_am timestamptz,
  lektionen_abgeschlossen bigint,
  bestellungen_bezahlt bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    co.id,
    co.profile_id,
    co.onboarding_status,
    co.onboarding_substatus,
    co.trainer_freigabe,
    co.trainer_freigabe_am,
    co.trainer_freigabe_von,
    co.ag_domain_email,
    co.erstellt_am,
    (SELECT COUNT(*) 
     FROM thermocheck.contractor_akademie_lektions_fortschritt calf 
     WHERE calf.contractor_id = co.id 
     AND calf.status = 'completed') as lektionen_abgeschlossen,
    (SELECT COUNT(*) 
     FROM thermocheck.contractor_bestellungen cb 
     WHERE cb.onboarding_id = co.id 
     AND cb.stripe_payment_status = 'paid') as bestellungen_bezahlt
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = auth.uid();
END;
$$;

-- Public wrapper neu erstellen
CREATE FUNCTION public.get_my_contractor_onboarding()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  onboarding_status thermocheck.contractor_onboarding_status_enum,
  onboarding_substatus thermocheck.contractor_onboarding_substatus_enum,
  trainer_freigabe boolean,
  trainer_freigabe_am timestamptz,
  trainer_freigabe_von uuid,
  ag_domain_email text,
  erstellt_am timestamptz,
  lektionen_abgeschlossen bigint,
  bestellungen_bezahlt bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM thermocheck.get_my_contractor_onboarding();
END;
$$;