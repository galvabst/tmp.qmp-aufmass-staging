
# Problem: "Onboarding abgeschlossen" wird angezeigt, obwohl nichts gemacht wurde

## Was passiert (Root Cause)

Du siehst "Onboarding abgeschlossen! Du hast alle Schritte erfolgreich absolviert" obwohl:
- Die Datenbank zeigt: `onboarding_status = 'invited'`, `onboarding_substatus = 'neu_angelegt'`
- Es gibt keinen echten Fortschritt (keine Adresse, keine Lektionen abgeschlossen, keine Bestellungen)

### Ursache: localStorage vs. Datenbank-Konflikt

Der Onboarding-Fortschritt wird aktuell **nur in localStorage** gespeichert (`thermocheck_onboarding_state_v2`).

Die Logik prüft:
```
isComplete = completedSteps.length === 7 || coachingAbgeschlossen === true
```

Wenn dein Browser **alte localStorage-Daten** von einem früheren Test enthält (wo `coachingAbgeschlossen: true`), zeigt die App "Onboarding abgeschlossen" – obwohl die DB sagt "neu_angelegt".

**Das ist ein fundamentales Architektur-Problem**: LocalStorage und DB sind nicht synchron.

---

## Lösung: DB als Single Source of Truth für Fortschritt

### Schritt 1: DB-basierte Fortschrittsvalidierung

Die `OnboardingScreen`-Komponente muss den DB-Status prüfen, bevor sie "complete" zeigt:

```text
WENN DB sagt "invited" oder "neu_angelegt"
  → zeige IMMER das Onboarding-Wizard (nicht WaitingForApproval)

WENN DB sagt "in_progress" oder "academy_complete"  
  → localStorage erlaubt
  → aber prüfe, ob coachingAbgeschlossen WIRKLICH ist

WENN DB sagt "ready" + kein trainer_freigabe
  → zeige WaitingForApproval

WENN DB sagt "ready" + trainer_freigabe = true
  → zeige OnboardingComplete (Zugang zur App)
```

### Schritt 2: localStorage beim ersten Login leeren

Wenn DB sagt `onboarding_status = 'invited'` (frischer User), aber localStorage enthält Fortschritt → localStorage löschen und neu starten.

### Schritt 3: Fortschritt in DB speichern (nicht nur localStorage)

Langfristig: Jeder Onboarding-Schritt soll in die DB geschrieben werden:
- `contractor_akademie_lektions_fortschritt` (bereits vorhanden)
- `contractor_bestellungen` (bereits vorhanden)
- `contractor_onboarding.onboarding_substatus` updaten bei Fortschritt

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/OnboardingScreen.tsx` | `isComplete`-Logik mit DB-Status verknüpfen |
| `src/hooks/useOnboardingState.ts` | localStorage löschen wenn DB = "invited" |
| `src/pages/Index.tsx` | dbStatus an OnboardingScreen durchreichen (bereits teilweise implementiert) |

---

## Konkrete Code-Änderungen

### 1. OnboardingScreen.tsx: DB-Status als Veto

```typescript
// Zeile 109: isComplete-Check erweitern
if (isComplete) {
  // NEUER CHECK: DB muss MINDESTENS "in_progress" sein
  // Wenn DB noch "invited"/"neu_angelegt" sagt, ist localStorage falsch
  const dbShowsNoProgress = dbStatus?.onboardingStatus === 'invited';
  
  if (dbShowsNoProgress) {
    // LocalStorage lügt - User hat noch nichts gemacht
    // → zeige Wizard, nicht Complete-Screen
    // (optional: localStorage reset)
    console.warn('[Onboarding] localStorage says complete but DB says invited - resetting');
    // ... weiter mit Wizard
  } else if (isDbReady) {
    return <OnboardingComplete onContinue={onComplete} />;
  } else {
    return <WaitingForApproval />;
  }
}
```

### 2. useOnboardingState.ts: Frisch-User-Reset

Wenn DB sagt "invited", aber localStorage hat Fortschritt → localStorage löschen:

```typescript
// Neue Funktion exportieren
export function clearOnboardingLocalStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// In OnboardingScreen: wenn dbStatus = invited UND localStorage hat Daten
// → clearOnboardingLocalStorage() aufrufen und State neu initialisieren
```

### 3. Index.tsx: dbStatus durchreichen (bereits implementiert ✓)

Zeile 267-270 gibt bereits `dbStatus` an `OnboardingScreen` weiter – das ist korrekt.

---

## Testplan

1. **localStorage leeren** (DevTools → Application → Clear Storage)
2. Mit Testuser einloggen (loloy47164@azeriom.com)
3. Erwartung: **Wizard startet bei Schritt 1 (Profil)**
4. Nicht mehr "Onboarding abgeschlossen"

5. Schritte durchlaufen, prüfen ob DB-Status sich aktualisiert
6. Nach Coaching: `WaitingForApproval` zeigen (weil `trainer_freigabe = false`)
7. Admin gibt Freigabe → `OnboardingComplete` zeigen → Zugang zu Pool

---

## Hinweis für sofortigen Quick-Fix

Du kannst als **Workaround** jetzt manuell im Browser die localStorage leeren:
1. F12 → Application → Local Storage → quick-measure-pro.lovable.app
2. `thermocheck_onboarding_state_v2` löschen
3. Seite neu laden

Dann sollte der Wizard bei Schritt 1 starten.

Aber die richtige Lösung ist der obige Plan, damit das für jeden neuen User automatisch funktioniert.
