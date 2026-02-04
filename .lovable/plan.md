

# Fix: Timer-Format, Lock-Icon UX und Video ohne schwarze Ränder

## Probleme (aus Screenshots)

1. **Timer zeigt Millisekunden** - "7:10.43905699999991 verbleibend" statt saubere "7:10"
2. **Falscher Lock-Zustand** - Zeigt "Kein Lerninhalt verfügbar" statt Lock-Icon bis Video geschaut
3. **Zwei-Phasen-Freischaltung fehlt** - Nach 90% sollen Tabs freigegeben werden, aber "Abschließen" erst nach 100%
4. **Schwarze Ränder bei Portrait-Videos** - Video sollte wie YouTube den Container ausfüllen ohne Letterboxing

---

## Lösung

### 1. Timer-Format korrigieren

**Datei:** `src/hooks/useVideoProgress.ts`

**Problem:** `watchedSeconds` ist ein Float mit vielen Nachkommastellen wegen `timeDelta`-Addition.

**Fix:** Bei der Berechnung von `remaining` runden:
```typescript
// Vorher (Zeile 165)
const remaining = Math.max(0, requiredSeconds - watchedSeconds);

// Nachher
const remaining = Math.max(0, Math.round(requiredSeconds - watchedSeconds));
```

Und bei `timeRemainingFormatted`:
```typescript
// Vorher (Zeile 168)
const timeRemainingFormatted = `${mins}:${secs.toString().padStart(2, '0')} verbleibend`;

// Nachher - secs muss auch gerundet werden
const secs = Math.round(remaining % 60);
const timeRemainingFormatted = `${mins}:${secs.toString().padStart(2, '0')} verbleibend`;
```

---

### 2. Lock-Icon UX für gesperrte Tabs

**Datei:** `src/pages/AkademieModul.tsx`

**Problem:** Wenn Tabs gesperrt sind UND Content existiert, zeigt es trotzdem "Kein Lerninhalt verfügbar".

**Fix:** Unterscheiden zwischen:
- **Gesperrt** (canCompleteVideo = false) → Lock-Icon + "Schaue das Video zu Ende"
- **Freigeschaltet aber leer** → "Kein Lerninhalt verfügbar"
- **Freigeschaltet mit Content** → Content anzeigen

```tsx
// TabsContent für "inhalt"
<TabsContent value="inhalt" className="mt-0">
  {!canCompleteVideo ? (
    // Gesperrt: Lock-Zustand
    <div className="text-center py-8 text-muted-foreground">
      <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Lerninhalt gesperrt</p>
      <p className="text-sm">Schaue das Video zu Ende, um freizuschalten.</p>
    </div>
  ) : hasTextContent ? (
    // Freigeschaltet mit Content
    <div className="prose prose-sm ...">
      <ReactMarkdown>{unterpunkt.textInhalt!}</ReactMarkdown>
    </div>
  ) : (
    // Freigeschaltet aber leer
    <div className="text-center py-8 text-muted-foreground">
      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Kein Lerninhalt verfügbar.</p>
    </div>
  )}
</TabsContent>
```

Gleiche Logik für "zusammenfassung" Tab.

---

### 3. Zwei-Phasen-Freischaltung: Tabs bei 90%, Button bei 100%

**Datei:** `src/hooks/useVideoProgress.ts` und `src/pages/AkademieModul.tsx`

**Neue Logik:**
- **canUnlockTabs** = 90% der Video-Dauer erreicht (wie bisher `canComplete`)
- **canMarkComplete** = Video komplett zu Ende geschaut (100% oder `ended` Event)

**Änderungen im Hook:**
```typescript
// Neue Returns
return {
  canUnlockTabs,      // 90% erreicht → Tabs freischalten
  canMarkComplete,    // 100% erreicht → Lektion abschließen
  watchedSeconds,
  requiredSeconds,
  percentComplete,
  timeRemainingFormatted,
  isPlaying,
  isVideoEnded,       // Neu: Video komplett zu Ende
};
```

**Änderungen im UI:**
- Tabs: `disabled={!canUnlockTabs}` (90%)
- "Abschließen" Button: `disabled={!canMarkComplete}` (100%)

---

### 4. Video ohne schwarze Ränder (wie YouTube)

**Datei:** `src/components/akademie/MultiSourceVideoPlayer.tsx`

**Problem:** Bei Portrait-Videos im Container mit fester Höhe entstehen schwarze Letterbox-Balken.

**YouTube-Lösung:** `object-fit: cover` statt `object-fit: contain` - Video füllt Container, Überlauf wird abgeschnitten.

Allerdings: Bei Bunny/YouTube iFrames haben wir keine direkte Kontrolle über das interne Video-Scaling. Bunny's `responsive=true` macht das teilweise, aber nicht perfekt.

**Mögliche Fixes:**

1. **CSS `object-fit: cover` auf iframe** - Funktioniert nicht direkt, da iframe kein object-fit unterstützt
2. **Container skalieren** - Höhe dynamisch an Video-Aspect-Ratio anpassen (erfordert Metadaten)
3. **`maxHeight` entfernen** - Video nimmt mehr Platz ein, aber füllt aus

**Pragmatischer Fix:** Die `maxHeight: 75vh` Limitierung entfernen und stattdessen das Video seinen natürlichen Platz einnehmen lassen. Für Portrait-Videos auf Mobile ist das natürlicher.

Außerdem: Die `minHeight` erhöhen und `overflow: hidden` auf den Container setzen.

```typescript
// Neue Styling-Logik
style={{ 
  height: heightMode === 'hero' 
    ? 'calc(100svh - var(--akademie-header-h, 60px) - var(--akademie-footer-h, 72px))' 
    : undefined,
  aspectRatio: heightMode === 'contained' ? '16/9' : undefined,
  // maxHeight entfernen für besseres Portrait-Verhalten
  minHeight: heightMode === 'hero' ? '300px' : undefined,
}}
```

**Bonus:** CSS-Klasse `object-cover` am Container kann helfen, aber für iFrames ist das begrenzt.

---

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/hooks/useVideoProgress.ts` | Timer runden, zwei-Phasen-Logik (canUnlockTabs + canMarkComplete), `isVideoEnded` Flag |
| `src/pages/AkademieModul.tsx` | Lock-Icon UX für gesperrte Tabs, Button-Logik mit 100% Check |
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | `maxHeight` entfernen für besseres Portrait-Video Verhalten |

---

## Technische Details

### Timer-Rundung
```typescript
// useBunnyPlayerProgress - Zeile 165-168
const remaining = Math.max(0, Math.round(requiredSeconds - watchedSeconds));
const mins = Math.floor(remaining / 60);
const secs = remaining % 60; // Bereits Integer nach round
const timeRemainingFormatted = `${mins}:${secs.toString().padStart(2, '0')} verbleibend`;
```

### Zwei-Phasen-Freischaltung
```typescript
// Neue State-Variable
const [isVideoEnded, setIsVideoEnded] = useState(false);

// In 'ended' Event Handler
player.on('ended', () => {
  setIsVideoEnded(true);
  setIsPlaying(false);
  setWatchedSeconds(requiredSeconds);
});

// Return-Werte
const canUnlockTabs = watchedSeconds >= requiredSeconds; // 90%
const canMarkComplete = isVideoEnded || watchedSeconds >= totalDurationSeconds; // 100%

return {
  canUnlockTabs,
  canMarkComplete,
  // ...
};
```

### UI-Logik
```tsx
// Tabs
<TabsTrigger value="inhalt" disabled={!canUnlockTabs}>
  ...
  {!canUnlockTabs && <Lock className="w-3 h-3 ml-1 opacity-50" />}
</TabsTrigger>

// Footer Button
{!canMarkComplete ? (
  <Button disabled>
    {!canUnlockTabs ? (
      <>{timeRemainingFormatted}</>
    ) : (
      <>Schaue das Video zu Ende</>
    )}
  </Button>
) : (
  <Button onClick={handleMarkComplete}>
    Als abgeschlossen markieren
  </Button>
)}
```

---

## Erwartetes Ergebnis

1. Timer zeigt sauber "7:10 verbleibend" ohne Dezimalstellen
2. Gesperrte Tabs zeigen Lock-Icon + "Lerninhalt gesperrt"
3. Nach 90%: Tabs werden freigeschaltet, Inhalte sichtbar
4. Nach 100%: "Abschließen" Button wird aktiv
5. Portrait-Videos füllen den Container besser aus ohne übermäßige schwarze Balken

