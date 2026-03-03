
-- Tabelle: thermocheck.auftrag_chat_gelesen
-- Speichert den Zeitpunkt, zu dem ein User den Chat eines Auftrags zuletzt gelesen hat.
CREATE TABLE thermocheck.auftrag_chat_gelesen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auftrag_id uuid NOT NULL REFERENCES thermocheck.thermocheck_auftraege(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  gelesen_am timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auftrag_id, user_id)
);

-- RLS aktivieren
ALTER TABLE thermocheck.auftrag_chat_gelesen ENABLE ROW LEVEL SECURITY;

-- SELECT: Nur eigene Rows
CREATE POLICY "chat_gelesen_select_own"
  ON thermocheck.auftrag_chat_gelesen
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Nur eigene Rows
CREATE POLICY "chat_gelesen_insert_own"
  ON thermocheck.auftrag_chat_gelesen
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Nur eigene Rows
CREATE POLICY "chat_gelesen_update_own"
  ON thermocheck.auftrag_chat_gelesen
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Nur eigene Rows
CREATE POLICY "chat_gelesen_delete_own"
  ON thermocheck.auftrag_chat_gelesen
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Index für schnelle Lookups
CREATE INDEX idx_chat_gelesen_user_auftrag ON thermocheck.auftrag_chat_gelesen(user_id, auftrag_id);
