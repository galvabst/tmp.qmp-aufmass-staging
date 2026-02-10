-- Alte leere Lektionen (7-1 bis 7-4 ohne Video) deaktivieren
UPDATE thermocheck.contractor_akademie_lektionen
SET ist_aktiv = false, updated_at = now()
WHERE code IN ('7-1', '7-2', '7-3', '7-4')
  AND video_url IS NULL;

-- 7-1-1 (Zoho Forms) -> eigenstaendig, neue Reihenfolge
UPDATE thermocheck.contractor_akademie_lektionen
SET code = '7-b', titel = 'Praxis: Zoho Forms', reihenfolge = 2, updated_at = now()
WHERE id = '7e450a86-8d49-4a5c-84f2-2a11347b9551';

-- 7-1-2 (Raumscann APP) -> eigenstaendig, neue Reihenfolge
UPDATE thermocheck.contractor_akademie_lektionen
SET code = '7-c', titel = 'Praxis: Raumscann APP', reihenfolge = 3, updated_at = now()
WHERE id = 'e34ef996-6c92-489f-bbb4-7f40ebd793a4';

-- Neue Lektion: Praxis Raeume scannen (als erstes Video)
INSERT INTO thermocheck.contractor_akademie_lektionen
  (modul_id, code, titel, reihenfolge, video_url, video_dauer_minuten, ist_aktiv)
VALUES
  ((SELECT id FROM thermocheck.contractor_akademie_module WHERE code LIKE 'modul-7%'),
   '7-a', 'Praxis: Räume scannen', 1,
   'https://iframe.mediadelivery.net/play/591760/3d205096-67ca-4ff4-be0c-37e729fc61e3',
   10, true);