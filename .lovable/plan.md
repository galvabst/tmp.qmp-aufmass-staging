
## Unskippable Video + Content-Gating fuer Akademie

### Zusammenfassung

Die Akademie-Lektionen sollen ein "Unskippable Video"-System bekommen:
- Der **Abschliessen-Button** wird erst aktiv, nachdem 90% der Video-Dauer auf der Seite vergangen ist
- Die **Tabs "Lerninhalt" und "Zusammenfassung"** bleiben gesperrt, bis diese Zeit erreicht ist
- Ein **Progress-Indikator** zeigt an, wie viel Zeit noch bleibt

Da Bunny Stream und YouTube iFrames sind (cross-origin), koennen wir deren Playback nicht direkt tracken. Stattdessen nutzen wir einen **seitenbasierten Timer** basierend auf der in der Datenbank hinterlegten `dauerMinuten`.

---

### Technische Umsetzung

#### 1) Neuer Hook: `useIframeLessonProgress`

**Datei:** `src/hooks/useVideoProgress.ts` (Erweiterung)

```typescript
/**
 * Hook for iframe-based videos (Bunny/YouTube) where we can't track playback.
 * Uses a page-based timer with the lesson's stored duration.
 */
export function useIframeLessonProgress(
  videoDurationMinutes: number,
  options: { requiredWatchPercent?: number } = {}
): {
  canComplete: boolean;
  elapsedSeconds: number;
  requiredSeconds: number;
  percentComplete: number;
  timeRemainingFormatted: string;
} {
  const { requiredWatchPercent = 0.9 } = options;
  const [elapsed, setElapsed] = useState(0);
  
  const requiredSeconds = Math.round(videoDurationMinutes * 60 * requiredWatchPercent);
  const canComplete = elapsed >= requiredSeconds;
  const percentComplete = Math.min(100, Math.round((elapsed / requiredSeconds) * 100));
  
  // Format: "X:XX verbleibend"
  const remaining = Math.max(0, requiredSeconds - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeRemainingFormatted = `${mins}:${secs.toString().padStart(2, '0')} verbleibend`;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return { canComplete, elapsedSeconds: elapsed, requiredSeconds, percentComplete, timeRemainingFormatted };
}
```

**Warum so:**
- Nutzt die in der DB gespeicherte `dauerMinuten` (z.B. 8 Minuten)
- Berechnet 90% davon als erforderliche Zeit (7.2 Minuten = 432 Sekunden)
- Zaehlt hoch, solange die Seite offen ist
- Liefert formatierte Restzeit fuer UI-Anzeige

---

#### 2) AkademieModul.tsx - UI-Aenderungen

**Datei:** `src/pages/AkademieModul.tsx`

**A) Hook einbinden:**
```typescript
import { useIframeLessonProgress } from '@/hooks/useVideoProgress';

// Im Component:
const { 
  canComplete, 
  percentComplete, 
  timeRemainingFormatted 
} = useIframeLessonProgress(unterpunkt.dauerMinuten);
```

**B) Tabs sperren bis 90% erreicht:**
```tsx
<TabsTrigger 
  value="inhalt" 
  className="gap-1.5" 
  disabled={!canComplete}
>
  <BookOpen className="w-4 h-4" />
  <span className="hidden sm:inline">Lerninhalt</span>
  {!canComplete && <Lock className="w-3 h-3 ml-1 opacity-50" />}
</TabsTrigger>

<TabsTrigger 
  value="zusammenfassung" 
  className="gap-1.5" 
  disabled={!canComplete}
>
  <FileText className="w-4 h-4" />
  <span className="hidden sm:inline">Zusammenfassung</span>
  {!canComplete && <Lock className="w-3 h-3 ml-1 opacity-50" />}
</TabsTrigger>
```

**C) Footer mit Progress-Anzeige:**
```tsx
<footer ref={footerRef} className="sticky bottom-0 ...">
  <div className="max-w-3xl mx-auto">
    {!canComplete ? (
      <div className="space-y-2">
        {/* Progress Bar */}
        <Progress value={percentComplete} className="h-2" />
        
        {/* Disabled Button mit Restzeit */}
        <Button className="w-full h-12 text-base" disabled>
          <Clock className="w-5 h-5 mr-2 animate-pulse" />
          {timeRemainingFormatted}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Schaue das Video zu Ende, um fortzufahren
        </p>
      </div>
    ) : (
      <Button 
        className="w-full h-12 text-base"
        onClick={handleMarkComplete}
      >
        <Check className="w-5 h-5 mr-2" />
        Als abgeschlossen markieren
      </Button>
    )}
  </div>
</footer>
```

---

#### 3) Schwarze Balken (Letterboxing)

**Problem:** Die schwarzen Balken oben/unten kommen vom Bunny-Player selbst, weil das Video ein Seitenverhaeltnis hat (z.B. 16:9) und der Container nicht exakt passt.

**Realitaet:** Bei einem iFrame (cross-origin) koennen wir das interne Rendering nicht beeinflussen. Die Balken verschwinden nur, wenn:
1. Das Quellvideo exakt zum Container passt (Seitenverhaeltnis identisch)
2. Oder wir einen eigenen Player mit HLS-Stream bauen (grosser Aufwand)

**Was wir optimieren koennen:**
- Container-Hoehe so waehlen, dass sie moeglichst nah am 16:9-Verhaeltnis ist
- Fuer Hochformat (Portrait-Modus) ist Letterboxing bei Landscape-Videos unvermeidlich

**Vorschlag:** Statt heroischem Fullscreen-Modus auf Mobile einen **16:9-Container** nutzen, der die Balken minimiert:

```tsx
// In MultiSourceVideoPlayer - optionaler "portrait-safe" Modus
style={{ 
  aspectRatio: '16/9',
  maxHeight: heightMode === 'hero' ? '75vh' : undefined,
}}
```

Das bedeutet: Das Video behaelt immer 16:9, wird nie zu gross, und minimiert interne Letterboxing-Balken.

---

### Dateien die ich aendern werde

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useVideoProgress.ts` | Neuer Hook `useIframeLessonProgress` hinzufuegen |
| `src/pages/AkademieModul.tsx` | Hook einbinden, Tabs sperren, Footer mit Progress |
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | (Optional) Container-Strategie fuer weniger Letterboxing |

---

### Erwartetes Verhalten

1. User oeffnet Lektion mit 8-Minuten-Video
2. Timer startet, zaehlt Sekunden hoch
3. Tabs "Lerninhalt" und "Zusammenfassung" sind gesperrt (ausgegraut + Lock-Icon)
4. Footer zeigt Progress-Bar und "X:XX verbleibend"
5. Nach 90% der Zeit (7:12 bei 8 Min) wird alles entsperrt
6. User kann jetzt Tabs oeffnen und "Als abgeschlossen markieren" klicken

---

### Hinweis zu den schwarzen Balken

Die schwarzen Balken im Hochformat sind technisch nicht vollstaendig entfernbar, weil:
- Das Quellvideo ist Landscape (16:9)
- Im Hochformat (Portrait) muss das Video irgendwo "Platz lassen"
- Bunny-Player zeigt schwarze Balken fuer den leeren Bereich

**Loesungsoptionen (ausserhalb dieses Plans):**
1. Videos im 9:16 (Hochformat) produzieren - dann kein Letterboxing auf Handy
2. Video nur im Fullscreen (Landscape) abspielen lassen
3. Akzeptieren dass Landscape-Videos im Portrait Balken haben (wie bei YouTube)

Fuer diesen Plan fokussiere ich mich auf das Content-Gating (unskippable video logic), da das die Hauptanforderung ist.
