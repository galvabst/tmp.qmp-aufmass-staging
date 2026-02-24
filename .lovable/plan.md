

## Trainer-Bypass auf alle Onboarding-Schritte erweitern

### Problem
Trainer (erfahrene Thermocheckler) muessen aktuell trotzdem Bestellungen, Dokumente und Equipment durchlaufen, obwohl sie das alles bereits haben. Nur Akademie, Coaching und Nachweise werden uebersprungen.

### Loesung
Den bestehenden `isTrainer`-Bypass in `isStepComplete` auf **alle** Schritte ausweiten: Profil, Dokumente, Bestellungen und Equipment. So koennen Trainer das komplette Onboarding durchklicken ohne reale Validierungen.

### Technischer Plan

| Datei | Aenderung |
|---|---|
| `src/hooks/useOnboardingState.ts` | In `isStepComplete`: `if (isTrainer) return true;` fuer die Cases `dokumente`, `bestellungen` und `equipment` hinzufuegen (Profil behaelt Validierung -- Trainer sollen trotzdem Name/Foto pruefen) |

Konkret wird in der `isStepComplete`-Funktion bei folgenden Cases jeweils `if (isTrainer) return true;` ergaenzt:
- **dokumente** (Zeile 451): Gewerbeschein-Upload wird uebersprungen
- **bestellungen** (Zeile 454): Pflichtbestellungen werden uebersprungen
- **equipment** (Zeile 459): Drohne/iPhone/Massband-Validierung wird uebersprungen

Der Profil-Schritt bleibt bestehen, damit Trainer zumindest ihr Foto und ihre Daten pruefen.

### Auswirkung
- Trainer koennen sofort durch alle Schritte navigieren ("Weiter"-Button immer aktiv)
- Normale Bewerber sind nicht betroffen (kein `isTrainer`-Flag)
- Keine DB-Migration noetig -- reine Frontend-Logik

