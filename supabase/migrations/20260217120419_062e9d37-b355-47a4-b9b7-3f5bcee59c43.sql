
-- Drop und Neuanlage der thermocheck RPC mit is_trainer
DROP FUNCTION IF EXISTS thermocheck.get_my_contractor_onboarding();

CREATE FUNCTION thermocheck.get_my_contractor_onboarding()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  onboarding_status text,
  onboarding_substatus text,
  trainer_freigabe boolean,
  trainer_freigabe_am timestamptz,
  trainer_freigabe_von uuid,
  ag_domain_email text,
  erstellt_am timestamptz,
  lektionen_abgeschlossen bigint,
  bestellungen_bezahlt bigint,
  vertrag_geprueft_intern boolean,
  kleidung_bestellt_intern boolean,
  lizenzen_bereitgestellt_intern boolean,
  is_trainer boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = thermocheck
AS $$
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
    COALESCE((
      SELECT COUNT(*)
      FROM thermocheck.contractor_akademie_lektions_fortschritt lf
      WHERE lf.contractor_id = co.profile_id AND lf.status = 'completed'
    ), 0) AS lektionen_abgeschlossen,
    COALESCE((
      SELECT COUNT(*)
      FROM thermocheck.contractor_bestellungen cb
      WHERE cb.onboarding_id = co.id AND cb.stripe_payment_status = 'paid'
    ), 0) AS bestellungen_bezahlt,
    co.vertrag_geprueft_intern,
    co.kleidung_bestellt_intern,
    co.lizenzen_bereitgestellt_intern,
    co.is_trainer
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = auth.uid()
  LIMIT 1;
$$;

-- Public Wrapper neu anlegen (gleiche Signatur)
DROP FUNCTION IF EXISTS public.get_my_contractor_onboarding();

CREATE FUNCTION public.get_my_contractor_onboarding()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  onboarding_status text,
  onboarding_substatus text,
  trainer_freigabe boolean,
  trainer_freigabe_am timestamptz,
  trainer_freigabe_von uuid,
  ag_domain_email text,
  erstellt_am timestamptz,
  lektionen_abgeschlossen bigint,
  bestellungen_bezahlt bigint,
  vertrag_geprueft_intern boolean,
  kleidung_bestellt_intern boolean,
  lizenzen_bereitgestellt_intern boolean,
  is_trainer boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM thermocheck.get_my_contractor_onboarding();
$$;
