
# Plan: Bestellungs-Flow im Vorschau-Modus reparieren + Scannerlizenz hinzufuegen

## Problem-Analyse

### Problem 1: Preview-Modus ueberspringt kompletten Bestellungs-Step
In `useOnboardingState.ts` Zeile 190-192:

```typescript
const isStepComplete = useCallback((step: OnboardingStepId): boolean => {
  // Preview-Modus: Alle Schritte sind durchklickbar (Tester-Modus)
  if (isPreview) return true;  // <-- DAS ist das Problem!
```

Das bedeutet: `canProceed` ist IMMER true im Preview-Modus. Wenn du auf "Weiter" klickst, springst du sofort von "Bestellungen" zu "Equipment", ohne durch die Produkt-Sequenz zu gehen.

### Problem 2: Scannerlizenz fehlt in Produktliste
Aktuell in `MOCK_PRODUCTS`:
1. Oberteil (T-Shirt/Poloshirt)
2. Schlappen
3. Pullover
4. Ausweiskarte
5. Google Workspace

Es fehlt: **Room-Scanner Lizenz** (~199 Euro/Monat)

## Loesung

### 1. Preview-Modus-Logik anpassen

Der Tester-Modus soll das **Durchklicken durch die Bestellungen** ermoeglichen, aber nicht den kompletten Step ueberspringen.

**Neue Logik:**
- Der "Weiter zu Equipment"-Button ist im Preview-Modus aktiv
- Die **einzelnen Produkte** muessen trotzdem durchgeklickt werden (um den Flow zu sehen)
- ABER: Der "Jetzt bestellen"-Button oeffnet den Shop-Link UND der "Ja, bestellt"-Dialog kann ohne tatsaechliche Bestellung bestaetigt werden

Das aktuelle Verhalten ist bereits korrekt - das Problem ist, dass der Hauptschritt-Button zu frueh aktiv wird.

**Fix:** Die Validierung fuer `bestellungen` soll NICHT durch `isPreview` umgangen werden.

```typescript
const isStepComplete = useCallback((step: OnboardingStepId): boolean => {
  switch (step) {
    case 'profil':
      // Preview-Modus: Profil-Validierung ueberspringen
      if (isPreview) return true;
      return !!(state.profil.vorname && ...);
      
    case 'dokumente':
      if (isPreview) return true;
      return !!(state.gewerbescheinUrl || state.gewerbescheinSpaeter);
      
    case 'bestellungen':
      // KEIN Preview-Skip hier! User soll alle Produkte durchklicken
      const requiredCount = state.oberteilAuswahl === 'beides' ? 7 : 6; // +1 fuer Scanner
      return state.bestellungenBestaetigt.length >= requiredCount;
      
    case 'equipment':
      if (isPreview) return true;
      // ...
```

### 2. Scannerlizenz als Produkt hinzufuegen

In `onboarding-config.ts` zwischen Ausweiskarte und Google Workspace:

```typescript
{
  id: 'scanner-lizenz',
  name: 'Room Scanner Lizenz',
  beschreibung: 'Professional 3D-Scanning Software fuer iPhone LiDAR',
  preisNetto: 167.23,
  preisBrutto: 199.00,
  preisTyp: 'monatlich',
  produktTyp: 'lizenz',
  bildUrl: '/placeholder.svg',
  externLink: 'https://shop.thermocheck.de/scanner-lizenz',
  pflicht: true,
  reihenfolge: 5, // Nach Ausweiskarte (4), vor Google Workspace (6)
},
```

Und Google Workspace wird dann `reihenfolge: 6`.

### 3. Required Count anpassen

Da jetzt 6 Produkte vorhanden sind (+ 1 bei "beides"):
- T-Shirt ODER Poloshirt: 6 Bestellungen
- Beides: 7 Bestellungen

```typescript
case 'bestellungen':
  const requiredCount = state.oberteilAuswahl === 'beides' ? 7 : 6;
  return state.bestellungenBestaetigt.length >= requiredCount;
```

## Produkt-Reihenfolge nach Fix

| # | ID | Name | Preis |
|---|------|------|-------|
| 1 | oberteil | T-Shirt/Poloshirt | Shop-Preis |
| 2 | schlappen | Thermocheck Hausschuhe | Shop-Preis |
| 3 | pullover | Thermocheck Pullover | Shop-Preis |
| 4 | ausweiskarte | Thermocheck Ausweiskarte | Shop-Preis |
| 5 | scanner-lizenz | Room Scanner Lizenz | 199 Euro/Monat |
| 6 | google-workspace | Google Workspace | 34.99 Euro/Monat |

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/lib/onboarding-config.ts` | Neues Produkt `scanner-lizenz`, Reihenfolgen anpassen |
| `src/hooks/useOnboardingState.ts` | `isStepComplete('bestellungen')` nicht mehr durch Preview-Modus umgangen, requiredCount aktualisieren |

## Technische Details

### onboarding-config.ts

```typescript
// MOCK_PRODUCTS erweitern um scanner-lizenz
{
  id: 'scanner-lizenz',
  name: 'Room Scanner Lizenz',
  beschreibung: 'Professional 3D-Scanning Software fuer iPhone LiDAR',
  preisNetto: 167.23,
  preisBrutto: 199.00,
  preisTyp: 'monatlich',
  produktTyp: 'lizenz',
  bildUrl: '/placeholder.svg',
  externLink: 'https://shop.thermocheck.de/scanner-lizenz',
  pflicht: true,
  reihenfolge: 5,
},

// google-workspace auf reihenfolge: 6 aendern
```

### useOnboardingState.ts

```typescript
const isStepComplete = useCallback((step: OnboardingStepId): boolean => {
  switch (step) {
    case 'profil':
      if (isPreview) return true;
      return !!(state.profil.vorname && state.profil.nachname && 
                state.profil.email && state.profil.avatarUrl);
                
    case 'dokumente':
      if (isPreview) return true;
      return !!(state.gewerbescheinUrl || state.gewerbescheinSpaeter);
      
    case 'bestellungen':
      // WICHTIG: Kein Preview-Skip hier! 
      // User soll im Vorschau-Modus alle Produkte durchklicken koennen
      const requiredCount = state.oberteilAuswahl === 'beides' ? 7 : 6;
      return state.bestellungenBestaetigt.length >= requiredCount;
      
    case 'equipment':
      if (isPreview) return true;
      const drohne = state.equipmentStatus['drohne'];
      const iphone = state.equipmentStatus['iphone-lidar'];
      return !!((drohne?.hatEigenes && drohne?.nachweisUrl) || 
                (drohne?.hatEigenes === false)) && !!(iphone?.hatEigenes);
                
    case 'akademie':
      if (isPreview) return true;
      return state.akademieTestBestanden;
      
    case 'nachweise':
      if (isPreview) return true;
      return !!(Object.values(state.ausstattungCheckliste).every(Boolean) && 
                state.gesamtfotoUrl);
                
    case 'coaching':
      if (isPreview) return true;
      return state.coachingAbgeschlossen;
      
    default:
      return false;
  }
}, [state, isPreview]);
```

## Erwartetes Verhalten nach Fix

### Im Vorschau-Modus:
1. Profil: "Weiter" Button aktiv (Preview-Skip)
2. Dokumente: "Weiter" Button aktiv (Preview-Skip)
3. **Bestellungen: User muss alle 6 Produkte durchklicken!**
   - Oberteil auswaehlen -> T-Shirt/Poloshirt bestellen
   - Schlappen bestellen
   - Pullover bestellen
   - Ausweiskarte bestellen
   - Scanner-Lizenz bestellen
   - Google Workspace bestellen
   - DANN ist "Weiter zu Equipment" aktiv
4. Equipment: "Weiter" Button aktiv (Preview-Skip)
5. usw.

### Im echten Modus:
Gleiches Verhalten wie bisher, plus Scanner-Lizenz in der Sequenz.
