

# Plan: Google Maps Navigation — ERR_BLOCKED_BY_RESPONSE Fix

## Analyse

Das Problem tritt nur im Lovable-Preview auf (Desktop). Der Screenshot zeigt die URL `google.com/maps/dir/?api=1&destination=...` mit `ERR_BLOCKED_BY_RESPONSE`. 

**Root Cause**: Der `/maps/dir/`-Endpoint von Google setzt strikte `Cross-Origin-Opener-Policy: same-origin`-Header. Wenn der Link aus einem Preview-Iframe geoeffnet wird, blockiert Google das Rendern der Seite — auch bei `<a target="_blank" rel="noopener noreferrer">`.

**Beweisfuehrung**: In `OrderDetail.tsx` (Zeile 27) wird bereits das einfachere Format `https://maps.google.com/?q=ADDRESS` verwendet — dieses Format ist weniger restriktiv mit COOP. In `TechnicianOrderDetail.tsx` (Zeile 103) wird dagegen `https://www.google.com/maps/dir/?api=1&destination=ADDRESS` verwendet — genau das Format, das blockiert wird.

## Loesung

Zwei Aenderungen:

1. **URL-Format aendern**: Von `/maps/dir/?api=1&destination=` auf `https://www.google.com/maps/search/?api=1&query=` wechseln. Der `/search/`-Endpoint hat weniger strikte COOP-Header als `/dir/`. Alternativ das noch einfachere `https://maps.google.com/?q=` verwenden, das in `OrderDetail.tsx` bereits funktioniert.

2. **Fallback via `window.location.assign`**: Falls der `<a>`-Link trotzdem blockiert wird, einen onClick-Handler hinzufuegen, der als Fallback `window.location.assign(mapsUrl)` nutzt. Das navigiert die aktuelle Seite weg (statt neuen Tab), umgeht aber COOP komplett. Der Nutzer drueckt "Zurueck" um zur App zu kommen.

### Technische Details

**`src/components/TechnicianOrderDetail.tsx`** — 2 Stellen:

**Zeile 103** — URL-Format aendern:
```tsx
// Vorher:
const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

// Nachher:
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
```

**Zeilen 522-531** — Fallback onClick hinzufuegen:
```tsx
<a
  href={mapsUrl}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => {
    // Fallback: wenn der Link blockiert wird (Preview/iframe),
    // navigiere direkt in diesem Tab
    setTimeout(() => {
      window.location.assign(mapsUrl);
    }, 500);
  }}
  className="mt-3 w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
>
  <Navigation className="w-4 h-4" />
  Navigation starten
</a>
```

Nein — der setTimeout-Fallback ist unzuverlaessig und verursacht doppelte Navigation auf der Published-URL. Besser: nur das URL-Format aendern und fertig. Falls es im Preview weiterhin nicht geht, liegt das am Sandbox-Attribut des iframes, das Lovable selbst setzt — dagegen koennen wir im Code nichts tun.

**Finaler Plan: Nur URL-Format aendern** (1 Zeile):

```tsx
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
```

## Dateien

| Aktion | Datei |
|---|---|
| Aendern | `src/components/TechnicianOrderDetail.tsx` (Zeile 103) |

## Hinweis

Falls der Fehler nach dieser Aenderung weiterhin **nur im Preview** auftritt, ist das eine Lovable-Preview-Sandbox-Limitation (das iframe hat restriktive `sandbox`-Attribute). Auf der **Published URL** (`quick-measure-pro.lovable.app`) und auf dem Handy sollte es funktionieren. Den endgueltigen Test bitte dort machen.

