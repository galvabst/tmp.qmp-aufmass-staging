

# Karten-Marker: Auftraege zaehlen, Terminvorschlaege im Popup auflisten

## Problem

Aktuell zeigt der Marker "3" an einem Standort, obwohl es nur 1 Auftrag mit 3 Terminvorschlaegen ist. Das ist irrefuehrend -- der Techniker denkt, es gaebe 3 verschiedene Auftraege in der Naehe.

## Gewuenschtes Verhalten

- **Marker-Zahl** = Anzahl einzigartiger Auftraege (dedupliziert nach `auftragId`)
- **Popup** zeigt pro Auftrag den Kundennamen, darunter die einzelnen Terminvorschlaege mit Datum/Uhrzeit
- **Klick auf einen Terminvorschlag** oeffnet genau diesen Vorschlag in der Detailansicht

```text
Marker: [1]

Popup:
+----------------------------------+
| 91242 Ottensoos                  |
| 1 Auftrag                       |
|                                  |
| Dirk Weihrauch                   |
|   Do., 26. Feb. · Ganztaegig    |
|   Sa., 28. Feb. · Ganztaegig    |
|   Fr., 13. Maerz · 13:00-16:00  |
+----------------------------------+
```

## Technische Aenderungen

### `src/components/PoolMap.tsx`

**1. Neues Interface fuer Auftrag-Gruppierung:**

Innerhalb jedes PLZ-Clusters werden die Orders zusaetzlich nach `auftragId` gruppiert. So entsteht eine zweistufige Struktur: PLZ -> Auftraege -> Terminvorschlaege.

**2. `createClusterIcon` bekommt die Anzahl einzigartiger Auftraege:**

Statt `cluster.orders.length` wird die Anzahl einzigartiger `auftragId`-Werte gezaehlt und als Marker-Zahl verwendet.

**3. `buildClusterPopup` wird umgebaut:**

- Zaehlt einzigartige Auftraege fuer die Ueberschrift ("1 Auftrag" / "3 Auftraege")
- Gruppiert Orders nach `auftragId`
- Zeigt pro Auftrag: Kundenname als Ueberschrift
- Darunter: jeden Terminvorschlag mit Datum und Uhrzeit als klickbares Item
- Jedes Termin-Item hat weiterhin `data-order-id` mit der Termin-ID (`order.id`) fuer praezise Navigation

**4. Keine Aenderungen an `PoolView.tsx` noetig** -- der `onOrderClick`-Handler matcht bereits nach `order.id`.

## Dateien

| Datei | Aenderung |
|---|---|
| `src/components/PoolMap.tsx` | Marker-Count auf unique Auftraege, Popup mit Auftrag-Gruppierung und Terminvorschlag-Liste |

