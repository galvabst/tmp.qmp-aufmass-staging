

# Heatmap mit Monatsauswahl für Thermochecks

## Was gebaut wird
Eine Monatsauswahl (letzte 6 Monate als klickbare Chips/Buttons) über der Map, die beim Wechsel eine echte Heatmap-Visualisierung der Thermocheck-Dichte anzeigt. Statt einzelner Punkte pro PLZ wird ein fließender Farbverlauf dargestellt, der Ballungszentren sofort sichtbar macht.

## Wie es aussieht
- Reihe von 6 Monats-Buttons (z.B. "Nov 25", "Dez 25", ... "Apr 26") neben dem bestehenden Toggle "Thermochecks"
- Aktiver Monat ist hervorgehoben, Klick wechselt sofort die Daten
- Heatmap-Layer mit Farbverlauf (grün → gelb → rot) zeigt Dichte der Thermochecks
- Bestehende lila CircleMarker bleiben optional als Detail-Layer verfügbar

## Technische Umsetzung

### 1. Leaflet Heatmap Plugin
- `leaflet.heat` als Dependency hinzufügen (leichtgewichtiges Heatmap-Plugin für Leaflet)
- Rendert gewichtete Punkte als fließenden Farbverlauf auf der Map

### 2. Hook: `useAdminHiringMap.ts` erweitern
- THC-Query bekommt einen `selectedMonth`-Parameter (Date) statt hardcoded "dieser Monat"
- Query lädt alle THCs im gewählten Monatszeitraum (`gte` Monatsanfang, `lt` nächster Monatsanfang)
- Rückgabe der Rohdaten (lat/lng + count) für den Heatmap-Layer

### 3. UI: `AdminHiringMap.tsx`
- State `selectedMonth` (Default: aktueller Monat)
- 6 Monats-Buttons generieren (aktueller Monat + 5 zurück)
- Neuer Leaflet `L.heatLayer` mit den geocodierten THC-Punkten, gewichtet nach Anzahl
- Heatmap-Layer ersetzt/ergänzt die bestehenden CircleMarker wenn aktiv
- Popup bei Klick auf Heatmap-Bereich zeigt Top-PLZs und Anzahl

### Dateien
- `src/features/admin/hooks/useAdminHiringMap.ts` — Monatsparameter für THC-Query
- `src/features/admin/ui/AdminHiringMap.tsx` — Monatsauswahl-UI + Heatmap-Layer
- `package.json` — `leaflet.heat` dependency

