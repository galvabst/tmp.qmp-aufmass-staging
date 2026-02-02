-- =====================================================
-- AKADEMIE-SYSTEM KOMPLETT-REFACTORING
-- 5 Tabellen, Indexes, RLS, 13 Module, 52 Lektionen
-- =====================================================

-- =====================================================
-- 1. NEUE TABELLEN ERSTELLEN
-- =====================================================

-- 1.1 Module (13 Stück)
CREATE TABLE thermocheck.techniker_akademie_module (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  titel text NOT NULL,
  beschreibung text,
  reihenfolge integer NOT NULL DEFAULT 0,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Lektionen (52 Stück)
CREATE TABLE thermocheck.techniker_akademie_lektionen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id uuid NOT NULL REFERENCES thermocheck.techniker_akademie_module(id) ON DELETE CASCADE,
  code text NOT NULL,
  titel text NOT NULL,
  beschreibung text,
  reihenfolge integer NOT NULL DEFAULT 0,
  video_url text,
  video_dauer_minuten integer DEFAULT 5,
  text_inhalt text,
  text_zusammenfassung text,
  zusatzmaterial_urls text[],
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(modul_id, code)
);

-- 1.3 Quiz-Fragen pro Modul
CREATE TABLE thermocheck.techniker_akademie_quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id uuid NOT NULL REFERENCES thermocheck.techniker_akademie_module(id) ON DELETE CASCADE,
  frage text NOT NULL,
  antworten jsonb NOT NULL DEFAULT '[]'::jsonb,
  reihenfolge integer NOT NULL DEFAULT 0,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.4 Lektions-Fortschritt pro User
CREATE TABLE thermocheck.techniker_akademie_lektions_fortschritt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  lektion_id uuid NOT NULL REFERENCES thermocheck.techniker_akademie_lektionen(id) ON DELETE CASCADE,
  status thermocheck.academy_progress_status_enum NOT NULL DEFAULT 'not_started',
  video_progress_seconds integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contractor_id, lektion_id)
);

-- 1.5 Quiz-Ergebnisse pro User/Modul
CREATE TABLE thermocheck.techniker_akademie_quiz_ergebnis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES thermocheck.contractor_onboarding(id) ON DELETE CASCADE,
  modul_id uuid NOT NULL REFERENCES thermocheck.techniker_akademie_module(id) ON DELETE CASCADE,
  versuch integer NOT NULL DEFAULT 1,
  score integer NOT NULL,
  bestanden boolean NOT NULL,
  antworten jsonb,
  abgeschlossen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contractor_id, modul_id, versuch)
);

-- =====================================================
-- 2. INDEXES ERSTELLEN
-- =====================================================

CREATE INDEX idx_tak_lektionen_modul_id ON thermocheck.techniker_akademie_lektionen(modul_id);
CREATE INDEX idx_tak_lektionen_reihenfolge ON thermocheck.techniker_akademie_lektionen(modul_id, reihenfolge);
CREATE INDEX idx_tak_quiz_modul_id ON thermocheck.techniker_akademie_quiz(modul_id);
CREATE INDEX idx_tak_fortschritt_contractor ON thermocheck.techniker_akademie_lektions_fortschritt(contractor_id);
CREATE INDEX idx_tak_fortschritt_lektion ON thermocheck.techniker_akademie_lektions_fortschritt(lektion_id);
CREATE INDEX idx_tak_quiz_ergebnis_contractor ON thermocheck.techniker_akademie_quiz_ergebnis(contractor_id);
CREATE INDEX idx_tak_quiz_ergebnis_modul ON thermocheck.techniker_akademie_quiz_ergebnis(modul_id);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Module: Alle authentifizierten User können aktive Module lesen
ALTER TABLE thermocheck.techniker_akademie_module ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read active modules"
  ON thermocheck.techniker_akademie_module FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Lektionen: Alle authentifizierten User können aktive Lektionen lesen
ALTER TABLE thermocheck.techniker_akademie_lektionen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read active lektionen"
  ON thermocheck.techniker_akademie_lektionen FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Quiz: Alle authentifizierten User können aktive Fragen lesen
ALTER TABLE thermocheck.techniker_akademie_quiz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read active quiz"
  ON thermocheck.techniker_akademie_quiz FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Fortschritt: Authenticated users can manage progress
ALTER TABLE thermocheck.techniker_akademie_lektions_fortschritt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage progress"
  ON thermocheck.techniker_akademie_lektions_fortschritt FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Quiz-Ergebnis: Authenticated users can manage quiz results
ALTER TABLE thermocheck.techniker_akademie_quiz_ergebnis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quiz results"
  ON thermocheck.techniker_akademie_quiz_ergebnis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. CURRICULUM EINFÜGEN: 13 MODULE
-- =====================================================

INSERT INTO thermocheck.techniker_akademie_module (code, titel, beschreibung, reihenfolge) VALUES
('modul-0-willkommen', 'Willkommen & Orientierung', 'Ziel der Akademie, Rolle im Gesamtprozess und Lernpfad', 0),
('modul-1-grundlagen', 'Grundlagen: Thermocheck verstehen', 'Was ist der Thermocheck, Zweck, Deliverables und Grenzen', 1),
('modul-2-service', 'Service-Professionalität beim Kunden', 'Auftreten, Kommunikation, Erwartungsmanagement', 2),
('modul-3-compliance', 'Sicherheit, Regeln & Compliance', 'Arbeitssicherheit, Datenschutz, Eskalation', 3),
('modul-4-vorbereitung', 'Terminvorbereitung (vor der Anfahrt)', 'Briefing, Equipment-Check, Zeitplanung', 4),
('modul-5-ablauf', 'Ablauf vor Ort: Struktur & Zeitmanagement', 'Phasenmodell, Raum-Systematik, Zeitmanagement', 5),
('modul-6-datenerhebung', 'Datenerhebung: Qualität, Vollständigkeit, Nachvollziehbarkeit', 'Mess-Grundregeln, Dokumentationsstandard, Belegqualität', 6),
('modul-7-workflow', 'Tool- & Dokumentationsworkflow', 'Datenerfassung, Upload, Versionierung, Fehlerbehebung', 7),
('modul-8-abschluss', 'Abschluss beim Kunden', 'Zusammenfassung, Next Steps, Verabschiedung', 8),
('modul-9-sonderfaelle', 'Sonderfälle & Eskalationen', 'Problemsituationen, Konflikte, Abbruchkriterien', 9),
('modul-10-qa', 'Qualitätssicherung (QA) & kontinuierliche Verbesserung', 'K.O.-Kriterien, Selbstcheck, Feedback', 10),
('modul-11-praxis', 'Praxisphase: Training on the Job', 'Shadowing, Feedback-Routine, Dokumentationsreview', 11),
('modul-12-pruefung', 'Prüfung & Zertifizierung', 'Theorie-Test, Praxis-Prüfung, Freigabelevel', 12);

-- =====================================================
-- 5. CURRICULUM EINFÜGEN: 52 LEKTIONEN
-- =====================================================

-- Modul 0: Willkommen & Orientierung (3 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-0-willkommen'), '0-1', 'Ziel der Akademie', 'Wofür qualifizieren wir dich? Überblick über das Zertifizierungsprogramm.', 1, 5),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-0-willkommen'), '0-2', 'Rolle im Gesamtprozess', 'Schnittstellen, Erwartungen und dein Platz im Team.', 2, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-0-willkommen'), '0-3', 'Lernpfad, Ablauf & Freigaben', 'Das Level-Modell verstehen: Von der Akademie zur Zertifizierung.', 3, 6);

-- Modul 1: Grundlagen: Thermocheck verstehen (3 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-1-grundlagen'), '1-1', 'Was ist der Thermocheck?', 'Zweck, Deliverables und Grenzen des Thermochecks.', 1, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-1-grundlagen'), '1-2', 'Was ist nicht Bestandteil?', 'Klare Abgrenzung: Was du NICHT zusagen darfst.', 2, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-1-grundlagen'), '1-3', 'Typische Kundenfragen', 'Sichere Antworten und Formulierungsleitfaden für häufige Fragen.', 3, 10);

-- Modul 2: Service-Professionalität (5 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-2-service'), '2-1', 'Auftreten & Kleidung', 'Körpersprache, Tonalität und professionelles Erscheinungsbild.', 1, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-2-service'), '2-2', 'Begrüßung & Vertrauen', 'Vertrauen aufbauen und Terminrahmen setzen.', 2, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-2-service'), '2-3', 'Strukturierte Gesprächsführung', 'Informationsaufnahme systematisch und professionell.', 3, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-2-service'), '2-4', 'Umgang mit schwierigen Situationen', 'Zeitdruck, Konflikte und Skepsis meistern.', 4, 10),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-2-service'), '2-5', 'Erwartungsmanagement', 'Professionell die Next Steps erklären.', 5, 6);

-- Modul 3: Sicherheit, Regeln & Compliance (4 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-3-compliance'), '3-1', 'Arbeitssicherheit allgemein', 'Grundlagen der Arbeitssicherheit für Außeneinsätze.', 1, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-3-compliance'), '3-2', 'Verhalten in Privatwohnungen', 'Hausregeln, Schutzmaßnahmen und Respekt.', 2, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-3-compliance'), '3-3', 'Datenschutz & Einwilligungen', 'DSGVO-konforme Fotos, Notizen und Datenerhebung.', 3, 9),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-3-compliance'), '3-4', 'Grenzen & Eskalation', 'Wann abbrechen, wann nachfordern, wen informieren.', 4, 7);

-- Modul 4: Terminvorbereitung (4 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-4-vorbereitung'), '4-1', 'Auftragsbriefing verstehen', 'Pflichtinfos, Risiken und Besonderheiten erkennen.', 1, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-4-vorbereitung'), '4-2', 'Equipment- & Material-Check', 'Die vollständige Packliste durchgehen.', 2, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-4-vorbereitung'), '4-3', 'Tool- & App-Setup', 'Zugang, Akkus, Offline-Fälle und Backup.', 3, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-4-vorbereitung'), '4-4', 'Zeitplanung & Routenlogik', 'Effiziente Planung mit Pufferzeiten.', 4, 5);

-- Modul 5: Ablauf vor Ort (4 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-5-ablauf'), '5-1', 'Standard-Ablauf Vor-Ort', 'Das Phasenmodell eines Termins verstehen.', 1, 10),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-5-ablauf'), '5-2', 'Raum-/Objekt-Systematik', 'Wie du dich systematisch durcharbeitest.', 2, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-5-ablauf'), '5-3', 'Zeitmanagement vor Ort', 'Minimum viable data vs. Nice-to-have.', 3, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-5-ablauf'), '5-4', 'Kommunikation während Aufnahme', 'Was kommentieren, was nicht.', 4, 6);

-- Modul 6: Datenerhebung (5 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-6-datenerhebung'), '6-1', 'Prinzipien guter Datenerhebung', 'Vollständig, konsistent, überprüfbar.', 1, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-6-datenerhebung'), '6-2', 'Mess- & Aufnahme-Grundregeln', 'Einheiten, Plausibilität, typische Fehler.', 2, 10),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-6-datenerhebung'), '6-3', 'Dokumentationsstandard', 'Notizen, Skizzen, Benennung, Struktur.', 3, 9),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-6-datenerhebung'), '6-4', 'Belegstandard: Foto-Qualität', 'Gut vs. Schlecht Beispiele für Nachweise.', 4, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-6-datenerhebung'), '6-5', 'Umgang mit fehlenden Informationen', 'Nachforderung und Markierung.', 5, 6);

-- Modul 7: Tool- & Dokumentationsworkflow (4 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-7-workflow'), '7-1', 'Datenerfassung im System', 'Pflichtfelder und Checkpoints.', 1, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-7-workflow'), '7-2', 'Foto-Upload & Zuordnung', 'Das Ordnungssystem verstehen.', 2, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-7-workflow'), '7-3', 'Versionierung & Status', 'In Arbeit → Fertig → Übergabe.', 3, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-7-workflow'), '7-4', 'Fehlerbehebung', 'Sync-Probleme, Offline, Datenverlust vermeiden.', 4, 8);

-- Modul 8: Abschluss beim Kunden (4 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-8-abschluss'), '8-1', 'Zusammenfassung geben', 'Neutral und ohne Zusagen kommunizieren.', 1, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-8-abschluss'), '8-2', 'Nächste Schritte erklären', 'Was passiert wann nach dem Termin.', 2, 5),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-8-abschluss'), '8-3', 'Offene Punkte klären', 'Dokumente, Fotos, Zugänge nachfordern.', 3, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-8-abschluss'), '8-4', 'Professionelle Verabschiedung', 'Der perfekte Abgang.', 4, 4);

-- Modul 9: Sonderfälle & Eskalationen (5 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-9-sonderfaelle'), '9-1', 'Zugang fehlt / Termin anpassen', 'Wenn der Kunde nicht vorbereitet ist.', 1, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-9-sonderfaelle'), '9-2', 'Sicherheitskritische Situationen', 'Abbruchkriterien kennen und anwenden.', 2, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-9-sonderfaelle'), '9-3', 'Unklare Bestandssituation', 'Widersprüchliche Angaben handhaben.', 3, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-9-sonderfaelle'), '9-4', 'Beschwerden & Konflikte', 'Ich will sofort Ergebnis - und andere Fälle.', 4, 9),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-9-sonderfaelle'), '9-5', 'Schnittstellenfälle', 'Andere Gewerke, Hausverwaltung, Mieter vs. Eigentümer.', 5, 7);

-- Modul 10: Qualitätssicherung (4 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-10-qa'), '10-1', 'Qualitätskriterien', 'K.O.-Kriterien und Mindeststandards.', 1, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-10-qa'), '10-2', 'Selbstcheck vor Abgabe', 'Deine Definition of Done.', 2, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-10-qa'), '10-3', 'Audit & Feedbackprozess', 'Stichproben, Coaching, Nachschulung.', 3, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-10-qa'), '10-4', 'Fehlerbibliothek', 'Top-Fehler und Lessons Learned.', 4, 8);

-- Modul 11: Praxisphase (3 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-11-praxis'), '11-1', 'Shadowing-Regeln', 'Mitlaufen, teilführen, komplett führen.', 1, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-11-praxis'), '11-2', 'Feedback-Routine', 'Kurz, konkret, standardisiert.', 2, 5),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-11-praxis'), '11-3', 'Dokumentationsreview', 'Beispiel-Fälle vergleichen und lernen.', 3, 7);

-- Modul 12: Prüfung & Zertifizierung (4 Lektionen)
INSERT INTO thermocheck.techniker_akademie_lektionen (modul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten) VALUES
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-12-pruefung'), '12-1', 'Theorie-Kurztest', 'Standards & Compliance prüfen.', 1, 6),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-12-pruefung'), '12-2', 'Praxisprüfung Vor-Ort', 'Beobachtung und Bewertungsrubrik.', 2, 8),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-12-pruefung'), '12-3', 'Dokumentationsprüfung', 'Qualität und Vollständigkeit bewerten.', 3, 7),
((SELECT id FROM thermocheck.techniker_akademie_module WHERE code = 'modul-12-pruefung'), '12-4', 'Freigabe & Rezertifizierung', 'Update-Pflicht und Refresh verstehen.', 4, 5);