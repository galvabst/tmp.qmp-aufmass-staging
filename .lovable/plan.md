

# Fix: Lektionen-Total dynamisch aus DB statt hardcoded "51"

## Problem
In `useAdminContractorList.ts` Zeile 205 steht `lektionenTotal: 51` hardcoded. Wenn Lektionen hinzugefügt oder deaktiviert werden, stimmt die Zahl nicht mehr. Der Admin soll immer den aktuellen Stand der aktiven Lektionen sehen.

## Lösung

**Datei:** `src/features/contractors/hooks/useAdminContractorList.ts`

Im bereits vorhandenen `Promise.all` (Zeile 127) einen zusätzlichen Fetch hinzufügen:

```typescript
// Aktive Lektionen zählen
supabaseTC.from('contractor_akademie_lektionen')
  .select('id', { count: 'exact', head: true })
  .eq('ist_aktiv', true)
```

Dann in Zeile 205 ersetzen:

```typescript
lektionenTotal: activeLektionenCount ?? 0,
```

Das ist ein 3-Zeilen-Fix. Keine Migration, keine neuen Dateien.

