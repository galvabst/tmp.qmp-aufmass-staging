# Validation: accept_pool_order RPC Erweiterung

## Datum: 2026-02-17

## Änderungen

### SQL Migration
- `thermocheck.accept_pool_order` erweitert um:
  1. `pipeline_status = 'wc1_durchfuehren'` beim Zuweisen
  2. Angenommener Termin: `status = 'angenommen'`, `angenommen_von`, `angenommen_am`
  3. Konkurrierende Termine: `status = 'abgelehnt'`
- Bestehende Dirty Data bereinigt (4 Termine + Aufträge korrigiert)

### Frontend
- `useMyAssignedOrders.ts`: Filter `&status=eq.angenommen` hinzugefügt

## Verifizierung

### Datenbereinigung bestätigt
- Alle 4 zugewiesenen Termine: `status = 'angenommen'`, `angenommen_am` gesetzt
- Alle zugewiesenen Aufträge: `pipeline_status = 'wc1_durchfuehren'`

### Rollen-Matrix
| Rolle | accept_pool_order | Ergebnis |
|---|---|---|
| user (Techniker mit contractor_onboarding) | Ja (SECURITY DEFINER) | Korrekt |
| user (ohne contractor_onboarding) | Nein - Fehler | Korrekt blockiert |
| admin/manager/superadmin | Nein - kein contractor_onboarding | Korrekt blockiert |

### Edge Cases
| Szenario | Status |
|---|---|
| 3 Termine, 1 angenommen | ✅ 1x angenommen, 2x abgelehnt |
| 1 Termin | ✅ angenommen, kein abgelehnt |
| Race Condition | ✅ FOR UPDATE Lock |
| Auftrag nicht im Pool | ✅ Fehler "nicht mehr im Pool" |

### Nicht betroffene Komponenten
- `usePoolOrders.ts`: Filtert weiterhin auf `zugewiesener_techniker_id=is.null` ✅
- RLS Policies: Nicht betroffen (SECURITY DEFINER) ✅
- Frontend-UI: Keine Änderung nötig ✅

## Hinweis
`angenommen_von` ist bei den migrierten Alt-Daten `NULL`, da der ursprüngliche Acceptor nicht mehr nachvollziehbar ist. Neue Annahmen setzen `angenommen_von` korrekt.
