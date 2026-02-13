

## Intro-Video-URL zuruecksetzen

### Was passiert ist

Das Video `53ef2c6e-d174-4577-885a-1b94ce91df46` ("Begruessung und Vertrauen", Lektion 2-2) wurde faelschlicherweise als Intro-Video gesetzt. Es gehoert aber in die Akademie und war dort bereits korrekt hinterlegt.

### Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/components/onboarding/IntroVideo.tsx` | URL zuruecksetzen auf die vorherige: `a9021913-0c3c-4986-a32e-11ac216e5edf` |

```
Vorher (falsch):
INTRO_VIDEO_URL = '.../53ef2c6e-d174-4577-885a-1b94ce91df46'

Nachher (korrekt):
INTRO_VIDEO_URL = '.../a9021913-0c3c-4986-a32e-11ac216e5edf'
```

Das ist eine einzeilige Aenderung -- nur die URL-Konstante wird zurueckgesetzt.
