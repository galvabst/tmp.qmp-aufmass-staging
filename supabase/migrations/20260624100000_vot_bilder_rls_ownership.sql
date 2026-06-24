-- ============================================================
-- RLS-Härtung: thermocheck_vot_bilder auf Eigentümer einschränken
-- ============================================================
-- Problem: Die ursprünglichen SELECT/INSERT/UPDATE-Policies aus
-- 20260224165723 nutzten USING/WITH CHECK (auth.uid() IS NOT NULL) — damit
-- konnte JEDER authentifizierte Techniker die Foto-Datensätze ALLER anderen
-- Formulare lesen/ändern. storage_path/dateiname/kategorie kodieren Lead-Name,
-- Auftrags-ID und Gebäudekontext → DSGVO-relevante Kunden-Metadaten lagen offen.
-- Nur DELETE war bereits korrekt über das Eltern-Formular (eingereicht_von)
-- eingeschränkt.
--
-- Fix: SELECT/INSERT/UPDATE auf denselben Eigentümer-Scope wie DELETE bringen —
-- Join über thermocheck_vot_formulare.eingereicht_von = auth.uid(), plus
-- Innendienst-Lesezugriff via public.is_admin() (analog aufmass_ki_fotos,
-- 20260623150000). Idempotent (DROP POLICY IF EXISTS + Neuanlage), kein
-- Schema-/Datenwechsel — nur Policy-Tausch.

DROP POLICY IF EXISTS "auth_select_vot_bilder" ON thermocheck.thermocheck_vot_bilder;
CREATE POLICY "auth_select_vot_bilder" ON thermocheck.thermocheck_vot_bilder
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM thermocheck.thermocheck_vot_formulare f
      WHERE f.id = thermocheck_vot_bilder.vot_formular_id
        AND f.eingereicht_von = auth.uid()
    )
  );

DROP POLICY IF EXISTS "auth_insert_vot_bilder" ON thermocheck.thermocheck_vot_bilder;
CREATE POLICY "auth_insert_vot_bilder" ON thermocheck.thermocheck_vot_bilder
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM thermocheck.thermocheck_vot_formulare f
      WHERE f.id = thermocheck_vot_bilder.vot_formular_id
        AND f.eingereicht_von = auth.uid()
    )
  );

DROP POLICY IF EXISTS "auth_update_vot_bilder" ON thermocheck.thermocheck_vot_bilder;
CREATE POLICY "auth_update_vot_bilder" ON thermocheck.thermocheck_vot_bilder
  FOR UPDATE USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM thermocheck.thermocheck_vot_formulare f
      WHERE f.id = thermocheck_vot_bilder.vot_formular_id
        AND f.eingereicht_von = auth.uid()
    )
  ) WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM thermocheck.thermocheck_vot_formulare f
      WHERE f.id = thermocheck_vot_bilder.vot_formular_id
        AND f.eingereicht_von = auth.uid()
    )
  );
