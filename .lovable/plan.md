

# Profil-View Überarbeitung: Stats, Akademie, UX-Cleanup

## Zusammenfassung der Änderungen

7 konkrete Verbesserungen am Profil-Tab für Contractor/Trainer:

### 1. Stats-Leiste überarbeiten (3 Kacheln)

**Vorher:** Aufträge | Annahmerate (100% hardcoded) | Bewertung (nur Zahl "5")  
**Nachher:** Aufträge | Bewertung (⭐ 5.0 + Anzahl) | Pünktlichkeit (%)

- **Annahmerate entfernen** — ist immer 100%, weil Ablehnungen nicht getrackt werden. Irreführend.
- **Bewertung**: Stern-Symbol + Durchschnitt anzeigen. Darunter "(X Bewertungen)" als Subtext via `bewertungStats.count`.
- **Pünktlichkeit**: `punctuality.onTimePercent` + "%" anzeigen. Darunter "X verspätet" wenn lateCount > 0.
- Dadurch wird die separate Pünktlichkeits-Sektion (Zeilen 233-268) **redundant** und kann entfernt werden — die Details (Late Fees) bleiben nur im Pünktlichkeits-Abschnitt wenn `totalSubmittedOrders > 0`.

**Korrektur**: Pünktlichkeits-Detailsektion bleibt bestehen (Late Fees, pünktlich/verspätet Zähler). Die Stats-Leiste zeigt nur den Prozentwert als Schnellübersicht.

**Datenfluss:**  
- `bewertungStats` kommt bereits via `useTechnikerBewertungStats` → wird durchgereicht als neues Prop `bewertungCount`
- `punctuality` ist bereits in ProfileView verfügbar via `useVerspaetungStats`

### 2. Galvanek Logo nach oben verschieben

Logo direkt neben Name/Avatar im Header statt unterhalb. Aktuell steht es allein in `div.flex.justify-center.mt-2` — verschieben in die Header-Zeile rechts neben dem Edit-Button, oder alternativ zwischen Avatar-Zeile und Stats-Karte als prominenterer Separator.

**Entscheidung:** Logo zwischen Name und Stats-Karte platzieren, zentriert, etwas größer (`size="md"` statt `sm`).

### 3. Onboarding-Sektion entfernen

- Komplette Onboarding-Sektion (Fortschritt + Steps + "abgeschlossen" Badge) entfernen (Zeilen 312-360)
- Trainers sehen Onboarding nie (bypass), fertige Contractors brauchen es nicht mehr
- `onStartOnboarding` Prop wird nicht mehr benötigt

### 4. Akademie-Sektion hinzufügen

Neue Sektion "Akademie" die alle aktiven Module + Lektionen anzeigt mit Fortschritt.

**Datenquellen (bereits existierend):**
- `useAkademieContent()` → liefert alle aktiven Module mit Unterpunkten
- `useAkademieFortschritt(contractorOnboardingId)` → liefert Set<string> der abgeschlossenen Lektion-IDs
- Route `/akademie/modul/:modulId` existiert bereits

**UI:**
```
Akademie
┌──────────────────────────────────────────┐
│ Fortschritt                    12/15 (80%) │
│ ████████████████░░░░                      │
│                                           │
│ Modul 1: Grundlagen          3/3  ✓       │
│ Modul 2: Wärmepumpen         3/3  ✓       │
│ Modul 6: Datenerhebung       6/9          │
│   └ 6.1 Einführung           ✓            │
│   └ 6.2 Thermografie         ✓            │
│   └ 6.3 Drohnenflug          ⏳           │
└──────────────────────────────────────────┘
```

Jede Lektion ist klickbar → navigiert zu `/akademie/modul/{lektionId}`.

**Props-Änderung:** `ProfileView` bekommt `contractorOnboardingId` als neues Prop (bereits in Index.tsx als `contractorOnboardingId` verfügbar).

### 5. Menü-Sektion aufräumen

**Entfernen:**
- "Persönliche Daten" (tut nichts, Edit-Button im Header reicht)
- "Einstellungen" (tut nichts)

**Behalten:**
- "Onboarding-Vorschau" (nur für Trainer sichtbar, `isTrainer && onStartOnboardingPreview`)

**Ergebnis:** Wenn kein Trainer → keine Menü-Sektion angezeigt. Wenn Trainer → nur "Onboarding-Vorschau".

### 6. TrainerRideAlongs: Collapsible bei vielen Einträgen

Vergangene Mitfahrten: Wenn >3 Einträge, nur erste 3 anzeigen + "Alle X anzeigen" Button.

**Änderung in `TrainerRideAlongs.tsx`:**
- `RideAlongSection` bekommt `collapsible={true}` + `initialCount={3}`
- State `showAll` toggle
- Anstehende immer alle zeigen, vergangene collapsed

### 7. Index.tsx: Props anpassen

- `bewertungStats` an ProfileView durchreichen (für count)
- `contractorOnboardingId` durchreichen (für Akademie-Fortschritt)
- `onStartOnboarding` Prop entfernen

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/ProfileView.tsx` | Stats-Leiste, Logo, Onboarding weg, Akademie-Sektion, Menü-Cleanup |
| `src/components/trainer/TrainerRideAlongs.tsx` | Collapsible vergangene Mitfahrten |
| `src/pages/Index.tsx` | Neue Props durchreichen |
| `src/types/technician.ts` | `acceptanceRate` aus Stats entfernen (optional, breaking) |

## Keine DB-Änderungen nötig

Alle Daten sind bereits in der DB vorhanden und über existierende Hooks abrufbar:
- `useAkademieContent` → Module + Lektionen
- `useAkademieFortschritt` → Abgeschlossene Lektionen
- `useTechnikerBewertungStats` → Rating average + count
- `useVerspaetungStats` → Pünktlichkeit

## Edge Cases

- Keine Bewertungen → "–" anzeigen statt 0 Sterne
- Keine Lektionen aktiv → Akademie-Sektion ausblenden
- 0 submitted orders → Pünktlichkeit "–" in Stats
- Trainer ohne Mitfahrten → leere Mitfahrten-Sektion bleibt wie bisher
- Contractor noch im Onboarding → diese View wird nie erreicht (Onboarding-Gate greift vorher)
- `contractorOnboardingId` null → Akademie-Sektion ausblenden

## Rollen-Matrix

| Rolle | Akademie-Content | Fortschritt | Bewertungen | Verspätungen |
|-------|-----------------|-------------|-------------|--------------|
| Contractor (user) | SELECT ✅ (RLS authenticated) | SELECT eigene ✅ | SELECT eigene ✅ | SELECT eigene ✅ |
| Trainer | SELECT ✅ | SELECT eigene ✅ | SELECT eigene ✅ | SELECT eigene ✅ |
| Admin | Sieht Profil-View nie (redirect /admin) | – | – | – |

