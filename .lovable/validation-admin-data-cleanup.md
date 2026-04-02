# Validation: Admin-Datenbereinigung

## Datum: 2026-04-02

## Befunde

1. **Kein Mock-Data-Problem**: `mockOrders.ts` und `mockTechnicianData.ts` waren nicht importiert — gelöscht.
2. **Stale `onboarding_substatus`**: Trigger aktualisiert nur `onboarding_status`, nicht den Substatus. Backfill-Migration ausgeführt.
3. **Bug `gebuehr` → `gesamtbetrag`**: `useAdminAggregatedStats.ts` referenzierte nicht-existente Spalte. Behoben.

## Änderungen

| Datei | Änderung |
|---|---|
| `ContractorListView.tsx` | Step-Badge als Primärinfo, Lektionen/Produkte sekundär |
| `useAdminAggregatedStats.ts` | `gebuehr` → `gesamtbetrag` (3 Stellen) |
| Migration | Substatus-Backfill basierend auf `current_step` |
| `mockOrders.ts` | Gelöscht (nicht importiert) |
| `mockTechnicianData.ts` | Gelöscht (nicht importiert) |

## Status: ✅ Abgeschlossen
