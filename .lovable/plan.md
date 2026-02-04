
# Fix: Player.js funktioniert nicht - iFrame Ref Kette gebrochen

## Zusammenfassung der Probleme

Du hast drei Probleme gemeldet:
1. **Video zeigt "pausiert" obwohl es laeuft** - Player.js Events werden nicht empfangen
2. **Skippen ist moeglich** - Anti-Skip Logik greift nicht
3. **Kein Lerninhalt** - DB-Spalte `text_inhalt` ist NULL (separates Daten-Problem)

---

## Root Cause Analyse (aus Console Logs)

```
[BunnyPlayer] No iframe ref yet
[BunnyPlayer] Player.js not ready after 5s, using fallback timer
```

**Warum passiert das?**

Die Ref-Weitergabe von `BunnyStreamPlayer` → `MultiSourceVideoPlayer` → `AkademieModul` ist **gebrochen**.

### Problem 1: Ref wird nie gesetzt

In `MultiSourceVideoPlayer.tsx`:
```typescript
const bunnyIframeRef = useRef<HTMLIFrameElement>(null);  // Zeile 178

// Expose iframe ref to parent
useImperativeHandle(ref, () => ({
  getIframeRef: () => bunnyIframeRef.current  // Zeile 182 - liest bunnyIframeRef
}), []);

// ABER: BunnyStreamPlayer schreibt in seinen EIGENEN internalRef!
<BunnyStreamPlayer ref={bunnyIframeRef} url={videoUrl} />  // Zeile 205
```

Das Problem: `BunnyStreamPlayer` verwendet `forwardRef` und `useImperativeHandle`, aber es **ueberschreibt** den Ref mit seinem eigenen Wert (`internalRef.current!`), statt den echten DOM-Node zu exponieren.

### Problem 2: Timing Race Condition

In `AkademieModul.tsx`:
```typescript
useEffect(() => {
  if (videoPlayerRef.current) {
    const iframe = videoPlayerRef.current.getIframeRef();  // Zeile 57
    setIframeRef(iframe);  // Wird aufgerufen, aber iframe ist null!
  }
}, [cssVarsReady, unterpunkt?.videoUrl]);  // Zeile 60
```

Dieser Effect wird ausgefuehrt **bevor** der iFrame tatsaechlich gerendert wird, weil:
1. `cssVarsReady` wird `true`
2. Effect laeuft
3. `getIframeRef()` gibt `null` zurueck (iFrame existiert noch nicht)
4. Spaeter wird iFrame gerendert, aber Effect laeuft nicht nochmal

---

## Loesung

### Fix 1: Korrektur der Ref-Kette in MultiSourceVideoPlayer

**Aktueller Code (fehlerhaft):**
```typescript
const bunnyIframeRef = useRef<HTMLIFrameElement>(null);

useImperativeHandle(ref, () => ({
  getIframeRef: () => bunnyIframeRef.current
}), []);

<BunnyStreamPlayer ref={bunnyIframeRef} url={videoUrl} />
```

**Problem:** `BunnyStreamPlayer` ist ein `forwardRef` Component der `useImperativeHandle` nutzt und `internalRef.current!` zurueckgibt. Aber `bunnyIframeRef` erwartet ein `HTMLIFrameElement`, nicht das was `useImperativeHandle` zurueckgibt.

**Fix:** Die Ref-Logik in `BunnyStreamPlayer` vereinfachen - direkt den DOM-Node exponieren statt `useImperativeHandle`:

```typescript
// BunnyStreamPlayer - vereinfacht
const BunnyStreamPlayer = forwardRef<HTMLIFrameElement, { url: string }>(
  function BunnyStreamPlayer({ url }, ref) {
    const normalizedUrl = normalizeBunnyUrl(url);
    
    return (
      <iframe
        ref={ref}  // Direkt den forwarded ref nutzen
        id="bunny-player-iframe"
        src={normalizedUrl}
        // ...
      />
    );
  }
);
```

### Fix 2: Polling in AkademieModul fuer iFrame Ref

**Aktueller Code:**
```typescript
useEffect(() => {
  if (videoPlayerRef.current) {
    const iframe = videoPlayerRef.current.getIframeRef();
    setIframeRef(iframe);
  }
}, [cssVarsReady, unterpunkt?.videoUrl]);
```

**Fix:** Polling mit Retry bis iFrame verfuegbar:
```typescript
useEffect(() => {
  if (!cssVarsReady || !unterpunkt?.videoUrl) return;
  
  // Poll for iframe availability
  const checkForIframe = () => {
    if (videoPlayerRef.current) {
      const iframe = videoPlayerRef.current.getIframeRef();
      if (iframe) {
        setIframeRef(iframe);
        return true;
      }
    }
    return false;
  };
  
  // Check immediately
  if (checkForIframe()) return;
  
  // Retry every 100ms
  const interval = setInterval(() => {
    if (checkForIframe()) {
      clearInterval(interval);
    }
  }, 100);
  
  // Give up after 5 seconds
  const timeout = setTimeout(() => clearInterval(interval), 5000);
  
  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
}, [cssVarsReady, unterpunkt?.videoUrl]);
```

### Fix 3: Player.js Hook mit iFrame-Change Detection

**Problem:** Der `useBunnyPlayerProgress` Hook initialisiert nur einmal und prueft `iframeRef.current` - wenn dieser `null` ist beim ersten Render, wird Player.js nie initialisiert.

**Fix:** Hook so aendern dass er auf Aenderungen von `iframeRef.current` reagiert:
```typescript
useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe) {
    console.log('[BunnyPlayer] No iframe ref yet');
    return;
  }
  
  // ... Player initialization
}, [iframeRef.current]);  // Re-run wenn sich der Ref aendert
```

**ABER:** `iframeRef.current` in Dependencies funktioniert nicht da es kein reaktiver Wert ist!

**Besserer Fix:** Das Polling in AkademieModul triggert ein State-Update (`setIframeRef`), und dieses wird via Props an `AkademieModulContent` weitergegeben. Dort wird es in einen Ref verpackt:
```typescript
const iframeRefObject = useRef<HTMLIFrameElement | null>(null);
iframeRefObject.current = iframeRef;  // Sync bei jedem Render
```

Das Problem ist: Der Hook `useBunnyPlayerProgress` laeuft vor diesem Sync. Wir muessen den Hook **neu triggern** wenn `iframeRef` sich aendert.

**Loesung:** Statt Ref als Parameter, den iFrame direkt als State uebergeben:

```typescript
// In useBunnyPlayerProgress - Dependencies auf iframe selbst
useEffect(() => {
  if (!iframe) {
    console.log('[BunnyPlayer] No iframe ref yet');
    return;
  }
  // ... initialization
}, [iframe, requiredSeconds]);  // iframe ist jetzt reaktiv
```

---

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | BunnyStreamPlayer: Direkte Ref-Weitergabe statt useImperativeHandle |
| `src/pages/AkademieModul.tsx` | iFrame Ref Polling mit Retry-Logik |
| `src/hooks/useVideoProgress.ts` | Hook akzeptiert iFrame als State statt Ref, re-initialisiert bei Aenderung |

---

## Ablauf nach Fix

1. `AkademieModul` rendert, `cssVarsReady = true`
2. `MultiSourceVideoPlayer` rendert, `BunnyStreamPlayer` rendert iFrame
3. Polling in `useEffect` findet iFrame nach ~100-200ms
4. `setIframeRef(iframe)` loest State-Update aus
5. `AkademieModulContent` bekommt neue `iframeRef` Prop
6. `useBunnyPlayerProgress` Hook re-initialisiert mit echtem iFrame
7. Player.js wird erfolgreich initialisiert
8. Console: `[BunnyPlayer] Player ready`
9. Play/Pause Events werden korrekt erkannt
10. Anti-Skip Logik greift

---

## Zum Lerninhalt (DB Problem)

Der Screenshot zeigt `text_inhalt = NULL` fuer die Lektion `f10b3df0-1a58-4d2a-80a1-164b38a21292`.

Das ist ein **Daten-Problem**, kein Code-Problem. Der Text den du frueher genannt hast (Cinderella-Prinzip etc.) muss in der Datenbank in die Spalte `text_inhalt` eingetragen werden.

**Nach dem Code-Fix:** Du kannst den Lerninhalt direkt in Supabase eintragen:
- Tabelle: `contractor_akademie_lektionen`
- Row: UUID `f10b3df0-1a58-4d2a-80a1-164b38a21292`
- Spalte: `text_inhalt`
- Format: Markdown

---

## Erwartetes Ergebnis

Nach dem Fix:
- Video Play → Button zeigt "X:XX verbleibend" mit laufendem Timer
- Video Pause → Button zeigt "Video pausiert"
- User versucht zu skippen → Video springt zurueck zur erlaubten Position
- 90% geschaut → Tabs und "Abschliessen" Button werden aktiv
