

# Plan: Echte Profil-Statistiken aus Auftragsdaten berechnen

## Problem
Die Stats im Profil (Aufträge, Annahmerate, Bewertung) sind hardcoded auf `0`. Till hat bereits Aufträge angenommen, sieht aber nur "–".

## Lösung
Die Daten liegen bereits vor: `dbAssignedOrders` enthält alle zugewiesenen Aufträge mit Status. Daraus lassen sich die Stats direkt berechnen.

## Änderung

**`src/pages/Index.tsx`** — Im `useMemo` für `profile` (Zeile 127-130):

Statt `totalOrders: 0, acceptanceRate: 0, rating: 0` die Stats aus `dbAssignedOrders` berechnen:

- **Aufträge**: Anzahl aller zugewiesenen Aufträge (`dbAssignedOrders.length`)
- **Annahmerate**: Prozentsatz der Aufträge, die nicht `'booked'` sind (also tatsächlich weiterbearbeitet wurden), relativ zur Gesamtzahl. Oder einfacher: Da der Techniker nur Aufträge sieht, die er angenommen hat, zeigen wir 100% — bis wir abgelehnte Aufträge tracken.
- **Bewertung**: Bleibt `0` (noch keine QG-Bewertungen implementiert), wird als "–" angezeigt.

Konkret:
```ts
const assignedCount = dbAssignedOrders?.length || 0;
// ...
stats: {
  totalOrders: assignedCount,
  acceptanceRate: assignedCount > 0 ? 100 : 0,
  rating: 0, // noch keine Bewertungen
},
```

Die `useMemo`-Dependency-Array muss um `dbAssignedOrders` erweitert werden.

## Kontingent
Das `kontingent.abgenommen` ist ebenfalls `0`. Hier könnten wir die Anzahl der Aufträge mit Status `'approved'` (abgenommen) zählen. Da es noch keine QG-Auswertung gibt, bleibt das vorerst bei 0.

## Dateien
- `src/pages/Index.tsx` — Stats aus `dbAssignedOrders` berechnen statt hardcoded `0`

