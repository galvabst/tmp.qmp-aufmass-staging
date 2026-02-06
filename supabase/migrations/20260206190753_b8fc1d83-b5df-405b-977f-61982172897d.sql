-- ZURÜCKSETZEN: Status wieder auf "invited" setzen
UPDATE thermocheck.contractor_onboarding 
SET onboarding_status = 'invited', trainer_freigabe = false 
WHERE id = 'dd56c32f-179c-41d0-9453-5afa5024ecc3';
