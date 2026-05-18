-- Manueller Push Alexandra Jaap bis "vor Einweisung"
-- onboarding_id: 2c5709de-bda3-4b56-b626-46feaa1c2eb9
-- trainer (Vincent Heth) profile_id: f9efb2ed-eccf-409e-ac57-b22ff6ad7761

UPDATE thermocheck.contractor_onboarding
SET
  akademie_test_bestanden = TRUE,
  coaching_bewertung = 'bestanden',
  coaching_bewertung_am = COALESCE(coaching_bewertung_am, NOW()),
  praxistest_eingereicht_am = COALESCE(praxistest_eingereicht_am, NOW()),
  praxistest_freigabe = TRUE,
  praxistest_freigabe_am = COALESCE(praxistest_freigabe_am, NOW()),
  praxistest_freigabe_von = 'f9efb2ed-eccf-409e-ac57-b22ff6ad7761',
  trainer_freigabe = TRUE,
  trainer_freigabe_am = COALESCE(trainer_freigabe_am, NOW()),
  trainer_freigabe_von = 'f9efb2ed-eccf-409e-ac57-b22ff6ad7761',
  aktualisiert_am = NOW()
WHERE id = '2c5709de-bda3-4b56-b626-46feaa1c2eb9';
