
-- 1. Storage Bucket für Contractor-Dokumente (Gewerbeschein etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-documents', 'contractor-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies für contractor-documents Bucket
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contractor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contractor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contractor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contractor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Spalten in thermocheck.contractor_onboarding hinzufügen
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN IF NOT EXISTS gewerbeschein_url TEXT,
  ADD COLUMN IF NOT EXISTS gewerbeschein_spaeter BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_step TEXT,
  ADD COLUMN IF NOT EXISTS completed_steps TEXT[] DEFAULT '{}';

-- 3. RPC: Onboarding-Fortschritt speichern
CREATE OR REPLACE FUNCTION public.update_contractor_onboarding_progress(
  p_current_step TEXT,
  p_completed_steps TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET current_step = p_current_step,
      completed_steps = p_completed_steps
  WHERE profile_id = auth.uid();
END;
$$;

-- 4. RPC: Gewerbeschein-Daten speichern
CREATE OR REPLACE FUNCTION public.update_contractor_gewerbeschein(
  p_gewerbeschein_url TEXT DEFAULT NULL,
  p_gewerbeschein_spaeter BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET gewerbeschein_url = p_gewerbeschein_url,
      gewerbeschein_spaeter = p_gewerbeschein_spaeter
  WHERE profile_id = auth.uid();
END;
$$;

-- 5. RPC: Onboarding-State laden (erweitert get_contractor_address)
CREATE OR REPLACE FUNCTION public.get_contractor_onboarding_state(
  p_profile_id UUID
)
RETURNS TABLE(
  anschrift_strasse TEXT,
  anschrift_plz TEXT,
  anschrift_ort TEXT,
  gewerbeschein_url TEXT,
  gewerbeschein_spaeter BOOLEAN,
  current_step TEXT,
  completed_steps TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  -- Nur eigene Daten oder Service-Role
  IF p_profile_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    co.anschrift_strasse,
    co.anschrift_plz,
    co.anschrift_ort,
    co.gewerbeschein_url,
    co.gewerbeschein_spaeter,
    co.current_step,
    co.completed_steps
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id;
END;
$$;
