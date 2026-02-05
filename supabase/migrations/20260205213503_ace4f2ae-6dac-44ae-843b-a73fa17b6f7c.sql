-- =============================================================================
-- DB-Bereinigung: Single Source of Truth + Produkt-Katalog (korrigiert)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SCHRITT 1: contractor_bestellungen erweitern
-- (Die Produkte-Tabelle + ENUM wurden bereits in der vorherigen Migration erstellt)
-- -----------------------------------------------------------------------------

-- Spalten von contractor_branding übernehmen
ALTER TABLE thermocheck.contractor_bestellungen 
  ADD COLUMN IF NOT EXISTS empfangsfoto_url text,
  ADD COLUMN IF NOT EXISTS empfang_confirmed_at timestamptz;

-- Index für Produktabfragen
CREATE INDEX IF NOT EXISTS idx_contractor_bestellungen_produkt_key 
  ON thermocheck.contractor_bestellungen(produkt_key);

-- -----------------------------------------------------------------------------
-- SCHRITT 2: Daten von contractor_branding migrieren (korrigierter JOIN)
-- contractor_branding.contractor_id → contractor_onboarding.id
-- -----------------------------------------------------------------------------
UPDATE thermocheck.contractor_bestellungen b
SET 
  empfangsfoto_url = br.empfangsfoto_url,
  empfang_confirmed_at = br.empfang_confirmed_at
FROM thermocheck.contractor_branding br
WHERE b.onboarding_id = br.contractor_id  -- contractor_id zeigt auf onboarding.id
  AND br.empfangsfoto_url IS NOT NULL
  AND b.empfangsfoto_url IS NULL;

-- -----------------------------------------------------------------------------
-- SCHRITT 3: contractor_branding löschen (redundant)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS thermocheck.contractor_branding;

-- -----------------------------------------------------------------------------
-- SCHRITT 4: Größen-Spalten aus contractor_onboarding entfernen
-- -----------------------------------------------------------------------------
ALTER TABLE thermocheck.contractor_onboarding 
  DROP COLUMN IF EXISTS tshirt_groesse,
  DROP COLUMN IF EXISTS poloshirt_groesse,
  DROP COLUMN IF EXISTS pullover_groesse,
  DROP COLUMN IF EXISTS schuh_groesse;

-- Auch das alte JSONB-Feld in Bestellungen entfernen (jetzt durch groesse TEXT ersetzt)
ALTER TABLE thermocheck.contractor_bestellungen 
  DROP COLUMN IF EXISTS groessen_info;

-- -----------------------------------------------------------------------------
-- SCHRITT 5: RPC-Funktion anpassen (Größe in Bestellungen schreiben)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION thermocheck.update_bestellung_groesse(
  p_bestellung_id uuid,
  p_groesse text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
BEGIN
  UPDATE thermocheck.contractor_bestellungen
  SET groesse = p_groesse, updated_at = now()
  WHERE id = p_bestellung_id
    AND onboarding_id IN (
      SELECT id FROM thermocheck.contractor_onboarding 
      WHERE profile_id = auth.uid()
    );
END;
$$;

-- Alte RPC-Funktion entfernen falls vorhanden
DROP FUNCTION IF EXISTS thermocheck.update_contractor_onboarding_size(text, text);

-- -----------------------------------------------------------------------------
-- FERTIG: SSoT-Struktur etabliert
-- -----------------------------------------------------------------------------