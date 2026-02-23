

## Fix: accept_pool_order FK-Verletzung bei `angenommen_von`

### Problem
Die Funktion `thermocheck.accept_pool_order` (Zeile 63) setzt:
```
angenommen_von = v_contractor_id
```
`v_contractor_id` ist die `contractor_onboarding.id`, aber `angenommen_von` hat einen Foreign Key auf `auth.users(id)`. Das ist eine UUID-Mismatch --> FK-Verletzung.

### Loesung
Eine neue SQL-Migration, die die Funktion korrigiert. Einzige Aenderung in Zeile 63:
```
angenommen_von = v_contractor_id  -->  angenommen_von = auth.uid()
```

`auth.uid()` liefert die `auth.users.id` des eingeloggten Users und erfuellt den FK korrekt. `zugewiesener_techniker_id` bleibt weiterhin auf `v_contractor_id` (anderer FK auf `contractor_onboarding`).

### Technischer Plan

| Datei | Aenderung |
|---|---|
| Neue Migration (`supabase/migrations/...`) | `CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order` -- identisch zur bestehenden Funktion, aber Zeile 63 wird `angenommen_von = auth.uid()` |

Die komplette Funktion wird neu erstellt (CREATE OR REPLACE), alle anderen Zeilen bleiben identisch. Kein Frontend-Code betroffen.

### Keine weiteren Aenderungen noetig
- Frontend bleibt gleich
- Public-Wrapper bleibt gleich
- Nur die eine Zeile in der RPC-Funktion wird korrigiert

