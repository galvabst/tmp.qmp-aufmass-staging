

## Trainer-Coaching-Bypass: Trainer muessen keinen Coaching-Ride buchen

### Problem

Trainer (`is_trainer = true`) sind selbst die Coaches -- sie muessen keine Mitfahrt bei einem anderen Trainer buchen. Aktuell blockiert der Coaching-Schritt sie aber, weil `isStepComplete('coaching')` nur `true` liefert wenn `state.coachingAbgeschlossen === true`.

### Loesung

Gleicher Ansatz wie beim Akademie-Bypass: Eine einzelne Zeile in der `isStepComplete`-Logik.

### Aenderungen

| Datei | Aenderung |
|---|---|
| `src/hooks/useOnboardingState.ts` | `case 'coaching'`: `if (isTrainer) return true;` hinzufuegen (analog zu `isPreview`) |
| `src/components/OnboardingScreen.tsx` | Coaching-Step: Info-Banner fuer Trainer anzeigen ("Als Trainer ist die Mitfahrt fuer dich nicht erforderlich.") |
| `.lovable/validation-trainer-akademie-bypass.md` | Coaching-Bypass dokumentieren |

### Technisches Detail

In `useOnboardingState.ts`, Zeile 482-484 wird zu:

```text
case 'coaching':
  if (isPreview) return true;
  if (isTrainer) return true;    // <-- NEU
  return state.coachingAbgeschlossen;
```

In `OnboardingScreen.tsx` wird beim Rendern des `CoachingStep` ein Trainer-Banner eingefuegt, das signalisiert dass dieser Schritt optional ist. Der Trainer kann trotzdem die verfuegbaren Rides sehen, muss aber keinen buchen um fortzufahren.

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Trainer will trotzdem Ride buchen | Kann er, UI bleibt funktional |
| Trainer-Status wird entzogen | Coaching wird wieder Pflicht (naechster Page-Load) |
| Normaler Onboarder | Keine Aenderung |

