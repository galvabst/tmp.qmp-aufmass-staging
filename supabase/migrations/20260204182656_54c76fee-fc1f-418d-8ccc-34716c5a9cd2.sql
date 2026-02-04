
-- =====================================================
-- Fehlende Spalten aus erster Migration hinzufügen
-- =====================================================

-- 1. Content-Versionierung für Akademie-Lektionen
ALTER TABLE thermocheck.contractor_akademie_lektionen 
ADD COLUMN IF NOT EXISTS content_version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN thermocheck.contractor_akademie_lektionen.content_version IS 
  'Wird nur bei inhaltlichen Änderungen (neues Video) hochgezählt';

-- 2. Completed-for-Version im Fortschritt
ALTER TABLE thermocheck.contractor_akademie_lektions_fortschritt 
ADD COLUMN IF NOT EXISTS completed_for_version integer;

COMMENT ON COLUMN thermocheck.contractor_akademie_lektions_fortschritt.completed_for_version IS 
  'Bei welcher Content-Version wurde die Lektion abgeschlossen';

-- 3. Trainer-Freigabe in Onboarding
ALTER TABLE thermocheck.contractor_onboarding 
ADD COLUMN IF NOT EXISTS trainer_freigabe boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trainer_freigabe_am timestamptz,
ADD COLUMN IF NOT EXISTS trainer_freigabe_von uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN thermocheck.contractor_onboarding.trainer_freigabe IS 'Hat Aufmaßtrainer zugestimmt?';
COMMENT ON COLUMN thermocheck.contractor_onboarding.trainer_freigabe_am IS 'Zeitpunkt der Freigabe';
COMMENT ON COLUMN thermocheck.contractor_onboarding.trainer_freigabe_von IS 'UUID des freigebenden Trainers';
