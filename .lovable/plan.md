
# Fix: IntroVideo Layout und Darstellung

## Probleme (aus dem Screenshot)

1. **Video zeigt Login-Seite** statt den eigentlichen Videoinhalt -- das Bunny Stream iframe laedt die App-URL statt das Video. Wahrscheinlich ein iframe-Embedding-Problem, das sich durch korrekte URL-Normalisierung (`/embed/` statt `/play/`) loesen laesst.
2. **Logo zu klein und links** statt zentriert
3. **Video-Container zu klein** -- zu viel schwarzer Leerraum oben und unten
4. **Progress-Bar** hat den orangenen Punkt ganz links, der Progress-Indikator ist kaum sichtbar auf dem schwarzen Hintergrund

## Aenderungen

### `src/components/onboarding/IntroVideo.tsx`

**Layout-Verbesserungen:**
- Logo groesser machen (`size="lg"` statt `"md"`) und sicherstellen, dass es zentriert ist
- Video-Container vergroessern: weniger Padding, `max-w-4xl` statt `max-w-3xl`
- Einen Titel/Ueberschrift unter dem Logo: "Willkommen bei Galvanek" o.ae.
- Progress-Bar Styling verbessern: den Indicator in der Brand-Farbe (Orange) und den Track sichtbarer machen (`bg-white/20`)
- Button im disabled-Zustand deutlicher stylen (opacity, Cursor)
- Gesamtlayout optimieren: Logo-Bereich kompakter, mehr Platz fuer das Video

**Video-URL Fix:**
- Sicherstellen, dass die URL korrekt als `/embed/` (nicht `/play/`) an den Player geht -- die `normalizeBunnyUrl`-Funktion in `MultiSourceVideoPlayer.tsx` macht das bereits, aber pruefen ob das iframe korrekt geladen wird

### Technische Details

| Datei | Aenderung |
|---|---|
| `src/components/onboarding/IntroVideo.tsx` | Logo groesser, Video-Container breiter, besseres Spacing, Progress-Bar Styling, Willkommens-Text |
