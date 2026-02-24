

# Map: Alle Terminvorschlaege anzeigen statt nur einen

## Problem

Die Funktion `deduplicateByAuftrag()` in `PoolMap.tsx` entfernt alle Terminvorschlaege bis auf den ersten pro Auftrag. Dadurch zeigt die Karte "1 Auftrag" statt "3 Auftraege" pro Standort. Der Techniker kann nicht den passenden Termin auswaehlen.

## Ursache

```text
PoolMap.tsx Zeile 20-27:
  deduplicateByAuftrag() -> behaelt nur den ersten Eintrag pro auftragId
  -> 3 Terminvorschlaege werden zu 1 reduziert
```

Zusaetzlich matcht der `onOrderClick`-Handler in `PoolView.tsx` nach `auftragId`, was bei mehreren Terminen immer nur den ersten findet.

## Loesung

### 1. `src/components/PoolMap.tsx`

- **`deduplicateByAuftrag()` entfernen** -- die Funktion wird nicht mehr aufgerufen
- In `groupByPlz()` direkt die ungefilterten Orders verwenden
- Die Popup-Items zeigen jetzt alle Terminvorschlaege mit Datum/Uhrzeit an
- Der Click-Handler im Popup nutzt die Termin-ID (`order.id`) statt `auftragId`, damit der richtige Terminvorschlag geoeffnet wird

### 2. `src/components/PoolView.tsx`

- Den `onOrderClick`-Handler in der Map-Komponente aendern: statt nach `auftragId` wird nach `order.id` (Termin-ID) gesucht
- So findet der Handler den exakten Terminvorschlag, den der Techniker in der Karte angeklickt hat

## Ergebnis

- Karte zeigt "3 Auftraege" pro Standort (wenn 3 Terminvorschlaege existieren)
- Popup listet alle 3 Termine mit jeweiligem Datum und Uhrzeit
- Klick auf einen Termin oeffnet genau diesen Terminvorschlag in der Detailansicht

## Dateien

| Datei | Aenderung |
|---|---|
| `src/components/PoolMap.tsx` | `deduplicateByAuftrag` entfernen, Orders direkt an `groupByPlz` geben |
| `src/components/PoolView.tsx` | `onOrderClick` nach `order.id` statt `auftragId` matchen |

