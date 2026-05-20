# Bugfix: Bestätigungs-Dialog in Hiring-Map nicht schließbar

## Problem

In der Admin-Hiring-Map öffnet ein Klick auf einen Techniker-Marker das Popup mit Aktions-Buttons (Pausieren, Ausgestiegen, Feuern, …). Beim Klick auf z.B. „Als ausgestiegen markieren" erscheint zwar der Bestätigungs-Dialog mit dem Titel — aber:

- Kein abdunkelnder Hintergrund (Overlay fehlt visuell)
- Beschreibungstext und Buttons („Abbrechen" / „Bestätigen") sind nicht klickbar
- ESC und Klick außerhalb funktionieren nicht
- User sitzt fest auf der Map-Ansicht

## Ursache

Leaflet rendert seine Karten-Panes mit hohen, hartkodierten z-index-Werten (Map-Container `z-index: 400`, Popups `z-index: 700`, Controls `z-index: 1000`). Der Radix `AlertDialog` aus shadcn nutzt per Default `z-50` für Overlay und Content. Dadurch liegt der gesamte Dialog **unter** der Leaflet-Karte — sichtbar ist nur der Teil, der zufällig über der Card-Header-Zeile liegt. Klicks gehen an die Karte, nicht an den Dialog.

## Fix

Den `AlertDialog` in `src/features/admin/ui/AdminHiringMap.tsx` (Zeile ~753) so anpassen, dass Overlay und Content über Leaflet liegen:

- `AlertDialogContent` bekommt `className="z-[2000]"`
- Das von Radix automatisch gerenderte Overlay separat erhöhen, indem ein expliziter `AlertDialogOverlay` mit `className="z-[1999]"` davor gerendert wird (shadcn-AlertDialog erlaubt das via Komposition)

Alternativ — und sauberer für den ganzen Admin-Bereich — eine globale CSS-Regel in `src/index.css`:

```css
/* Leaflet darf Radix-Dialoge/Popovers/Toasts nicht überdecken */
.leaflet-pane,
.leaflet-top,
.leaflet-bottom { z-index: 30 !important; }
.leaflet-popup-pane { z-index: 40 !important; }
```

Ich empfehle den **globalen CSS-Fix**, weil:
- Er auch andere Dialoge/Tooltips/Toasts/Popovers über der Map automatisch fixt (z.B. Sheet-Komponenten, Sonner-Toasts)
- Die Leaflet-Controls (+/−) und Popups bleiben über der Karte, nur die globale Schicht (z-50+) gewinnt
- Keine Änderung pro Dialog nötig

## Technische Details

**Geänderte Dateien:**
- `src/index.css` — neue Sektion „Leaflet z-index normalisieren" am Ende

**Verifikation:**
- Browser auf /admin: Marker klicken → „Ausgestiegen" → Dialog erscheint mit Overlay, „Abbrechen" schließt sauber, ESC funktioniert
- Map-Funktionalität (Zoom, Popup-Buttons, Heatmap-Layer) bleibt erhalten
- Sonner-Toasts erscheinen weiterhin über der Karte
