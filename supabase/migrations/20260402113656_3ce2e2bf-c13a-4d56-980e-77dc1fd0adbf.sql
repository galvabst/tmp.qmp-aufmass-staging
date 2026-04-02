UPDATE thermocheck.contractor_onboarding
SET mitfahrt_bezahlt_am = now(),
    onboarding_status = 'ready',
    onboarding_substatus = NULL,
    completed_steps = ARRAY['profil','dokumente','bestellungen','equipment','akademie','coaching','nachweise']
WHERE id IN (
  'd27fc078-562f-423b-b0cf-b7d5353c30b1',
  'f52afad9-484e-4ee8-8743-7c3429afbd14',
  '07d92f25-fb65-4f71-8342-29a0a2821ebd'
);