
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN IF NOT EXISTS praxistest_scan_url TEXT,
  ADD COLUMN IF NOT EXISTS praxistest_video_url TEXT,
  ADD COLUMN IF NOT EXISTS praxistest_eingereicht_am TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS praxistest_freigabe BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS praxistest_freigabe_am TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS praxistest_freigabe_von UUID;
