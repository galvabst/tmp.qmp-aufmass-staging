

# Dashboard-Umbau: Detaillierte Filtertabelle

## Problem
Die aktuelle Ansicht mit abstrakten Fortschrittsbalken und kleinen Icons ist nicht intuitiv. Der Admin kann nicht auf einen Blick erkennen, wer genau wo steht. Gewünscht: Eine filterbare Übersicht, gruppiert nach konkreten Onboarding-Phasen.

## Lösung: Filter-Tabs mit detaillierter Auflistung

Die Techniker-Sektion wird komplett umgebaut zu einer Tab-gefilterten Liste mit folgenden Kategorien:

### Filter-Tabs (horizontal scrollbar)

| Tab | Logik | Detail in der Zeile |
|-----|-------|---------------------|
| **Alle** | Alle nicht-ready, nicht-Trainer | Aktueller Schritt als Badge |
| **Nicht registriert** | `onboardingStatus = 'invited'` ODER kein `currentStep` | Einladungsdatum |
| **Stammdaten** | `currentStep = 'profil'` oder `'dokumente'` | Was fehlt (Name/Adresse/Gewerbeschein) |
| **Bestellungen** | `currentStep = 'bestellungen'` oder `'equipment'` | Einzelne Produkte als Chips: ✓ Polo, ✗ Schlappen, ✗ Pullover, etc. |
| **Akademie** | `currentStep = 'akademie'` | Fortschritt: "Modul 4/11, 23/51 Lektionen" |
| **Abschlussprüfung** | `akademieTestBestanden` oder alle Lektionen fertig aber Test noch offen | Quiz-Status: bestanden/x Versuche |
| **Praxistest** | `praxistestEingereicht` aber nicht freigegeben | Scan + Video eingereicht, wartet auf Freigabe |
| **Coaching** | `currentStep = 'coaching'` oder `'nachweise'` | Termin gebucht? Coach-Name, Bewertung |

### Zeilen-Design (pro Techniker)
Kompakte Zeile: Avatar | Name | Status-Detail (kontextabhängig je nach Tab) | Datum

### Daten-Erweiterung
Der Hook `useAdminContractorList` muss um Praxistest-Felder erweitert werden (aus der neuen Migration):
- `praxistestEingereicht: boolean`
- `praxistestFreigabe: boolean`

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `useAdminContractorList.ts` | Praxistest-Felder hinzufügen |
| `AdminDashboardView.tsx` | Komplett umbauen: Filter-Tabs + kontextabhängige Detail-Zeilen |

