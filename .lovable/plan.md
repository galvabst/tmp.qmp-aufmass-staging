

# Plan: Navigation-Link Fix — ERR_BLOCKED_BY_RESPONSE

## Problem

Der "Navigation starten"-Button verwendet `window.open(mapsUrl, '_blank')`. Google blockiert das mit COOP/CORP-Headern (`ERR_BLOCKED_BY_RESPONSE`), wenn die Seite von einer fremden Origin geoeffnet wird. Das ist ein bekanntes Problem mit `window.open()` und Google Maps.

## Loesung

Den `<button>` durch einen nativen `<a href="..." target="_blank" rel="noopener noreferrer">` ersetzen. Browser behandeln native Link-Klicks anders als programmatische `window.open()`-Aufrufe — sie unterliegen nicht den COOP-Restriktionen. Auf Mobilgeraeten oeffnet ein `<a>`-Link zu Google Maps ausserdem automatisch die native Maps-App (Intent auf Android, Universal Link auf iOS).

## Aenderung

### `src/components/TechnicianOrderDetail.tsx` (Zeilen 522-531)

`<button onClick={() => window.open(mapsUrl, '_blank')}>` wird zu:

```tsx
<a
  href={mapsUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-3 w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
>
  <Navigation className="w-4 h-4" />
  Navigation starten
</a>
```

Kein `window.open()`, kein `onClick`, kein JavaScript — nur ein nativer HTML-Link. Das umgeht die COOP-Blockade komplett und funktioniert auf allen Plattformen.

## Dateien

| Aktion | Datei |
|---|---|
| Aendern | `src/components/TechnicianOrderDetail.tsx` |

