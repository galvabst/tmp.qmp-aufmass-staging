

## Onboarding Layout Redesign + Forward-Navigation Fix

### Problem 1: Navigation blockiert bei abgeschlossenen Schritten
Wenn man zu einem bereits abgeschlossenen Schritt zuruecknavigiert, ist der "Weiter"-Button deaktiviert, weil `canProceed` die Schritt-Validierung erneut prueft statt zu erkennen, dass der Schritt schon als completed markiert ist.

### Problem 2: Layout soll professioneller und ansprechender werden
Das aktuelle Layout ist funktional aber schlicht. Es fehlt das Galvanek-Logo und ein modernes, "sexy" Design.

---

### Loesung 1: Forward-Navigation fuer abgeschlossene Schritte

**Datei:** `src/hooks/useOnboardingState.ts`

Zeile 487 aendern: Wenn der aktuelle Schritt bereits in `completedSteps` enthalten ist, soll `canProceed` immer `true` sein:

```text
// ALT:
const canProceed = isStepComplete(state.currentStep);

// NEU:
const canProceed = state.completedSteps.includes(state.currentStep) || isStepComplete(state.currentStep);
```

So kann man nach dem Zuruecknavigieren sofort wieder vorwaerts gehen.

---

### Loesung 2: Layout-Redesign des OnboardingStepWrapper

**Datei:** `src/components/onboarding/OnboardingStepWrapper.tsx`

Aenderungen am Header-Bereich:

1. **Galvanek-Logo** oben rechts im Header einbinden (klein, `size="sm"`)
2. **Modernes Header-Design**: Gradient statt flachem Orange, abgerundete untere Ecken, subtiler Schatten
3. **Verbesserte Stepper-Dots**: Groesser, mit Haekchen-Icon fuer abgeschlossene Schritte, animierter aktiver Dot
4. **Schritt-Info besser strukturiert**: Zurueck-Button und Logo auf einer Zeile, Schritt-Info darunter
5. **Footer aufpolieren**: Dezenterer Fortschrittsbalken, besserer Button-Style mit Pfeil-Icon

Konkretes Design:

```text
Header-Aufbau:
+------------------------------------------+
| [<-]  Schritt 3 von 7    [Galvanek-Logo] |
|                                          |
| Bestellungen                             |
| Bestelle deine Pflichtausruestung        |
|                                          |
| [*] [*] [o] [ ] [ ] [ ] [ ]  (Dots)     |
+------------------------------------------+
```

- Header bekommt einen leichten Gradient: `bg-gradient-to-br from-primary to-primary/85`
- Untere Ecken abgerundet: `rounded-b-2xl`
- Stepper-Dots werden `h-2 w-2` statt `h-1 flex-1` (Punkte statt Balken)
- Abgeschlossene Dots bekommen ein Mini-Haekchen oder filled circle
- Aktueller Dot pulsiert dezent

Footer:
- Progress-Bar bekommt einen orange Gradient
- "Weiter"-Button mit ArrowRight Icon am Ende
- Leichter Schatten oben statt border-t

---

### Zusammenfassung der Aenderungen

| Datei | Aenderung |
|---|---|
| `src/hooks/useOnboardingState.ts` | `canProceed` prueft auch `completedSteps` |
| `src/components/onboarding/OnboardingStepWrapper.tsx` | Logo, Gradient-Header, bessere Stepper-Dots, polierter Footer |

