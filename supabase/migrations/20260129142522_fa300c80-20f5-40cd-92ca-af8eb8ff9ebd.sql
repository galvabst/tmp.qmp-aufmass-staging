-- Akademie Content-Management Tabellen für Single Source of Truth
-- Hauptmodule (4 Module: Grundlagen, Ausrüstung, Durchführung, Nachbearbeitung)
CREATE TABLE public.onboarding_akademie_hauptmodule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  titel text NOT NULL,
  beschreibung text,
  reihenfolge int NOT NULL DEFAULT 0,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unterpunkte (16 Lektionen mit Video + Text)
CREATE TABLE public.onboarding_akademie_unterpunkte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hauptmodul_id uuid NOT NULL REFERENCES public.onboarding_akademie_hauptmodule(id) ON DELETE CASCADE,
  code text NOT NULL,
  titel text NOT NULL,
  beschreibung text,
  reihenfolge int NOT NULL DEFAULT 0,
  
  -- Video
  video_url text,
  video_dauer_minuten int DEFAULT 5,
  
  -- Lerninhalt (Markdown)
  text_inhalt text,
  text_zusammenfassung text,
  zusatzmaterial_urls jsonb DEFAULT '[]',
  
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(hauptmodul_id, code)
);

-- Indexes für Performance
CREATE INDEX idx_akademie_unterpunkte_hauptmodul ON public.onboarding_akademie_unterpunkte(hauptmodul_id);
CREATE INDEX idx_akademie_hauptmodule_reihenfolge ON public.onboarding_akademie_hauptmodule(reihenfolge);
CREATE INDEX idx_akademie_unterpunkte_reihenfolge ON public.onboarding_akademie_unterpunkte(reihenfolge);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION public.update_akademie_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_akademie_hauptmodule_updated_at
  BEFORE UPDATE ON public.onboarding_akademie_hauptmodule
  FOR EACH ROW EXECUTE FUNCTION public.update_akademie_updated_at();

CREATE TRIGGER update_akademie_unterpunkte_updated_at
  BEFORE UPDATE ON public.onboarding_akademie_unterpunkte
  FOR EACH ROW EXECUTE FUNCTION public.update_akademie_updated_at();

-- RLS aktivieren
ALTER TABLE public.onboarding_akademie_hauptmodule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_akademie_unterpunkte ENABLE ROW LEVEL SECURITY;

-- Leserechte für alle authentifizierten User (Onboarding-Content)
CREATE POLICY "Authenticated users can read hauptmodule"
  ON public.onboarding_akademie_hauptmodule FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

CREATE POLICY "Authenticated users can read unterpunkte"
  ON public.onboarding_akademie_unterpunkte FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Seed-Daten: 4 Hauptmodule
INSERT INTO public.onboarding_akademie_hauptmodule (code, titel, beschreibung, reihenfolge) VALUES
  ('grundlagen', 'Einführung und Grundlagen', 'Lerne die Basics von Thermocheck kennen', 1),
  ('ausruestung', 'Ausrüstung und Vorbereitung', 'Alles über Equipment und Vorbereitung', 2),
  ('durchfuehrung', 'Durchführung Thermocheck', 'Der komplette Ablauf eines Thermochecks', 3),
  ('nachbearbeitung', 'Nachbearbeitung und Dokumentation', 'Upload, Qualitätssicherung und Abschluss', 4);

-- Seed-Daten: 16 Unterpunkte
INSERT INTO public.onboarding_akademie_unterpunkte (hauptmodul_id, code, titel, beschreibung, reihenfolge, video_dauer_minuten, text_inhalt, text_zusammenfassung) VALUES
-- Modul 1: Grundlagen
((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'grundlagen'), 'einfuehrung', 'Einführung und Begrüßung', 'Willkommen bei Thermocheck', 1, 5, 
  '## Willkommen bei Thermocheck!

In diesem Modul lernst du:
- Die Geschichte und Mission von Thermocheck
- Deine Rolle als zertifizierter Techniker
- Den Ablauf des Onboardings

### Wichtige Punkte

1. **Qualität steht an erster Stelle**
   Jeder Thermocheck folgt unserem standardisierten Prozess.

2. **Der Kunde ist König**
   Professionelles Auftreten ist Pflicht.', 
  'Überblick über Thermocheck und deine Rolle als Techniker'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'grundlagen'), 'kleidung', 'Kleidung und Auftreten', 'Professionelles Erscheinungsbild', 2, 4, 
  '## Kleidung und Auftreten

### Pflichtausstattung
- Galvanek Poloshirt oder T-Shirt
- Saubere, gepflegte Kleidung
- Geschlossene Schuhe

### Verhalten beim Kunden
- Freundliche Begrüßung
- Kurze Vorstellung
- Respektvoller Umgang', 
  'Dress-Code und professionelles Auftreten'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'grundlagen'), 'sicherheit', 'Sicherheit und Datenschutz', 'DSGVO und Sicherheitsrichtlinien', 3, 6, 
  '## Sicherheit und Datenschutz

### DSGVO-Konformität
- Keine Fotos von Personen
- Keine Kundendaten teilen
- Sichere Datenübertragung

### Arbeitssicherheit
- Vorsicht auf Dächern
- Schutzausrüstung nutzen', 
  'Datenschutz und Arbeitssicherheit'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'grundlagen'), 'qualitaet', 'Qualitätsstandards', 'Was einen guten Thermocheck ausmacht', 4, 5, 
  '## Qualitätsstandards

### Kriterien für einen guten Thermocheck
- Vollständige Aufnahmen
- Korrekte Temperatureinstellungen
- Saubere Dokumentation

### Häufige Fehler vermeiden
- Unvollständige Scans
- Falsche Kameraeinstellungen', 
  'Qualitätsanforderungen und typische Fehler'),

-- Modul 2: Ausrüstung
((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'ausruestung'), 'drohne', 'Drohnen-Setup', 'Konfiguration und Checks', 1, 8, 
  '## Drohnen-Setup

### Vor dem Einsatz
- Firmware-Update prüfen
- Akkus vollständig geladen
- Propeller-Check

### Kalibrierung
- Kompass-Kalibrierung
- Gimbal-Kalibrierung', 
  'Drohne vorbereiten und kalibrieren'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'ausruestung'), 'waermebildkamera', 'Wärmebildkamera', 'Einstellungen und Bedienung', 2, 7, 
  '## Wärmebildkamera

### Optimale Einstellungen
- Temperaturbereich: -20°C bis +120°C
- Emissionsgrad: 0.95
- Palette: Iron oder Rainbow

### Kalibrierung
- Vor jedem Einsatz NUC durchführen', 
  'Kamera-Einstellungen für optimale Ergebnisse'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'ausruestung'), 'iphone-scanner', 'iPhone und Scanner App', 'LiDAR-Scanning mit dem iPhone', 3, 6, 
  '## iPhone und Scanner App

### Room Scanner Pro Setup
- App installieren und lizenzieren
- Kameraberechtigungen aktivieren
- LiDAR-Kalibrierung prüfen

### Scan-Einstellungen
- Hohe Auflösung aktivieren
- Texturaufnahme einschalten', 
  'iPhone für 3D-Scans vorbereiten'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'ausruestung'), 'checkliste', 'Equipment-Checkliste', 'Vollständigkeit vor dem Termin', 4, 4, 
  '## Equipment-Checkliste

### Pflicht-Equipment
- [ ] Drohne + Akkus
- [ ] iPhone mit Scanner App
- [ ] Ersatz-Akkus
- [ ] Ladegeräte
- [ ] Tablet für Dokumentation

### Nice-to-have
- Stativ
- Powerbank', 
  'Alles dabei? Checkliste vor jedem Einsatz'),

-- Modul 3: Durchführung
((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'durchfuehrung'), 'ankunft', 'Ankunft beim Kunden', 'Erster Eindruck zählt', 1, 5, 
  '## Ankunft beim Kunden

### Vor dem Klingeln
- Kleidung ordentlich
- Equipment bereit
- Ausweis griffbereit

### Begrüßung
- Freundlich vorstellen
- Ablauf kurz erklären
- Fragen beantworten', 
  'Professionelle Ankunft und Begrüßung'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'durchfuehrung'), 'begehung', 'Objektbegehung', 'Systematische Erfassung', 2, 8, 
  '## Objektbegehung

### Systematischer Ablauf
1. Außenaufnahmen (alle 4 Seiten)
2. Dachaufnahmen per Drohne
3. Innenräume systematisch

### Dokumentation
- Raum-für-Raum-Protokoll
- Besonderheiten notieren', 
  'Strukturierte Objekterfassung'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'durchfuehrung'), 'drohnenflug', 'Drohnenflug', 'Sicherer und effektiver Einsatz', 3, 10, 
  '## Drohnenflug

### Flugvorbereitung
- Wetterbedingungen prüfen
- Hindernisse identifizieren
- Startplatz wählen

### Flugmuster
- Kreuzflugmuster für Dächer
- Überlappende Aufnahmen
- Mindesthöhe beachten', 
  'Drohneneinsatz für Thermocheck'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'durchfuehrung'), 'innenraum-scan', 'Innenraum-Scanning', '3D-Erfassung mit LiDAR', 4, 7, 
  '## Innenraum-Scanning

### Scan-Technik
- Langsame, gleichmäßige Bewegungen
- Überlappende Scans
- Alle Ecken erfassen

### Qualitätskontrolle
- Vorschau prüfen
- Lücken nachscannen', 
  'LiDAR-Scans für Innenräume'),

-- Modul 4: Nachbearbeitung
((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'nachbearbeitung'), 'daten-upload', 'Daten-Upload', 'Sichere Übertragung der Daten', 1, 5, 
  '## Daten-Upload

### Upload-Prozess
1. WLAN-Verbindung sicherstellen
2. Thermocheck-App öffnen
3. Auftrag auswählen
4. Dateien hochladen

### Wichtig
- Alle Dateien vollständig
- Internetverbindung stabil', 
  'Daten sicher hochladen'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'nachbearbeitung'), 'qualitaetspruefung', 'Qualitätsprüfung', 'Eigenkontrolle vor Abgabe', 2, 6, 
  '## Qualitätsprüfung

### Checkliste
- [ ] Alle Räume erfasst
- [ ] Bilder scharf
- [ ] Temperaturskala korrekt
- [ ] Keine Personen sichtbar

### Bei Problemen
- Sofort Backoffice kontaktieren', 
  'Selbstkontrolle der Arbeit'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'nachbearbeitung'), 'dokumentation', 'Dokumentation', 'Vollständige Auftragsprotokollierung', 3, 5, 
  '## Dokumentation

### Pflichtangaben
- Datum und Uhrzeit
- Wetterbedingungen
- Besonderheiten

### Notizen
- Kundenfeedback
- Probleme dokumentieren', 
  'Lückenlose Dokumentation'),

((SELECT id FROM public.onboarding_akademie_hauptmodule WHERE code = 'nachbearbeitung'), 'abschluss', 'Auftragsabschluss', 'Verabschiedung und Nachbereitung', 4, 4, 
  '## Auftragsabschluss

### Beim Kunden
- Kurze Zusammenfassung
- Fragen beantworten
- Professionelle Verabschiedung

### Nach dem Termin
- Equipment verstauen
- Auftrag in App abschließen', 
  'Professioneller Abschluss');