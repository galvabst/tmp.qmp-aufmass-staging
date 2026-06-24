-- U-Werte / Gebäudehülle: Foto-Nachweis-Kategorien zum Bild-Enum hinzufügen.
-- Ohne diese Werte schlägt der Insert in thermocheck.thermocheck_vot_bilder für
-- die U-Werte-Foto-Felder fehl (22P02: invalid input value for enum) → der Client
-- zeigt nur den generischen Toast "Fehler beim Hochladen". Nur die U-Werte-Sektion
-- ist betroffen, weil nur diese Kategorien neu sind.
-- Additiv & rückwärtskompatibel (bestehende Werte/Leser/Schreiber unberührt).
-- Muster identisch zu 20260518135255_*.sql (PV-Kategorien).
ALTER TYPE thermocheck.vot_bild_kategorie_enum ADD VALUE IF NOT EXISTS 'wanddicke_fenster_meterstab';
ALTER TYPE thermocheck.vot_bild_kategorie_enum ADD VALUE IF NOT EXISTS 'wandaufbau';
ALTER TYPE thermocheck.vot_bild_kategorie_enum ADD VALUE IF NOT EXISTS 'dachaufbau';
ALTER TYPE thermocheck.vot_bild_kategorie_enum ADD VALUE IF NOT EXISTS 'bodenaufbau';
ALTER TYPE thermocheck.vot_bild_kategorie_enum ADD VALUE IF NOT EXISTS 'fenster_originalrechnung';
