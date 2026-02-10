

# Video-Player dynamisch an Hochkant/Querformat anpassen

## Problem
Der Video-Container hat aktuell ein festes 16:9 Seitenverhaeltnis. Bei Hochkant-Videos (9:16, z.B. Handy-Aufnahmen) entstehen grosse schwarze Balken links und rechts, statt den Bildschirm optimal zu nutzen.

## Loesung

Das Bunny Player iframe sendet per `postMessage` Informationen ueber die Video-Dimensionen. Wir lauschen auf diese Nachrichten und passen das Seitenverhaeltnis des Containers dynamisch an — genau wie YouTube es macht.

### Ablauf

1. Video-Player rendert initial mit 16:9 (Standard-Annahme)
2. Sobald das Bunny-Video geladen ist, erkennt der Player die echten Dimensionen
3. Container passt sein Seitenverhaeltnis automatisch an (z.B. 9:16 fuer Hochkant)
4. Auf Mobilgeraeten wird die Hoehe bei Hochkant-Videos begrenzt (max 70vh), damit Tabs und Footer noch sichtbar bleiben

### Technische Umsetzung

**Datei: `src/components/akademie/MultiSourceVideoPlayer.tsx`**

- Neuer State `detectedAspectRatio` (default: `16/9`)
- `useEffect` mit `window.addEventListener('message', ...)` um Bunny-Player-Events abzufangen
- Bunny sendet Events mit Video-Breite/Hoehe — daraus Aspect Ratio berechnen
- Fallback: Falls keine Dimensionen erkannt werden, bleibt 16:9

- Container-`style.aspectRatio` wird dynamisch gesetzt statt fest auf `16/9`
- Bei Portrait-Videos (Hoehe > Breite): `maxHeight: 70vh` auf Mobil, damit die Seite noch scrollbar ist

**Datei: `src/hooks/useVideoProgress.ts`**

- Im `useBunnyPlayerProgress` Hook: Wenn der Player `ready` meldet, Video-Dimensionen abfragen (falls Player.js das unterstuetzt) und per optionalem Callback nach oben geben

### Aenderungen

| Datei | Aenderung |
|---|---|
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | Dynamisches Aspect-Ratio per postMessage-Erkennung, maxHeight-Begrenzung fuer Portrait |
| `src/pages/AkademieModul.tsx` | Minutenanzeige im Header entfernen (zeigt noch "X Minuten") |

