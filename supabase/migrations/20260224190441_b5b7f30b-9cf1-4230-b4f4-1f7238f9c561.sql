UPDATE thermocheck.contractor_onboarding
SET 
  completed_steps = ARRAY['profil','dokumente','bestellungen','equipment','akademie','coaching','nachweise'],
  current_step = 'nachweise'
WHERE profile_id = 'd88929cb-5156-45e1-8082-b4c22c42c472';