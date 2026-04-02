

# Fix: Quartalskontingent-Ampel am Quartalsanfang

## Problem
Am 2. April (Tag 2 des neuen Quartals) zeigt die Ampel alle Techniker auf Rot, weil:
- `weeksPassed = max(1, differenceInWeeks(now, qStart))` = 1
- `expected = (1/13) * 24` ≈ 1.85
- `0 >= 1.85 * 0.8` → false → `0 >= 1.85 * 0.5` → false → **Rot**

Das ist unlogisch — am Anfang des Quartals kann niemand schon TCs haben.

## Lösung
Eine **Karenzzeit von 2 Wochen** einbauen: In den ersten 14 Tagen des Quartals sind alle automatisch Grün (es sei denn, sie haben bereits TCs — dann normal bewerten). Danach greift die bestehende Logik.

## Technisch

**Datei: `src/features/admin/ui/AdminDashboardView.tsx` (Zeile 94-101)**

```typescript
function getQuotaTrafficLight(quartalTCs: number): 'green' | 'orange' | 'red' {
  const now = new Date();
  const qStart = startOfQuarter(now);
  const daysPassed = differenceInDays(now, qStart);
  
  // Karenzzeit: erste 2 Wochen → Grün (noch keine sinnvolle Erwartung)
  if (daysPassed < 14) return 'green';
  
  const weeksPassed = Math.max(1, differenceInWeeks(now, qStart));
  const expected = (weeksPassed / 13) * 24;
  if (quartalTCs >= expected * 0.8) return 'green';
  if (quartalTCs >= expected * 0.5) return 'orange';
  return 'red';
}
```

Einzige Änderung: 3 Zeilen hinzufügen für den Early-Quarter-Check mit `differenceInDays`.

