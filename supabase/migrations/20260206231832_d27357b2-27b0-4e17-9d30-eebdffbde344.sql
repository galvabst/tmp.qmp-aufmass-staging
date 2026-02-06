
-- Set Anton's internal checks to true
UPDATE thermocheck.contractor_onboarding
SET vertrag_geprueft_intern = true,
    kleidung_bestellt_intern = true,
    lizenzen_bereitgestellt_intern = true
WHERE profile_id = '17ef2646-e455-4d99-88ad-443b44ed9594';
