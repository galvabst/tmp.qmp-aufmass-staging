
## Problem

Die **veröffentlichte** App (quick-measure-pro.lovable.app) läuft noch mit dem **alten** JavaScript-Bundle, in dem das Video-Gate aktiv war. Der Code im Projekt ist zwar schon gefixt (Hook gibt `[]` zurück, Gate ist deaktiviert), aber die Änderungen wurden **nie erfolgreich publiziert** — wahrscheinlich wegen der 43 Security Findings, die den Update-Button blockieren.

## Plan

### Schritt 1: Video-Gate komplett entfernen (nicht nur deaktivieren)

Aktuell ist der Import von `PflichtVideoOverlay` und `usePflichtVideos` noch in `Index.tsx` vorhanden, nur der Render-Pfad ist auskommentiert. Das ist halbherzig — komplett entfernen:

- **Index.tsx**: Import von `PflichtVideoOverlay` und `usePflichtVideos` entfernen, sowie die `void`-Zeilen und den gesamten Hook-Aufruf
- Dateien `PflichtVideoOverlay.tsx` und `usePflichtVideos.ts` bleiben bestehen (könnten im Onboarding noch referenziert werden), aber der Gate in Index.tsx wird restlos entfernt

### Schritt 2: Build validieren

- Sicherstellen, dass der Build nach dem Entfernen sauber durchläuft (keine toten Imports)

### Schritt 3: Publish ermöglichen

- Nach Implementierung: Du klickst auf **Publish > Update** im Lovable-Editor
- Falls der Button weiterhin blockiert ist wegen Security Findings: diese müssen im Security-Panel reviewed/dismissed werden

## Technische Details

Betroffene Datei: `src/pages/Index.tsx`
- Zeile 33-34: Imports entfernen (`usePflichtVideos`, `PflichtVideoOverlay`)  
- Zeile ~100-110: Hook-Aufruf `usePflichtVideos(...)` entfernen
- Zeile 409-412: Kommentar und `void`-Zeilen entfernen

Keine DB-Migration nötig. Keine neuen Dateien.
