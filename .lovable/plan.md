
# Fix: Reload-Loop beheben + Onboarding-Daten mit Datenbank verknüpfen

## Zusammenfassung der Probleme

### Problem 1: Endlosschleife (Reload-Loop)
Die aktuelle Logik löscht localStorage und ruft `window.location.reload()` auf. Nach dem Reload:
- `useOnboardingState` lädt erneut aus localStorage (jetzt leer)
- Aber `createInitialOnboardingState()` nutzt `MOCK_APPLICANT_PROFILE`
- Der State wird wieder gespeichert in localStorage
- Bei der nächsten DB-Prüfung: wieder `isComplete && dbShowsNoProgress` → wieder reload

**Lösung**: Statt `reload()` den State direkt im Hook zurücksetzen und einen "sync"-Flag setzen, der verhindert, dass Mock-Daten persistiert werden.

### Problem 2: Keine DB-Verknüpfung der Profildaten
Aktuell werden alle Onboarding-Daten in localStorage gespeichert:
- Profil-Daten kommen aus `MOCK_APPLICANT_PROFILE` (Mock)
- Änderungen werden nicht in die DB geschrieben
- Profilbild wird nicht gespeichert

**Lösung** (gemäß LOVABLE_BEHAVIOUR.txt Regel 1: "profiles ist SSoT für User-Identität"):
1. Profil-Daten aus `public.profiles` laden (über `profile_id` aus `contractor_onboarding`)
2. Bei Änderungen: Updates an `public.profiles` UND `thermocheck.contractor_onboarding` schreiben
3. Profilbild in Supabase Storage speichern

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/OnboardingScreen.tsx` | Endlosschleife-Fix: State-Reset ohne Reload |
| `src/hooks/useOnboardingState.ts` | Export `resetOnboardingState()` Funktion |
| `src/hooks/useContractorProfile.ts` | NEUER Hook: Lädt/speichert Profile aus DB |
| `src/components/onboarding/steps/ProfileStep.tsx` | Nutzt DB-Daten, speichert Änderungen |
| `src/pages/Index.tsx` | Gibt `profile_id` an OnboardingScreen weiter |

---

## Technische Details

### 1. Endlosschleife beheben (Priorität: KRITISCH)

**OnboardingScreen.tsx** - State-Reset ohne Page-Reload:

Statt:
```typescript
if (isComplete && dbShowsNoProgress) {
  clearOnboardingLocalStorage();
  window.location.reload();
  return null;
}
```

Neu:
```typescript
const [forceReset, setForceReset] = useState(false);

// Prüfe beim ersten Render
useEffect(() => {
  if (isComplete && dbShowsNoProgress && !forceReset) {
    clearOnboardingLocalStorage();
    setForceReset(true);
    // State wird beim nächsten Render durch Hook-Reinitialisierung frisch
  }
}, [isComplete, dbShowsNoProgress, forceReset]);

// Nach Reset: Hook mit leerer Initialisierung starten
```

**Alternative (einfacher)**: In `useOnboardingState` eine `forceReset`-Funktion exportieren, die den State auf den Initialzustand zurücksetzt.

### 2. Profile-Daten aus DB laden

**Neuer Hook: `useContractorProfile.ts`**

Lädt die Profile-Daten des aktuellen Users aus:
- `public.profiles` (Vorname, Nachname, E-Mail, Telefon, Avatar)
- `thermocheck.contractor_onboarding` (Adresse)

```typescript
export function useContractorProfile(profileId: string | null) {
  return useQuery({
    queryKey: ['contractor-profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      // Profile-Daten
      const { data: profileData } = await supabase
        .from('profiles')
        .select('vorname, nachname, email, telefon, avatar_url')
        .eq('id', profileId)
        .single();
      
      // Adress-Daten aus contractor_onboarding
      const { data: onboardingData } = await supabase
        .rpc('get_my_contractor_onboarding');
      
      return {
        vorname: profileData?.vorname || '',
        nachname: profileData?.nachname || '',
        email: profileData?.email || '',
        telefon: profileData?.telefon || '',
        avatarUrl: profileData?.avatar_url || undefined,
        strasse: onboardingData?.anschrift_strasse || '',
        hausnummer: '', // Nicht separat in DB - Teil von strasse
        plz: onboardingData?.anschrift_plz || '',
        ort: onboardingData?.anschrift_ort || '',
      };
    },
    enabled: !!profileId,
  });
}
```

### 3. Profile-Änderungen in DB speichern

**Mutation für Profile-Updates:**

```typescript
export function useUpdateContractorProfile() {
  return useMutation({
    mutationFn: async (profile: ApplicantProfile) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // 1. public.profiles updaten (Name, Telefon)
      await supabase
        .from('profiles')
        .update({
          vorname: profile.vorname,
          nachname: profile.nachname,
          telefon: profile.telefon,
          // Email ist auth-gebunden, nicht änderbar
        })
        .eq('id', user.id);
      
      // 2. thermocheck.contractor_onboarding updaten (Adresse)
      await supabase
        .from('contractor_onboarding')
        .update({
          anschrift_strasse: `${profile.strasse} ${profile.hausnummer}`.trim(),
          anschrift_plz: profile.plz,
          anschrift_ort: profile.ort,
        })
        .eq('profile_id', user.id);
    },
  });
}
```

### 4. Avatar-Upload in Supabase Storage

**Storage-Bucket**: `contractor-avatars` (oder existierender Bucket nutzen)

```typescript
async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileName = `${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
  
  const { data, error } = await supabase.storage
    .from('contractor-avatars')
    .upload(fileName, file, { upsert: true });
  
  if (error) throw error;
  
  // Public URL holen
  const { data: { publicUrl } } = supabase.storage
    .from('contractor-avatars')
    .getPublicUrl(fileName);
  
  // In profiles speichern
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);
  
  return publicUrl;
}
```

---

## Architektur-Konformität (LOVABLE_BEHAVIOUR.txt)

| Regel | Umsetzung |
|-------|-----------|
| **Regel 1**: profiles ist SSoT für User-Identität | ✓ Profil-Daten aus `public.profiles` laden |
| **Regel 12**: Schema-Trennung | ✓ Adresse bleibt in `thermocheck.contractor_onboarding` |
| **Regel 5**: Layered Architecture | ✓ Hook (Data Layer) getrennt von UI (Presentation Layer) |
| **Regel 9.3**: Modular Development | ✓ Eigener Hook für Profile-Daten |
| **Regel 13**: ENUM-Pflicht | ✓ Keine neuen Status-Felder nötig |

---

## Schritte der Umsetzung

1. **Fix Reload-Loop** (sofort, kritisch)
   - `useOnboardingState.ts`: `resetState()` Funktion hinzufügen
   - `OnboardingScreen.tsx`: State-Reset ohne Reload

2. **Hook für Profile-Daten** (danach)
   - Neuer Hook `useContractorProfile.ts`
   - Lädt aus `profiles` + `contractor_onboarding`

3. **ProfileStep mit DB verknüpfen**
   - Prefill aus DB-Daten
   - onChange → DB-Update via Mutation

4. **Avatar-Upload implementieren**
   - Storage-Upload Funktion
   - ProfileStep anpassen

5. **Optional: RLS für Storage-Bucket**
   - Nur eigenes Avatar änderbar

---

## Risiken

- **Gering**: Die Änderungen sind modular und betreffen nur den Onboarding-Flow
- **Migration nicht nötig**: Alle benötigten Spalten existieren bereits in der DB
- **Kein Breaking Change**: Bestehende localStorage-Logik bleibt für Offline-Zwischenspeicherung erhalten, aber DB ist SSOT
