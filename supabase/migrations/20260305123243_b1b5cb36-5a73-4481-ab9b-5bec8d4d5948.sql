-- Fix: Mark all in_progress lektion records as completed for contractors who already passed akademie
UPDATE thermocheck.contractor_akademie_lektions_fortschritt f
SET status = 'completed', completed_at = COALESCE(f.started_at, now())
FROM thermocheck.contractor_onboarding o
WHERE f.contractor_id = o.id
  AND f.status = 'in_progress'
  AND 'akademie' = ANY(o.completed_steps);