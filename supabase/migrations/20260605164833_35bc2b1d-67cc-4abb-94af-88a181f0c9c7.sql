CREATE OR REPLACE FUNCTION thermocheck.sync_bestellung_to_onboarding_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'thermocheck', 'public'
AS $function$
DECLARE
  v_open_count int;
  v_paid_count int;
  v_onboarding_id uuid := COALESCE(NEW.onboarding_id, OLD.onboarding_id);
  v_typ thermocheck.contractor_bestellung_produkt_typ_enum := COALESCE(NEW.produkt_typ, OLD.produkt_typ);
BEGIN
  IF v_typ::text NOT IN ('kleidung','lizenz') THEN
    RETURN NEW;
  END IF;

  SELECT
    count(*) FILTER (WHERE stripe_payment_status = 'paid' AND intern_abgeschlossen = false),
    count(*) FILTER (WHERE stripe_payment_status = 'paid')
  INTO v_open_count, v_paid_count
  FROM thermocheck.contractor_bestellungen
  WHERE onboarding_id = v_onboarding_id
    AND produkt_typ = v_typ;

  IF v_typ::text = 'kleidung' THEN
    UPDATE thermocheck.contractor_onboarding
       SET kleidung_bestellt_intern = (v_paid_count > 0 AND v_open_count = 0)
     WHERE id = v_onboarding_id
       AND kleidung_bestellt_intern IS DISTINCT FROM (v_paid_count > 0 AND v_open_count = 0);
  ELSE
    UPDATE thermocheck.contractor_onboarding
       SET lizenzen_bereitgestellt_intern = (v_paid_count > 0 AND v_open_count = 0)
     WHERE id = v_onboarding_id
       AND lizenzen_bereitgestellt_intern IS DISTINCT FROM (v_paid_count > 0 AND v_open_count = 0);
  END IF;

  RETURN NEW;
END;
$function$;