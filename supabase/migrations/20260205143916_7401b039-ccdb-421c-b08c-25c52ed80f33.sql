-- RPC-Funktion für Adress-Update in thermocheck.contractor_onboarding
CREATE OR REPLACE FUNCTION public.update_contractor_onboarding_address(
  p_strasse TEXT,
  p_plz TEXT,
  p_ort TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  UPDATE thermocheck.contractor_onboarding
  SET 
    anschrift_strasse = p_strasse,
    anschrift_plz = p_plz,
    anschrift_ort = p_ort
  WHERE profile_id = auth.uid();
END;
$$;

-- Storage Bucket für Contractor-Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-avatars', 'contractor-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies für den Avatar-Bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'contractor-avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contractor-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'contractor-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'contractor-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);