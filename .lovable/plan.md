

# Fix: Onboarding-Profildaten aus DB laden und validieren

## Analyse des Problems

### Root Cause 1: Race Condition bei State-Initialisierung
Der `useOnboardingState` Hook wird mit `initialProfile` initialisiert, bevor die DB-Daten geladen sind:

```text
Zeitablauf:
1. OnboardingScreen rendert → dbProfile = null (loading)
2. useOnboardingState(EMPTY_PROFILE) → State mit leeren Feldern
3. useContractorProfile lädt → dbProfile = {vorname: "Anton", ...}
4. ABER: State bleibt leer (keine Re-Initialisierung!)
5. User klickt "Weiter" → leere Daten werden in DB geschrieben
```

### Root Cause 2: Fehlende Validierung
- Es gibt keine Pflichtfeld-Validierung für die Adresse
- `canProceed` prüft nur Avatar und Name, nicht Adresse

---

## Lösung

### 1. DB-Profildaten in den State synchronisieren

Wenn `dbProfile` verfügbar wird (nach dem Laden), muss der lokale State aktualisiert werden:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ OnboardingScreen                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. useContractorProfile lädt dbProfile                                      │
│ 2. useEffect erkennt: dbProfile geladen + state.profil ist leer/EMPTY       │
│ 3. → updateProfile(dbProfile) wird aufgerufen                               │
│ 4. State enthält jetzt DB-Daten                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Adress-Validierung beim Profil-Schritt

Die `isStepComplete('profil')` Funktion muss erweitert werden:

```text
Aktuelle Prüfung (unzureichend):
- vorname ✓
- nachname ✓
- email ✓
- avatarUrl ✓

Neue Prüfung (vollständig):
- vorname ✓
- nachname ✓
- email ✓
- avatarUrl ✓
- strasse ✓      ← NEU
- hausnummer ✓   ← NEU
- plz ✓          ← NEU
- ort ✓          ← NEU
```

### 3. Speichern nur wenn Daten vorhanden

Vor dem `saveProfileToDb` muss geprüft werden, ob die Adresse ausgefüllt ist:

```text
handleNext() in OnboardingScreen:
  IF currentStep === 'profil'
    IF profil.strasse leer ODER profil.plz leer ODER profil.ort leer
      → toast.error("Bitte Adresse ausfüllen")
      → return (nicht weiter)
    ELSE
      → saveProfileToDb(state.profil)
```

---

## Technische Änderungen

### Datei 1: `src/components/OnboardingScreen.tsx`

**Änderung A: useEffect für DB-zu-State Sync**

Neuer useEffect nach dem `useContractorProfile` Hook:

```typescript
// Sync DB-Profil in State wenn geladen und State noch leer
useEffect(() => {
  if (!profileLoading && dbProfile && state.profil.id === '') {
    console.log('[Onboarding] Hydrating profile from DB:', dbProfile);
    updateProfile(dbProfile);
  }
}, [profileLoading, dbProfile, state.profil.id, updateProfile]);
```

**Änderung B: handleNext mit Validierung**

```typescript
const handleNext = async () => {
  // Bei Profil-Schritt: Validierung + DB speichern
  if (state.currentStep === 'profil') {
    // Validiere Pflichtfelder
    if (!state.profil.strasse?.trim() || !state.profil.plz?.trim() || !state.profil.ort?.trim()) {
      toast.error('Bitte fülle deine vollständige Adresse aus');
      return;
    }
    
    try {
      await saveProfileToDb(state.profil);
      toast.success('Profildaten gespeichert');
    } catch (error) {
      console.error('[Onboarding] Failed to save profile:', error);
      toast.error('Fehler beim Speichern der Profildaten');
      return;
    }
  }
  
  // ... rest der Logik
};
```

### Datei 2: `src/hooks/useOnboardingState.ts`

**Änderung: isStepComplete erweitern**

```typescript
case 'profil':
  if (isPreview) return true;
  return !!(
    state.profil.vorname?.trim() &&
    state.profil.nachname?.trim() &&
    state.profil.email?.trim() &&
    state.profil.avatarUrl &&
    // NEU: Adresse ist auch Pflicht
    state.profil.strasse?.trim() &&
    state.profil.plz?.trim() &&
    state.profil.ort?.trim()
  );
```

---

## Datenfluss nach Fix

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ BEIM LADEN                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. OnboardingScreen rendert                                                 │
│ 2. useContractorProfile startet Query                                       │
│ 3. useOnboardingState erstellt State mit EMPTY_PROFILE                      │
│ 4. dbProfile wird geladen (async)                                           │
│ 5. useEffect erkennt: dbProfile da + state.profil.id leer                   │
│ 6. → updateProfile(dbProfile) → State hat jetzt DB-Daten                    │
│ 7. ProfileStep zeigt vorausgefüllte Felder (Name, Adresse aus DB)           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ BEIM SPEICHERN                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. User klickt "Weiter zu Dokumente"                                        │
│ 2. handleNext prüft: Adresse vollständig?                                   │
│    - JA → saveProfileToDb() → weiter zum nächsten Schritt                   │
│    - NEIN → toast.error() → bleibt auf Profil-Schritt                       │
│ 3. Keine leeren Werte werden in DB geschrieben                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/OnboardingScreen.tsx` | useEffect für DB-Sync, handleNext mit Validierung |
| `src/hooks/useOnboardingState.ts` | isStepComplete erweitert um Adress-Felder |

---

## Edge Cases

1. **User ist Erstteilnehmer (keine Adresse in DB)**
   - dbProfile.strasse etc. ist leer
   - User muss Adresse manuell eingeben
   - Validierung verhindert leere Speicherung

2. **Page Refresh während Eingabe**
   - localStorage hat die aktuellen Eingaben
   - DB hat die zuletzt gespeicherten Daten
   - useEffect prüft `state.profil.id === ''` → verhindert Überschreiben von localStorage mit DB

3. **DB-Daten überschreiben User-Eingaben?**
   - Nein, weil useEffect nur triggert wenn `state.profil.id === ''`
   - Wenn User schon Daten eingegeben hat, bleibt der State erhalten

---

## Testplan

1. **Neuer User ohne Adresse**
   - Öffne Onboarding
   - Felder sollten aus DB vorausgefüllt sein (Name, Email)
   - Adresse leer
   - "Weiter" ohne Adresse → Fehlermeldung
   - Adresse eingeben → "Weiter" → Speichert in DB

2. **Bestehender User mit Adresse**
   - Öffne Onboarding
   - Alle Felder vorausgefüllt (inkl. Adresse aus DB)
   - Änderung möglich
   - "Weiter" → Speichert Änderungen in DB

3. **Page Refresh**
   - Adresse eingeben (nicht speichern)
   - Page Refresh
   - Adresse sollte entweder aus localStorage oder DB wieder da sein

