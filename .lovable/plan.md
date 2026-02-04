
## Akademie Video-Player Layout-Optimierung

### Aktuelle Probleme (aus den Screenshots)

1. **Desktop (Laptop)**: Das Video ist auf `max-w-3xl` (768px) begrenzt und hat deshalb viel leeren Rand links/rechts. Das Video sollte die volle verfuegbare Breite nutzen.

2. **Mobile**: Das Video wird ebenfalls durch den Container eingeschraenkt und wirkt zu klein. Auf Mobilgeraeten sollte das Video die volle Bildschirmbreite einnehmen (edge-to-edge).

3. **Fullscreen-Zugang**: Die iFrame-Player (Bunny Stream, YouTube) unterstuetzen Fullscreen nativ, aber der Zugang ist nicht offensichtlich (versteckt in Player-Controls). Ein visueller Hinweis oder Button fehlt.

---

### Geplante Aenderungen

#### A) AkademieModul.tsx - Video-Container anpassen

**Ziel**: Video edge-to-edge auf allen Geraten, Content darunter weiterhin lesbar begrenzt.

Aktuelle Struktur:
```tsx
<main className="flex-1 flex flex-col">
  <div className="w-full max-w-3xl mx-auto">
    <MultiSourceVideoPlayer ... />
    <div className="p-4">
      {/* Tabs/Content */}
    </div>
  </div>
</main>
```

Neue Struktur:
```tsx
<main className="flex-1 flex flex-col">
  {/* Video AUSSERHALB des max-w Containers = volle Breite */}
  <MultiSourceVideoPlayer ... />
  
  {/* Content MIT max-w fuer Lesbarkeit */}
  <div className="w-full max-w-3xl mx-auto">
    <div className="p-4">
      {/* Tabs/Content */}
    </div>
  </div>
</main>
```

Das Video nimmt jetzt immer 100% der Viewport-Breite ein.

---

#### B) MultiSourceVideoPlayer.tsx - Responsives Aspect Ratio

**Problem**: `aspect-video` (16:9) auf kleinen Bildschirmen kann zu einer sehr kleinen Videohoehe fuehren.

**Loesung**: Mindesthoehe auf Mobile setzen, damit das Video nicht zu klein wird.

```tsx
// Vorher
<div className="relative w-full aspect-video bg-black">

// Nachher
<div className="relative w-full aspect-video bg-black min-h-[200px] sm:min-h-[300px]">
```

---

#### C) MultiSourceVideoPlayer.tsx - Fullscreen-Hinweis fuer Mobile

Da Bunny/YouTube-iFrames native Fullscreen-Controls haben, aber diese nicht immer offensichtlich sind, fuegen wir einen kleinen visuellen Hinweis hinzu:

```tsx
// Nach dem Player, optional sichtbar
<p className="text-xs text-center text-muted-foreground py-1 sm:hidden">
  Tippe auf das Video fuer Vollbild
</p>
```

Alternativ: Ein Overlay mit Fullscreen-Icon beim ersten Anzeigen, das nach dem ersten Play verschwindet.

---

### Technische Details

| Aenderung | Datei | Zeilen (ca.) |
|-----------|-------|--------------|
| Video aus Container nehmen | `src/pages/AkademieModul.tsx` | ~168-170 |
| Min-Height hinzufuegen | `src/components/akademie/MultiSourceVideoPlayer.tsx` | 55, 73, 91 |
| Fullscreen-Hinweis (optional) | `src/components/akademie/MultiSourceVideoPlayer.tsx` | Nach Player-Return |

---

### Ergebnis nach Implementation

- **Desktop**: Video nutzt volle Bildschirmbreite (kein seitlicher Weissraum mehr)
- **Mobile**: Video edge-to-edge mit Mindesthoehe, damit es nicht zu klein erscheint
- **Tabs/Content**: Bleiben auf `max-w-3xl` begrenzt fuer optimale Lesbarkeit
- **Fullscreen**: Native Browser-Fullscreen-Option bleibt erhalten (Doppeltipp/Controls)

---

### Risiken / Bedenken

- Bunny Stream iFrames sind bereits responsive (`w-full h-full` innerhalb eines `aspect-video` Containers). Die Aenderung sollte keine Breaking Changes verursachen.
- Falls das Video zu gross wird auf sehr breiten Bildschirmen (4K), koennte man optional eine `max-w-6xl` oder `max-w-7xl` Begrenzung nur fuer das Video einfuehren - aber aktuell ist edge-to-edge gewuenscht.
