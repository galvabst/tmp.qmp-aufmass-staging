
-- The previous migration already dropped these, but the error suggests they were recreated
-- with partial return types. Drop again explicitly.
DROP FUNCTION IF EXISTS public.get_my_contractor_onboarding();
DROP FUNCTION IF EXISTS thermocheck.get_my_contractor_onboarding();
