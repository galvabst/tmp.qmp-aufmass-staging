

# Bug-Analyse: Bestellungen-Schritt wird trotz fehlgeschlagener Zahlungen übersprungen

## Root Cause

**Datei:** `src/hooks/useOnboardingState.ts`, Zeile 514:

```typescript
const canProceed = state.completedSteps.includes(state.currentStep) || isStepComplete(state.currentStep);
```

Das Problem: `canProceed` hat **zwei Wege** um `true` zu werden:
1. `isStepComplete('bestellungen')` -- prüft korrekt, ob genug **paid** Produkte vorhanden sind
2. `state.completedSteps.includes('bestellungen')` -- **Bypass**: wenn der Schritt jemals als "completed" gespeichert wurde

### Was passiert:

1. Person startet Onboarding, gelangt zum Bestellungen-Schritt
2. Klickt "Weiter" (zu einem Zeitpunkt, als Zahlungen noch "pending" waren oder eine Race-Condition vorlag)
3. `handleNext()` speichert `'bestellungen'` in `completedSteps` in der DB (Zeile 668-681)
4. Später scheitern die Stripe-Zahlungen → Webhook setzt Status auf `"failed"`
5. `getPaidProductKeys()` gibt korrekt `[]` zurück → `bestellungenBestaetigt` ist leer
6. **ABER**: `completedSteps` enthält immer noch `'bestellungen'` → `canProceed = true`
7. Person kann alle weiteren Schritte durchlaufen, obwohl keine einzige Bestellung bezahlt ist

### Zweites Problem: `handleNext()` validiert nicht nochmal

In `handleNext()` (OnboardingScreen.tsx, Zeile 583ff) gibt es spezielle Checks für `profil` (Adresse), `dokumente` (Gewerbeschein) und `equipment` -- aber **keinen Re-Check für `bestellungen`**. Es wird einfach `goToNextStep()` aufgerufen.

## Lösung

### Änderung 1: `canProceed` -- kritische Schritte immer re-validieren

In `useOnboardingState.ts`, Zeile 514 ändern:

```typescript
// Schritte die immer re-validiert werden müssen (Daten können sich extern ändern)
const ALWAYS_REVALIDATE_STEPS: OnboardingStepId[] = ['bestellungen'];

const canProceed = ALWAYS_REVALIDATE_STEPS.includes(state.currentStep)
  ? isStepComplete(state.currentStep)
  : (state.completedSteps.includes(state.currentStep) || isStepComplete(state.currentStep));
```

Das stellt sicher, dass der "Weiter"-Button für `bestellungen` **immer** auf den tatsächlichen Zahlungsstatus prüft, egal was in `completedSteps` steht.

### Änderung 2: `handleNext()` -- Bestellungen-Gate

In `OnboardingScreen.tsx`, vor `goToNextStep()` (Zeile 664), einen expliziten Check einfügen:

```typescript
if (state.currentStep === 'bestellungen' && !isStepComplete('bestellungen')) {
  toast.error('Bitte schließe erst alle Bestellungen ab.');
  nextClickLockRef.current = false;
  setIsAdvancing(false);
  return;
}
```

### Änderung 3: `completedSteps` bereinigen wenn Zahlungen fehlschlagen

Im `useEffect` das `bestellungenBestaetigt` aus DB synct (OnboardingScreen.tsx, Zeile 286-299): Wenn die bezahlten Produkte unter dem Required-Count fallen, `'bestellungen'` aus `completedSteps` entfernen und DB updaten.

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/hooks/useOnboardingState.ts` | `canProceed` re-validiert Bestellungen immer |
| `src/components/OnboardingScreen.tsx` | Gate in `handleNext()` + completedSteps-Bereinigung |

