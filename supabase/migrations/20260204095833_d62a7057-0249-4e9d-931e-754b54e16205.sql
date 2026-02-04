-- Umbenennung der Akademie-Tabellen für einheitliche Namenskonvention
-- Von: techniker_akademie_* → Zu: contractor_akademie_*

-- 1. Haupttabellen umbenennen
ALTER TABLE thermocheck.techniker_akademie_module 
RENAME TO contractor_akademie_module;

ALTER TABLE thermocheck.techniker_akademie_lektionen 
RENAME TO contractor_akademie_lektionen;

ALTER TABLE thermocheck.techniker_akademie_lektions_fortschritt 
RENAME TO contractor_akademie_lektions_fortschritt;

ALTER TABLE thermocheck.techniker_akademie_quiz 
RENAME TO contractor_akademie_quiz;

ALTER TABLE thermocheck.techniker_akademie_quiz_ergebnis 
RENAME TO contractor_akademie_quiz_ergebnis;

-- 2. Kommentare aktualisieren für Dokumentation
COMMENT ON TABLE thermocheck.contractor_akademie_module IS 'Akademie-Module für Contractor-Onboarding (SSOT)';
COMMENT ON TABLE thermocheck.contractor_akademie_lektionen IS 'Lektionen/Videos innerhalb der Akademie-Module';
COMMENT ON TABLE thermocheck.contractor_akademie_lektions_fortschritt IS 'Fortschritt der Contractor bei Lektionen (Wiedergabezeit)';
COMMENT ON TABLE thermocheck.contractor_akademie_quiz IS 'Quiz-Fragen pro Modul (Admin-gepflegt)';
COMMENT ON TABLE thermocheck.contractor_akademie_quiz_ergebnis IS 'Quiz-Ergebnisse der Contractor (automatisch befüllt)';