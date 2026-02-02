
# Migration: Akademie-Tabellen ins thermocheck Schema

## Analyse-Ergebnis

### Aktuelle Situation (Problem)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DOPPELTE STRUKTUREN - VERWIRREND                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ public Schema (FALSCH PLATZIERT - hat echte Daten)                              │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ onboarding_akademie_hauptmodule     → 4 Module mit Inhalt                   │ │
│ │ onboarding_akademie_unterpunkte     → 16 Lektionen mit Inhalt               │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ thermocheck Schema (RICHTIG PLATZIERT - aber leer/andere Struktur)              │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ academy_module                      → LEER (0 Einträge), flache Struktur    │ │
│ │ contractor_academy_progress         → Fortschritts-Tracking (behalten!)     │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Regelverletzung (LOVABLE_BEHAVIOUR.txt Regel 12)

Die Akademie gehört zum **Techniker-Onboarding-Domain** und muss ins `thermocheck` Schema. Der aktuelle Name `onboarding_akademie_*` ist zudem unklar - welches Onboarding? Für wen?

---

## Lösung: Eindeutige Benennung im richtigen Schema

### Neue Tabellenstruktur

| Alt (public) | Neu (thermocheck) | Begründung |
|--------------|-------------------|------------|
| `onboarding_akademie_hauptmodule` | `techniker_akademie_module` | Klar: Akademie für Techniker, "Module" statt "Hauptmodule" |
| `onboarding_akademie_unterpunkte` | `techniker_akademie_lektionen` | Klar: Lektionen innerhalb der Module |
| `academy_module` (leer) | LÖSCHEN | Legacy, nie befüllt, andere Struktur |
| `contractor_academy_progress` | BEHALTEN | Fortschritts-Tracking, wird angepasst |

### Namenskonvention

```text
thermocheck.techniker_akademie_module      → Die 4 Hauptbereiche
thermocheck.techniker_akademie_lektionen   → Die 16 Lektionen
thermocheck.techniker_akademie_fortschritt → Fortschritt pro User (Umbenennung von contractor_academy_progress)
```

**Warum "techniker_akademie_*"?**
- `techniker_` = Zielgruppe eindeutig (nicht Verkäufer, nicht Admins)
- `akademie_` = Bereich eindeutig
- `module/lektionen/fortschritt` = Inhalt eindeutig

---

## Migrations-Schritte

### Schritt 1: Neue Tabellen im thermocheck Schema erstellen

```sql
-- Modul 1: Hauptbereiche der Akademie
CREATE TABLE thermocheck.techniker_akademie_module (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,           -- z.B. 'grundlagen', 'ausruestung'
  titel text NOT NULL,
  beschreibung text,
  reihenfolge integer NOT NULL DEFAULT 0,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Modul 2: Lektionen innerhalb der Module
CREATE TABLE thermocheck.techniker_akademie_lektionen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id uuid NOT NULL REFERENCES thermocheck.techniker_akademie_module(id) ON DELETE CASCADE,
  code text NOT NULL,                  -- z.B. 'was-ist-thermocheck'
  titel text NOT NULL,
  beschreibung text,
  reihenfolge integer NOT NULL DEFAULT 0,
  
  -- Content
  video_url text,
  video_dauer_minuten integer,
  text_inhalt text,                    -- Markdown
  text_zusammenfassung text,           -- Markdown
  zusatzmaterial_urls text[],
  
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(modul_id, code)
);
```

### Schritt 2: Daten migrieren

```sql
-- Hauptmodule übertragen
INSERT INTO thermocheck.techniker_akademie_module 
  (id, code, titel, beschreibung, reihenfolge, ist_aktiv, created_at, updated_at)
SELECT 
  id, code, titel, beschreibung, reihenfolge, ist_aktiv, created_at, updated_at
FROM public.onboarding_akademie_hauptmodule;

-- Lektionen übertragen
INSERT INTO thermocheck.techniker_akademie_lektionen
  (id, modul_id, code, titel, beschreibung, reihenfolge, 
   video_url, video_dauer_minuten, text_inhalt, text_zusammenfassung, 
   zusatzmaterial_urls, ist_aktiv, created_at, updated_at)
SELECT 
  id, hauptmodul_id, code, titel, beschreibung, reihenfolge,
  video_url, video_dauer_minuten, text_inhalt, text_zusammenfassung,
  zusatzmaterial_urls, ist_aktiv, created_at, updated_at
FROM public.onboarding_akademie_unterpunkte;
```

### Schritt 3: Fortschritts-Tabelle anpassen

```sql
-- Umbenennen für Konsistenz
ALTER TABLE thermocheck.contractor_academy_progress 
RENAME TO techniker_akademie_fortschritt;

-- FK auf neue Lektions-Tabelle anpassen
-- (Falls module_id auf alte Tabelle zeigt)
```

### Schritt 4: Alte Tabellen löschen

```sql
-- Erst nach erfolgreicher Migration!
DROP TABLE public.onboarding_akademie_unterpunkte;
DROP TABLE public.onboarding_akademie_hauptmodule;
DROP TABLE thermocheck.academy_module;  -- War immer leer
```

---

## Frontend-Anpassungen

### Datei: `src/hooks/useAkademieContent.ts`

Änderungen:
- `from('onboarding_akademie_hauptmodule')` → `from('techniker_akademie_module')`
- `from('onboarding_akademie_unterpunkte')` → `from('techniker_akademie_lektionen')`
- Anpassung der Join-Namen (`onboarding_akademie_unterpunkte` → `techniker_akademie_lektionen`)

### Datei: `src/integrations/supabase/types.ts`

Wird automatisch aktualisiert nach Migration (Supabase generiert neue Types).

---

## Ergebnis nach Migration

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SAUBERE STRUKTUR IM THERMOCHECK SCHEMA                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ thermocheck.techniker_akademie_module                                           │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ id, code, titel, beschreibung, reihenfolge, ist_aktiv                       │ │
│ │ → "Einführung und Grundlagen"                                               │ │
│ │ → "Ausrüstung und Vorbereitung"                                             │ │
│ │ → "Durchführung Thermocheck"                                                │ │
│ │ → "Nachbearbeitung und Dokumentation"                                       │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│          │                                                                      │
│          │ 1:n                                                                  │
│          ▼                                                                      │
│ thermocheck.techniker_akademie_lektionen                                        │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ id, modul_id, code, titel, video_url, text_inhalt, ...                      │ │
│ │ → 16 Lektionen mit Content                                                  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│          │                                                                      │
│          │ 1:n                                                                  │
│          ▼                                                                      │
│ thermocheck.techniker_akademie_fortschritt                                      │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ contractor_id, lektion_id, status, completed_at, quiz_score                 │ │
│ │ → Tracking pro Techniker                                                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Zusammenfassung der Änderungen

| Bereich | Änderung |
|---------|----------|
| **DB: Schema** | Von `public` nach `thermocheck` verschieben |
| **DB: Tabellennamen** | `onboarding_akademie_*` → `techniker_akademie_*` |
| **DB: Spaltennamen** | `hauptmodul_id` → `modul_id` (konsistenter) |
| **DB: Legacy** | `thermocheck.academy_module` löschen (leer) |
| **Frontend** | `useAkademieContent.ts` Tabellennamen anpassen |
| **Types** | Automatisch nach Supabase-Sync |

---

## Vorteile der neuen Struktur

1. **Eindeutig:** `techniker_akademie_*` sagt sofort wofür es ist
2. **Korrekt platziert:** Im `thermocheck` Domain-Schema (Regel 12)
3. **Keine Redundanz:** Leere `academy_module` Tabelle wird gelöscht
4. **Konsistente Benennung:** Passt zu `contractor_onboarding`, `contractor_coaching`, etc.
5. **Erweiterbar:** Falls später Verkäufer-Akademie kommt: `verkaeufer_akademie_*`
