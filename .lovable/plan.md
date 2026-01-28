
# Plan: Produkt-Sequenz-Fix - Alle Bestellungen anzeigen

## Problem-Analyse

Das aktuelle Problem: Nach dem T-Shirt werden die weiteren Produkte (Schlappen, Pullover, Ausweiskarte, Google Workspace) nicht angezeigt.

### Ursache identifiziert

Der `oberteilAuswahl`-State in `OrdersStep.tsx` ist ein lokaler React-State und wird **nicht persistiert**. Das fuehrt zu folgendem Problem:

```text
1. User waehlt "T-Shirt" aus (oberteilAuswahl = 'tshirt')
2. User klickt "Jetzt bestellen" -> Shop oeffnet sich
3. User bestaetigt Bestellung -> 'tshirt' wird zu orderedProducts hinzugefuegt
4. Komponente rendert neu...
5. ABER: oberteilAuswahl ist wieder null! (State nicht persistiert)
6. getRequiredOberteilIds() gibt [] zurueck
7. isOberteilComplete() gibt false zurueck (weil oberteilAuswahl === null)
8. currentProduct bleibt 'oberteil' -> Endlosschleife!
```

### Loesung

Der `oberteilAuswahl`-State muss in den globalen OnboardingState verschoben werden, damit er nach Neuladen der Komponente erhalten bleibt.

## Aenderungen

### 1. Types erweitern

In `src/types/onboarding.ts`:

```typescript
// Neuer Typ
export type OberteilAuswahl = 'tshirt' | 'poloshirt' | 'beides' | null;

// In OnboardingState hinzufuegen:
export interface OnboardingState {
  // ... bestehende Felder
  
  // Schritt 3: Bestellungen
  bestellungenBestaetigt: string[];
  oberteilAuswahl?: OberteilAuswahl; // NEU: Persistierte Auswahl
  
  // ...
}
```

### 2. Initial State anpassen

In `src/lib/onboarding-config.ts`:

```typescript
export function createInitialOnboardingState(profile: ApplicantProfile): OnboardingState {
  return {
    // ...
    bestellungenBestaetigt: [],
    oberteilAuswahl: null, // NEU
    // ...
  };
}
```

### 3. Hook erweitern

In `src/hooks/useOnboardingState.ts`:

```typescript
// Neue Funktion hinzufuegen
const setOberteilAuswahl = useCallback((auswahl: OberteilAuswahl) => {
  setState(prev => ({ ...prev, oberteilAuswahl: auswahl }));
}, []);

// Im Return-Objekt:
return {
  // ...
  setOberteilAuswahl,
  // ...
};
```

### 4. OrdersStep anpassen

In `src/components/onboarding/steps/OrdersStep.tsx`:

```typescript
interface OrdersStepProps {
  products: OnboardingProduct[];
  orderedProducts: string[];
  onProductOrder: (productId: string) => void;
  oberteilAuswahl: OberteilAuswahl;         // NEU
  onOberteilAuswahl: (a: OberteilAuswahl) => void; // NEU
}

export function OrdersStep({ 
  products, 
  orderedProducts, 
  onProductOrder,
  oberteilAuswahl,      // NEU - aus Props statt useState
  onOberteilAuswahl,    // NEU
}: OrdersStepProps) {
  // ENTFERNEN: const [oberteilAuswahl, setOberteilAuswahl] = useState<...>
  
  // Buttons aendern von setOberteilAuswahl zu onOberteilAuswahl
}
```

### 5. OnboardingScreen anpassen

In `src/components/OnboardingScreen.tsx`:

```typescript
// Im OrdersStep-Aufruf:
case 'bestellungen':
  return (
    <OrdersStep
      products={MOCK_PRODUCTS}
      orderedProducts={state.bestellungenBestaetigt}
      onProductOrder={handleProductOrder}
      oberteilAuswahl={state.oberteilAuswahl}           // NEU
      onOberteilAuswahl={setOberteilAuswahl}            // NEU
    />
  );
```

## Flow nach Fix

```text
1. User waehlt "T-Shirt" aus
   -> onOberteilAuswahl('tshirt')
   -> state.oberteilAuswahl = 'tshirt' (persistiert)
   
2. User bestaetigt Bestellung
   -> orderedProducts = ['tshirt']
   
3. Komponente rendert neu
   -> oberteilAuswahl = 'tshirt' (aus Props, persistiert!)
   -> getRequiredOberteilIds() = ['tshirt']
   -> isOberteilComplete() = true (weil 'tshirt' in orderedProducts)
   
4. currentProduct = 'schlappen' (naechstes Produkt!)
5. User sieht Schlappen-Bestellung
```

## Produkt-Reihenfolge bestaetigt

Die Produkte in `MOCK_PRODUCTS` sind korrekt konfiguriert:

| Reihenfolge | Produkt-ID | Name |
|-------------|------------|------|
| 1 | oberteil | T-Shirt oder Poloshirt |
| 2 | schlappen | Thermocheck Hausschuhe |
| 3 | pullover | Thermocheck Pullover |
| 4 | ausweiskarte | Thermocheck Ausweiskarte |
| 5 | google-workspace | Google Workspace |

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/types/onboarding.ts` | Neuer Typ `OberteilAuswahl`, Feld in State |
| `src/lib/onboarding-config.ts` | Initial State mit `oberteilAuswahl: null` |
| `src/hooks/useOnboardingState.ts` | Neue Funktion `setOberteilAuswahl` |
| `src/components/onboarding/steps/OrdersStep.tsx` | Props statt lokaler State |
| `src/components/OnboardingScreen.tsx` | Props an OrdersStep weitergeben |

## Validierung der Bestellungen

Im `isStepComplete('bestellungen')` Check:

```typescript
case 'bestellungen':
  // Mindestens 4 Bestellungen (T-Shirt ODER Poloshirt + Schlappen + Pullover + Ausweis + Workspace)
  // Oder 5 wenn "beides" gewaehlt wurde
  const requiredCount = state.oberteilAuswahl === 'beides' ? 6 : 5;
  return state.bestellungenBestaetigt.length >= requiredCount;
```

Korrektur: Die Anzahl haengt von der Oberteil-Auswahl ab:
- T-Shirt nur: ['tshirt', 'schlappen', 'pullover', 'ausweiskarte', 'google-workspace'] = 5
- Poloshirt nur: ['poloshirt', 'schlappen', 'pullover', 'ausweiskarte', 'google-workspace'] = 5
- Beides: ['tshirt', 'poloshirt', 'schlappen', 'pullover', 'ausweiskarte', 'google-workspace'] = 6
