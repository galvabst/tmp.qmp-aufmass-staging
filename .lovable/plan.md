
# Bugfix: Onboarding-Complete wird fälschlich angezeigt

## Problem

Ein brandneuer User sieht sofort den "Onboarding abgeschlossen" Screen, obwohl die Datenbank zeigt:
- `onboarding_status: 'invited'`
- `trainer_freigabe: false`

**Ursache:** `localStorage` enthält alte Testdaten (`coachingAbgeschlossen: true`) von vorherigen Sessions. Diese werden beim Start geladen und triggern `isComplete = true`.

## Lösung

Die Komponente `OnboardingScreen.tsx` prüft aktuell nur den **lokalen** `isComplete`-Status. Sie muss stattdessen den **DB-Status** als Wahrheitsquelle nutzen.

### Änderung 1: OnboardingScreen.tsx

Übergebe den DB-Status an die Komponente und validiere gegen diesen:

```tsx
interface OnboardingScreenProps {
  onComplete: () => void;
  isPreview?: boolean;
  onExitPreview?: () => void;
  dbStatus?: {  // NEU
    onboardingStatus: string;
    trainerFreigabe: boolean;
  };
}

// In der Komponente:
// Nur "complete" anzeigen, wenn DB sagt "ready" + trainer_freigabe
// NICHT basierend auf localStorage!
const isDbReady = dbStatus?.onboardingStatus === 'ready' && dbStatus?.trainerFreigabe === true;

if (isComplete && isDbReady) {
  // Zeige Complete-Screen nur wenn BEIDES stimmt
  return <OnboardingComplete onContinue={onComplete} />;
} else if (isComplete && !isDbReady) {
  // localStorage sagt complete, DB sagt nein → "Warte auf Freigabe" Screen
  return <WaitingForApprovalScreen />;
}
```

### Änderung 2: Index.tsx

Übergebe den DB-Status an OnboardingScreen:

```tsx
<OnboardingScreen 
  isPreview={isPreviewMode}
  onExitPreview={() => { ... }}
  onComplete={() => { ... }}
  dbStatus={onboardingRecord ? {
    onboardingStatus: onboardingRecord.onboarding_status,
    trainerFreigabe: onboardingRecord.trainer_freigabe || false,
  } : undefined}
/>
```

### Änderung 3: Neuer "Warte auf Freigabe" Screen

Für User die alle Schritte abgeschlossen haben, aber noch auf Trainer-Freigabe warten:

```tsx
// src/components/onboarding/WaitingForApproval.tsx
export function WaitingForApproval() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Clock className="w-16 h-16 text-primary mb-6 animate-pulse" />
      <h1 className="text-2xl font-bold mb-4">Onboarding abgeschlossen!</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Du hast alle Schritte erfolgreich absolviert. 
        Bitte warte auf die Freigabe durch deinen Trainer.
      </p>
    </div>
  );
}
```

### Alternative: localStorage bei neuem User zurücksetzen

Eine zusätzliche Sicherheit wäre, den localStorage für einen User zu validieren:

```typescript
// In loadPersistedState():
// Wenn DB-Status "invited" ist, ignoriere localStorage "coachingAbgeschlossen"
if (dbStatus === 'invited' && parsed.coachingAbgeschlossen) {
  console.warn('[Onboarding] DB says invited but localStorage says complete - resetting');
  return createInitialOnboardingState(initialProfile);
}
```

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/OnboardingScreen.tsx` | DB-Status als Prop + Validierung |
| `src/pages/Index.tsx` | DB-Status an OnboardingScreen übergeben |
| `src/components/onboarding/WaitingForApproval.tsx` | NEU: "Warte auf Freigabe" Screen |

## Flussdiagramm

```text
User besucht /
       │
       ▼
┌──────────────────────────────────────────┐
│ Lade DB-Status (useContractorOnboarding) │
│ Lade localStorage (useOnboardingState)   │
└────────────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ DB: onboarding_status?     │
        └────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
   'ready'       'in_progress'   'invited'
   + freigabe         │              │
      │               │              │
      ▼               ▼              ▼
   Haupt-App    Onboarding-     Onboarding-
   zeigen       Schritte        Schritte
                     │              │
                     ▼              ▼
              localStorage     localStorage
              isComplete?      isComplete?
                     │              │
         ┌───────────┴───────────┐  │
         ▼                       ▼  ▼
      true                    false│
   (alle Schritte                  │
    lokal fertig)                  │
         │                         │
         ▼                         ▼
   "Warte auf              Normale
   Freigabe"               Onboarding-
   Screen                  Schritte
```

## Warum diese Lösung?

1. **DB bleibt Single Source of Truth** für den "einsatzbereit"-Status
2. **localStorage** behält den Fortschritt (für UX, falls User Seite schließt)
3. **Neuer Screen** erklärt dem User was passiert (Trainer muss freigeben)
4. **Kein Datenverlust** - User muss nicht von vorne anfangen

Soll ich mit der Implementierung beginnen?
