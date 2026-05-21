## Problem

Beim manuellen Setzen eines Onboarding-Steps (z. B. auf „coaching") wirft die Datenbank den Fehler `column "updated_at" of relation "contractor_onboarding" does not exist`.

Die Tabelle `thermocheck.contractor_onboarding` folgt der Projekt-Konvention und nutzt `aktualisiert_am` (deutscher Spaltenname). Die RPC `thermocheck.admin_set_onboarding_step` greift jedoch fälschlich auf `updated_at` zu (an zwei Stellen).

## Fix

Eine Migration: die RPC `thermocheck.admin_set_onboarding_step(p_profile_id uuid, p_target_step text)` per `CREATE OR REPLACE FUNCTION` neu definieren und beide `updated_at = now()` durch `aktualisiert_am = now()` ersetzen. Logik, Signatur und Rückgaben bleiben 1:1 identisch.

Kein Frontend-Code muss geändert werden — der Wrapper `public.admin_set_onboarding_step` bleibt unverändert.

## Validierung

- Nach Migration: in der Detailansicht eines Contractors „Step setzen" → `coaching` → erwartet `success: true`, `current_step = 'coaching'`, `completed_steps = ['profil','dokumente','bestellungen','equipment','akademie']`, `aktualisiert_am` aktualisiert.
- Auch „einsatzbereit" testen → `onboarding_status = 'ready'`.