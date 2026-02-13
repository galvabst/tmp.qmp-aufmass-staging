
-- 1. Add is_trainer flag to contractor_onboarding
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN IF NOT EXISTS is_trainer BOOLEAN NOT NULL DEFAULT false;

-- 2. Create contractor_forum_threads table
CREATE TABLE thermocheck.contractor_forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titel text NOT NULL,
  inhalt text NOT NULL,
  erstellt_am timestamptz NOT NULL DEFAULT now(),
  aktualisiert_am timestamptz NOT NULL DEFAULT now(),
  ist_geloest boolean NOT NULL DEFAULT false,
  akzeptierte_antwort_id uuid
);

-- 3. Create contractor_forum_antworten table
CREATE TABLE thermocheck.contractor_forum_antworten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES thermocheck.contractor_forum_threads(id) ON DELETE CASCADE,
  autor_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inhalt text NOT NULL,
  ist_trainer_antwort boolean NOT NULL DEFAULT false,
  erstellt_am timestamptz NOT NULL DEFAULT now(),
  aktualisiert_am timestamptz NOT NULL DEFAULT now()
);

-- 4. Add FK for akzeptierte_antwort_id
ALTER TABLE thermocheck.contractor_forum_threads
  ADD CONSTRAINT fk_akzeptierte_antwort
  FOREIGN KEY (akzeptierte_antwort_id) REFERENCES thermocheck.contractor_forum_antworten(id) ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX idx_forum_threads_autor ON thermocheck.contractor_forum_threads(autor_profile_id);
CREATE INDEX idx_forum_threads_erstellt ON thermocheck.contractor_forum_threads(erstellt_am DESC);
CREATE INDEX idx_forum_antworten_thread ON thermocheck.contractor_forum_antworten(thread_id);
CREATE INDEX idx_forum_antworten_autor ON thermocheck.contractor_forum_antworten(autor_profile_id);

-- 6. Updated_at trigger for threads
CREATE TRIGGER update_forum_threads_updated_at
  BEFORE UPDATE ON thermocheck.contractor_forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Updated_at trigger for antworten
CREATE TRIGGER update_forum_antworten_updated_at
  BEFORE UPDATE ON thermocheck.contractor_forum_antworten
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. RLS: Enable on both tables
ALTER TABLE thermocheck.contractor_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thermocheck.contractor_forum_antworten ENABLE ROW LEVEL SECURITY;

-- 9. Helper: check if user is a ready contractor
CREATE OR REPLACE FUNCTION thermocheck.is_ready_contractor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = thermocheck
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM thermocheck.contractor_onboarding
    WHERE profile_id = _user_id
      AND onboarding_status = 'ready'
  );
$$;

-- 10. Helper: check if user is trainer
CREATE OR REPLACE FUNCTION thermocheck.is_trainer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = thermocheck
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM thermocheck.contractor_onboarding
    WHERE profile_id = _user_id
      AND is_trainer = true
  );
$$;

-- 11. RLS Policies for contractor_forum_threads

-- SELECT: ready contractors can read all threads
CREATE POLICY "Ready contractors can view threads"
  ON thermocheck.contractor_forum_threads
  FOR SELECT
  TO authenticated
  USING (thermocheck.is_ready_contractor(auth.uid()) OR is_admin());

-- INSERT: ready contractors can create threads (own profile_id only)
CREATE POLICY "Ready contractors can create threads"
  ON thermocheck.contractor_forum_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    autor_profile_id = auth.uid()
    AND thermocheck.is_ready_contractor(auth.uid())
  );

-- UPDATE: own threads or admins
CREATE POLICY "Users can update own threads or admins"
  ON thermocheck.contractor_forum_threads
  FOR UPDATE
  TO authenticated
  USING (autor_profile_id = auth.uid() OR is_admin());

-- DELETE: admins only
CREATE POLICY "Admins can delete threads"
  ON thermocheck.contractor_forum_threads
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- 12. RLS Policies for contractor_forum_antworten

-- SELECT: ready contractors can read all answers
CREATE POLICY "Ready contractors can view answers"
  ON thermocheck.contractor_forum_antworten
  FOR SELECT
  TO authenticated
  USING (thermocheck.is_ready_contractor(auth.uid()) OR is_admin());

-- INSERT: ready contractors can create answers
CREATE POLICY "Ready contractors can create answers"
  ON thermocheck.contractor_forum_antworten
  FOR INSERT
  TO authenticated
  WITH CHECK (
    autor_profile_id = auth.uid()
    AND thermocheck.is_ready_contractor(auth.uid())
  );

-- UPDATE: own answers or admins
CREATE POLICY "Users can update own answers or admins"
  ON thermocheck.contractor_forum_antworten
  FOR UPDATE
  TO authenticated
  USING (autor_profile_id = auth.uid() OR is_admin());

-- DELETE: admins only
CREATE POLICY "Admins can delete answers"
  ON thermocheck.contractor_forum_antworten
  FOR DELETE
  TO authenticated
  USING (is_admin());
