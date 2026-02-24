
# Pool-Karte: PLZ-basierte Cluster-Pins (Auftrag-dedupliziert)

## Kernproblem

Die Pool-Listenansicht zeigt aktuell Terminvorschlaege (1 Auftrag = bis zu 3 Eintraege). Fuer die Kartenansicht muessen wir nach **Auftrag** deduplizieren, damit z.B. "Holger Bennemann" (3 Terminvorschlaege, PLZ 06686) nur als 1 Pin zaehlt -- nicht 3.

Aktuell zeigt die Karte gar nichts, weil `lat`/`lng` fehlen und der Filter `o.lat && o.lng` greift.

## Datengrundlage (Live-Analyse)

23 unique Auftraege im Pool (pipeline_status = termin_abwarten, kein Techniker zugewiesen). Davon haben 3 Auftraege jeweils 3 Terminvorschlaege -- also 29 Listeneintraege, aber nur 23 unique Auftraege fuer die Karte.

PLZ-Verteilung: 23 verschiedene PLZ, keine Dopplungen auf PLZ-Ebene aktuell. Bei wachsenden Daten werden PLZ-Cluster relevant.

---

## Technische Umsetzung

### Datei 1: `src/features/pool/utils/plz-geocoder.ts` (NEU)

Geocoding-Utility fuer deutsche Postleitzahlen:

- `geocodePlz(plz)`: Einzelne PLZ in Koordinaten aufloesen via OpenStreetMap Nominatim
- `geocodePlzBatch(plzList)`: Batch-Aufloesung mit Deduplizierung
- **LocalStorage-Cache**: Key `plz-geo-{plz}`, einmal gecacht = nie wieder abgefragt
- **Rate-Limiting**: Sequentielle Abfragen mit 1s Delay (Nominatim-Vorgabe)
- PLZ mit fuehrender Null (z.B. "06686") als String behandelt

### Datei 2: `src/components/PoolMap.tsx` (KOMPLETT UMGEBAUT)

Neues Interface: Akzeptiert `TechnicianOrder[]` statt `Order[]`

Ablauf:
1. Orders nach `auftragId` deduplizieren (ein Auftrag = ein Eintrag, egal wie viele Terminvorschlaege)
2. Deduplizierte Auftraege nach `postalCode` gruppieren
3. Fuer jede unique PLZ Koordinaten via Geocoder laden (async, mit Loading-State)
4. Pro PLZ einen Cluster-Marker setzen

**Cluster-Marker-Design:**
- Rundes oranges Icon (#f97316) mit weisser Zahl (Anzahl Auftraege in dieser PLZ)
- Groesse skaliert: 32px (1 Auftrag) bis 48px (5+ Auftraege)
- Weisser Rand, Schatten

**Popup beim Klick:**
- PLZ + Stadt als Header
- Anzahl Auftraege (nicht Termine!)
- Liste der Kunden mit Name
- Jeder Eintrag klickbar via `onOrderClick`

### Datei 3: `src/components/PoolView.tsx` (KLEINE ANPASSUNG)

- `mapOrders`-Mapping entfernen (PoolMap akzeptiert jetzt direkt `TechnicianOrder[]`)
- `onOrderClick` Logik anpassen: Klick auf Cluster-Popup-Eintrag liefert `auftragId`, suche ersten passenden Termin

---

## Deduplizierungs-Logik (kritisch)

```text
Input:  29 TechnicianOrders (mit Termin-Dopplungen)
        |
        v
Schritt 1: Gruppiere nach auftragId
        -> Map<auftragId, TechnicianOrder[]>
        -> 23 unique Auftraege
        |
        v  
Schritt 2: Pro auftragId: nimm ersten Eintrag (fuer Name, PLZ, Stadt)
        -> 23 deduplizierte Eintraege
        |
        v
Schritt 3: Gruppiere nach postalCode
        -> Map<plz, {city, orders[]}>
        -> z.B. PLZ 06686 = 1 Auftrag (Bennemann)
        |
        v
Schritt 4: Geocode jede unique PLZ -> Koordinaten
        |
        v
Schritt 5: Pro PLZ ein Cluster-Marker mit Anzahl
```

## Edge Cases

| Szenario | Verhalten |
|---|---|
| 3 Terminvorschlaege fuer 1 Auftrag | Wird als 1 Auftrag gezaehlt (Deduplizierung via auftragId) |
| Mehrere Auftraege in gleicher PLZ | Cluster-Marker zeigt Summe, Popup listet alle Kunden |
| PLZ nicht geocodierbar | console.warn, Marker wird uebersprungen |
| Nominatim Rate-Limit | Sequentielle Abfragen mit 1s Delay |
| 0 Pool-Orders | Leere Karte, kein Geocoding |
| PLZ "06686" (fuehrende Null) | String-Handling, kein Problem |
| Auftrag ohne PLZ | Wird uebersprungen |
| Cache voll | try/catch um localStorage.setItem |

## Keine DB-Aenderung noetig

- Rein Frontend: Geocoding client-seitig, Cache in LocalStorage
- Keine neuen Tabellen/Spalten
- Kein neues RLS
- Kein neuer Storage-Zugriff
- Bestehende `usePoolOrders`-Daten werden weiterverwendet

## Implementierungsschritte

| # | Was | Datei |
|---|---|---|
| 1 | PLZ-Geocoder mit Cache + Rate-Limiting | `src/features/pool/utils/plz-geocoder.ts` |
| 2 | PoolMap komplett umbauen (TechnicianOrder[], Deduplizierung, Cluster) | `src/components/PoolMap.tsx` |
| 3 | PoolView anpassen (mapOrders-Mapping entfernen) | `src/components/PoolView.tsx` |
