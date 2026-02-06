-- Schritt 1: Bestehende Lektionen 6-4 und 6-5 nach hinten verschieben
UPDATE thermocheck.contractor_akademie_lektionen
SET reihenfolge = reihenfolge + 1, updated_at = now()
WHERE modul_id = 'a4cb8918-c503-4b7d-8c0c-84daca3aac65'
  AND reihenfolge >= 4;

-- Schritt 2: Neue Lektion 6-3-1 einfügen
INSERT INTO thermocheck.contractor_akademie_lektionen (
  modul_id, code, titel, reihenfolge, video_url, video_dauer_minuten, ist_aktiv
) VALUES (
  'a4cb8918-c503-4b7d-8c0c-84daca3aac65',
  '6-3-1',
  'Raumweise Gebäude Daten in der Software kurz erklärt',
  4,
  'https://iframe.mediadelivery.net/play/591760/8d31b459-c3b3-4539-915f-efa34341db03',
  5,
  true
);