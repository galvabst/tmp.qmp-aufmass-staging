
## Echtes Unskippable Video mit Player.js API

### Problem-Analyse

Du hast zwei Probleme gemeldet:
1. **Video kann uebersprungen werden** - Der User kann vorspulen
2. **Timer laeuft auch bei Pause** - Die Uhr zaehlt weiter, auch wenn das Video pausiert ist

**Ursache:** Die aktuelle Implementierung nutzt einen simplen `setInterval`-Timer, der jede Sekunde hochzaehlt - unabhaengig davon, ob das Video spielt oder pausiert ist.

### Loesung: Bunny Stream Player.js API

Bunny Stream unterstuetzt die **Player.js API**, die es erlaubt:
- `play` / `pause` Events zu empfangen
- `timeupdate` Events mit aktueller Position zu erhalten
- `setCurrentTime()` aufzurufen um Skipping zu verhindern

---

## Technische Umsetzung

### 1) Player.js SDK einbinden

**Datei:** `index.html`

```html
<script src="//assets.mediadelivery.net/playerjs/playerjs-latest.min.js"></script>
```

### 2) Neuer Hook: `useBunnyPlayerProgress`

**Datei:** `src/hooks/useVideoProgress.ts`

Dieser Hook ersetzt `useIframeLessonProgress` und macht folgendes:
- Hoert auf `play`/`pause` Events vom Bunny Player
- Zaehlt nur hoch wenn Video **tatsaechlich spielt**
- Trackt die maximale erreichte Position
- Verhindert Vorspulen ueber die maximal erreichte Position

```typescript
interface UseBunnyPlayerProgressOptions {
  requiredWatchPercent?: number;
  iframeRef: RefObject<HTMLIFrameElement>;
}

export function useBunnyPlayerProgress(
  videoDurationMinutes: number,
  options: UseBunnyPlayerProgressOptions
): {
  canComplete: boolean;
  watchedSeconds: number;
  requiredSeconds: number;
  percentComplete: number;
  timeRemainingFormatted: string;
  isPlaying: boolean;
}
```

**Logik:**
1. `playerjs.Player(iframe)` initialisieren wenn iFrame geladen
2. `player.on('timeupdate', callback)` - empfaengt `{seconds, duration}`
3. Nur die tatsaechlich abgespielten Sekunden zaehlen (keine Spruenge)
4. Bei Vorwaerts-Seek: `player.setCurrentTime(maxReachedTime)` zuruecksetzen

### 3) BunnyStreamPlayer anpassen

**Datei:** `src/components/akademie/MultiSourceVideoPlayer.tsx`

- iFrame bekommt eine `id` oder `ref`
- Progress-Hook bekommt Zugriff auf die iFrame-Referenz
- Kommunikation nach oben via Callback/Context

### 4) AkademieModul.tsx anpassen

- Neuen Hook statt `useIframeLessonProgress` nutzen
- iFrame-Ref von MultiSourceVideoPlayer durchreichen

---

## Architektur-Entscheidung

Es gibt zwei Wege, die Kommunikation zwischen Player und Hook zu organisieren:

**Option A: Ref durchreichen (einfacher)**
- MultiSourceVideoPlayer gibt iFrame-Ref nach oben
- Hook wird in AkademieModul mit dieser Ref initialisiert

**Option B: Context/Callback (sauberer)**
- MultiSourceVideoPlayer managed Player.js intern
- Feuert Callbacks: `onProgress(seconds)`, `onPlay()`, `onPause()`
- Hook reagiert auf diese Events

Ich empfehle **Option A** fuer Einfachheit, da es nur eine Komponente betrifft.

---

## Dateien die ich aendern werde

| Datei | Aenderung |
|-------|-----------|
| `index.html` | Player.js SDK Script hinzufuegen |
| `src/hooks/useVideoProgress.ts` | Neuer Hook `useBunnyPlayerProgress` mit echtem Playback-Tracking |
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | iFrame-Ref exponieren, ID hinzufuegen |
| `src/pages/AkademieModul.tsx` | Neuen Hook nutzen mit iFrame-Ref |
| `src/vite-env.d.ts` | TypeScript-Deklaration fuer `playerjs` global |

---

## Anti-Skip Logik (Kernfeature)

```typescript
// Pseudo-Code fuer Anti-Skip
let maxReachedTime = 0;
let accumulatedWatchTime = 0;
let lastUpdateTime = 0;

player.on('timeupdate', ({ seconds }) => {
  // Normale Wiedergabe: kleine Spruenge (< 2 Sek) erlauben
  if (seconds > lastUpdateTime && seconds - lastUpdateTime < 2) {
    accumulatedWatchTime += (seconds - lastUpdateTime);
    maxReachedTime = Math.max(maxReachedTime, seconds);
  }
  // Vorwaerts-Skip erkannt: zuruecksetzen!
  else if (seconds > maxReachedTime + 2) {
    player.setCurrentTime(maxReachedTime);
  }
  lastUpdateTime = seconds;
});
```

---

## Erwartetes Verhalten nach Implementierung

1. User startet Video - Timer beginnt
2. User pausiert Video - **Timer stoppt**
3. User versucht vorzuspulen - **Video springt zurueck**
4. Nur tatsaechlich abgespielte Zeit zaehlt
5. Nach 90% echter Wiedergabe: Tabs und Button werden freigeschalten

---

## Fallback fuer YouTube

YouTube unterstuetzt Player.js **nicht**. Fuer YouTube-Videos bleibt der alte Timer-basierte Ansatz als Fallback:
- Erkennung via `detectVideoSource()`
- Bei `youtube`: weiterhin `useIframeLessonProgress` nutzen
- Bei `bunny-stream`: neuen `useBunnyPlayerProgress` nutzen

---

## Risiken

1. **Player.js Script blockiert**: Falls CDN nicht erreichbar, funktioniert Tracking nicht. Fallback auf Timer-basiert.
2. **Timing-Races**: iFrame muss geladen sein bevor Player initialisiert wird. Robustes `player.on('ready')` Handling noetig.
3. **Mobile Safari**: Kann restriktiver sein mit iframe-Kommunikation. Testen erforderlich.
