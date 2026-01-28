
# Plan: Onboarding-Vorschau Button im Profil

## Zusammenfassung
Ein "Onboarding-Vorschau" Button wird im Profil hinzugefügt, der es ermöglicht, das Onboarding jederzeit anzuschauen, ohne den echten Fortschritt zu verlieren.

## Aktuelle Architektur

Das System funktioniert so:
- **Index.tsx** hat einen State `onboardingComplete` (startet mit `false`)
- Wenn `onboardingComplete === false`, wird `OnboardingScreen` angezeigt
- Der echte Onboarding-Status wird in **localStorage** gespeichert (`thermocheck_onboarding_state`)
- ProfileView hat bereits einen `onStartOnboarding` Callback, der aber aktuell den echten State zurücksetzt

## Lösung: Preview-Modus

Anstatt den echten State zu löschen, führen wir einen **Preview-Modus** ein:

```text
┌─────────────────────────────────────────────────────────┐
│                    Index.tsx                            │
├─────────────────────────────────────────────────────────┤
│  onboardingComplete: boolean                            │
│  isPreviewMode: boolean (NEU)                           │
│                                                         │
│  if (!onboardingComplete || isPreviewMode)              │
│    → OnboardingScreen (mit previewMode prop)            │
└─────────────────────────────────────────────────────────┘
```

## Änderungen

### 1. ProfileView.tsx
Einen neuen Button "Onboarding-Vorschau" im Einstellungen-Bereich hinzufügen:
- Icon: `Eye` (Lucide)
- Text: "Onboarding-Vorschau"
- Erscheint **immer** (auch wenn Onboarding abgeschlossen)
- Ruft `onStartOnboardingPreview()` Callback auf

### 2. Index.tsx
- Neuer State: `isPreviewMode: boolean`
- Neuer Handler: `handleStartOnboardingPreview()` 
  - Setzt `isPreviewMode = true`
  - Zeigt Toast: "Vorschau-Modus aktiv"
- OnboardingScreen erhält neues Prop: `isPreview?: boolean`
- Wenn Preview-Modus, wird localStorage **nicht** überschrieben

### 3. OnboardingScreen.tsx
- Neues Prop: `isPreview?: boolean`
- Neues Prop: `onExitPreview?: () => void`
- Im Preview-Modus:
  - Zeigt Banner oben: "Vorschau-Modus - Änderungen werden nicht gespeichert"
  - "X" Button zum Beenden der Vorschau
  - Verwendet **temporären State** statt localStorage
  - Bei Abschluss: Toast + Exit (kein echtes onComplete)

### 4. useOnboardingState.ts
- Neuer Parameter: `isPreview?: boolean`
- Wenn Preview-Modus:
  - Lädt Initial-State (nicht aus localStorage)
  - Speichert **nicht** in localStorage
  - Alle Änderungen nur im Memory

## UI-Design

### Button im Profil (Einstellungen-Bereich)
```text
┌──────────────────────────────────────────┐
│ 👁  Onboarding-Vorschau              >   │
├──────────────────────────────────────────┤
│ 👤 Persönliche Daten                 >   │
├──────────────────────────────────────────┤
│ ⚙  Einstellungen                     >   │
└──────────────────────────────────────────┘
```

### Preview-Banner im OnboardingScreen
```text
┌──────────────────────────────────────────┐
│ ⚠ Vorschau-Modus                    [X]  │
│   Änderungen werden nicht gespeichert    │
└──────────────────────────────────────────┘
│                                          │
│        (normales Onboarding UI)          │
│                                          │
```

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/components/ProfileView.tsx` | Neuer Button + Callback |
| `src/pages/Index.tsx` | Preview-State + Handler |
| `src/components/OnboardingScreen.tsx` | Preview-Props + Banner |
| `src/hooks/useOnboardingState.ts` | Preview-Modus Support |

## Technische Details

### useOnboardingState.ts - Preview-Modus
```typescript
export function useOnboardingState(
  initialProfile: ApplicantProfile,
  isPreview: boolean = false  // NEU
) {
  const [state, setState] = useState<OnboardingState>(() => 
    isPreview 
      ? createInitialOnboardingState(initialProfile)  // Frischer State
      : loadPersistedState(initialProfile)            // Aus localStorage
  );

  // Persist nur wenn NICHT Preview
  useEffect(() => {
    if (isPreview) return;  // NEU: Keine Persistierung
    // ... existing localStorage code
  }, [state, isPreview]);
  
  // ... rest
}
```

### OnboardingScreen.tsx - Preview-Banner
```tsx
{isPreview && (
  <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
    <div className="flex items-center gap-2 text-amber-800">
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm font-medium">
        Vorschau-Modus - Änderungen werden nicht gespeichert
      </span>
    </div>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onExitPreview}
    >
      <X className="w-4 h-4" />
    </Button>
  </div>
)}
```

## Vorteile dieser Lösung

1. **Echter Fortschritt bleibt erhalten** - localStorage wird nicht berührt
2. **Vollständige Vorschau** - User kann alle Steps durchklicken
3. **Klar erkennbar** - Gelber Banner zeigt Preview-Modus
4. **Einfacher Exit** - X-Button oder Abschluss beendet Vorschau
5. **Minimal Invasiv** - Bestehender Code bleibt größtenteils unverändert
