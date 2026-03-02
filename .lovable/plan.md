

# Fix: Check-in/out Pipeline-Status Mapping

## Problem

Zwei Bugs in den RPCs + Frontend-Status-Ableitung:

1. **Checkin RPC** prueft auf `wc1_durchfuehren`, aber Check-in ist erst bei `vot_formular_abfragen` oder `vot_formular_in_verzug` erlaubt. `wc1_durchfuehren` ist die Welcome-Call-Stage -- da war der Techniker noch gar nicht vor Ort.
2. **Checkout RPC (nachbearbeitung)** setzt `pipeline_status = 'vot_formular_abfragen'` -- das ist die Stage VOR der Arbeit. Nach Einreichung muss es auf `vot_auswertung_ag` weiterruecken.
3. **Frontend `deriveStatus`** behandelt `vot_formular_abfragen` als `submitted`, aber das ist die Stage wo die Arbeit stattfindet. `submitted` sollte erst ab `vot_auswertung_ag` gelten.

## Pipeline-Flow (korrekt)

```text
... → wc1_durchfuehren → [Termin-Bestaetigung] → ... →
vot_formular_abfragen → [Check-in Vor-Ort, Arbeit, Formular] →
vot_auswertung_ag → ...
```

## Aenderungen

### 1. DB-Migration (ALTER RPCs)

**`checkin_thermocheck_auftrag`**: Pipeline-Check aendern von:
```sql
IF v_row.pipeline_status != 'wc1_durchfuehren' THEN ...
```
zu:
```sql
IF v_row.pipeline_status NOT IN ('vot_formular_abfragen', 'vot_formular_in_verzug') THEN ...
```

**`checkout_thermocheck_auftrag`** (nachbearbeitung): Pipeline-Transition aendern von:
```sql
pipeline_status = 'vot_formular_abfragen'
```
zu:
```sql
pipeline_status = 'vot_auswertung_ag'
```

### 2. Frontend: `useMyAssignedOrders.ts`

`deriveStatus` korrigieren:
- `submitted` = `eingereicht_am` gesetzt ODER `pipeline_status` in (`vot_auswertung_ag`, `ergebnis_abwarten`, `ergebnis_ausstehend`, `gewonnen`, ...)
- `in_progress` = `vor_ort_checkin_at` gesetzt + kein `eingereicht_am`
- `booked` = alles andere (inkl. `wc1_durchfuehren`, `vot_formular_abfragen` ohne Check-in)

### 3. Betroffene Dateien

1. Migration SQL (CREATE OR REPLACE beide RPCs + public Wrapper)
2. `src/hooks/useMyAssignedOrders.ts` (deriveStatus fix)

