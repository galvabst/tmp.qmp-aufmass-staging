-- KI-Aufmaß-Prüfungen im THERMOCHECK-Schema (U-Werte-Assistent) — Domänen-Schnitt.
-- Entkoppelt von der salesos-Tabelle public.sales_zaehlerschrank_pruefungen
-- (war Cross-Domain: Vertriebs-Tabelle, salesos-RLS, lead-gekoppelt + RLS-Leak).
-- Hier: gehört der thermocheck-Domäne, gekoppelt an den AUFMASS-AUFTRAG (auftrag_id),
-- NICHT an einen Vertriebs-Lead. RLS spiegelt das bestehende Aufmaß-Modell
-- (thermocheck_vot_*): authenticated; Mutation/Delete via Eigentum (created_by).
-- Eigene qmp-Edge-Function aufmass-uwerte-analyze schreibt per service_role.

CREATE TABLE IF NOT EXISTS thermocheck.aufmass_ki_pruefungen (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auftrag_id                uuid NOT NULL,
  created_by                uuid NOT NULL,
  last_modified_by          uuid,
  pruefung_typ              text NOT NULL DEFAULT 'u_werte'
                              CHECK (pruefung_typ IN ('u_werte')),
  status                    text NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','photo_uploaded','analyzing','waiting_for_photos','completed','failed','cancelled')),
  current_step              integer NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  status_message            text,
  empfehlung                text CHECK (empfehlung IS NULL OR empfehlung IN ('keine_anpassung','teilanpassung','grossanpassung','sanierung')),
  confidence                numeric CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  findings                  jsonb,
  requested_photos          jsonb,
  request_reason            text,
  ai_model                  text,
  total_tokens_in           integer,
  total_tokens_out          integer,
  total_cost_eur            numeric NOT NULL DEFAULT 0,
  error_code                text,
  error_detail              text,
  cancellation_requested    boolean NOT NULL DEFAULT false,
  cancellation_requested_at timestamptz,
  analyzing_started_at      timestamptz,
  completed_at              timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aufmass_ki_pruef_auftrag
  ON thermocheck.aufmass_ki_pruefungen (auftrag_id, created_at DESC);

CREATE TABLE IF NOT EXISTS thermocheck.aufmass_ki_fotos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pruefung_id        uuid NOT NULL REFERENCES thermocheck.aufmass_ki_pruefungen(id) ON DELETE CASCADE,
  step               integer NOT NULL DEFAULT 1,
  storage_path       text NOT NULL,
  mime_type          text,
  size_bytes         integer,
  original_filename  text,
  is_ai_requested    boolean NOT NULL DEFAULT false,
  ai_requested_view  text,
  ai_request_reason  text,
  uploaded_by        uuid,
  uploaded_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aufmass_ki_fotos_pruef
  ON thermocheck.aufmass_ki_fotos (pruefung_id, uploaded_at);

-- RLS
ALTER TABLE thermocheck.aufmass_ki_pruefungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE thermocheck.aufmass_ki_fotos      ENABLE ROW LEVEL SECURITY;

-- SELECT auf den Eigentümer (created_by) bzw. Admin begrenzen. Ein offenes
-- USING(auth.uid() IS NOT NULL) ließe JEDEN authentifizierten Techniker die
-- KI-Befunde (findings: Gemini-Reasoning, red_flags, Bauteil-Bewertungen) ALLER
-- anderen Aufträge lesen — DSGVO-relevante Gebäude-/Bewertungsdaten. Aufsichts-/
-- Innendienst-Lesezugriff läuft über public.is_admin() (wie bei DELETE/UPDATE).
DROP POLICY IF EXISTS aufmass_ki_pruef_select ON thermocheck.aufmass_ki_pruefungen;
CREATE POLICY aufmass_ki_pruef_select ON thermocheck.aufmass_ki_pruefungen
  FOR SELECT USING (public.is_admin() OR created_by = auth.uid());
DROP POLICY IF EXISTS aufmass_ki_pruef_insert ON thermocheck.aufmass_ki_pruefungen;
CREATE POLICY aufmass_ki_pruef_insert ON thermocheck.aufmass_ki_pruefungen
  FOR INSERT WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS aufmass_ki_pruef_update ON thermocheck.aufmass_ki_pruefungen;
CREATE POLICY aufmass_ki_pruef_update ON thermocheck.aufmass_ki_pruefungen
  FOR UPDATE USING (public.is_admin() OR created_by = auth.uid())
  WITH CHECK (public.is_admin() OR created_by = auth.uid());
DROP POLICY IF EXISTS aufmass_ki_pruef_delete ON thermocheck.aufmass_ki_pruefungen;
CREATE POLICY aufmass_ki_pruef_delete ON thermocheck.aufmass_ki_pruefungen
  FOR DELETE USING (public.is_admin() OR created_by = auth.uid());

-- SELECT/UPDATE auf das Eigentum der zugehörigen Prüfung (created_by) bzw. Admin
-- begrenzen. Offen (auth.uid() IS NOT NULL) ließe jeden Techniker fremde Foto-
-- Datensätze lesen UND verändern (z. B. ai_requested_view manipulieren). Eigentum
-- läuft über die parent-Prüfung — analog zur DELETE-Policy weiter unten.
-- INSERT bleibt offen für authentifizierte Nutzer (WITH CHECK greift erst beim
-- Schreiben; die Edge-Function setzt uploaded_by serverseitig).
DROP POLICY IF EXISTS aufmass_ki_fotos_select ON thermocheck.aufmass_ki_fotos;
CREATE POLICY aufmass_ki_fotos_select ON thermocheck.aufmass_ki_fotos
  FOR SELECT USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM thermocheck.aufmass_ki_pruefungen p
    WHERE p.id = aufmass_ki_fotos.pruefung_id AND p.created_by = auth.uid()));
DROP POLICY IF EXISTS aufmass_ki_fotos_insert ON thermocheck.aufmass_ki_fotos;
CREATE POLICY aufmass_ki_fotos_insert ON thermocheck.aufmass_ki_fotos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS aufmass_ki_fotos_update ON thermocheck.aufmass_ki_fotos;
CREATE POLICY aufmass_ki_fotos_update ON thermocheck.aufmass_ki_fotos
  FOR UPDATE USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM thermocheck.aufmass_ki_pruefungen p
    WHERE p.id = aufmass_ki_fotos.pruefung_id AND p.created_by = auth.uid()))
  WITH CHECK (public.is_admin() OR EXISTS (
    SELECT 1 FROM thermocheck.aufmass_ki_pruefungen p
    WHERE p.id = aufmass_ki_fotos.pruefung_id AND p.created_by = auth.uid()));
DROP POLICY IF EXISTS aufmass_ki_fotos_delete ON thermocheck.aufmass_ki_fotos;
CREATE POLICY aufmass_ki_fotos_delete ON thermocheck.aufmass_ki_fotos
  FOR DELETE USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM thermocheck.aufmass_ki_pruefungen p
    WHERE p.id = aufmass_ki_fotos.pruefung_id AND p.created_by = auth.uid()));

-- Grants (PostgREST via authenticated; Edge-Function via service_role)
GRANT USAGE ON SCHEMA thermocheck TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON thermocheck.aufmass_ki_pruefungen TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON thermocheck.aufmass_ki_fotos      TO authenticated, service_role;

-- PostgREST-Schemacache neu laden, damit die neuen Tabellen sofort abfragbar sind.
NOTIFY pgrst, 'reload schema';
