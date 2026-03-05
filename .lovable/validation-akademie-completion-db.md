# Validation: Akademie-Lektionen DB-Completion Fix

**Datum:** 2026-03-05

## Problem
`completeAkademieUnterpunkt()` schrieb nur in localStorage, nie `status: 'completed'` in die DB-Tabelle `contractor_akademie_lektions_fortschritt`. Alle Lektionen blieben dauerhaft `in_progress`.

## Lösung

### 1. Frontend-Fix (OnboardingScreen.tsx)
- Beim Abschluss einer Lektion (Navigation zurück von AkademieModul) wird jetzt zusätzlich ein DB-Upsert mit `status: 'completed'` + `completed_at` ausgeführt
- Verwendet `supabaseTC` (thermocheck-Schema-Client)
- `contractor_id` = `dbStatus.onboardingId` (= `contractor_onboarding.id`)
- Idempotent via `onConflict: 'contractor_id,lektion_id'`
- Fehler werden geloggt aber blockieren nicht den localStorage-Write

### 2. Datenmigration
- 94 bestehende `in_progress` Records auf `completed` migriert
- Betraf alle Contractors mit `'akademie' IN completed_steps`
- `completed_at` = `started_at` (Fallback: `now()`)

## Rollen-Matrix

| Rolle | DB-Write Fortschritt | RLS |
|-------|---------------------|-----|
| Contractor (authenticated) | ✅ | ALL for authenticated |
| Admin | ✅ | Gleiche Policy |
| Trainer | ✅ | Nutzt Onboarding-Bypass |

## Edge Cases

| Szenario | Status |
|----------|--------|
| Kein contractorId (preview mode) | ✅ Guard-Check, nur localStorage |
| DB-Fehler beim Upsert | ✅ Warn-Log, localStorage bleibt korrekt |
| Doppelklick/Race Condition | ✅ Upsert idempotent |
| intro-video / outro-video | ✅ Eigene RPCs, nicht betroffen |
| PflichtVideoOverlay | ✅ Schreibt bereits korrekt `completed` |
| Lektion ohne Video | ✅ Gleicher handleMarkComplete Pfad |

## Verifizierung
- Vor Migration: 94 Records `in_progress` bei Contractors mit abgeschlossener Akademie
- Nach Migration: 0 Records `in_progress`, 94 Records `completed`
