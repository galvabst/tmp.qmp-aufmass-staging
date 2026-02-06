
UPDATE thermocheck.contractor_onboarding
SET 
  onboarding_status = 'ready',
  trainer_freigabe = true,
  trainer_freigabe_am = now(),
  current_step = 'coaching',
  completed_steps = ARRAY['profil','dokumente','bestellungen','equipment','akademie','nachweise','coaching'],
  gewerbeschein_spaeter = true
WHERE id = '17ef2646-e455-4d99-88ad-443b44ed9594';
