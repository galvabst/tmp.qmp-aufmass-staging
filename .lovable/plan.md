
# Plan: Galvanek Logo Integration

## Zusammenfassung

Das Galvanek-Logo wird an strategisch sinnvollen Stellen in der App platziert, um die Markenidentitaet zu staerken ohne aufdringlich zu wirken.

## Empfohlene Platzierungen

### 1. Onboarding Complete Screen (Sehr prominent)

Der perfekte Moment fuer das Logo - wenn der User das Onboarding abschliesst und "Teil des Teams" wird:

```text
┌─────────────────────────────────────┐
│                                     │
│        [Galvanek Logo]              │  ← Logo ueber dem Erfolgs-Icon
│                                     │
│           ✓ (Checkmark)             │
│                                     │
│    "Du bist einsatzbereit! 🎉"      │
│                                     │
└─────────────────────────────────────┘
```

**Groesse**: ca. 200px breit, zentriert

### 2. Alle Header mit Brand-Element (Dezent)

Jede Hauptansicht (Pool, Buchungen, Aktiv, Pruefung) bekommt das Logo als kleines Brand-Element rechts oben im Header:

```text
┌─────────────────────────────────────┐
│  Verfuegbare Auftraege   [🌞 Logo]  │  ← Logo rechts, 32px
│  12 in deiner Region                │
└─────────────────────────────────────┘
```

**Betroffene Views**: PoolView, BookingsView, ActiveOrdersView, ReviewView

**Groesse**: 32x32px (nur das Sonnen-Symbol ohne Text, oder sehr klein mit Text)

### 3. Profil Header (Mittel)

Im Profil-Bereich ist mehr Platz fuer ein groesseres Logo:

```text
┌─────────────────────────────────────┐
│  [Avatar]  Max Mustermann           │
│            Techniker seit 2025      │
│                                     │
│         [Galvanek Logo]             │  ← Unter dem Namen, zentriert
└─────────────────────────────────────┘
```

**Alternative**: Rechts neben dem Namen/Avatar

### 4. Onboarding Header (Optional)

Im OnboardingStepWrapper koennte das Logo oben erscheinen:

```text
┌─────────────────────────────────────┐
│  ← Schritt 3 von 7    [Logo klein]  │
│                                     │
│  Bestellungen                       │
└─────────────────────────────────────┘
```

## Technische Umsetzung

### Asset speichern

Das Logo wird als Asset importiert:

```
src/assets/galvanek-logo.png
```

### Wiederverwendbare Logo-Komponente

Eine kleine Komponente fuer konsistente Verwendung:

```typescript
// src/components/GalvanekLogo.tsx
interface GalvanekLogoProps {
  size?: 'sm' | 'md' | 'lg';  // 24px | 48px | 200px
  variant?: 'full' | 'icon';   // Mit/ohne Text
  className?: string;
}
```

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/assets/galvanek-logo.png` | Logo-Asset hinzufuegen |
| `src/components/GalvanekLogo.tsx` | NEU: Wiederverwendbare Logo-Komponente |
| `src/components/onboarding/OnboardingComplete.tsx` | Grosses Logo ueber Erfolgs-Icon |
| `src/components/ProfileView.tsx` | Logo im Header-Bereich |
| `src/components/PoolView.tsx` | Kleines Logo rechts im Header |
| `src/components/BookingsView.tsx` | Kleines Logo rechts im Header |
| `src/components/ActiveOrdersView.tsx` | Kleines Logo rechts im Header |
| `src/components/ReviewView.tsx` | Kleines Logo rechts im Header |

## Empfehlung zur Priorisierung

1. **Muss**: OnboardingComplete Screen - sehr plakativ, emotionaler Moment
2. **Soll**: ProfileView Header - verstaerkt Zugehoerigkeit
3. **Kann**: Alle anderen Headers - dezentes Branding

## Erwartetes Ergebnis

- Logo erscheint an strategischen Stellen ohne aufdringlich zu wirken
- Staerkt Markenidentitaet und Zugehoerigkeit der Techniker
- Konsistente Groessen durch wiederverwendbare Komponente
