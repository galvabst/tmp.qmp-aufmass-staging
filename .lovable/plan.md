

## Video-Player Layout Fix: Edge-to-Edge ohne Raender

### Problem-Analyse

Die Screenshots zeigen deutlich:
1. Das Video wird von grossen dunkelblauen Raendern umgeben
2. Der Video-Container hat zwar `bg-black`, aber der **iFrame von Bunny Stream** zeigt das Video zentriert mit eigenem Padding
3. Das Problem ist nicht unser CSS, sondern wie Bunny Stream den iFrame rendert

### Ursache

Die Bunny Stream Embed-URL `https://iframe.mediadelivery.net/play/591760/...` laeuft intern mit:
- Eigenem Dark Background (nicht vom iFrame-Container)
- Video zentriert innerhalb des iFrames (nicht stretched)
- Native Player-Controls die Platz brauchen

Unsere aktuelle Loesung mit `aspect-video` (16:9) passt nicht zum tatsaechlichen Video-Seitverhaeltnis.

### Loesung

#### A) Responsive Video Container mit Auto-Height

**Datei:** `src/components/akademie/MultiSourceVideoPlayer.tsx`

Statt fixes `aspect-video` nutzen wir einen responsiven Ansatz der dem Video mehr Platz gibt:

```tsx
// Fuer Bunny Stream: Container mit responsiver Hoehe
function BunnyStreamPlayer({ url }: { url: string }) {
  // Parameter hinzufuegen um schwarze Raender zu minimieren
  const enhancedUrl = url.includes('?') 
    ? `${url}&responsive=true&autoplay=false`
    : `${url}?responsive=true&autoplay=false`;
    
  return (
    <div className="relative w-full bg-black" style={{ 
      paddingBottom: '56.25%', // 16:9 Basis
      minHeight: '220px'
    }}>
      <iframe
        src={enhancedUrl}
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        style={{ 
          backgroundColor: 'black'
        }}
        title="Video Player"
      />
    </div>
  );
}
```

**Wichtig**: Bunny Stream unterstuetzt keine URL-Parameter zum Aendern des Aspect Ratios - das wird vom Stream selbst bestimmt.

#### B) Realistischer Ansatz: Der schwarze Rand ist unvermeidlich

Das eigentliche Problem ist, dass das gehostete Video (bei Bunny Stream) ein bestimmtes Seitverhaeltnis hat, und der Bunny-Player zeigt immer schwarze Balken wenn Container und Video nicht uebereinstimmen.

**Bessere Loesung**: Den schwarzen Hintergrund akzeptieren, aber den Container so anpassen, dass er sich dem Inhalt anpasst:

```tsx
function BunnyStreamPlayer({ url }: { url: string }) {
  return (
    // Volle Breite, natuerliches Aspect Ratio durch iFrame
    <div className="relative w-full overflow-hidden bg-black">
      {/* Padding-Trick fuer 16:9 Minimum */}
      <div style={{ paddingBottom: '56.25%' }} />
      <iframe
        src={url}
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        title="Video Player"
      />
    </div>
  );
}
```

#### C) Minimalistische Alternative: Viewport-basierte Hoehe

**Fuer Mobile**: Das Video nimmt eine feste Viewport-Hoehe ein (z.B. 50vh auf Mobile, 60vh auf Desktop):

```tsx
// Mobile-first: Viewport-basierte Hoehe
<div className="relative w-full h-[50vh] sm:h-[60vh] max-h-[600px] bg-black">
  <iframe ... className="absolute inset-0 w-full h-full" />
</div>
```

Dies stellt sicher, dass das Video immer eine vernuenftige Groesse hat, unabhaengig vom Geraet.

### Empfohlene Implementierung

**Option C (Viewport-basiert)** ist am zuverlaessigsten weil:
- Funktioniert auf allen Geraeten
- Video ist nie zu klein (50vh Minimum)
- Nie zu gross (max-h-[600px] Cap)
- Schwarze Balken sind minimal weil Container grosszuegiger ist

### Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | Container-Hoehe von `aspect-video` zu `h-[50vh] sm:h-[60vh] max-h-[600px]` aendern |
| `src/components/akademie/MultiSourceVideoPlayer.tsx` | Fullscreen-Attribut im allow-String hinzufuegen |
| `src/pages/AkademieModul.tsx` | Keine Aenderungen noetig (Video ist bereits edge-to-edge) |

### Erwartetes Ergebnis

- **Mobile**: Video nimmt 50% der Viewport-Hoehe, volle Breite
- **Desktop**: Video nimmt 60% der Viewport-Hoehe (max 600px), volle Breite
- **Schwarze Balken**: Minimiert durch grosszuegigeren Container
- **Fullscreen**: Nativer Bunny-Fullscreen-Button funktioniert

