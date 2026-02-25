# Validation: Booking Confirmation Workflow

**Datum:** 2026-02-25

## Feature

Zwei-Stufen Buchungsbestätigung für Techniker:
1. **Buchungsbestätigung** – Techniker kontaktiert Kunden per E-Mail nach Auftragsannahme
2. **Vortag-Bestätigung** – Techniker ruft Kunden am Vortag an

## DB-Änderungen

- `thermocheck.thermocheck_auftraege` + 2 Spalten: `buchung_bestaetigt_am`, `vortag_bestaetigt_am`
- View `v_thermocheck_auftraege` erweitert um diese Spalten
- 2 RPCs: `confirm_thermocheck_booking`, `confirm_thermocheck_vortag`
- 2 Public Wrappers (SECURITY DEFINER)

## RPC Ownership-Checks

- Ermittelt `contractor_onboarding.id` über `auth.uid()`
- Prüft `zugewiesener_techniker_id = contractor_id`
- Prüft `pipeline_status = 'wc1_durchfuehren'`
- `FOR UPDATE` Row-Lock gegen Race Conditions

## Rollen-Matrix

| Rolle | confirm_booking | confirm_vortag |
|---|---|---|
| Zugewiesener Techniker | ✅ | ✅ |
| Anderer Techniker | ❌ Ownership | ❌ Ownership |
| Admin/Superadmin | ❌ kein contractor_onboarding | ❌ |

## Edge Cases

| Szenario | Status |
|---|---|
| Doppelklick | ✅ Idempotent |
| Falscher pipeline_status | ✅ RPC blockt |
| Vortag ohne Buchungsbestätigung | ✅ UI verhindert |
| Stornierter Auftrag | ✅ Pipeline-Check |
| Termin in Vergangenheit | ✅ Nachholen möglich |

## Frontend-Dateien

- `src/types/technician.ts` – +2 Felder
- `src/hooks/useMyAssignedOrders.ts` – SELECT erweitert, Mapping
- `src/components/BookingsView.tsx` – Task-Badges
- `src/components/TechnicianOrderDetail.tsx` – Confirm-Buttons + RPC-Calls
