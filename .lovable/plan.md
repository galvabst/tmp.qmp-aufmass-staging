
# Fix: Timer soll echte Video-Dauer nutzen statt DB-Schaetzung

## Problem

Der Timer "X:XX verbleibend" basiert auf `video_dauer_minuten` aus der Datenbank (z.B. 5 Min). Wenn das Video tatsaechlich kuerzer ist (z.B. 47 Sekunden wie im Screenshot), muss der User sinnlos warten. Der Bunny Player liefert die echte Dauer bereits im `timeupdate`-Event (`data.duration`), aber der Code ignoriert sie.

## Loesung

**Eine Datei, eine Aenderung:** `src/hooks/useVideoProgress.ts`

Im `useBunnyPlayerProgress`-Hook:

1. `totalDurationSeconds` wird von `const` zu einem `useState` -- initial auf den DB-Wert gesetzt
2. Im `timeupdate`-Event (Zeile 244) wird `data.duration` ausgelesen und uebernimmt den DB-Wert, sobald der Player die echte Dauer liefert
3. `requiredSeconds` und alle abgeleiteten Werte (Timer, Prozent, canUnlockTabs) passen sich automatisch an

```text
Vorher:
  const totalDurationSeconds = Math.round(videoDurationMinutes * 60);  // statisch aus DB
  
  player.on('timeupdate', (data) => {
    // data.duration wird IGNORIERT
  });

Nachher:
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(Math.round(videoDurationMinutes * 60));
  
  player.on('timeupdate', (data) => {
    if (data.duration > 0 && data.duration !== totalDurationSeconds) {
      setTotalDurationSeconds(Math.round(data.duration));  // echte Dauer uebernehmen
    }
  });
```

Das `ended`-Event (Zeile 241) muss ebenfalls den dynamischen State nutzen statt die alte Konstante.

## Warum nur diese eine Aenderung reicht

- Alle abgeleiteten Werte (`requiredSeconds`, `canUnlockTabs`, `percentComplete`, `timeRemainingFormatted`) werden bereits reaktiv aus `totalDurationSeconds` berechnet -- sobald der State sich aendert, aktualisiert sich alles automatisch
- Kein DB-Change noetig
- Kein UI-Change noetig

## Edge Cases

- Video laenger als DB-Wert: Timer passt sich nach oben an -- korrekt
- Video kuerzer als DB-Wert: Timer passt sich nach unten an -- genau der Fix
- Player.js ladt nicht: Fallback bleibt der DB-Wert (bisheriges Verhalten)
- `data.duration` ist 0 oder undefined: Guard-Clause verhindert Uebernahme
