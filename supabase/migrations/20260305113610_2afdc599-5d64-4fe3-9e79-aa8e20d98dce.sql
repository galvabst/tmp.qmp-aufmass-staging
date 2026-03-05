-- Fix Anton Berger: set onboarding_status to 'ready' since all steps completed and all flags set
UPDATE thermocheck.contractor_onboarding
SET onboarding_status = 'ready'
WHERE id = '66912458-4735-4e2a-9942-9c3bb525f447'
  AND onboarding_status != 'ready';