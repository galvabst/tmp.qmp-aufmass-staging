DO $$
DECLARE
  v_michel_profile uuid := 'f41fe4f6-6126-4e7f-be04-dc3715247ea3';
  v_brian_profile  uuid := '70c3a23e-5497-49e9-b606-0370324b98cf';
  v_arthur_profile uuid := '2c05c58d-2881-4b3d-b51f-e42b772519f4';
  v_arthur_onb_id  uuid := 'd27fc078-562f-423b-b0cf-b7d5353c30b1';
  v_arthur_name    text;
  v_auftrag_chemnitz uuid := 'ac1db288-f9ee-4175-a9ae-5b3b8f26577a';
  v_auftrag_witten   uuid := 'b3ccb43a-87e9-4cba-9c39-0a2a2e8c40f6';
  v_auftrag_essen    uuid := '9f99fdcf-5709-4b76-8292-4e73b4373987';
  v_chemnitz_termin date;
  v_witten_termin   date;
BEGIN
  SELECT TRIM(COALESCE(vorname,'') || ' ' || COALESCE(nachname,''))
    INTO v_arthur_name
    FROM public.profiles WHERE id = v_arthur_profile;

  -- Vorbedingung: alle drei Aufträge gehören Arthur, sind noch nicht gebucht & nicht bewertet
  IF (SELECT COUNT(*) FROM thermocheck.thermocheck_auftraege
        WHERE id IN (v_auftrag_chemnitz, v_auftrag_witten, v_auftrag_essen)
          AND zugewiesener_techniker_id = v_arthur_onb_id
          AND coaching_bewertung = 'ausstehend'
          AND coaching_gebucht_von IS NULL) <> 3 THEN
    RAISE EXCEPTION 'Vorbedingung verletzt: Auftrag falsch zugeordnet, bereits gebucht oder bereits bewertet';
  END IF;

  -- Termine ermitteln für Onboarding-Felder
  SELECT datum INTO v_chemnitz_termin
    FROM thermocheck.thermocheck_terminvorschlaege
   WHERE thermocheck_auftrag_id = v_auftrag_chemnitz
   ORDER BY sortierung ASC LIMIT 1;

  SELECT datum INTO v_witten_termin
    FROM thermocheck.thermocheck_terminvorschlaege
   WHERE thermocheck_auftrag_id = v_auftrag_witten
   ORDER BY sortierung ASC LIMIT 1;

  -- Aufträge buchen (Bewertung bleibt 'ausstehend')
  UPDATE thermocheck.thermocheck_auftraege
     SET coaching_gebucht_von = v_michel_profile, coaching_gebucht_am = now()
   WHERE id = v_auftrag_chemnitz;

  UPDATE thermocheck.thermocheck_auftraege
     SET coaching_gebucht_von = v_brian_profile, coaching_gebucht_am = now()
   WHERE id = v_auftrag_witten;

  UPDATE thermocheck.thermocheck_auftraege
     SET coaching_gebucht_von = v_brian_profile, coaching_gebucht_am = now()
   WHERE id = v_auftrag_essen;

  -- Onboarding-Felder synchronisieren (Trainee sieht Coach + Termin)
  UPDATE thermocheck.contractor_onboarding
     SET gebuchter_coaching_termin = v_chemnitz_termin,
         gebuchter_coach_name      = v_arthur_name
   WHERE profile_id = v_michel_profile;

  UPDATE thermocheck.contractor_onboarding
     SET gebuchter_coaching_termin = v_witten_termin,
         gebuchter_coach_name      = v_arthur_name
   WHERE profile_id = v_brian_profile;
END $$;