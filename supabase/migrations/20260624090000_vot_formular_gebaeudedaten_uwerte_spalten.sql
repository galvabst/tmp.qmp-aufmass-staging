-- Persistenz-Spalten für Gebäudedaten + U-Werte auf thermocheck.thermocheck_vot_formulare.
--
-- HINTERGRUND (Bug, gefunden 2026-06-24): FORM_DB_FIELDS = Object.keys(aufmassDraftSchema.shape)
-- enthält 16 Felder, die KEINE Spalte dieser Tabelle sind. useUpsertVotFormular schreibt
-- jedes gesetzte FORM_DB_FIELDS-Feld OHNE generischen Missing-Column-Retry (nur
-- plausi_begruendungen ist abgesichert) → jeder Draft-Save/Submit mit Gebäudedaten oder
-- U-Werten scheitert mit PGRST204 "column not found". Die frühere Migration
-- 20260623120000 ergänzt nur u_werte + u_werte_haftung_bestaetigt (2 von 16).
--
-- Diese Migration ergänzt ALLE 16 (additiv, idempotent IF NOT EXISTS). Damit schließt
-- ein einziges Apply die komplette Lücke; 20260623120000 wird dadurch redundant (überlappt
-- nur idempotent). RLS unverändert (nur Spalten). Tabelle wird von qmp UND wp-flow-hub
-- (thermocheck-Schema) genutzt — additive Spalten sind für beide unkritisch.
--
-- WIRD NICHT automatisch angewendet (MCP read-only). Vor dem Deploy des U-Werte/
-- Gebäudedaten-Standes per Nutzer-CLI/SQL-Editor einspielen, danach per read-only
-- gegenlesen (information_schema) — siehe Memory [[supabase-sql-editor-begin-commit-pitfall]].
--
-- Spaltentypen = Feldtypen in aufmass-schema.ts (aufmassDraftSchema):
--   z.enum(...)               → text  (Werte werden app-seitig via zod erzwungen; kein PG-Enum nötig)
--   optionalNonNegativeNumber → numeric
--   optionalPositiveInteger   → integer
--   optionalBoolean           → boolean

ALTER TABLE thermocheck.thermocheck_vot_formulare
  -- Gebäudedaten (autarc-Sync)
  ADD COLUMN IF NOT EXISTS gebaeudetyp                    text,
  ADD COLUMN IF NOT EXISTS beheizte_wohnflaeche_m2        numeric,
  ADD COLUMN IF NOT EXISTS anzahl_bewohner                integer,
  ADD COLUMN IF NOT EXISTS anzahl_etagen                  integer,
  ADD COLUMN IF NOT EXISTS hat_denkmalschutz              boolean,
  ADD COLUMN IF NOT EXISTS durchschnittsverbrauch_3_jahre numeric,
  ADD COLUMN IF NOT EXISTS fassade_gedaemmt               boolean,
  ADD COLUMN IF NOT EXISTS dach_gedaemmt                  boolean,
  ADD COLUMN IF NOT EXISTS rohrsystem                     text,
  ADD COLUMN IF NOT EXISTS verglasung                     text,
  ADD COLUMN IF NOT EXISTS hat_kamin                      boolean,
  ADD COLUMN IF NOT EXISTS hat_solarthermie               boolean,
  ADD COLUMN IF NOT EXISTS vorlauftemperatur              numeric,
  ADD COLUMN IF NOT EXISTS ruecklauftemperatur            numeric,
  -- U-Werte / Gebäudehülle (deckt auch 20260623120000 idempotent ab)
  ADD COLUMN IF NOT EXISTS u_werte                        jsonb,
  ADD COLUMN IF NOT EXISTS u_werte_haftung_bestaetigt     boolean;

-- PostgREST-Schema-Cache neu laden, sonst PGRST204 trotz vorhandener Spalte.
NOTIFY pgrst, 'reload schema';
