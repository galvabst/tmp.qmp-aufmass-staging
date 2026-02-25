

# Fix: Karten-Marker im Meer wegen fehlerhafter Geocoding-Daten

## Problem

Die Marker landen im Meer, weil die API **zippopotam.us** fuer viele deutsche PLZs **komplett falsche Koordinaten** liefert:

```text
PLZ 44894 Bochum:   longitude="51.4925" (eigentlich lat!), latitude="05911" (Unsinn)
PLZ 06118 Halle:    longitude="51.5175",                    latitude="15002" (Unsinn)
PLZ 45326 Essen:    longitude="51.4844",                    latitude="05113" (Unsinn)
PLZ 91242 Ottensoos: longitude="11.35",   latitude="49.5167" (korrekt!)
```

Die `latitude`-Werte sind bei vielen Eintraegen abgeschnittene Zahlen (5-stellig statt Dezimalgrad). Die API ist schlicht unzuverlaessig fuer Deutschland.

## Loesung

**Nominatim (OpenStreetMap) als primaere Geocoding-Quelle verwenden** statt zippopotam.us. Nominatim liefert zuverlaessige Koordinaten fuer deutsche PLZs.

Zusaetzlich: PLZs mit fuehrender Null normalisieren (DB enthaelt z.B. `7549` statt `07549`).

## Technische Aenderungen

### `src/features/pool/utils/plz-geocoder.ts`

1. **PLZ-Normalisierung**: Neue Hilfsfunktion `normalizePlz()` die PLZs auf 5 Stellen mit fuehrender Null auffuellt (`"7549"` → `"07549"`)

2. **Primaere Quelle wechseln**: `fetchFromZippopotam()` entfernen oder als letzten Fallback behalten. Neue primaere Funktion `fetchFromNominatim(plz)` die per `postalcode`-Parameter sucht:
   ```
   https://nominatim.openstreetmap.org/search?postalcode=44894&country=de&format=json&limit=1
   ```

3. **Validierung der Koordinaten**: Pruefen ob die zurueckgegebenen Werte in einem plausiblen Bereich fuer Deutschland liegen (lat 47-55, lng 5-16). Falsche Werte verwerfen statt cachen.

4. **Rate-Limiting fuer Nominatim**: Requests serialisieren mit 200ms Pause (Nominatim erlaubt max 1 req/s). Die `geocodePlzBatch` wird von parallel auf sequentiell mit Throttling umgestellt.

5. **LocalStorage-Cache bleibt**, aber ungueltige Eintraege aus dem alten Cache werden durch die Validierung automatisch verworfen (alte Eintraege mit falschen Koordinaten werden nicht mehr gelesen wenn sie ausserhalb des DE-Bereichs liegen).

### Dateien

| Datei | Aenderung |
|---|---|
| `src/features/pool/utils/plz-geocoder.ts` | Nominatim als primaere Quelle, PLZ-Normalisierung, Koordinaten-Validierung, Throttling |

