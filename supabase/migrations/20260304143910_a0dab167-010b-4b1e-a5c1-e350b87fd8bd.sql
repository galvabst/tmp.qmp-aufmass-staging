
-- Reset coaching booking on the thermocheck_auftraege
UPDATE thermocheck.thermocheck_auftraege 
SET coaching_gebucht_von = NULL, coaching_gebucht_am = NULL 
WHERE id = '58ee2606-238e-4275-9c5d-654a5b5202f0';

-- Reset onboarding completed_steps (remove 'coaching')
UPDATE thermocheck.contractor_onboarding 
SET completed_steps = ARRAY['profil','dokumente','bestellungen','equipment','akademie']
WHERE id = 'a22e88c2-95fe-4b24-a04b-cece2f792d96';
