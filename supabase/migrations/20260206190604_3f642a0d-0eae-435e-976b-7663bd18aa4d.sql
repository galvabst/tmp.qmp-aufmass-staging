-- TEMPORÄR: Status auf "ready" setzen, damit der User die App sehen kann
-- MUSS danach zurückgesetzt werden!
UPDATE thermocheck.contractor_onboarding 
SET onboarding_status = 'ready', trainer_freigabe = true 
WHERE id = 'dd56c32f-179c-41d0-9453-5afa5024ecc3';
