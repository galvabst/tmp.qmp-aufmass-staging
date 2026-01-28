
# Plan: Gewerbeschein-Nachreichung + Tester-Modus + ProfileStep Layout

## Zusammenfassung

Drei Anpassungen werden umgesetzt:

1. **Gewerbeschein "spaeter nachreichen"** - Option zum Ueberspringen mit Reminder-Task
2. **Tester-Modus** - Felder nicht mandatory, einfaches Durchklicken moeglich
3. **ProfileStep Layout** - Reihenfolge aendern: Info-Box oben, dann Foto, dann Daten

## 1. Gewerbeschein spaeter nachreichen

### Konzept

Der User kann "Spaeter nachreichen" waehlen. Der Schritt wird als "uebersprungen" markiert, aber eine Aufgabe bleibt offen. Der User kann trotzdem weiter im Onboarding und spaeter sogar Auftraege annehmen.

### UI-Aenderung in DocumentsStep

```text
┌─────────────────────────────────────────────────────────────┐
│ Gewerbeschein erforderlich                                  │
│ Gemäß § 9 des Vertrags musst du einen gültigen...          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Gewerbeschein hochladen                                     │
│                                                             │
│    ┌─────────────────────────────┐                          │
│    │    [Upload Dropzone]        │                          │
│    └─────────────────────────────┘                          │
│                                                             │
│    ─────────── oder ───────────                             │
│                                                             │
│    ┌─────────────────────────────┐                          │
│    │  📅 Später nachreichen      │  (Ghost-Button)          │
│    └─────────────────────────────┘                          │
│    Du kannst den Gewerbeschein später im Profil             │
│    nachreichen. Aufträge sind trotzdem möglich.             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### State-Aenderungen

Neues Feld im OnboardingState:

```typescript
// In OnboardingState
gewerbescheinSpaeter: boolean; // Später nachreichen gewaehlt
```

### Logik-Aenderungen

- `isStepComplete('dokumente')` gibt `true` zurueck wenn:
  - `gewerbescheinUrl` vorhanden ODER
  - `gewerbescheinSpaeter === true`
- Im Profil-Tab wird eine Warnung/Erinnerung angezeigt wenn Gewerbeschein fehlt
- Auftraege koennen trotzdem angenommen werden

## 2. Tester-Modus (nicht-mandatory Felder)

### Konzept

Der `isStepComplete()`-Check wird angepasst, sodass Schritte auch ohne vollstaendige Daten als "abgeschlossen" gelten. Dies erlaubt schnelles Durchklicken im Preview-Modus.

### Aenderung in useOnboardingState

```typescript
// Option 1: Preview-Modus ueberspringt Validierung
const isStepComplete = useCallback((step: OnboardingStepId): boolean => {
  // In Preview-Mode: Immer true (kann durchklicken)
  if (isPreview) return true;
  
  // Produktions-Logik bleibt bestehen...
}, [state, isPreview]);
```

### Alternative: Separate Validierung

Statt die Validierung komplett zu entfernen, koennte man:
- Im Preview-Modus: Validierung nur warnen, aber nicht blockieren
- Der "Weiter"-Button bleibt immer aktiv im Preview-Modus

## 3. ProfileStep Layout umordnen

### Aktuelle Reihenfolge

1. Avatar Upload ("Profilfoto fuer Ausweiskarte")
2. Foto-Anleitung ("So sollte dein Foto aussehen")
3. Persoenliche Daten
4. Adresse

### Neue Reihenfolge

1. **Foto-Anleitung ("So sollte dein Foto aussehen")** - NACH OBEN
2. **Avatar Upload ("Profilfoto fuer Ausweiskarte")** - DARUNTER
3. Persoenliche Daten
4. Adresse

### Visualisierung

```text
VORHER:                          NACHHER:
┌────────────────────┐           ┌────────────────────┐
│ Profilfoto fuer    │           │ 💡 So sollte dein  │
│ Ausweiskarte       │           │    Foto aussehen   │
│ [Avatar Upload]    │           │ - Tipps...         │
├────────────────────┤           │ [Gut] vs [Schlecht]│
│ 💡 So sollte dein  │           ├────────────────────┤
│    Foto aussehen   │           │ Profilfoto fuer    │
│ - Tipps...         │           │ Ausweiskarte       │
│ [Gut] vs [Schlecht]│           │ [Avatar Upload]    │
├────────────────────┤           ├────────────────────┤
│ Persönliche Daten  │           │ Persönliche Daten  │
├────────────────────┤           ├────────────────────┤
│ Adresse            │           │ Adresse            │
└────────────────────┘           └────────────────────┘
```

### Code-Aenderung

Die JSX-Bloecke in ProfileStep.tsx werden einfach in der neuen Reihenfolge angeordnet.

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/types/onboarding.ts` | Neues Feld `gewerbescheinSpaeter: boolean` |
| `src/lib/onboarding-config.ts` | Initial-State anpassen |
| `src/hooks/useOnboardingState.ts` | Neue Funktion `setGewerbescheinSpaeter`, `isStepComplete` anpassen |
| `src/components/onboarding/steps/DocumentsStep.tsx` | "Spaeter nachreichen" Button + State |
| `src/components/onboarding/steps/ProfileStep.tsx` | Layout-Reihenfolge aendern |
| `src/components/OnboardingScreen.tsx` | Handler fuer "Spaeter nachreichen" |

## Technische Details

### DocumentsStep Props erweitern

```typescript
interface DocumentsStepProps {
  gewerbescheinUrl?: string;
  gewerbescheinSpaeter?: boolean;
  onGewerbescheinUpload: (file: File) => void;
  onRemoveGewerbeschein: () => void;
  onGewerbescheinSpaeter: () => void; // NEU
}
```

### "Spaeter nachreichen" UI

```tsx
{/* Separator */}
<div className="flex items-center gap-4 my-4">
  <div className="flex-1 h-px bg-border" />
  <span className="text-sm text-muted-foreground">oder</span>
  <div className="flex-1 h-px bg-border" />
</div>

{/* Später nachreichen */}
<Button
  variant="ghost"
  className="w-full text-muted-foreground"
  onClick={onGewerbescheinSpaeter}
>
  <Clock className="w-4 h-4 mr-2" />
  Später nachreichen
</Button>
<p className="text-xs text-muted-foreground text-center mt-2">
  Du kannst den Gewerbeschein später im Profil nachreichen. 
  Aufträge sind trotzdem möglich.
</p>
```

### Validierungs-Anpassung fuer Preview

```typescript
// In useOnboardingState.ts
const isStepComplete = useCallback((step: OnboardingStepId): boolean => {
  // Preview-Modus: Alle Schritte sind "fertig" (durchklickbar)
  if (isPreview) return true;
  
  switch (step) {
    case 'dokumente':
      // Entweder hochgeladen ODER "später" gewählt
      return !!(state.gewerbescheinUrl || state.gewerbescheinSpaeter);
    // ... rest
  }
}, [state, isPreview]);
```

## Reihenfolge der Implementation

1. Types erweitern (`gewerbescheinSpaeter`)
2. Initial-State und Hook anpassen
3. ProfileStep Layout umordnen
4. DocumentsStep mit "Spaeter nachreichen" erweitern
5. OnboardingScreen Handler hinzufuegen
6. Testen im Preview-Modus
