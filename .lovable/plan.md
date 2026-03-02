

# Plan: Check-in/out Persistenz in der Datenbank

## Ist-Zustand (verifiziert)

- `thermocheck_auftraege` hat **keine** Spalten fuer Check-in/out-Zeitstempel
- RLS: UPDATE/SELECT = `true` fuer authenticated, INSERT = `true`, DELETE = admin-only
- `zugewiesener_techniker_id` referenziert `contractor_onboarding.id` (nicht `auth.uid()`)
- Pipeline-Status ist ein DB-Enum `thermocheck_auftrags_pipeline_status` mit u.a. `wc1_durchfuehren` und `vot_formular_abfragen`
- View `v_thermocheck_auftraege` joined `thermocheck_auftraege` mit `leads`
- Frontend-Status (`in_progress`, `submitted`) existiert nur als lokaler React-State

## Umsetzung

### 1. DB-Migration (1 SQL-Datei)

**6 neue Spalten** auf `thermocheck_auftraege`:

| Spalte | Typ |
|---|---|
| `vor_ort_checkin_at` | timestamptz |
| `vor_ort_checkout_at` | timestamptz |
| `nachbearbeitung_checkin_at` | timestamptz |
| `nachbearbeitung_checkout_at` | timestamptz |
| `eingereicht_am` | timestamptz |
| `eingereicht_von` | uuid |

**View `v_thermocheck_auftraege`** neu erstellen (CREATE OR REPLACE) mit allen 6 neuen Spalten.

**RPC `thermocheck.checkin_thermocheck_auftrag(p_auftrag_id uuid, p_phase text)`**:
- Ownership-Check: `zugewiesener_techniker_id = contractor_onboarding.id` des aktuellen Users
- Pipeline-Status-Check: `wc1_durchfuehren`
- `vor_ort`: Setzt `vor_ort_checkin_at = now()` (idempotent)
- `nachbearbeitung`: Nur wenn `vor_ort_checkout_at IS NOT NULL`, setzt `nachbearbeitung_checkin_at = now()`
- Returns JSON `{success, error?}`

**RPC `thermocheck.checkout_thermocheck_auftrag(p_auftrag_id uuid, p_phase text)`**:
- Ownership-Check
- `vor_ort`: Setzt `vor_ort_checkout_at = now()`
- `nachbearbeitung`: Setzt `nachbearbeitung_checkout_at = now()`, `eingereicht_am = now()`, `eingereicht_von = contractor_id`, `pipeline_status = 'vot_formular_abfragen'`
- `FOR UPDATE` Row-Lock

**Public Wrappers** (`SECURITY DEFINER, SET search_path = public`) fuer beide RPCs.

Keine RLS-Aenderung noetig (UPDATE = `true` fuer authenticated; Ownership wird im RPC geprueft).

### 2. `useMyAssignedOrders.ts`

- SELECT erweitern um `vor_ort_checkin_at`, `vor_ort_checkout_at`, `nachbearbeitung_checkin_at`, `nachbearbeitung_checkout_at`, `eingereicht_am`, `eingereicht_von`
- Status-Ableitung aus Zeitstempeln:
  - `eingereicht_am` gesetzt oder `pipeline_status = 'vot_formular_abfragen'` → `submitted`
  - `vor_ort_checkin_at` gesetzt + kein `eingereicht_am` → `in_progress`
  - Sonst → `booked`
- `checkinPhase` ableiten: hat `nachbearbeitung_checkin_at` aber kein `nachbearbeitung_checkout_at` → `nachbearbeitung`; hat `vor_ort_checkin_at` aber kein `vor_ort_checkout_at` → `vor_ort`

### 3. `Index.tsx`

- `handleCheckin`: RPC `checkin_thermocheck_auftrag` aufrufen (ueber `supabase.rpc()`), danach `queryClient.invalidateQueries(['my-assigned-orders'])`
- `handleCheckout`: RPC `checkout_thermocheck_auftrag` aufrufen, danach invalidate
- `handleStartRework`: RPC `checkin_thermocheck_auftrag` mit `phase = 'nachbearbeitung'`, danach invalidate
- Lokale `setOrders`-Aufrufe entfallen komplett -- Daten kommen nach Invalidierung frisch aus DB
- `auftragId` statt `termin.id` an die RPCs uebergeben (RPCs arbeiten auf Auftrags-Ebene)

### 4. Validation-Dokument

`.lovable/validation-checkin-persistence.md` erstellen.

## Edge Cases

| Szenario | Handling |
|---|---|
| Doppelklick Check-in | Idempotent: `IF vor_ort_checkin_at IS NOT NULL THEN RETURN success` |
| Nachbearbeitung vor Vor-Ort-Checkout | RPC blockiert mit Fehlermeldung |
| Refresh nach Check-in | Daten aus DB, Status korrekt abgeleitet |
| Anderer Techniker versucht Check-in | Ownership-Check schlaegt fehl |
| `pipeline_status != wc1_durchfuehren` | Check-in blockiert |
| Nachbearbeitung-Checkout setzt `pipeline_status = vot_formular_abfragen` | Korrekte Transition |

## Betroffene Dateien

1. Migration (neue SQL-Datei)
2. `src/hooks/useMyAssignedOrders.ts`
3. `src/pages/Index.tsx`
4. `src/integrations/supabase/types.ts` (auto-update)
5. `.lovable/validation-checkin-persistence.md`

