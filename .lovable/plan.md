

## Fix: Auftrag wird nicht angezeigt -- UMGESETZT ✅

### Was wurde gemacht

#### 1. SQL Migration: `accept_pool_order` RPC ✅
- `thermocheck.accept_pool_order(p_termin_id UUID)` — SECURITY DEFINER
- FOR UPDATE Lock gegen Race Conditions
- Validiert `pipeline_status = 'termin_abwarten'` und `zugewiesener_techniker_id IS NULL`
- Setzt `zugewiesener_techniker_id = auth.uid()` (korrekte profile_id!)
- Public Wrapper `public.accept_pool_order` für Frontend-Zugriff

#### 2. Neuer Hook `useMyAssignedOrders` ✅
- `src/hooks/useMyAssignedOrders.ts`
- Fetcht Aufträge wo `zugewiesener_techniker_id = auth.uid()`
- Mappt auf `TechnicianOrder` mit Status `booked`

#### 3. Code-Updates ✅
- `src/types/technician.ts`: `auftragId` Feld hinzugefügt
- `src/hooks/usePoolOrders.ts`: `auftragId` gemappt
- `src/pages/Index.tsx`: 
  - Beide Hooks eingebunden (Pool + zugewiesene)
  - Orders werden gemerged (dedupliziert by ID)
  - `handleStatusChange` ruft RPC `accept_pool_order` auf bei `booked`

### Noch offen: Datenkorrektur (manuell)

```sql
-- Option A: Richtigen Trainer zuweisen
UPDATE thermocheck.thermocheck_auftraege
SET zugewiesener_techniker_id = 'c0893b68-bc58-4694-94dc-9d991efdec12'
WHERE id = 'c9f59cdc-c64e-485d-8573-3e4b0e824d54';

-- Plus fehlende Terminvorschlaege
INSERT INTO thermocheck.thermocheck_terminvorschlaege
  (thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung)
VALUES
  ('c9f59cdc-c64e-485d-8573-3e4b0e824d54', '2026-02-27', false, '09:00', '13:00', 2),
  ('c9f59cdc-c64e-485d-8573-3e4b0e824d54', '2026-02-28', false, '10:00', '14:00', 3);
```
