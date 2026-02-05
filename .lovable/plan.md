
# Fix: DB-Profil-Hydration bei vorhandenem localStorage-State

## Analyse des Problems

### Aktuelle fehlerhafte Logik

Die Bedingung `state.profil.id === ''` im `useEffect` triggert nur, wenn der State komplett leer ist:

```text
Szenario:
1. User war schon im Onboarding → localStorage hat State mit profil.id
2. Page Refresh
3. loadPersistedState lädt localStorage → profil.id ist NICHT leer
4. dbProfile wird geladen mit avatarUrl aus DB
5. useEffect prüft: state.profil.id === '' → FALSE!
6. → DB-Daten werden NICHT in State synchronisiert
7. state.profil.avatarUrl bleibt leer (aus localStorage)
8. isStepComplete('profil') → FALSE wegen fehlendem avatarUrl
9. Button "Weiter" ist deaktiviert / funktioniert nicht
```

### Root Cause

Die Hydrations-Bedingung ist zu restriktiv. Sie sollte prüfen:
- DB-Daten vorhanden?
- Wichtige Felder im State leer, die in DB existieren?
- → Dann mergen!

---

## Lösung

### Änderung in `src/components/OnboardingScreen.tsx`

Der `useEffect` muss intelligenter mergen - insbesondere `avatarUrl` aus der DB übernehmen, wenn im State leer:

**Alt (Zeile 122-128):**
```typescript
useEffect(() => {
  if (!profileLoading && dbProfile && state.profil.id === '') {
    console.log('[Onboarding] Hydrating profile from DB:', dbProfile);
    updateProfile(dbProfile);
  }
}, [profileLoading, dbProfile, state.profil.id, updateProfile]);
```

**Neu:**
```typescript
useEffect(() => {
  if (!profileLoading && dbProfile) {
    // Prüfe ob wichtige DB-Felder fehlen im State
    const stateHasNoAvatar = !state.profil.avatarUrl;
    const dbHasAvatar = !!dbProfile.avatarUrl;
    
    // Hydrate wenn State leer ODER wenn DB wichtige Daten hat die im State fehlen
    if (state.profil.id === '' || (stateHasNoAvatar && dbHasAvatar)) {
      console.log('[Onboarding] Hydrating profile from DB:', {
        reason: state.profil.id === '' ? 'empty_state' : 'missing_avatar',
        dbProfile,
      });
      
      // Merge: Lokale Eingaben behalten, DB-Werte für leere Felder nutzen
      const mergedProfile: ApplicantProfile = {
        id: dbProfile.id,
        vorname: state.profil.vorname || dbProfile.vorname,
        nachname: state.profil.nachname || dbProfile.nachname,
        email: state.profil.email || dbProfile.email,
        telefon: state.profil.telefon || dbProfile.telefon,
        avatarUrl: state.profil.avatarUrl || dbProfile.avatarUrl,
        strasse: state.profil.strasse || dbProfile.strasse,
        hausnummer: state.profil.hausnummer || dbProfile.hausnummer,
        plz: state.profil.plz || dbProfile.plz,
        ort: state.profil.ort || dbProfile.ort,
      };
      
      updateProfile(mergedProfile);
    }
  }
}, [profileLoading, dbProfile, state.profil, updateProfile]);
```

---

## Datenfluss nach Fix

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ SZENARIO: Page Refresh mit vorhandenem localStorage                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. loadPersistedState → State aus localStorage (avatarUrl evtl. leer)       │
│ 2. useContractorProfile → DB-Daten laden (avatarUrl vorhanden)              │
│ 3. useEffect prüft:                                                         │
│    - state.profil.avatarUrl leer? JA                                        │
│    - dbProfile.avatarUrl vorhanden? JA                                      │
│    → Merge durchführen!                                                     │
│ 4. State enthält jetzt avatarUrl aus DB + lokale Eingaben                   │
│ 5. isStepComplete('profil') → TRUE                                          │
│ 6. Button "Weiter" funktioniert                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/components/OnboardingScreen.tsx` | useEffect Zeile 122-128 anpassen für intelligentes Merging |

---

## Edge Cases

1. **User hat Avatar lokal geändert, aber nicht gespeichert**
   - Lokaler avatarUrl wird bevorzugt (Merge-Logik: `state || db`)
   
2. **DB hat keine Daten**
   - dbProfile ist null → useEffect triggert nicht → kein Problem

3. **Beides leer**
   - User muss Avatar hochladen → Validierung bleibt bestehen
