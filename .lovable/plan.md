

## Stepper-Dots klickbar machen + Vorwaerts-Button + Animation verlangsamen

### Aenderung 1: Pulsing-Animation verlangsamen

**Datei:** `src/components/onboarding/OnboardingStepWrapper.tsx`

Die Klasse `animate-pulse` (Standard: 2s) wird durch eine custom Animation ersetzt mit laengerer Dauer (4s), damit das Blinken subtiler und weniger aggressiv wirkt.

Statt `animate-pulse` wird `animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]` verwendet.

---

### Aenderung 2: Vorwaerts-Button im Header (neben Zurueck-Button)

**Datei:** `src/components/onboarding/OnboardingStepWrapper.tsx`

Ein ArrowRight-Button wird rechts neben dem Schritt-Text angezeigt, wenn der naechste Schritt bereits abgeschlossen ist ODER wenn der aktuelle Schritt abgeschlossen ist (also man sich zuruecknavigiert hat). Bedingung: Es gibt einen naechsten Schritt UND dieser oder der aktuelle Schritt ist in `completedSteps`.

**Datei:** `src/components/onboarding/OnboardingStepWrapper.tsx` - Neue Props noetig:
- `onForward?: () => void` - Callback fuer Vorwaerts-Navigation

**Datei:** `src/components/OnboardingScreen.tsx`:
- Neue Prop `onForward` an `OnboardingStepWrapper` uebergeben, die `goToNextStep()` aufruft (ohne die handleNext-Logik mit Validierung/Speichern, da der Schritt ja schon completed ist)

Layout im Header:
```text
+----------------------------------------------------+
| [<-]    Schritt 3 von 7    [->]   [Galvanek-Logo]  |
+----------------------------------------------------+
```

Der Vorwaerts-Button erscheint nur wenn:
- `currentStep` ist in `completedSteps` (man hat sich zuruecknavigiert)
- Es gibt einen naechsten Schritt

---

### Aenderung 3: Stepper-Dots klickbar machen

**Datei:** `src/components/onboarding/OnboardingStepWrapper.tsx`

Abgeschlossene Dots werden zu klickbaren Buttons. Klick navigiert direkt zu dem Schritt. Nur abgeschlossene Schritte und der aktuelle Schritt sind klickbar.

Neue Prop noetig:
- `onStepClick?: (stepId: OnboardingStepId) => void`

**Datei:** `src/components/OnboardingScreen.tsx`:
- `onStepClick={goToStep}` an Wrapper uebergeben

Die Dots bekommen `cursor-pointer` und ein `onClick` Handler fuer abgeschlossene Schritte.

---

### Zusammenfassung

| Datei | Aenderung |
|---|---|
| `src/components/onboarding/OnboardingStepWrapper.tsx` | Animation verlangsamen, Vorwaerts-Button, klickbare Dots, neue Props `onForward` und `onStepClick` |
| `src/components/OnboardingScreen.tsx` | `onForward` und `onStepClick` Props durchreichen |

