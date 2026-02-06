
# Video-Layout wie YouTube: Keine schwarzen Balken

## Problem

Aktuell nutzt der Video-Player den `hero`-Modus, der den gesamten verfuegbaren Bildschirm (100svh minus Header/Footer) ausfuellt. Da die meisten Videos 16:9 sind, aber Smartphones viel hoeher (z.B. 19.5:9), entstehen oben und unten schwarze Balken (Letterboxing).

## Loesung: YouTube-Layout

Wie bei YouTube Mobile: Das Video nimmt die volle Breite ein und behaelt sein natuerliches Seitenverhaeltnis (16:9). Der restliche Content (Tabs, Abschluss-Button) scrollt darunter. Kein erzwungenes Fuellen des Viewports mehr.

Bei Klick auf Fullscreen (im Player selbst) wird das Video dann wirklich bildschirmfuellend - das uebernimmt der Browser/Bunny-Player automatisch.

## Aenderungen

### 1. `src/components/akademie/MultiSourceVideoPlayer.tsx`

- Den `hero`-Modus aendern: Statt fester Hoehe (`calc(100svh - ...)`) auf `aspect-ratio: 16/9` mit voller Breite umstellen
- Der `contained`-Modus bleibt gleich (wird anderswo evtl. genutzt)
- `minHeight` und die CSS-Variable-Abhaengigkeit entfallen fuer `hero`
- Schwarzer Hintergrund bleibt fuer den Fall, dass ein Video etwas schmaler ist
- `maxHeight` optional begrenzen (z.B. 70vh auf Desktop), damit auf grossen Bildschirmen das Video nicht ueberdimensioniert wird

Konkret:
```text
// Vorher (hero):
height: 'calc(100svh - var(--akademie-header-h) - var(--akademie-footer-h))'

// Nachher (hero):
aspectRatio: '16/9'
width: '100%'
maxHeight: '70vh'  // Begrenzung auf Desktop
```

### 2. `src/pages/AkademieModul.tsx`

- Die CSS-Variable-Messung (`--akademie-header-h`, `--akademie-footer-h`) und den `cssVarsReady`-Guard koennen vereinfacht werden, da der Player die Variablen nicht mehr braucht
- Der `cssVarsReady`-Guard vor dem Player-Render kann entfallen (Player haengt nicht mehr von gemessenen Hoehen ab)
- Footer bleibt `sticky bottom-0` - funktioniert weiterhin korrekt

### 3. Kein Einfluss auf Fullscreen

Der Fullscreen-Button im Bunny-Player/YouTube-iframe nutzt die native Browser Fullscreen API. Das funktioniert unabhaengig vom Container-Layout und wird weiterhin echtes Vollbild sein.

## Betroffene Dateien

1. `src/components/akademie/MultiSourceVideoPlayer.tsx` -- Layout-Logik aendern
2. `src/pages/AkademieModul.tsx` -- cssVarsReady-Guard vereinfachen
