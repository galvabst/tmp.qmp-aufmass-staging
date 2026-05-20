
DO $$ BEGIN
  CREATE TYPE thermocheck.praxistest_komponente AS ENUM ('scan','video');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN IF NOT EXISTS praxistest_runde int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS praxistest_scan_freigegeben boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS praxistest_video_freigegeben boolean NOT NULL DEFAULT false;

UPDATE thermocheck.contractor_onboarding
SET praxistest_scan_freigegeben = true,
    praxistest_video_freigegeben = true
WHERE praxistest_freigabe = true
  AND (praxistest_scan_freigegeben = false OR praxistest_video_freigegeben = false);

CREATE TABLE IF NOT EXISTS thermocheck.praxistest_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id uuid NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  runde int NOT NULL,
  komponente thermocheck.praxistest_komponente NOT NULL,
  kommentar text NOT NULL,
  pruefer_profile_id uuid REFERENCES public.profiles(id),
  pruefer_rolle text NOT NULL CHECK (pruefer_rolle IN ('trainer','admin')),
  erstellt_am timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_praxistest_feedback_onb ON thermocheck.praxistest_feedback(onboarding_id, runde);

CREATE TABLE IF NOT EXISTS thermocheck.praxistest_feedback_bilder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES thermocheck.praxistest_feedback(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position int NOT NULL DEFAULT 0,
  erstellt_am timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_praxistest_feedback_bilder_fb ON thermocheck.praxistest_feedback_bilder(feedback_id);

ALTER TABLE thermocheck.praxistest_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE thermocheck.praxistest_feedback_bilder ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS praxistest_feedback_select ON thermocheck.praxistest_feedback;
CREATE POLICY praxistest_feedback_select ON thermocheck.praxistest_feedback
  FOR SELECT TO authenticated
  USING (
    thermocheck.is_innendienst()
    OR thermocheck.is_trainer(auth.uid())
    OR onboarding_id IN (SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS praxistest_feedback_bilder_select ON thermocheck.praxistest_feedback_bilder;
CREATE POLICY praxistest_feedback_bilder_select ON thermocheck.praxistest_feedback_bilder
  FOR SELECT TO authenticated
  USING (
    feedback_id IN (
      SELECT id FROM thermocheck.praxistest_feedback
      WHERE thermocheck.is_innendienst()
        OR thermocheck.is_trainer(auth.uid())
        OR onboarding_id IN (SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid())
    )
  );

GRANT SELECT ON thermocheck.praxistest_feedback TO authenticated;
GRANT SELECT ON thermocheck.praxistest_feedback_bilder TO authenticated;

INSERT INTO storage.buckets (id, name, public) VALUES ('praxistest-feedback','praxistest-feedback', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "praxistest_feedback_read" ON storage.objects;
CREATE POLICY "praxistest_feedback_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'praxistest-feedback' AND (
      thermocheck.is_innendienst()
      OR thermocheck.is_trainer(auth.uid())
      OR (storage.foldername(name))[1] IN (SELECT id::text FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "praxistest_feedback_write" ON storage.objects;
CREATE POLICY "praxistest_feedback_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'praxistest-feedback' AND (thermocheck.is_innendienst() OR thermocheck.is_trainer(auth.uid()))
  );

DROP POLICY IF EXISTS "praxistest_feedback_delete" ON storage.objects;
CREATE POLICY "praxistest_feedback_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'praxistest-feedback' AND (thermocheck.is_innendienst() OR thermocheck.is_trainer(auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.reject_contractor_praxistest(
  p_onboarding_id uuid,
  p_components jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','thermocheck'
AS $$
DECLARE
  v_is_admin boolean;
  v_is_trainer boolean;
  v_rolle text;
  v_runde int;
  v_item jsonb;
  v_komp thermocheck.praxistest_komponente;
  v_kommentar text;
  v_bilder jsonb;
  v_feedback_id uuid;
  v_feedback_ids uuid[] := ARRAY[]::uuid[];
  v_pos int;
  v_path text;
  v_reject_scan boolean := false;
  v_reject_video boolean := false;
BEGIN
  v_is_admin := thermocheck.is_innendienst();
  v_is_trainer := thermocheck.is_trainer(auth.uid());
  IF NOT (v_is_admin OR v_is_trainer) THEN
    RAISE EXCEPTION 'Nicht berechtigt';
  END IF;
  v_rolle := CASE WHEN v_is_admin THEN 'admin' ELSE 'trainer' END;

  IF jsonb_array_length(p_components) = 0 THEN
    RAISE EXCEPTION 'Mindestens eine Komponente erforderlich';
  END IF;

  SELECT praxistest_runde INTO v_runde
  FROM thermocheck.contractor_onboarding WHERE id = p_onboarding_id FOR UPDATE;
  IF v_runde IS NULL THEN
    RAISE EXCEPTION 'Onboarding nicht gefunden';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_components) LOOP
    v_komp := (v_item->>'komponente')::thermocheck.praxistest_komponente;
    v_kommentar := trim(v_item->>'kommentar');
    IF v_kommentar IS NULL OR length(v_kommentar) = 0 THEN
      RAISE EXCEPTION 'Kommentar erforderlich für Komponente %', v_komp;
    END IF;
    v_bilder := COALESCE(v_item->'bild_pfade', '[]'::jsonb);

    INSERT INTO thermocheck.praxistest_feedback (onboarding_id, runde, komponente, kommentar, pruefer_profile_id, pruefer_rolle)
    VALUES (p_onboarding_id, v_runde, v_komp, v_kommentar, auth.uid(), v_rolle)
    RETURNING id INTO v_feedback_id;

    v_feedback_ids := v_feedback_ids || v_feedback_id;

    v_pos := 0;
    FOR v_path IN SELECT jsonb_array_elements_text(v_bilder) LOOP
      INSERT INTO thermocheck.praxistest_feedback_bilder (feedback_id, storage_path, position)
      VALUES (v_feedback_id, v_path, v_pos);
      v_pos := v_pos + 1;
    END LOOP;

    IF v_komp = 'scan' THEN v_reject_scan := true; END IF;
    IF v_komp = 'video' THEN v_reject_video := true; END IF;
  END LOOP;

  UPDATE thermocheck.contractor_onboarding
  SET
    praxistest_scan_freigegeben = CASE WHEN v_reject_scan THEN false ELSE praxistest_scan_freigegeben END,
    praxistest_video_freigegeben = CASE WHEN v_reject_video THEN false ELSE praxistest_video_freigegeben END,
    praxistest_scan_url = CASE WHEN v_reject_scan THEN '' ELSE praxistest_scan_url END,
    praxistest_video_url = CASE WHEN v_reject_video THEN '' ELSE praxistest_video_url END,
    praxistest_eingereicht_am = NULL,
    praxistest_freigabe = false,
    praxistest_freigabe_am = NULL,
    praxistest_freigabe_von = NULL,
    praxistest_runde = praxistest_runde + 1,
    aktualisiert_am = now()
  WHERE id = p_onboarding_id;

  RETURN jsonb_build_object('feedback_ids', to_jsonb(v_feedback_ids), 'runde', v_runde);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_contractor_praxistest(uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_praxistest_komponente(
  p_onboarding_id uuid,
  p_komponente thermocheck.praxistest_komponente
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','thermocheck'
AS $$
DECLARE
  v_scan boolean;
  v_video boolean;
BEGIN
  IF NOT (thermocheck.is_innendienst() OR thermocheck.is_trainer(auth.uid())) THEN
    RAISE EXCEPTION 'Nicht berechtigt';
  END IF;

  UPDATE thermocheck.contractor_onboarding
  SET
    praxistest_scan_freigegeben = CASE WHEN p_komponente = 'scan' THEN true ELSE praxistest_scan_freigegeben END,
    praxistest_video_freigegeben = CASE WHEN p_komponente = 'video' THEN true ELSE praxistest_video_freigegeben END,
    aktualisiert_am = now()
  WHERE id = p_onboarding_id
  RETURNING praxistest_scan_freigegeben, praxistest_video_freigegeben INTO v_scan, v_video;

  IF v_scan AND v_video THEN
    UPDATE thermocheck.contractor_onboarding
    SET praxistest_freigabe = true,
        praxistest_freigabe_am = COALESCE(praxistest_freigabe_am, now()),
        praxistest_freigabe_von = COALESCE(praxistest_freigabe_von, auth.uid()),
        aktualisiert_am = now()
    WHERE id = p_onboarding_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_praxistest_komponente(uuid, thermocheck.praxistest_komponente) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_contractor_praxistest(p_onboarding_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','thermocheck'
AS $$
BEGIN
  IF NOT (thermocheck.is_innendienst() OR thermocheck.is_trainer(auth.uid())) THEN
    RAISE EXCEPTION 'Nicht berechtigt';
  END IF;

  UPDATE thermocheck.contractor_onboarding
  SET
    praxistest_scan_freigegeben = true,
    praxistest_video_freigegeben = true,
    praxistest_freigabe = true,
    praxistest_freigabe_am = now(),
    praxistest_freigabe_von = auth.uid(),
    aktualisiert_am = now()
  WHERE id = p_onboarding_id;
END;
$$;
