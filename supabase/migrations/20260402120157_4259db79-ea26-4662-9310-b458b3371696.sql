UPDATE thermocheck.contractor_onboarding SET onboarding_substatus = 
  CASE 
    WHEN onboarding_status = 'ready' THEN NULL
    WHEN current_step IS NULL THEN 'neu_angelegt'
    WHEN current_step = 'profil' THEN 'stammdaten_erfasst'
    WHEN current_step = 'dokumente' THEN 'stammdaten_erfasst'
    WHEN current_step IN ('bestellungen','equipment') THEN 'kleidung_bestellen'
    WHEN current_step = 'akademie' THEN 'akademie_gestartet'
    WHEN current_step IN ('coaching','nachweise') 
      AND 'akademie' = ANY(completed_steps) THEN 'akademie_abgeschlossen'
    ELSE onboarding_substatus
  END
WHERE onboarding_status NOT IN ('deaktiviert','gefeuert','ready');