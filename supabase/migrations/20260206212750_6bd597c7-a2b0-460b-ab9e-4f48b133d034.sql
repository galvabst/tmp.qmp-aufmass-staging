
UPDATE thermocheck.contractor_akademie_lektionen
SET reihenfolge = reihenfolge + 1, updated_at = now()
WHERE modul_id = 'a4cb8918-c503-4b7d-8c0c-84daca3aac65' AND reihenfolge >= 5;

INSERT INTO thermocheck.contractor_akademie_lektionen (
  modul_id, code, titel, reihenfolge, video_url, video_dauer_minuten, ist_aktiv
) VALUES (
  'a4cb8918-c503-4b7d-8c0c-84daca3aac65', '6-3-2',
  'Heizlastberechnung: Allgemeine Standards und Grundlagen', 5,
  'https://iframe.mediadelivery.net/play/591760/338cc614-9947-4e96-aae3-a5a524f47779', 5, true
);
