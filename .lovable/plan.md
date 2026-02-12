

# Fix: localStorage-Leak absichern und App publishen

## Problem

Die Datenbank ist korrekt (`onboarding_status: 'invited'`, alle Checks `false`). Der aktuelle Preview-Code wuerde das Onboarding korrekt anzeigen. Aber die **Published Version** auf `quick-measure-pro.lovable.app` hat aelteren Code, der das Onboarding-Gate nicht korrekt durchsetzt.

Zusaetzlich kann localStorage von einem vorherigen User-Login uebrig bleiben und den Onboarding-Fortschritt verfaelschen.

## Loesung

### 1. localStorage-Reset haerten (`OnboardingScreen.tsx`)

Die `isDefinitelyStale`-Bedingung erweitern: Wenn die DB `invited` meldet (kein Fortschritt), aber localStorage irgendeinen Fortschritt zeigt (currentStep nicht 'profil' oder completedSteps nicht leer), wird der localStorage sofort geloescht.

**Vorher (Zeile 87-89):**
```text
const isDefinitelyStale =
  parsed.coachingAbgeschlossen === true ||
  parsed.akademieTestBestanden === true;
```

**Nachher:**
```text
const isDefinitelyStale =
  parsed.coachingAbgeschlossen === true ||
  parsed.akademieTestBestanden === true ||
  (parsed.currentStep && parsed.currentStep !== 'profil') ||
  (Array.isArray(parsed.completedSteps) && parsed.completedSteps.length > 0);
```

### 2. App publishen

Nach der Aenderung muss die App neu published werden, damit `quick-measure-pro.lovable.app` den aktuellen Gate-Code bekommt.

## Technische Details

| Datei | Aenderung |
|---|---|
| `src/components/OnboardingScreen.tsx` | Zeilen 87-89: `isDefinitelyStale`-Bedingung um `currentStep` und `completedSteps`-Pruefung erweitern |

Nach dem Publish: Alle neuen User mit `onboarding_status: 'invited'` werden korrekt ins Onboarding geleitet, unabhaengig von eventuell vorhandenen localStorage-Daten eines vorherigen Users.

