
-- 1. Helper function: is_innendienst() — checks admin + superadmin + manager
CREATE OR REPLACE FUNCTION thermocheck.is_innendienst(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'iam'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM iam.user_system_roles usr
    WHERE usr.user_id = p_user_id
    AND usr.role::text IN ('admin', 'superadmin', 'manager')
  );
$$;

-- Public wrapper for RLS policies
CREATE OR REPLACE FUNCTION public.is_innendienst(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT thermocheck.is_innendienst(p_user_id);
$$;

-- 2. Chat table
CREATE TABLE thermocheck.auftrag_nachrichten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auftrag_id uuid NOT NULL REFERENCES thermocheck.thermocheck_auftraege(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.profiles(id),
  inhalt text NOT NULL CHECK (char_length(inhalt) > 0),
  erstellt_am timestamptz NOT NULL DEFAULT now(),
  aktualisiert_am timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_auftrag_nachrichten_auftrag ON thermocheck.auftrag_nachrichten (auftrag_id, erstellt_am ASC);
CREATE INDEX idx_auftrag_nachrichten_autor ON thermocheck.auftrag_nachrichten (autor_id);

-- updated_at trigger (using thermocheck's own function per memory)
CREATE TRIGGER set_auftrag_nachrichten_updated_at
  BEFORE UPDATE ON thermocheck.auftrag_nachrichten
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.update_updated_at_column();

-- 3. RLS
ALTER TABLE thermocheck.auftrag_nachrichten ENABLE ROW LEVEL SECURITY;

-- SELECT: Innendienst sees all, Contractor sees own orders
CREATE POLICY "Chat: select own order messages"
  ON thermocheck.auftrag_nachrichten FOR SELECT TO authenticated
  USING (
    is_innendienst()
    OR EXISTS (
      SELECT 1 FROM thermocheck.thermocheck_auftraege a
      JOIN thermocheck.contractor_onboarding co ON co.id = a.zugewiesener_techniker_id
      WHERE a.id = auftrag_nachrichten.auftrag_id
        AND co.profile_id = auth.uid()
    )
  );

-- INSERT: own autor_id + (innendienst OR own order)
CREATE POLICY "Chat: insert messages for own orders"
  ON thermocheck.auftrag_nachrichten FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      is_innendienst()
      OR EXISTS (
        SELECT 1 FROM thermocheck.thermocheck_auftraege a
        JOIN thermocheck.contractor_onboarding co ON co.id = a.zugewiesener_techniker_id
        WHERE a.id = auftrag_nachrichten.auftrag_id
          AND co.profile_id = auth.uid()
      )
    )
  );

-- UPDATE: only own messages
CREATE POLICY "Chat: update own messages"
  ON thermocheck.auftrag_nachrichten FOR UPDATE TO authenticated
  USING (autor_id = auth.uid())
  WITH CHECK (autor_id = auth.uid());

-- DELETE: only innendienst
CREATE POLICY "Chat: admins delete messages"
  ON thermocheck.auftrag_nachrichten FOR DELETE TO authenticated
  USING (is_innendienst());
