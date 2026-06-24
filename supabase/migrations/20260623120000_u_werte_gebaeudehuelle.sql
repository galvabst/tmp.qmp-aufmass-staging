-- U-Werte / Gebäudehülle (geschichteter Aufbau) — additive Persistenz-Spalten.
--
-- Auf thermocheck.thermocheck_vot_formulare. Rein additiv, idempotent (IF NOT EXISTS).
-- RLS bleibt unverändert — nur Spalten ergänzt, keine neue Policy nötig.
-- WIRD NICHT automatisch angewendet (MCP read-only / DB-Push via Nutzer-CLI).
--
-- u_werte = ein JSONB-Objekt mit den Bauteilen aussenwand/dach/unten/fenster/anbau
--   (Schicht-Aufbau, Material-Enums, cm, Dämmjahr, geprueft_per). Struktur =
--   src/features/aufmass/data/aufmass-schema.ts (uWerteSchema) — Single Source of
--   Truth. JSONB (statt vieler Spalten), da rein erfassend; autarc übernimmt keine
--   U-Werte (separater manueller Schritt).

ALTER TABLE thermocheck.thermocheck_vot_formulare
  ADD COLUMN IF NOT EXISTS u_werte jsonb,
  ADD COLUMN IF NOT EXISTS u_werte_haftung_bestaetigt boolean;

COMMENT ON COLUMN thermocheck.thermocheck_vot_formulare.u_werte IS
  'Gebäudehülle als geschichteter Aufbau (aussenwand/dach/unten/fenster/anbau). Struktur = uWerteSchema in aufmass-schema.ts.';
COMMENT ON COLUMN thermocheck.thermocheck_vot_formulare.u_werte_haftung_bestaetigt IS
  'Kunde hat die Richtigkeit der Hülle-Angaben (Heizlast-/WP-Auslegung) bestätigt. Rechtsverbindlichkeit separat zu prüfen.';
