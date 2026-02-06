

# Equipment-Schritt erweitern: Echte Links + Massband

## Zusammenfassung

Der Equipment-Schritt bekommt echte Amazon-Affiliate-Links fuer die Drohne, ein neues drittes Equipment-Item "Massband" mit eigener Auswahl-Logik, und der Kauf-Button der Drohne wird als "Bessere Wahl" hervorgehoben.

## Aenderungen im Detail

### 1. Konfiguration: `src/lib/onboarding-config.ts`

**Drohne** - echten Kauf-Link setzen:
```text
kaufLink: 'https://amzn.to/4tkCQpV'
```
(Miet-Link bleibt vorerst Placeholder)

**Neues Equipment-Item "Massband"** hinzufuegen:
```text
{
  id: 'massband',
  name: 'Massband',
  beschreibung: 'Empfohlene Laenge: mindestens 5m',
  hatEigenes: false,
  nachweisPflicht: false,
  kaufLink: 'https://amzn.to/4afYToT',
}
```

### 2. UI-Komponente: `src/components/onboarding/steps/EquipmentStep.tsx`

**Props erweitern** um Massband-Status und -Handler:
- `massbandStatus: EquipmentStatus`
- `onMassbandChange: (status) => void`
- `massbandKaufLink?: string`

**Drohne-Kauf-Button aufwerten:**
- Badge/Label "Langfristig guenstiger" oder "Bessere Wahl" am Kauf-Button
- Visuell hervorgehobener als der Miet-Button (z.B. gruener Akzent oder Badge)

**Neuer Massband-Block** (nach iPhone, vor Tipp-Box):
- Icon: `Ruler` (aus lucide-react)
- Titel: "Massband"
- Untertitel: "Empfohlene Laenge: mindestens 5m"
- Radio-Auswahl:
  - "Ja, ich habe bereits ein Massband" --> Bestaetigung (gruener Haken)
  - "Nein, ich brauche ein Massband" --> Kauf-Button "Unser empfohlenes Modell kaufen" mit Amazon-Link
- Hinweistext: "Empfohlene Laenge: mindestens 5m"

### 3. Integration: `src/components/OnboardingScreen.tsx`

Im `equipment`-Case des `renderStep()`:
- `massbandItem` aus MOCK_EQUIPMENT extrahieren
- `massbandStatus` aus `state.equipmentStatus['massband']` lesen
- `onMassbandChange` via `updateEquipmentStatus('massband', ...)` anschliessen
- `massbandKaufLink` durchreichen

### 4. canProceed-Logik: `src/hooks/useOnboardingState.ts`

Equipment-Schritt kann weitergehen wenn Drohne + iPhone + Massband alle einen definierten Status haben (entweder "habe ich" oder "brauche ich"):

```text
case 'equipment':
  const drohne = state.equipmentStatus['drohne'];
  const iphone = state.equipmentStatus['iphone-lidar'];
  const massband = state.equipmentStatus['massband'];
  return !!(
    (drohne?.hatEigenes && drohne?.nachweisUrl) || (drohne?.hatEigenes === false)
  ) && !!(iphone?.hatEigenes) && !!(massband?.hatEigenes !== undefined);
```

Hinweis: Das Massband blockiert nicht hart - sobald eine Auswahl getroffen wurde (ja/nein), kann weiter geklickt werden.

### 5. Tipp-Text anpassen

Den bestehenden Tipp am Ende erweitern:
```text
"Die Drohne, das iPhone und das Massband kannst du auch steuerlich absetzen!"
```

## Nicht betroffen / offen

- **iPhone-Links**: Du hast gesagt, die muessen noch rausgesucht werden. Die Placeholder-Links bleiben vorerst. Sobald du die Affiliate-Links hast, pflege ich sie ein.
- **DB-Persistierung**: Der Massband-Status wird automatisch ueber das bestehende `equipmentStatus`-JSONB-Feld in der DB gespeichert (gleicher Mechanismus wie Drohne/iPhone - wurde gerade implementiert).
- **Drohne Miet-Link**: Bleibt Placeholder bis ein passender Link vorliegt.

## Betroffene Dateien

1. `src/lib/onboarding-config.ts` - Massband-Item + Drohne-Kauf-Link
2. `src/components/onboarding/steps/EquipmentStep.tsx` - Massband-Block + Drohne "Bessere Wahl" Badge
3. `src/components/OnboardingScreen.tsx` - Massband-Props durchreichen
4. `src/hooks/useOnboardingState.ts` - canProceed um Massband erweitern
