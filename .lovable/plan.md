
# Masterplan: Akademie-System Komplett-Refactoring

## Executive Summary

Komplettes Refactoring des Akademie-Systems mit 13 Modulen (0-12), 52 Lektionen, Unskippable Videos und Quiz-System nach jedem Modul.

---

## 1. Ist-Analyse (Systemzustand)

### 1.1 Datenbank-Status

| Tabelle | Schema | Status | Datensätze |
|---------|--------|--------|-----------|
| `onboarding_akademie_hauptmodule` | public | **AKTIV** | 4 Module |
| `onboarding_akademie_unterpunkte` | public | **AKTIV** | 16 Lektionen |
| `academy_module` | thermocheck | LEGACY (leer) | 0 |
| `contractor_academy_progress` | thermocheck | AKTIV | FK auf `academy_module` |

**Problem:** Akademie-Tabellen falsch im `public` Schema, sollten in `thermocheck` sein (LOVABLE_BEHAVIOUR.txt Regel 12).

### 1.2 Vorhandene ENUMs (thermocheck)

- `academy_module_typ_enum`: video, doc, mixed
- `academy_progress_status_enum`: not_started, in_progress, completed

### 1.3 Frontend-Status

- Hook: `src/hooks/useAkademieContent.ts` → Liest aus `public` Schema
- Step: `src/components/onboarding/steps/AcademyStep.tsx` → Zeigt Module/Lektionen
- Page: `src/pages/AkademieModul.tsx` → Einzelne Lektion mit Video
- State: `src/hooks/useOnboardingState.ts` → Lokaler State in localStorage
- Config: `src/lib/onboarding-config.ts` → MOCK_AKADEMIE_HAUPTMODULE als Fallback

### 1.4 RLS-Status

- `public.onboarding_akademie_hauptmodule`: SELECT für `ist_aktiv = true`
- `public.onboarding_akademie_unterpunkte`: SELECT für `ist_aktiv = true`
- `thermocheck.academy_module`: ALL für authenticated (zu permissiv)
- `thermocheck.contractor_academy_progress`: ALL für authenticated (zu permissiv)

---

## 2. User Stories & User Flow

### 2.1 User Story: Techniker absolviert Akademie

```text
Als neuer Techniker möchte ich:
1. Die Akademie-Übersicht sehen mit allen 13 Modulen
2. Module sequentiell freischalten (vorheriges muss abgeschlossen sein)
3. Innerhalb eines Moduls alle Lektionen ansehen (sequentiell)
4. Videos komplett ansehen müssen (unskippable)
5. Nach Abschluss ALLER Lektionen eines Moduls ein Quiz absolvieren
6. Bei bestandenem Quiz das nächste Modul freischalten
7. Nach Abschluss aller Module den Abschlusstest machen
```

### 2.2 User Flow (Step-by-Step)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Akademie-Übersicht                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. User ist auf Onboarding-Step "Akademie"                                  │
│ 2. Sieht 13 Module (0-12) als Accordion                                     │
│ 3. Nur Modul 0 ist freigeschaltet                                           │
│ 4. Andere Module zeigen Lock-Icon                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Lektion ansehen                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. User klickt auf freigeschaltete Lektion                                  │
│ 2. Navigiert zu /akademie/modul/{lektionId}                                 │
│ 3. Video startet (16:9 Container)                                           │
│ 4. "Abschließen"-Button ist DISABLED                                        │
│ 5. Video-Progress wird getrackt (onTimeUpdate)                              │
│ 6. Nach 90% Wiedergabe: Button wird ENABLED                                 │
│ 7. User klickt "Abschließen" → Zurück zur Übersicht                         │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Modul-Quiz                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Alle Lektionen eines Moduls abgeschlossen                                │
│ 2. Quiz-Modal erscheint automatisch ODER Button "Quiz starten"              │
│ 3. User beantwortet 3-5 Fragen (Multiple Choice)                            │
│ 4. Ergebnis: >= 80% = Bestanden                                             │
│ 5. Bei Bestanden: Nächstes Modul wird freigeschaltet                        │
│ 6. Bei Nicht-Bestanden: Erneuter Versuch möglich                            │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Abschluss                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Alle 13 Module + Quizze abgeschlossen                                    │
│ 2. Finaler Abschlusstest (Modul 12 Inhalt)                                  │
│ 3. Bei Bestanden: Akademie-Schritt wird als "completed" markiert            │
│ 4. User kann zu "Nachweise" (nächster Onboarding-Schritt) wechseln          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technischer Plan

### 3.1 Datenbank-Migration

**Schritt 1: Neue Tabellen im thermocheck Schema erstellen**

```sql
-- 1. Module (13 Stück)
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

-- 2. Lektionen (52 Stück)
CREATE TABLE thermocheck.techniker_akademie_lektionen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id uuid NOT NULL REFERENCES thermocheck.techniker_akademie_module(id) ON DELETE CASCADE,
  code text NOT NULL,
  titel text NOT NULL,
  beschreibung text,
  reihenfolge integer NOT NULL DEFAULT 0,
  video_url text,
  video_dauer_minuten integer,
  text_inhalt text,
  text_zusammenfassung text,
  zusatzmaterial_urls text[],
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(modul_id, code)
);

-- 3. Quiz-Fragen pro Modul
CREATE TABLE thermocheck.techniker_akademie_quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id uuid NOT NULL REFERENCES thermocheck.techniker_akademie_module(id) ON DELETE CASCADE,
  frage text NOT NULL,
  antworten jsonb NOT NULL, -- [{text: "...", korrekt: true/false}]
  reihenfolge integer NOT NULL DEFAULT 0,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Lektions-Fortschritt pro User
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

-- 5. Quiz-Ergebnisse pro User/Modul
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
```

**Schritt 2: Indexes erstellen**

```sql
CREATE INDEX idx_lektionen_modul_id ON thermocheck.techniker_akademie_lektionen(modul_id);
CREATE INDEX idx_quiz_modul_id ON thermocheck.techniker_akademie_quiz(modul_id);
CREATE INDEX idx_lektions_fortschritt_contractor ON thermocheck.techniker_akademie_lektions_fortschritt(contractor_id);
CREATE INDEX idx_quiz_ergebnis_contractor ON thermocheck.techniker_akademie_quiz_ergebnis(contractor_id);
```

**Schritt 3: RLS Policies**

```sql
-- Module: Alle authentifizierten User können lesen
ALTER TABLE thermocheck.techniker_akademie_module ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read modules"
  ON thermocheck.techniker_akademie_module FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Lektionen: Alle authentifizierten User können lesen
ALTER TABLE thermocheck.techniker_akademie_lektionen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read lektionen"
  ON thermocheck.techniker_akademie_lektionen FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Quiz: Alle authentifizierten User können lesen
ALTER TABLE thermocheck.techniker_akademie_quiz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read quiz"
  ON thermocheck.techniker_akademie_quiz FOR SELECT
  TO authenticated
  USING (ist_aktiv = true);

-- Fortschritt: User können nur eigenen Fortschritt sehen/ändern
-- HINWEIS: Aktuell kein user_id in contractor_onboarding, daher erstmal ALL für authenticated
ALTER TABLE thermocheck.techniker_akademie_lektions_fortschritt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage own progress"
  ON thermocheck.techniker_akademie_lektions_fortschritt FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Quiz-Ergebnis: User können nur eigene Ergebnisse sehen/ändern
ALTER TABLE thermocheck.techniker_akademie_quiz_ergebnis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage own quiz results"
  ON thermocheck.techniker_akademie_quiz_ergebnis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Schritt 4: Neues Curriculum einfügen (13 Module, 52 Lektionen)**

```sql
-- Module 0-12 einfügen
INSERT INTO thermocheck.techniker_akademie_module (code, titel, beschreibung, reihenfolge) VALUES
('willkommen', 'Willkommen & Orientierung', 'Ziel der Akademie und Lernpfad', 0),
('grundlagen', 'Grundlagen: Thermocheck verstehen', 'Was ist Thermocheck und was nicht', 1),
('service', 'Service-Professionalität', 'Auftreten, Kommunikation, Erwartungsmanagement', 2),
('compliance', 'Sicherheit, Regeln & Compliance', 'Arbeitssicherheit, Datenschutz, Eskalation', 3),
('vorbereitung', 'Terminvorbereitung', 'Briefing, Equipment-Check, Zeitplanung', 4),
('ablauf', 'Ablauf vor Ort', 'Phasenmodell, Zeitmanagement', 5),
('datenerhebung', 'Datenerhebung', 'Qualität, Vollständigkeit, Dokumentation', 6),
('workflow', 'Tool- & Dokumentationsworkflow', 'Datenerfassung, Upload, Versionierung', 7),
('abschluss', 'Abschluss beim Kunden', 'Zusammenfassung, Next Steps, Verabschiedung', 8),
('sonderfaelle', 'Sonderfälle & Eskalationen', 'Problemsituationen, Konflikte, Abbruchkriterien', 9),
('qa', 'Qualitätssicherung', 'K.O.-Kriterien, Selbstcheck, Feedback', 10),
('praxis', 'Praxisphase: Training on the Job', 'Shadowing, Feedback-Routine', 11),
('pruefung', 'Prüfung & Zertifizierung', 'Theorie-Test, Praxis-Prüfung, Freigabe', 12);

-- Lektionen pro Modul einfügen (gekürzt für Übersicht)
-- Modul 0: 3 Lektionen
-- Modul 1: 3 Lektionen
-- ... (insgesamt 52 Lektionen)
```

**Schritt 5: Alte Tabellen löschen**

```sql
-- Erst NACH erfolgreicher Migration und Frontend-Update!
DROP TABLE public.onboarding_akademie_unterpunkte;
DROP TABLE public.onboarding_akademie_hauptmodule;

-- Legacy thermocheck.academy_module FK entfernen und löschen
ALTER TABLE thermocheck.contractor_academy_progress DROP CONSTRAINT IF EXISTS contractor_academy_progress_module_id_fkey;
DROP TABLE thermocheck.academy_module;
```

### 3.2 Frontend-Änderungen

**Dateien die geändert werden:**

| Datei | Änderung |
|-------|----------|
| `src/hooks/useAkademieContent.ts` | Neue Tabellennamen, thermocheck Schema |
| `src/pages/AkademieModul.tsx` | Unskippable Video-Logik |
| `src/components/onboarding/steps/AcademyStep.tsx` | Quiz-Trigger nach Modul-Abschluss |
| `src/lib/onboarding-config.ts` | MOCK_AKADEMIE_HAUPTMODULE auf 13 Module updaten |
| `src/types/onboarding.ts` | Quiz-Types hinzufügen |

**Neue Dateien:**

| Datei | Zweck |
|-------|-------|
| `src/components/akademie/QuizModal.tsx` | Quiz-Overlay nach Modul-Abschluss |
| `src/hooks/useModulQuiz.ts` | Quiz-Fragen laden |
| `src/hooks/useVideoProgress.ts` | Video-Fortschritt tracken |
| `src/hooks/useAkademieFortschritt.ts` | DB-Fortschritt laden/speichern |

### 3.3 Video-Unskippable-Logik

```typescript
// src/hooks/useVideoProgress.ts
export function useVideoProgress(videoRef: RefObject<HTMLVideoElement>) {
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const requiredWatchTime = duration * 0.9; // 90% muss angesehen werden
  const canComplete = watchedSeconds >= requiredWatchTime;
  
  // Event-Handler:
  // - onLoadedMetadata: Duration setzen
  // - onTimeUpdate: watchedSeconds erhöhen (nur vorwärts!)
  // - Springen im Video erhöht watchedSeconds NICHT
  
  return { canComplete, watchedSeconds, duration, percentWatched };
}
```

### 3.4 Quiz-System

```typescript
// Quiz-Flow:
// 1. Alle Lektionen eines Moduls abgeschlossen
// 2. QuizModal erscheint mit 3-5 Fragen
// 3. User wählt Antworten
// 4. Submit → Score berechnen
// 5. >= 80% = Bestanden → Nächstes Modul freigeschaltet
// 6. < 80% = Nicht bestanden → Erneuter Versuch
```

---

## 4. Sicherheits-Analyse

### 4.1 IAM-Berechtigungen

- **Akademie-Inhalte (Module, Lektionen, Quiz):** READ für alle authentifizierten User
- **Fortschritt (Lektionen, Quiz-Ergebnisse):** READ/WRITE nur für eigene Daten
- **Admin-Zugriff:** Über is_admin() für Inhalts-Verwaltung (später)

### 4.2 RLS-Muster

| Tabelle | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| techniker_akademie_module | auth + ist_aktiv | is_admin() | is_admin() | is_admin() |
| techniker_akademie_lektionen | auth + ist_aktiv | is_admin() | is_admin() | is_admin() |
| techniker_akademie_quiz | auth + ist_aktiv | is_admin() | is_admin() | is_admin() |
| techniker_akademie_lektions_fortschritt | auth (eigene) | auth (eigene) | auth (eigene) | - |
| techniker_akademie_quiz_ergebnis | auth (eigene) | auth (eigene) | - | - |

### 4.3 Bekannte Einschränkung

**Problem:** `thermocheck.contractor_onboarding` hat aktuell KEINE `user_id` Spalte die auf `public.profiles` zeigt. Daher kann RLS nicht "eigene Daten" validieren.

**Workaround für jetzt:** ALL für authenticated (vertrauen auf Frontend-Logik).

**TODO (Zukunft):** `user_id uuid REFERENCES public.profiles(id)` zu `contractor_onboarding` hinzufügen und RLS anpassen.

---

## 5. Migrations-Reihenfolge

```text
1. ✅ Neue Tabellen in thermocheck erstellen (Module, Lektionen, Quiz, Fortschritt)
2. ✅ Indexes erstellen
3. ✅ RLS Policies erstellen
4. ✅ 13 Module einfügen
5. ✅ 52 Lektionen einfügen (mit leeren video_urls)
6. ✅ Frontend: useAkademieContent.ts anpassen
7. ✅ Frontend: AkademieModul.tsx mit Unskippable-Logik
8. ✅ Frontend: QuizModal.tsx erstellen
9. ✅ Frontend: onboarding-config.ts updaten
10. ⏳ Alte Tabellen löschen (NACH Verifikation)
```

---

## 6. Edge Cases & Lösungen

| Edge Case | Lösung |
|-----------|--------|
| Video lädt nicht | Fallback: Button nach 60s Wartezeit aktiv |
| User schließt Tab während Video | Progress in localStorage speichern, bei Rückkehr fortsetzen |
| Quiz nicht bestanden | Sofort erneuter Versuch möglich, Versuch-Counter in DB |
| Modul 11 (Praxisphase) ohne Video | Spezial-Logik: Zeigt Info-Text, verlinkt zu Coaching-Step |
| Modul 12 (Prüfung) | Finaler Theorie-Test mit höherer Bestehensgrenze (85%) |
| Manipulation via DevTools | Video-Progress nur serverseitig validieren (Phase 2) |
| User ist nicht eingeloggt | Redirect zu /login, kein Zugriff auf Akademie |
| Video-Format nicht unterstützt | Fallback auf Platzhalter, Admin benachrichtigen |

---

## 7. Neues Curriculum (52 Lektionen)

| Modul | Titel | Lektionen |
|-------|-------|-----------|
| 0 | Willkommen & Orientierung | 3 |
| 1 | Grundlagen: Thermocheck verstehen | 3 |
| 2 | Service-Professionalität | 5 |
| 3 | Sicherheit, Regeln & Compliance | 4 |
| 4 | Terminvorbereitung | 4 |
| 5 | Ablauf vor Ort | 4 |
| 6 | Datenerhebung | 5 |
| 7 | Tool- & Dokumentationsworkflow | 4 |
| 8 | Abschluss beim Kunden | 4 |
| 9 | Sonderfälle & Eskalationen | 5 |
| 10 | Qualitätssicherung | 4 |
| 11 | Praxisphase: Training on the Job | 3 |
| 12 | Prüfung & Zertifizierung | 4 |
| **TOTAL** | | **52** |

---

## 8. Implementierungs-Schritte (Atomare Tasks)

### Task 1: DB-Migration (Schema + Daten)
- Neue Tabellen erstellen
- Indexes erstellen
- RLS Policies erstellen
- 13 Module einfügen
- 52 Lektionen einfügen

### Task 2: Frontend-Hook Updates
- `useAkademieContent.ts` auf neue Tabellen anpassen
- `useAkademieFortschritt.ts` neu erstellen

### Task 3: Video-Player mit Unskippable-Logik
- `useVideoProgress.ts` Hook erstellen
- `AkademieModul.tsx` anpassen

### Task 4: Quiz-System
- `QuizModal.tsx` Komponente erstellen
- `useModulQuiz.ts` Hook erstellen
- Integration in `AcademyStep.tsx`

### Task 5: Config & Types Update
- `onboarding-config.ts` mit 13 Modulen
- `types/onboarding.ts` Quiz-Types

### Task 6: Cleanup
- Alte Tabellen löschen (nach Verifikation)
- Legacy-Code entfernen

---

## 9. Offene Fragen (VOR Implementation klären)

1. **Video-Provider:** YouTube, Vimeo oder eigenes Hosting?
2. **Quiz-Bestehensgrenze:** 80% für normale Module, 85% für Abschlussprüfung?
3. **Wiederholungsversuche:** Unbegrenzt oder max. 3 pro Tag?
4. **Modul 11 (Praxisphase):** Videos oder nur Info + Coaching-Link?
5. **Authentication:** Ist Auth bereits implementiert oder muss das zuerst?

---

## 10. Technische Voraussetzungen

- ✅ Supabase-Verbindung aktiv
- ✅ thermocheck Schema existiert
- ✅ RLS Helper-Funktionen vorhanden (is_admin)
- ✅ ENUMs vorhanden (academy_progress_status_enum)
- ⚠️ Auth noch nicht vollständig (user_id FK fehlt)
- ⚠️ contractor_onboarding hat keine user_id Spalte
