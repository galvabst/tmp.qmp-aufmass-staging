

# Fixes: Akademie-Navigation, Praxistest-Einsicht für Trainer, Mitfahrten-Cleanup

## 3 Probleme

### 1. Zurück-Button in Akademie navigiert immer zu `/` statt zur vorherigen Ansicht

**Datei:** `src/pages/AkademieModul.tsx` (Zeile 314)

Aktuell: `onClick={() => navigate('/')}` — geht immer zum Pool/Dashboard.
Fix: `navigate(-1)` mit 250ms Timeout-Fallback auf `/` (existierendes Pattern aus `navigation-exit-protocol`).

Betrifft auch den "Zurück zum Onboarding" Button in der Error-Ansicht (Zeile 150) und die `handleMarkComplete`-Funktion (Zeile 291-297) — dort bleibt `navigate('/')` korrekt, da es den State mitgibt.

### 2. Trainer kann eingereichte Praxistest-Nachweise (3D-Scan + Drohnenvideo) seiner Trainees nicht sehen

Die Daten (`praxistest_scan_url`, `praxistest_video_url`, `praxistest_eingereicht`) liegen auf `contractor_onboarding`. Trainer sehen aktuell nur Name, Kontakt, Datum und Bewertungs-Buttons.

**Lösung:** Im `useMyCoachingRideAlongs` Hook die Praxistest-Felder vom Trainee-Onboarding-Record mitlesen und in der `TraineeCard` anzeigen.

**Hook-Änderung (`useMyCoachingRideAlongs.ts`):**
- `contractor_onboarding` Select erweitern: `profile_id, anschrift_plz, anschrift_ort, praxistest_scan_url, praxistest_video_url, praxistest_eingereicht`
- Neue Felder im `RideAlongTrainee` Interface

**UI-Änderung (`TrainerRideAlongs.tsx`):**
- Neue Sektion in der TraineeCard (nach Kontakt, vor Aktions-Buttons): "Praxistest"
- Scan-Link als klickbarer externer Link (mit `Link2`-Icon)
- Video-URL als klickbarer externer Link (mit `FileVideo`-Icon)
- Nur anzeigen wenn `praxistestEingereicht === true`

### 3. Mitfahrten-Karten kompakter

Die Karten nehmen viel vertikalen Platz ein. Optimierungen:
- Datum + "Ganztägig" in eine Zeile mit Kontaktdaten (statt eigener Block)
- "Gebucht am" Footer kleiner/kompakter
- Bei bereits bewerteten vergangenen Mitfahrten: Karte insgesamt kompakter (kein separator vor Footer)

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/pages/AkademieModul.tsx` | Back-Button: `navigate(-1)` mit Fallback |
| `src/hooks/useMyCoachingRideAlongs.ts` | Praxistest-Felder mitlesen |
| `src/components/trainer/TrainerRideAlongs.tsx` | Praxistest-Anzeige + kompakteres Layout |

## RLS / Security
- `contractor_onboarding.praxistest_*` Felder: Trainer liest via `supabaseTC` — RLS erlaubt SELECT für authenticated Users auf eigene Daten. Da der Trainer die Onboarding-Records über die Profile-IDs seiner Trainees abfragt (die er bereits über die Auftrags-Zuordnung kennt), funktioniert dies nur wenn die RLS-Policy SELECT für alle authenticated erlaubt. Das ist der Fall: die bestehende Query in Zeile 57 liest bereits `contractor_onboarding` Records fremder Profile-IDs.

## Edge Cases
- Kein Praxistest eingereicht → Sektion wird nicht angezeigt
- Nur Scan-Link ohne Video (oder umgekehrt) → Nur vorhandenes anzeigen
- Browser-History leer (Deep-Link zu Akademie) → Fallback auf `/` nach 250ms

