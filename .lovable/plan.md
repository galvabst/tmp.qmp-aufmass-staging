

# Plan: "Zurück zur App"-Button für Trainer im Onboarding

## Problem

Dein DB-Status ist `onboarding_status: "in_progress"` mit `is_trainer: true`. Da `isReady` nur bei `onboarding_status === 'ready'` greift, landest du im Onboarding und kommst nicht raus. Als Trainer solltest du das Onboarding jederzeit verlassen können.

## Lösung

### 1. Index.tsx: Trainer-Bypass in `isDbReady`-Logik

Trainer (`is_trainer: true`) sollen immer Zugang zur App haben, unabhängig vom `onboarding_status`. Die Bedingung auf Zeile 334 wird erweitert:

```
// Vorher:
if (!isDbReady || isPreviewMode) → zeige OnboardingScreen

// Nachher:
const isTrainerBypass = onboardingRecord?.is_trainer === true;
if ((!isDbReady && !isTrainerBypass) || isPreviewMode) → zeige OnboardingScreen
```

Das bedeutet: Trainer werden nie ins Onboarding gezwungen. Sie können es aber weiterhin freiwillig über die Profil-Vorschau starten.

### 2. OnboardingScreen: "Zurück zur App"-Banner für Trainer

Falls ein Trainer trotzdem im Onboarding landet (z.B. via Vorschau-Button im Profil), wird ein permanenter Banner oben angezeigt:

- Grüner Banner: "Du bist als Trainer freigeschaltet"
- Button: "Zur App →" der `onComplete()` aufruft
- Sichtbar wenn `dbStatus?.isTrainer === true` und `!isPreview`

### Betroffene Dateien
- `src/pages/Index.tsx` — Trainer-Bypass bei `isDbReady`-Check (1 Zeile)
- `src/components/OnboardingScreen.tsx` — Trainer-Exit-Banner im OnboardingStepWrapper-Bereich

## Ergebnis
- Trainer kommen nie ungewollt ins Onboarding
- Trainer können das Onboarding jederzeit freiwillig besuchen (Vorschau im Profil)
- Keine DB-Migration nötig

