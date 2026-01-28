
# Fix: Onboarding-Vorschau zeigt sofort Complete-Screen

## Problem
Wenn du auf "Onboarding-Vorschau" klickst, wird sofort der "Du bist einsatzbereit!" Screen angezeigt, anstatt das Onboarding von Anfang an zu starten.

## Ursache
Der `useState` Hook in `useOnboardingState.ts` wird mit einer Initializer-Funktion aufgerufen:

```typescript
const [state, setState] = useState<OnboardingState>(() => 
  isPreview 
    ? createInitialOnboardingState(initialProfile)
    : loadPersistedState(initialProfile)
);
```

**Problem**: React führt den Initializer nur beim **ersten Mount** der Komponente aus. Wenn sich `isPreview` von `false` auf `true` ändert, bleibt der alte State (aus localStorage) erhalten.

Da im localStorage `coachingAbgeschlossen: true` steht (weil du das Onboarding bereits abgeschlossen hast), wird `isComplete = true` und der Complete-Screen erscheint.

## Lösung
Wir fügen einen `useEffect` hinzu, der den State zurücksetzt wenn `isPreview` auf `true` wechselt:

```text
┌─────────────────────────────────────────────────────────┐
│             useOnboardingState.ts                       │
├─────────────────────────────────────────────────────────┤
│  useEffect(() => {                                      │
│    if (isPreview) {                                     │
│      setState(createInitialOnboardingState(profile));   │
│    }                                                    │
│  }, [isPreview]);                                       │
└─────────────────────────────────────────────────────────┘
```

## Änderungen

### Datei: `src/hooks/useOnboardingState.ts`

**Neue useEffect hinzufügen** (nach Zeile 49):

```typescript
// Reset state when entering preview mode
useEffect(() => {
  if (isPreview) {
    setState(createInitialOnboardingState(initialProfile));
  }
}, [isPreview, initialProfile]);
```

Dies stellt sicher, dass:
1. Beim Wechsel in den Preview-Modus der State auf den Anfang zurückgesetzt wird
2. Der echte State im localStorage unberührt bleibt
3. Du das Onboarding von Step 1 aus durchklicken kannst

## Zusammenfassung der Änderung

| Datei | Änderung |
|-------|----------|
| `src/hooks/useOnboardingState.ts` | Neuer `useEffect` zum Reset bei Preview-Wechsel |

## Technische Details

Der Hook erhält einen zusätzlichen Effect:

```typescript
// Existing persist effect (lines 42-49)
useEffect(() => {
  if (isPreview) return;
  // ... persist to localStorage
}, [state, isPreview]);

// NEW: Reset state when entering preview mode
useEffect(() => {
  if (isPreview) {
    setState(createInitialOnboardingState(initialProfile));
  }
}, [isPreview, initialProfile]);
```

Nach dieser Änderung wird beim Klick auf "Onboarding-Vorschau" der State auf den Anfang zurückgesetzt und du siehst Step 1 (Profil prüfen) statt des Complete-Screens.
