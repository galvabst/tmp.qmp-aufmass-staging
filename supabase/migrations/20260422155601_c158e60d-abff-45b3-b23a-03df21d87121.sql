UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = COALESCE(paid_at, now())
WHERE produkt_key = 'schlappen'
  AND stripe_payment_status = 'pending'
  AND onboarding_id IN (
    SELECT o.id FROM thermocheck.contractor_onboarding o
    JOIN public.profiles p ON p.id = o.profile_id
    WHERE p.vorname ILIKE 'Yilmaz' AND p.nachname ILIKE 'Akhan'
  );