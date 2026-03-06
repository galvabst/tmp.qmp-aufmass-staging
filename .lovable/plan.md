

# Plan: Forum UX verbessern + Themen-Filter

## Überblick
Die Forum-Ansicht bekommt eine bessere UX mit Themen-Tags und schöneren Cards. Threads werden mit Kategorien versehen, die als horizontale Filter-Chips funktionieren.

## 1. Themen-Kategorien einführen

Feste Kategorien als Frontend-Konstante (kein DB-Feld nötig — wir nutzen ein neues optionales `kategorie`-Feld in der DB):

- **Aufmaß** — Fragen zum ThermoCheck-Formular
- **Technik** — Wärmepumpen, Hydraulik, Elektrik
- **Montage** — Aufstellort, Abstände, Schallschutz
- **App & Tools** — Raumscan, Software-Probleme
- **Sonstiges** — Alles andere

## 2. DB-Änderung

`thermocheck.contractor_forum_threads` um Spalte `kategorie text` erweitern. Bestehende 8 Threads mit passenden Kategorien updaten.

## 3. UI-Änderungen

**`ForumView.tsx`**:
- Themen-Filter als horizontale Scroll-Leiste mit farbigen Chips unter dem bestehenden "Alle/Unbeantwortete"-Filter
- Jeder Chip hat eine eigene dezente Farbe (analog zu Status-Badges)
- Filter-Logik: Kategorie-Filter + bestehender Filter kombiniert

**`ForumThreadCard.tsx`**:
- Farbiger Kategorie-Badge oben rechts in der Card
- Avatar-Initialen-Kreis links (erstes Buchstabe des Autorennamens) für persönlichere Optik
- Dezenter Farbverlauf-Hintergrund bei gelösten Threads

**`ForumNewThread.tsx`**:
- Kategorie-Auswahl (Dropdown oder Chip-Select) als Pflichtfeld beim Erstellen

**`useForumThreads.ts`**:
- `kategorie` im ForumThread-Interface ergänzen
- Optional: Kategorie-Filter als Parameter

**`useCreateThread.ts`**:
- `kategorie` Parameter beim Insert mitschicken

## 4. Bestehende Threads kategorisieren (Migration)

| Thread | Kategorie |
|--------|-----------|
| Vorlauftemperatur Altbau | Technik |
| Raumscan-App stürzt ab | App & Tools |
| Mindestabstände Außengerät | Montage |
| Unbegehbare Räume | Aufmaß |
| Pufferspeicher Fußbodenheizung | Technik |
| Neuer Zählerplatz | Technik |
| Fotos Heizungsraum | Aufmaß |
| Schallschutznachweis | Montage |

## Dateien

- **Migration**: `kategorie text` Spalte + Update bestehender Threads
- `src/features/forum/ui/ForumView.tsx` — Kategorie-Filter-Chips + Layout
- `src/features/forum/ui/ForumThreadCard.tsx` — Avatar, Kategorie-Badge, schöneres Layout
- `src/features/forum/ui/ForumNewThread.tsx` — Kategorie-Auswahl
- `src/features/forum/hooks/useForumThreads.ts` — Kategorie im Interface + Filter
- `src/features/forum/hooks/useCreateThread.ts` — Kategorie beim Insert

