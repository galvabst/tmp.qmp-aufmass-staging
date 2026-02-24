

# Pool-Karte: Attribution entfernen + Edge-to-Edge Map

## Probleme

1. **Leaflet-Attribution mit Flagge**: Der Standard-Attributionstext "Leaflet | (c) OpenStreetMap" mit ukrainischer Flagge sieht unprofessionell aus
2. **Karte endet abrupt**: Die Map hat `rounded-lg border border-border` -- dadurch entsteht ein haesslicher Rand, die Karte sollte randlos in den Screen fliessen
3. **Zoom-Controls** sehen mit dem Standard-Leaflet-Styling generisch aus

## Loesung

### 1. Attribution minimieren (`PoolMap.tsx`)

Leaflet erfordert rechtlich die OpenStreetMap-Attribution, aber das Flaggen-Prefix und "Leaflet" koennen entfernt werden. Loesung:
- `attributionControl: false` beim Map-Init setzen
- Eigene minimale Attribution hinzufuegen: nur "(c) OSM" als kleiner, dezenter Text
- Alternativ: Attribution per CSS stark verkleinern und transparent machen

### 2. Edge-to-Edge Map (`PoolMap.tsx`)

- `rounded-lg border border-border` vom Map-Container entfernen
- Der Map-Container soll die volle Breite und Hoehe einnehmen ohne Rundung oder Border
- Dadurch fliesst die Karte nahtlos in den unteren Bildschirmrand

### 3. Zoom-Controls stylen (`PoolMap.tsx` oder globales CSS)

- Leaflet Zoom-Buttons per CSS an das App-Design anpassen (abgerundeter, subtilere Schatten)

---

## Technische Aenderungen

### Datei: `src/components/PoolMap.tsx`

**Map-Init aendern (Zeile 140-144):**
```text
const map = L.map(containerRef.current, {
  center: [51.2, 10.5],
  zoom: 6,
  zoomControl: true,
  attributionControl: false,  // Standard-Attribution deaktivieren
});

// Minimale Attribution hinzufuegen
L.control.attribution({ prefix: false })
  .addAttribution('(c) <a href="https://openstreetmap.org">OSM</a>')
  .addTo(map);
```

**Map-Container stylen (Zeile 220):**
```text
Vorher:  className="h-full w-full rounded-lg border border-border"
Nachher: className="h-full w-full"
```

### Datei: `src/index.css` (optional)

Leaflet Zoom-Buttons und Attribution per CSS verfeinern:
```text
.leaflet-control-attribution {
  font-size: 10px;
  opacity: 0.5;
  background: transparent !important;
}

.leaflet-control-zoom a {
  border-radius: 8px !important;
  /* subtilere Schatten */
}
```

---

## Dateien

| Datei | Aenderung |
|---|---|
| `src/components/PoolMap.tsx` | `attributionControl: false`, eigene minimale Attribution, Border/Rounding entfernen |
| `src/index.css` | Optional: Leaflet-Controls feiner stylen |

