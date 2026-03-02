# Validation: Check-in/out Persistenz

**Datum:** 2026-03-02

## Änderungen

### DB-Migration
- 6 neue Spalten auf `thermocheck.thermocheck_auftraege`: `vor_ort_checkin_at`, `vor_ort_checkout_at`, `nachbearbeitung_checkin_at`, `nachbearbeitung_checkout_at`, `eingereicht_am`, `eingereicht_von`
- View `v_thermocheck_auftraege` erweitert um alle 6 Spalten
- 2 RPCs: `checkin_thermocheck_auftrag`, `checkout_thermocheck_auftrag` (thermocheck-Schema + public Wrapper)

### RPC-Logik
- **Ownership-Check**: `zugewiesener_techniker_id = contractor_onboarding.id` (aufgelöst via `auth.uid()`)
- **Pipeline-Status-Check**: Nur bei `wc1_durchfuehren` erlaubt
- **Idempotent**: Bereits gesetzte Timestamps → success ohne Update
- **Phase-Reihenfolge**: Nachbearbeitung nur nach Vor-Ort-Checkout
- **Row-Lock**: `FOR UPDATE` verhindert Race Conditions
- **Nachbearbeitung-Checkout**: Setzt `pipeline_status = 'vot_formular_abfragen'`

### Frontend
- `useMyAssignedOrders.ts`: Status-Ableitung aus Zeitstempeln statt lokaler State
- `Index.tsx`: RPC-Aufrufe + `queryClient.invalidateQueries` statt `setOrders`

## Rollen-Matrix

| Rolle | Check-in | Check-out | Begründung |
|---|---|---|---|
| Zugewiesener Techniker | ✅ | ✅ | Ownership-Check im RPC |
| Anderer Techniker | ❌ | ❌ | `zugewiesener_techniker_id` stimmt nicht |
| Admin (ohne contractor_onboarding) | ❌ | ❌ | Kein contractor_onboarding-Datensatz |

## RLS-Policy-Review
- `thermocheck_auftraege` UPDATE = `true` für authenticated → OK, da Ownership im RPC geprüft wird (SECURITY DEFINER)
- Keine neuen RLS-Policies nötig

## Edge Cases

| Szenario | Status |
|---|---|
| Doppelklick Check-in | ✅ Idempotent |
| Nachbearbeitung vor Vor-Ort-Checkout | ✅ RPC blockiert |
| Seiten-Refresh nach Check-in | ✅ Daten aus DB |
| Anderer Techniker Check-in | ✅ Ownership-Check |
| Falscher Pipeline-Status | ✅ Status-Check |
| Nachbearbeitung-Checkout → Pipeline-Transition | ✅ `vot_formular_abfragen` |

## Datenmigration
- Keine bestehenden Daten betroffen (neue Spalten sind nullable, alle bestehenden Aufträge haben NULL-Timestamps → Status `booked`)
