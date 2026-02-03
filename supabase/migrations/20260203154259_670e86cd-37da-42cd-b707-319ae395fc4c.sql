-- Temporär: Anon-Zugriff auf aktive Akademie-Module und Lektionen
-- (wird später auf authenticated umgestellt wenn Auth implementiert)

-- Policy für Module
CREATE POLICY "Public read active modules"
ON thermocheck.techniker_akademie_module
FOR SELECT TO anon
USING (ist_aktiv = true);

-- Policy für Lektionen
CREATE POLICY "Public read active lektionen"
ON thermocheck.techniker_akademie_lektionen
FOR SELECT TO anon
USING (ist_aktiv = true);