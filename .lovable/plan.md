

## Plan: Onboarding-Status im Profil korrekt synchronisieren

### Problem-Analyse

Es existieren zwei getrennte Onboarding-Datenquellen:

1. **Echter State** (`localStorage: thermocheck_onboarding_state`)
   - Wird vom `useOnboardingState`-Hook verwaltet
   - Speichert `coachingAbgeschlossen: true` nach Abschluss
   - Ist die Single Source of Truth

2. **Mock-Daten** (`mockTechnicianData.ts`)
   - Statische Werte: `isCompleted: false`, `progressPercent: 40`
   - Wird direkt in `ProfileView` verwendet
   - Ignoriert den echten Onboarding-Fortschritt

**Ergebnis:** Der "Onboarding fortsetzen"-Button erscheint immer, obwohl das Onboarding laengst abgeschlossen ist.

---

### Loesung

Die Onboarding-Anzeige im Profil muss den **echten State aus localStorage** lesen und verwenden.

---

### Aenderungen

#### 1. Index.tsx - Onboarding-Status aus localStorage lesen

Neue Funktion hinzufuegen die den echten Onboarding-Status laedt:

```typescript
const loadOnboardingStatus = () => {
  try {
    const saved = localStorage.getItem('thermocheck_onboarding_state');
    if (saved) {
      const state = JSON.parse(saved);
      return {
        isCompleted: state.coachingAbgeschlossen || false,
        completedSteps: state.completedSteps || [],
        currentStep: state.currentStep,
      };
    }
  } catch (e) {
    console.warn('Failed to load onboarding status', e);
  }
  return null;
};
```

Beim Erstellen des Profils die Onboarding-Daten dynamisch berechnen:

```typescript
const [profile, setProfile] = useState(() => {
  const onboardingProfile = loadOnboardingProfile();
  const onboardingStatus = loadOnboardingStatus();
  
  // Wenn Onboarding abgeschlossen -> keine Onboarding-Sektion anzeigen
  const onboarding = onboardingStatus?.isCompleted 
    ? { ...mockOnboardingProgress, isCompleted: true, progressPercent: 100 }
    : mockTechnicianProfile.onboarding;
  
  return {
    ...mockTechnicianProfile,
    name: onboardingProfile 
      ? `${onboardingProfile.vorname} ${onboardingProfile.nachname}` 
      : mockTechnicianProfile.name,
    avatarUrl: onboardingProfile?.avatarUrl || mockTechnicianProfile.avatarUrl,
    onboarding,
  };
});
```

#### 2. ProfileView.tsx - Onboarding-Sektion ausblenden wenn abgeschlossen

Aktuell wird die Sektion immer angezeigt wenn `onboarding` existiert.

Besser: Wenn `isCompleted: true`, die Sektion komplett ausblenden oder einen "Abgeschlossen"-Status anzeigen:

```typescript
{onboarding && !onboarding.isCompleted && (
  <section className="p-4 pt-0">
    {/* Onboarding-Fortschritt anzeigen */}
  </section>
)}

{onboarding?.isCompleted && (
  <section className="p-4 pt-0">
    <div className="bg-card rounded-lg shadow-card p-4 flex items-center gap-3">
      <CheckCircle className="w-6 h-6 text-green-600" />
      <span className="text-foreground font-medium">Onboarding abgeschlossen</span>
    </div>
  </section>
)}
```

---

### Zusammenfassung der Dateiaenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Index.tsx` | `loadOnboardingStatus()` Funktion + dynamische `isCompleted`/`progressPercent` Berechnung |
| `src/components/ProfileView.tsx` | Onboarding-Sektion nur bei `!isCompleted` anzeigen, sonst "Abgeschlossen"-Badge |

---

### Technischer Hintergrund

Diese Aenderung folgt dem Prinzip **Single Source of Truth**:
- Der localStorage-State (`thermocheck_onboarding_state`) ist die einzige Wahrheit
- Mock-Daten werden nur als Fallback verwendet wenn kein echter State existiert
- Spaeter kann dies auf Supabase umgestellt werden ohne UI-Aenderungen

