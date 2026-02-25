# Validation: accept_thermocheck_reschedule RPC

## Datum: 2026-02-25

## Änderungen

### SQL Migration
- Neue RPC `thermocheck.accept_thermocheck_reschedule(p_termin_id uuid)` erstellt
- Public Wrapper `public.accept_thermocheck_reschedule` mit SECURITY DEFINER
- Separate RPC von `accept_pool_order`, da Semantik unterschiedlich:
  - **Pool**: Unzugewiesener Auftrag → Techniker zuweisen + annehmen
  - **Reschedule**: Bereits zugewiesener Auftrag → Nur Termin wechseln

### RPC Logik
1. `contractor_onboarding.id` für `auth.uid()` ermitteln
2. `thermocheck_auftrag_id` + `status` vom Termin laden
3. Auftrag sperren (`FOR UPDATE`) → Race-Condition-Schutz
4. Validieren: `zugewiesener_techniker_id = v_contractor_id` (Ownership)
5. Validieren: `pipeline_status = 'termin_abwarten'`
6. Gewählten Termin: `status = 'angenommen'`, `angenommen_von = auth.uid()`, `angenommen_am = now()`
7. Andere Vorschläge: `status = 'abgelehnt'`
8. `pipeline_status` auf `wc1_durchfuehren` setzen
9. `zugewiesener_techniker_id` bleibt unverändert

### Frontend
- `RescheduleModal.tsx`: `accept_pool_order` → `accept_thermocheck_reschedule`

## Rollen-Matrix

| Rolle | accept_thermocheck_reschedule | Ergebnis |
|---|---|---|
| user (zugewiesener Techniker) | Ja | Erfolgreich - eigener Auftrag |
| user (anderer Techniker) | Nein | "Auftrag nicht zugewiesen" |
| user (ohne contractor_onboarding) | Nein | "Kein Contractor-Profil" |
| admin/manager | Nein | Kein contractor_onboarding-Eintrag |

| Rolle | decline_thermocheck_reschedule | Ergebnis |
|---|---|---|
| user (zugewiesener Techniker) | Ja | Techniker entfernt, zurück im Pool |
| user (anderer Techniker) | Nein | "nicht zugewiesen" |

## Edge Cases

| Szenario | Handling | Status |
|---|---|---|
| Techniker nimmt an, Auftrag parallel umgewiesen | FOR UPDATE Lock + ownership-check | ✅ |
| 3 Vorschläge, 1 angenommen | 1x angenommen, 2x abgelehnt | ✅ |
| 1 Vorschlag | 1x angenommen, 0x abgelehnt | ✅ |
| Termin-ID existiert nicht | "Termin nicht gefunden" | ✅ |
| Auftrag nicht in termin_abwarten | "Auftrag nicht im Reschedule-Status" | ✅ |
| Doppelklick / zweimal annehmen | FOR UPDATE + status-check blockiert | ✅ |
| Termin bereits angenommen/abgelehnt | "Termin nicht mehr verfügbar" | ✅ |

## ID-Mapping (Critical Pattern)
- `zugewiesener_techniker_id` → `contractor_onboarding.id` (interne Row-ID)
- `angenommen_von` → `auth.uid()` (auth.users.id)
- Diese Unterscheidung wird in der RPC korrekt eingehalten

## Datenmigration
Keine nötig. Bestehende Daten sind korrekt.
