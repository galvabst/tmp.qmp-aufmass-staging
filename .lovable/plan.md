

## Fix: Onboarding-State Reset nach Redirect verhindern

### Ursachenanalyse

Es gibt drei zusammenhaengende Bugs, die dazu fuehren, dass der User nach einem externen Redirect (z.B. Stripe-Checkout) zum Intro-Video zurueckgesetzt wird:

1. **Leere completedSteps-Hydration**: In `OnboardingScreen.tsx` (Zeilen 202-207) ist der Loop-Body, der die completedSteps aus der DB in den State schreiben soll, komplett leer. Die DB meldet `completed_steps: ["profil","dokumente",...]`, aber diese werden nie in den lokalen State uebernommen.

2. **Nicht-atomare Hydration**: Die DB-Werte werden ueber mehrere separate `setState`-Aufrufe gesetzt (`setGewerbescheinSpaeter`, `goToStep`, `setIntroVideoWatched`). Zwischen diesen Aufrufen befindet sich der Component in einem inkonsistenten Zwischenzustand.

3. **Kein Loading-Gate**: Der IntroVideo-Check (Zeile 381) feuert beim ersten Render BEVOR die DB-Daten geladen sind. Wenn localStorage leer oder veraltet ist, wird das Intro-Video angezeigt, obwohl die DB `intro_video_watched: true` hat.

### Loesung

#### 1. Atomare Hydration in `useOnboardingState.ts`

Neue Funktion `hydrateFromDb` hinzufuegen, die ALLE DB-Werte in einem einzigen `setState`-Aufruf setzt:

```typescript
const hydrateFromDb = useCallback((dbState: {
  gewerbescheinUrl?: string;
  gewerbescheinSpaeter?: boolean;
  currentStep?: OnboardingStepId;
  completedSteps?: OnboardingStepId[];
  equipmentStatus?: Record<string, EquipmentItemStatus>;
  akademieTestBestanden?: boolean;
  introVideoWatched?: boolean;
}) => {
  setState(prev => ({
    ...prev,
    gewerbescheinUrl: dbState.gewerbescheinUrl || prev.gewerbescheinUrl,
    gewerbescheinSpaeter: dbState.gewerbescheinSpaeter || prev.gewerbescheinSpaeter,
    currentStep: dbState.currentStep || prev.currentStep,
    completedSteps: dbState.completedSteps?.length
      ? dbState.completedSteps
      : prev.completedSteps,
    equipmentStatus: dbState.equipmentStatus
      ? { ...prev.equipmentStatus, ...dbState.equipmentStatus }
      : prev.equipmentStatus,
    akademieTestBestanden: dbState.akademieTestBestanden || prev.akademieTestBestanden,
    introVideoWatched: dbState.introVideoWatched || prev.introVideoWatched,
  }));
}, []);
```

#### 2. Hydration-Effect in `OnboardingScreen.tsx` vereinfachen

Den bestehenden Hydration-Effect (Zeilen 164-208) ersetzen durch einen einzigen Aufruf von `hydrateFromDb`:

```typescript
useEffect(() => {
  if (isPreview || hasHydratedOnboardingStateRef.current || !isOnboardingStateLoaded || !dbOnboardingState) return;
  hasHydratedOnboardingStateRef.current = true;

  hydrateFromDb({
    gewerbescheinUrl: dbOnboardingState.gewerbescheinUrl,
    gewerbescheinSpaeter: dbOnboardingState.gewerbescheinSpaeter,
    currentStep: dbOnboardingState.currentStep,
    completedSteps: dbOnboardingState.completedSteps,
    equipmentStatus: dbOnboardingState.equipmentStatus,
    akademieTestBestanden: dbOnboardingState.akademieTestBestanden,
    introVideoWatched: dbOnboardingState.introVideoWatched,
  });
}, [isPreview, isOnboardingStateLoaded, dbOnboardingState, hydrateFromDb]);
```

#### 3. Loading-Gate vor IntroVideo-Check

In `OnboardingScreen.tsx` einen Loading-Zustand einbauen, der wartet, bis die DB-Hydration abgeschlossen ist, BEVOR der IntroVideo-Check greift:

```typescript
// VOR dem IntroVideo-Check:
const isHydrationPending = !isPreview && !hasHydratedOnboardingStateRef.current && !isOnboardingStateLoaded;

if (isHydrationPending) {
  return <OnboardingLoadingScreen message="Lade Fortschritt..." />;
}

// DANN erst der IntroVideo-Check:
if (!state.introVideoWatched && !isPreview && !paymentRedirectRef.current) {
  // ...
}
```

### Betroffene Dateien

- **`src/hooks/useOnboardingState.ts`**: Neue `hydrateFromDb`-Funktion exportieren
- **`src/components/OnboardingScreen.tsx`**: Hydration-Effect vereinfachen, Loading-Gate einfuegen, leeren completedSteps-Loop entfernen

### Warum das den Gewerbeschein-Bug behebt

Der User hat `gewerbeschein_spaeter: true` in der DB, aber beim Redirect wird der State kurzzeitig ohne diesen Wert initialisiert. Durch die atomare Hydration wird `gewerbescheinSpaeter` zusammen mit `introVideoWatched`, `currentStep` und `completedSteps` in einem einzigen Schritt gesetzt -- es gibt keinen inkonsistenten Zwischenzustand mehr.

