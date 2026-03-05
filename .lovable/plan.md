

# Pool-View Fix: Keine Daten sichtbar

## Problem

Die Query filtert mit `NOT IN ('wc1_durchfuehren', ...)` -- aber **alle 512 nicht-zugewiesenen Aufträge** haben genau den Status `wc1_durchfuehren`. Das sind historische/Legacy-Aufträge, die ohne Techniker-Zuweisung diesen Status erhalten haben. Ergebnis: 0 Treffer, leere Ansicht.

Aktuell existiert nur 1 offener Terminvorschlag (status `vorgeschlagen`), 30 angenommene und 10 abgelehnte.

## Lösung: Filter erweitern + Storniert-only ausschließen

Statt eine Negativliste von Status zu pflegen, sollte der Admin-Pool **alle nicht-zugewiesenen Aufträge** zeigen -- nur `storniert` wird ausgeschlossen. So sieht der Admin das vollständige Bild:

### Hook (`useAdminObjectOrders.ts`)
- Filter ändern: nur `.neq('pipeline_status', 'storniert')` statt der langen NOT IN-Liste
- Damit werden die 512 `wc1_durchfuehren`-Aufträge ohne Techniker sichtbar (+ alle zukünftigen Statuswerte)

### View (`ObjectOrderListView.tsx`)  
- Pipeline-Status als zusätzliche Info auf der Karte anzeigen (z.B. kleiner Badge mit dem Status)
- So erkennt der Admin sofort, welche Aufträge wirklich im Pool warten (`termin_abwarten`) vs. welche Anomalien sind (`wc1_durchfuehren` ohne Techniker)

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `useAdminObjectOrders.ts` | NOT IN → nur `storniert` ausschließen, `pipeline_status` mit zurückgeben |
| `ObjectOrderListView.tsx` | Pipeline-Status-Badge auf Karten anzeigen |

