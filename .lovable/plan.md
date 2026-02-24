

# Pool-Karte: Schneller laden, Fallback fuer ungueltige PLZ, Map-Tab fixieren

## 3 Probleme

1. **Geocoding zu langsam**: Sequentielle Nominatim-Calls mit 1,1s Delay pro PLZ
2. **Ungueltige PLZ (z.B. 7549)**: Kein Fallback -- Marker fehlt auf der Karte
3. **Karten-Tab verschwindet**: Der Map-Container wird per Conditional Rendering (`viewMode === 'map'`) ein-/ausgeblendet. Beim Wechsel wird die Leaflet-Map jedes Mal zerstoert und neu erstellt. Die Map-Hoehe wird nicht korrekt berechnet.

---

## Loesung

### 1. Schnelleres Geocoding (`plz-geocoder.ts`)

- **API wechseln** zu `api.zippopotam.us/de/{plz}` -- keine Rate-Limits, CORS-faehig
- **Parallel statt sequentiell**: `Promise.allSettled()` fuer alle uncached PLZs gleichzeitig
- Kein 1,1s Delay mehr noetig
- LocalStorage-Cache bleibt bestehen

**Vorher:** 23 PLZs x 1,1s = ~25 Sekunden
**Nachher:** 23 PLZs parallel = ~1-2 Sekunden

### 2. Fallback fuer ungueltige PLZ (`plz-geocoder.ts`)

Wenn die PLZ-Suche fehlschlaegt (z.B. "7549"), wird ein **Fallback ueber den Ortsnamen** gemacht. Dafuer bekommt `geocodePlz` einen optionalen `city`-Parameter und `geocodePlzBatch` erhaelt eine Map von PLZ zu Ortsname.

Ablauf:
1. Versuche PLZ ueber zippopotam.us
2. Falls 404/kein Ergebnis UND ein Ortsname vorhanden: Suche ueber Nominatim mit `city={Ort}&country=de` (ein einzelner Call, kein Rate-Limit-Problem bei wenigen Fallbacks)
3. Ergebnis wird im gleichen LocalStorage-Cache gespeichert

### 3. Map-Tab fixieren (`PoolView.tsx` + `PoolMap.tsx`)

**Problem:** Die Map wird per `{viewMode === 'map' ? <PoolMap/> : <List/>}` gerendert. Beim Tab-Wechsel wird die gesamte Leaflet-Instanz zerstoert.

**Loesung:** Beide Views immer rendern, aber die inaktive per CSS verstecken (`hidden`-Klasse). So bleibt die Leaflet-Map am Leben und muss nicht jedes Mal neu initialisiert werden.

```text
Vorher:
  {viewMode === 'list' ? <ListContent/> : <PoolMap/>}

Nachher:
  <div className={viewMode === 'list' ? '' : 'hidden'}><ListContent/></div>
  <div className={viewMode === 'map' ? 'h-[calc(100vh-200px)]' : 'hidden'}><PoolMap/></div>
```

Zusaetzlich: `map.invalidateSize()` aufrufen wenn die Map sichtbar wird, damit Leaflet die Groesse korrekt berechnet.

---

## Dateien

| Datei | Aenderung |
|---|---|
| `src/features/pool/utils/plz-geocoder.ts` | API auf zippopotam.us umstellen, parallele Ausfuehrung, City-Fallback ueber Nominatim |
| `src/components/PoolView.tsx` | Beide Views immer rendern, inaktive per `hidden` verstecken; City-Daten an PoolMap weitergeben |
| `src/components/PoolMap.tsx` | City-Daten an Geocoder weitergeben fuer Fallback; `invalidateSize()` bei Sichtbarkeit |

---

## Technische Details

### plz-geocoder.ts -- neues Interface

```text
geocodePlz(plz: string, city?: string): Promise<PlzCoordinate | null>
geocodePlzBatch(plzList: string[], cityMap?: Map<string, string>): Promise<Map<string, PlzCoordinate>>
```

- Primaer: `https://api.zippopotam.us/de/{plz}` (parallel, kein Delay)
- Fallback: `https://nominatim.openstreetmap.org/search?city={city}&country=de&format=json&limit=1`
- Cache-Key bleibt `plz-geo-{plz}`

### PoolMap.tsx -- City-Daten

Die `groupByPlz`-Funktion sammelt bereits den Ortsnamen (`o.city`). Dieser wird als `cityMap` an `geocodePlzBatch` weitergegeben, damit der Fallback funktioniert.

### PoolView.tsx -- CSS-basiertes Tab-Switching

Statt Conditional Rendering werden beide Views permanent gerendert. Die Map initialisiert sich einmal und bleibt bestehen. Beim Wechsel zurueck zur Karte wird `invalidateSize()` getriggert ueber einen neuen `isVisible`-Prop oder einen ResizeObserver.

