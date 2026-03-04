

# Plan: Onboarding-Exit-Button für bereits abgeschlossene User

## Problem

Du landest im Onboarding, obwohl du es schon abgeschlossen hast. Das passiert, weil `isReady` in `useContractorOnboardingStatus` **alle 4 Flags** prüft:
- `onboarding_status = 'ready'`
- `trainer_freigabe = true`
- `vertrag_geprueft_intern = true`
- `kleidung_bestellt_intern = true`
- `lizenzen_bereitgestellt_intern = true`

Wenn eines dieser internen Admin-Flags fehlt, wirst du zurück ins Onboarding geschickt — auch wenn du alles fertig hast.

## Lösung

### 1. "Überspringen"-Button im OnboardingScreen

Wenn der DB-Status `onboarding_status = 'ready'` ist (also alle 7 Steps completed + Trigger hat fired), aber die internen Admin-Flags noch fehlen, zeige einen **"Zum Pool →"**-Button oben im OnboardingScreen. Das betrifft den Fall, dass der User fertig ist aber auf interne Freigabe wartet.

### 2. Alternativ: `isReady`-Logik lockern

Aktuell blockiert die fehlende interne Freigabe den Zugang zum Pool komplett. Stattdessen:
- `isReady = onboarding_status === 'ready'` (ohne interne Flags)
- Die internen Flags sind Admin-seitig und sollten den Techniker nicht blockieren

Das ist die sauberere Lösung — der Techniker soll arbeiten können, sobald sein Onboarding-Status `ready` ist.

## Betroffene Dateien

- `src/hooks/useContractorOnboardingStatus.ts` — `isReady` Logik vereinfachen: nur `onboarding_status === 'ready'` prüfen (interne Flags sind für Admin-Tracking, nicht für User-Blocking)
- `src/components/OnboardingScreen.tsx` — Fallback: "Überspringen"-Button wenn `dbStatus.onboardingStatus === 'ready'`

## Empfehlung

Option 2 (isReady lockern) ist besser — die internen Admin-Flags (`vertrag_geprueft`, `kleidung_bestellt`, `lizenzen_bereitgestellt`) sind Backoffice-Checks und sollten den Techniker nicht am Arbeiten hindern, wenn der DB-Trigger bereits `ready` gesetzt hat.

