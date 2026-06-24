-- T4 autarc-Validierungs-Gate: additive Sync-Status-Spalten (Spec §5).
--
-- Auf thermocheck.thermocheck_vot_formulare. Rein additiv, idempotent (IF NOT EXISTS).
-- RLS bleibt unverändert — keine neue Policy nötig, da nur Spalten ergänzt werden.
-- WIRD NICHT automatisch angewendet (MCP read-only / DB-Push via Nutzer-CLI).
--
-- autarc_sync_status ∈ { ausstehend | ok | freigegeben | eingereicht |
--                        abweichung | unvollstaendig | kein_projekt | fehler }
--   (als text, kein enum, um künftige Zustände ohne Migration zu erlauben)

ALTER TABLE thermocheck.thermocheck_vot_formulare
  ADD COLUMN IF NOT EXISTS autarc_project_id text,
  ADD COLUMN IF NOT EXISTS autarc_sync_status text DEFAULT 'ausstehend',
  ADD COLUMN IF NOT EXISTS autarc_sync_diff jsonb,
  ADD COLUMN IF NOT EXISTS autarc_sync_error text,
  ADD COLUMN IF NOT EXISTS autarc_synced_at timestamptz;

COMMENT ON COLUMN thermocheck.thermocheck_vot_formulare.autarc_project_id IS
  'Verknüpfte autarc-Projekt-ID (gespeichert oder via Fallback aufgelöst).';
COMMENT ON COLUMN thermocheck.thermocheck_vot_formulare.autarc_sync_status IS
  'T4-Gate-Status: ausstehend|ok|freigegeben|eingereicht|abweichung|unvollstaendig|kein_projekt|fehler.';
COMMENT ON COLUMN thermocheck.thermocheck_vot_formulare.autarc_sync_diff IS
  'Maschinenlesbare Differenzliste (gesendet ↔ zurückgelesen) bei Status abweichung.';
COMMENT ON COLUMN thermocheck.thermocheck_vot_formulare.autarc_sync_error IS
  'Konkrete Fehlermeldung bei Status fehler (Netz/HTTP/JSON).';
COMMENT ON COLUMN thermocheck.thermocheck_vot_formulare.autarc_synced_at IS
  'Zeitpunkt des letzten T4-Verify-Laufs (ISO/timestamptz).';
