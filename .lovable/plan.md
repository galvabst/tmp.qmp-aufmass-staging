
## Fix: "Onboarding abschliessen" Button funktioniert nicht

### Problem
Beim Klick auf "Onboarding abschliessen" im Nachweise-Schritt passiert nichts. Der Grund ist ein State-Bug:

1. `handleNext` auf dem Nachweise-Schritt ruft `setCoachingAbgeschlossen(true)` auf (Zeile 635)
2. Aber `nachweise` wird nie zu `completedSteps` im lokalen State hinzugefuegt
3. Die `isComplete`-Pruefung verlangt: `state.coachingAbgeschlossen && state.completedSteps.includes('nachweise')`
4. Da `nachweise` nie in `completedSteps` aufgenommen wird, bleibt `isComplete = false`
5. Die `saveProgress`-Funktion schreibt zwar alle 7 Schritte in die DB, aktualisiert aber nicht den lokalen React-State

### Loesung
In `OnboardingScreen.tsx`, Zeile 624-638: Vor dem `setCoachingAbgeschlossen(true)` den lokalen State aktualisieren, sodass alle 7 Schritte (inklusive `nachweise`) in `completedSteps` stehen.

### Technische Aenderung

**Datei: `src/components/OnboardingScreen.tsx`** (Zeile 624-638)

Aktuell:
```typescript
if (state.currentStep === 'nachweise') {
  const allSteps = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];
  try {
    await saveProgress({
      currentStep: 'nachweise',
      completedSteps: allSteps,
    });
  } catch (error) {
    console.warn('[Onboarding] Failed to save final progress:', error);
  }
  setCoachingAbgeschlossen(true); // triggers isComplete
  ...
}
```

Neu -- vor `setCoachingAbgeschlossen` noch alle fehlenden Schritte zum lokalen State hinzufuegen:
```typescript
if (state.currentStep === 'nachweise') {
  const allSteps: OnboardingStepId[] = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];
  try {
    await saveProgress({
      currentStep: 'nachweise',
      completedSteps: allSteps,
    });
  } catch (error) {
    console.warn('[Onboarding] Failed to save final progress:', error);
  }
  // Lokalen State aktualisieren: alle Schritte als completed markieren
  for (const step of allSteps) {
    if (!state.completedSteps.includes(step)) {
      goToNextStep(); // oder direkt setState nutzen
    }
  }
  setCoachingAbgeschlossen(true); // triggers isComplete
  ...
}
```

Alternativ (sauberer): Eine neue Funktion `setAllStepsCompleted` im `useOnboardingState` Hook hinzufuegen, die `completedSteps` direkt auf alle 7 Schritte setzt. Das ist zuverlaessiger als mehrere `goToNextStep`-Aufrufe.

**Datei: `src/hooks/useOnboardingState.ts`** -- Neue Hilfsfunktion:
```typescript
const setAllStepsCompleted = useCallback(() => {
  setState(prev => ({
    ...prev,
    completedSteps: [...STEP_ORDER],
  }));
}, []);
```

**Datei: `src/components/OnboardingScreen.tsx`** -- Dann im handleNext:
```typescript
if (state.currentStep === 'nachweise') {
  const allSteps = [...STEP_ORDER];
  try {
    await saveProgress({ currentStep: 'nachweise', completedSteps: allSteps });
  } catch (error) {
    console.warn('[Onboarding] Failed to save final progress:', error);
  }
  setAllStepsCompleted();          // lokalen State synchronisieren
  setCoachingAbgeschlossen(true);  // triggers isComplete
  nextClickLockRef.current = false;
  setIsAdvancing(false);
  return;
}
```

### Zusammenfassung
- Eine einzeilige Root-Cause: `nachweise` fehlt in `completedSteps` im lokalen State
- Fix: Neue Funktion `setAllStepsCompleted` im Hook + Aufruf vor `setCoachingAbgeschlossen`
- Keine DB- oder RLS-Aenderungen noetig
