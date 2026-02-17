

## Fix: Auftrag wird nicht angezeigt -- Root Cause + Loesung

### Root Cause

Der Auftrag `c9f59cdc...` (Ferizi Arsim) ist unsichtbar, weil:

1. **Falscher Wert in `zugewiesener_techniker_id`**: Steht auf `643d967e...` (= contractor_onboarding **Row-ID**). Richtig waere `c0893b68...` (= `profile_id` / `auth.uid()`). Die ID `643d967e` existiert nicht in `auth.users`.
2. **Pool filtert korrekt**: `usePoolOrders` zeigt nur Auftraege mit `zugewiesener_techniker_id IS NULL` -- dieser ist nicht NULL, also unsichtbar.
3. **Kein "Meine Auftraege"-Hook**: Es gibt keinen Hook, der zugewiesene Auftraege (`zugewiesener_techniker_id = auth.uid()`) laedt. Buchungen/Aktive Auftraege existieren nur im lokalen React-State.
4. **Nur 1 statt 3 Terminvorschlaege** in der DB.

### Loesung: 3 Schritte

#### Schritt 1: Datenkorrektur (manuell im Supabase SQL Editor)

```sql
-- Option A: Richtigen Trainer zuweisen
UPDATE thermocheck.thermocheck_auftraege
SET zugewiesener_techniker_id = 'c0893b68-bc58-4694-94dc-9d991efdec12'
WHERE id = 'c9f59cdc-c64e-485d-8573-3e4b0e824d54';

-- Option B: Zurueck in den Pool setzen
UPDATE thermocheck.thermocheck_auftraege
SET zugewiesener_techniker_id = NULL
WHERE id = 'c9f59cdc-c64e-485d-8573-3e4b0e824d54';
```

Plus fehlende Terminvorschlaege einfuegen (Daten/Zeiten anpassen):

```sql
INSERT INTO thermocheck.thermocheck_terminvorschlaege
  (thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung)
VALUES
  ('c9f59cdc-c64e-485d-8573-3e4b0e824d54', '2026-02-27', false, '09:00', '13:00', 2),
  ('c9f59cdc-c64e-485d-8573-3e4b0e824d54', '2026-02-28', false, '10:00', '14:00', 3);
```

#### Schritt 2: Neuer Hook `useMyAssignedOrders` (Code-Aenderung)

Ein neuer Hook der Auftraege laedt, bei denen `zugewiesener_techniker_id = auth.uid()`:

- Fetcht aus `thermocheck_auftraege` + `thermocheck_terminvorschlaege` (JOIN via auftrag_id)
- Kundendaten aus `v_thermocheck_auftraege`
- Mappt auf `TechnicianOrder` mit Status `booked`
- Wird in `Index.tsx` zusaetzlich zum Pool-Hook eingebunden

| Datei | Aenderung |
|---|---|
| `src/hooks/useMyAssignedOrders.ts` | Neu: Hook fuer zugewiesene Auftraege |
| `src/pages/Index.tsx` | Hook einbinden, orders aus Pool + zugewiesenen zusammenfuehren |

#### Schritt 3: `accept_pool_order` RPC (wie im vorherigen Plan genehmigt)

SQL-Migration mit atomarer RPC-Funktion:

- `thermocheck.accept_pool_order(p_termin_id UUID)` -- SECURITY DEFINER
- Setzt `zugewiesener_techniker_id = auth.uid()` (korrekte ID!)
- FOR UPDATE Lock gegen Race Conditions
- Prueft `pipeline_status = 'termin_abwarten'` und `zugewiesener_techniker_id IS NULL`
- Public Wrapper `public.accept_pool_order`

Dazu: `handleStatusChange` in `Index.tsx` ruft RPC auf statt nur lokalen State zu aendern.

| Datei | Aenderung |
|---|---|
| SQL-Migration | RPC `thermocheck.accept_pool_order` + Public Wrapper |
| `src/types/technician.ts` | `auftragId: string` zu `TechnicianOrder` hinzufuegen |
| `src/hooks/usePoolOrders.ts` | `auftragId` mappen |
| `src/pages/Index.tsx` | `handleStatusChange` mit RPC-Aufruf |

### Zusammenfassung Betroffene Dateien

| Datei | Typ | Aenderung |
|---|---|---|
| SQL-Migration | DB | RPC `accept_pool_order` + Public Wrapper |
| `src/hooks/useMyAssignedOrders.ts` | Neu | Hook fuer zugewiesene Auftraege laden |
| `src/types/technician.ts` | Edit | `auftragId` Feld hinzufuegen |
| `src/hooks/usePoolOrders.ts` | Edit | `auftragId` mappen |
| `src/pages/Index.tsx` | Edit | Beide Hooks einbinden, RPC im handleStatusChange |
| Manuelles SQL | Daten-Fix | `zugewiesener_techniker_id` korrigieren + 2 Termine einfuegen |

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Zwei Techniker klicken gleichzeitig "Annehmen" | FOR UPDATE Lock, zweiter bekommt Fehlermeldung |
| Auftrag hat 3 Terminvorschlaege, einer wird angenommen | Alle 3 verschwinden aus Pool (Auftrag hat nun einen Techniker) |
| Seite nach Annahme neu laden | Auftrag kommt aus `useMyAssignedOrders`, nicht mehr aus lokalem State |
| Trainer nimmt Auftrag an | `zugewiesener_techniker_id = auth.uid()` -- Coaching-Buchung dann moeglich |

### Wichtig: Woher kam die falsche ID?

Die ID `643d967e...` ist die **contractor_onboarding Row-ID**, nicht die profile_id. Vermutlich wurde sie manuell oder aus dem anderen Lovable-Projekt falsch eingetragen. Der `zugewiesener_techniker_id`-Wert muss IMMER eine `auth.uid()` / `profile_id` sein -- das wird durch die neue RPC sichergestellt (`auth.uid()` wird automatisch verwendet).

