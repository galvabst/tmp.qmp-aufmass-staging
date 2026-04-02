

# Heatmap-Verbesserungen & Geocoding-Cache

## Probleme
1. **Heatmap erst beim Reinzoomen sichtbar** — `maxZoom: 10` sorgt dafür, dass die Heatmap bei niedrigen Zoomstufen unsichtbar ist
2. **Lila THC-Punkte überlagern alles** — die CircleMarker sind zu dominant und konkurrieren mit der Heatmap
3. **Geocoding dauert bei jedem Laden** — localStorage-Cache geht beim Browser-Wechsel verloren, Nominatim wird jedes Mal erneut abgefragt

## Änderungen

### 1. Heatmap auf allen Zoomstufen sichtbar
**`AdminHiringMap.tsx`** — Heatmap-Parameter anpassen:
- `maxZoom` auf `18` erhöhen (Heatmap bleibt auf allen Zoomstufen aktiv)
- `radius` auf `25` reduzieren für kompaktere Hotspots bei Übersicht
- `blur` auf `20` für schärfere Ballungszentren
- `minOpacity` auf `0.3` setzen, damit auch einzelne Punkte sichtbar bleiben

### 2. THC-Punkte dezenter darstellen
- Standardmäßig THC-Punkte ausblenden wenn Heatmap aktiv ist (Toggle bleibt für Detail-Drill-Down)
- CircleMarker Opacity und Größe reduzieren (max radius 15 statt 40, opacity 0.4 statt 0.85)
- Farbe leicht transparenter machen

### 3. Geocoding in Supabase cachen
**Neue Tabelle `thermocheck.plz_geocode_cache`** (Migration):
```sql
CREATE TABLE thermocheck.plz_geocode_cache (
  plz TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**`plz-geocoder.ts`** anpassen:
- Vor Nominatim-Anfragen: Alle PLZs als Batch aus `plz_geocode_cache` laden (ein einziger DB-Query)
- Nach Nominatim-Geocoding: Ergebnis in die Tabelle schreiben (upsert)
- localStorage-Cache bleibt als L1-Cache für sofortige Treffer, DB ist L2-Cache
- Ergebnis: Beim 2. Laden keine Nominatim-Requests mehr, alle Koordinaten kommen aus der DB in <1s

### 4. Gesamt-THC-Ansicht ("Alle Monate")
**Optional:** Einen "Gesamt"-Button neben den Monats-Chips hinzufügen, der alle THCs ohne Datumsfilter lädt — zeigt die historische Gesamtverteilung als Heatmap.

### Dateien
- `AdminHiringMap.tsx` — Heatmap-Config, THC-Punkte dezenter, "Gesamt"-Button
- `plz-geocoder.ts` — DB-Cache Layer hinzufügen
- Migration — `plz_geocode_cache` Tabelle erstellen

