
## Unskippable Outro-Video zwischen Akademie und Coaching

### Problem
Beim Klick auf "Weiter zu Coaching" wird direkt zum naechsten Schritt gewechselt. Es gibt keinen Code, der ein Video dazwischen einblendet.

### Loesung
Ein fullscreen Outro-Video (gleiche Mechanik wie das Intro-Video) wird eingeblendet, wenn der User den Akademie-Schritt abschliesst und zu Coaching wechseln will. Erst nach vollstaendigem Ansehen darf weiternavigiert werden.

### Video-URL
`https://iframe.mediadelivery.net/embed/591760/37bee5ad-1e93-454a-b48a-e10dd0b90e38`

### Technische Umsetzung

| Datei | Aenderung |
|---|---|
| `src/components/onboarding/OutroVideo.tsx` | Neue Komponente (Kopie von IntroVideo, angepasst fuer Outro-Kontext) |
| `src/components/OnboardingScreen.tsx` | State `showOutroVideo` + Gate in `handleNext` bei `currentStep === 'akademie'` |

### Ablauf

1. User klickt "Weiter zu Coaching" im Akademie-Schritt
2. Statt `goToNextStep()` wird `showOutroVideo = true` gesetzt
3. Fullscreen-Video erscheint (unskippable, gleiche Seekbar-Blockade wie IntroVideo)
4. Nach Video-Ende: Button "Weiter zum Coaching" wird aktiv
5. Klick: `showOutroVideo = false`, `goToNextStep()` wird ausgefuehrt, Fortschritt wird gespeichert

### OutroVideo Komponente

- Wiederverwendet `MultiSourceVideoPlayer` mit `hideSeekbar={true}`
- Wiederverwendet `useBunnyPlayerProgress` fuer Fortschrittsanzeige
- Titel: "Praxis-Phase abgeschlossen!" oder aehnlich
- Button-Text: "Weiter zum Coaching"
- Kein Logo noetig, aber schwarzer Fullscreen-Hintergrund wie IntroVideo

### Aenderungen in OnboardingScreen.tsx

```text
// Neuer State
const [showOutroVideo, setShowOutroVideo] = useState(false);

// In handleNext, VOR goToNextStep():
if (state.currentStep === 'akademie') {
  setShowOutroVideo(true);
  nextClickLockRef.current = false;
  setIsAdvancing(false);
  return; // Blockiert Navigation bis Video fertig
}

// Outro-Video Gate (vor renderStep)
if (showOutroVideo) {
  return <OutroVideo onComplete={() => {
    setShowOutroVideo(false);
    goToNextStep();
    // saveProgress...
  }} />;
}
```

Der Outro-Video-Status muss NICHT in der DB persistiert werden, da er nur einmalig beim Uebergang relevant ist. Beim naechsten Laden ist der User bereits auf dem Coaching-Schritt.
