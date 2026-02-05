

# Fix: Profil-Daten bei Schritt-Wechsel in die Datenbank speichern

## Problem

Der User gibt Adresse ein (Straße, PLZ, Ort), klickt "Weiter zu Dokumente", aber:
- Die Datenbank zeigt: `anschrift_strasse = NULL`, `anschrift_plz = NULL`, `anschrift_ort = NULL`
- Die Daten werden nur im Browser (localStorage) gespeichert, nicht in der Datenbank

## Ursache

In `OnboardingScreen.tsx`:
1. Der Hook `useContractorProfile` wird eingebunden und bietet `saveProfileToDb` an (Zeile 90)
2. Diese Funktion wird aber **nie aufgerufen**
3. `handleNext()` (Zeile 240) navigiert einfach zum nächsten Schritt ohne DB-Speicherung

## Lösung

Beim Klick auf "Weiter" (wenn aktueller Schritt = "profil"):
1. Profil-Daten in die Datenbank speichern via `saveProfileToDb`
2. Avatar-Upload falls vorhanden
3. Erst dann zum nächsten Schritt navigieren

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/OnboardingScreen.tsx` | `handleNext` erweitern: DB-Speicherung bei Profil-Schritt |

## Konkrete Änderungen

### OnboardingScreen.tsx - handleNext erweitern

```typescript
const handleNext = async () => {
  // Bei Profil-Schritt: Daten in DB speichern
  if (state.currentStep === 'profil') {
    try {
      await saveProfileToDb(state.profil);
      toast.success('Profildaten gespeichert');
    } catch (error) {
      console.error('[Onboarding] Failed to save profile:', error);
      toast.error('Fehler beim Speichern der Profildaten');
      return; // Nicht weiter navigieren bei Fehler
    }
  }
  
  if (state.currentStep === 'coaching' && state.coachingAbgeschlossen) {
    return;
  }
  goToNextStep();
};
```

### Avatar-Upload ebenfalls verknüpfen

Der aktuelle `handleAvatarUpload` nutzt nur `URL.createObjectURL` (Zeile 185-189).
Stattdessen muss `uploadAvatar` aus dem Hook verwendet werden:

```typescript
const handleAvatarUpload = async (file: File) => {
  try {
    const url = await uploadAvatar(file);
    setAvatarUrl(url);
    toast.success('Profilbild hochgeladen');
  } catch (error) {
    console.error('[Onboarding] Avatar upload failed:', error);
    toast.error('Fehler beim Hochladen des Profilbilds');
  }
};
```

## Zusätzliche Überlegung: "Zurück" und erneutes Bearbeiten

Falls der User zurückgeht und Daten ändert:
- Bei erneutem "Weiter" werden die Daten erneut gespeichert (Update statt Insert)
- Das funktioniert, weil `useContractorProfile.updateProfile` ein UPSERT via `eq('id', user.id)` macht

## Testplan

1. Einloggen als Test-User
2. Adresse eingeben: "Am Steinbruch 3, 91466 Gerhardshofen"
3. "Weiter zu Dokumente" klicken
4. In Supabase Dashboard prüfen: `thermocheck.contractor_onboarding` sollte jetzt zeigen:
   - `anschrift_strasse = 'Am Steinbruch 3'`
   - `anschrift_plz = '91466'`
   - `anschrift_ort = 'Gerhardshofen'`

