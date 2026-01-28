
# Plan: Step-by-Step Bestellungen im Onboarding

## Zusammenfassung

Die Bestellungen werden von einer **Übersichtsseite** (alle Produkte auf einmal) in einen **sequentiellen Wizard** umgebaut:

1. T-Shirt → 2. Schlappen → 3. Pullover → 4. Ausweiskarte → 5. Google Workspace

Jedes Produkt wird einzeln angezeigt. Erst nach Bestätigung einer Bestellung erscheint das nächste Produkt. Außerdem wird die Google Workspace E-Mail-Domain von `@thermocheck.de` auf `@galvanic-bau.de` korrigiert.

## Aktuelle Produktliste (MOCK_PRODUCTS)

| Aktuell | Neu |
|---------|-----|
| Raumscanner-Lizenz | T-Shirt |
| Google Workspace | Schlappen |
| Kleidung-Paket | Pullover |
| - | Ausweiskarte |
| - | Google Workspace (@galvanic-bau.de) |

## UI-Konzept

```text
┌──────────────────────────────────────────────────────────┐
│                    Bestellungen                          │
│              Schritt 1 von 5: T-Shirt                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │              [Produktbild]                         │  │
│  │                                                    │  │
│  │         Thermocheck T-Shirt                        │  │
│  │                                                    │  │
│  │    Hochwertige Arbeitskleidung mit deinem          │  │
│  │    Namen und Thermocheck-Branding                  │  │
│  │                                                    │  │
│  │              XX,XX € (einmalig)                    │  │
│  │                                                    │  │
│  │    ┌────────────────────────────────────────┐     │  │
│  │    │         🛒 Jetzt bestellen              │     │  │
│  │    └────────────────────────────────────────┘     │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│           ○ ○ ○ ○ ○  (Progress-Dots)                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Nach Klick auf "Jetzt bestellen":
1. Externer Link öffnet sich
2. Dialog fragt "Hast du bestellt?"
3. Bei "Ja" → Nächstes Produkt erscheint
4. Bei "Nein" → Bleibt auf aktuellem Produkt

## Architektur-Änderungen

### Neue Datei: `src/components/onboarding/steps/OrdersStep.tsx`

Komplett neu strukturiert mit:
- `currentProductIndex` State für sequentielle Anzeige
- Fortschrittsanzeige (Dots oder Progress-Bar)
- Einzelprodukt-Fokus statt Liste

### Änderungen in `src/lib/onboarding-config.ts`

```typescript
export const MOCK_PRODUCTS: OnboardingProduct[] = [
  {
    id: 'tshirt',
    name: 'Thermocheck T-Shirt',
    beschreibung: 'Hochwertige Arbeitskleidung mit deinem Namen',
    preisNetto: 0,
    preisBrutto: 0, // Aus DB
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    externLink: 'https://shop.thermocheck.de/tshirt',
    pflicht: true,
    reihenfolge: 1,
  },
  {
    id: 'schlappen',
    name: 'Thermocheck Hausschuhe',
    beschreibung: 'Bequeme Hausschuhe für Kundenbesuche',
    preisNetto: 0,
    preisBrutto: 0,
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    externLink: 'https://shop.thermocheck.de/schlappen',
    pflicht: true,
    reihenfolge: 2,
  },
  {
    id: 'pullover',
    name: 'Thermocheck Pullover',
    beschreibung: 'Warme Arbeitskleidung für kalte Tage',
    preisNetto: 0,
    preisBrutto: 0,
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    externLink: 'https://shop.thermocheck.de/pullover',
    pflicht: true,
    reihenfolge: 3,
  },
  {
    id: 'ausweiskarte',
    name: 'Thermocheck Ausweiskarte',
    beschreibung: 'Offizielle Ausweiskarte für Kundenbesuche',
    preisNetto: 0,
    preisBrutto: 0,
    preisTyp: 'einmalig',
    produktTyp: 'kleidung',
    externLink: 'https://shop.thermocheck.de/ausweiskarte',
    pflicht: true,
    reihenfolge: 4,
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    beschreibung: 'Deine @galvanic-bau.de E-Mail-Adresse',  // GEÄNDERT!
    preisNetto: 29.40,
    preisBrutto: 34.99,
    preisTyp: 'monatlich',
    produktTyp: 'lizenz',
    externLink: 'https://shop.thermocheck.de/workspace',
    pflicht: true,
    reihenfolge: 5,
  },
];
```

### Änderungen in `src/hooks/useOnboardingState.ts`

```typescript
// Schritt 3: Bestellungen - isStepComplete anpassen
case 'bestellungen':
  // Alle 5 Pflichtprodukte müssen bestellt sein
  return state.bestellungenBestaetigt.length >= 5;
```

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/lib/onboarding-config.ts` | MOCK_PRODUCTS komplett neu mit 5 Produkten |
| `src/components/onboarding/steps/OrdersStep.tsx` | Neues Step-by-Step UI statt Liste |
| `src/hooks/useOnboardingState.ts` | `isStepComplete` für 5 Produkte anpassen |

## Technische Details

### OrdersStep.tsx - Neue Struktur

```tsx
export function OrdersStep({ products, orderedProducts, onProductOrder }: OrdersStepProps) {
  const [confirmingProduct, setConfirmingProduct] = useState<OnboardingProduct | null>(null);
  
  // Sortiere Produkte nach Reihenfolge
  const sortedProducts = [...products].sort((a, b) => a.reihenfolge - b.reihenfolge);
  
  // Finde das aktuelle (nächste nicht-bestellte) Produkt
  const currentProduct = sortedProducts.find(p => !orderedProducts.includes(p.id));
  const currentIndex = sortedProducts.findIndex(p => p.id === currentProduct?.id);
  
  // Wenn alle bestellt sind
  if (!currentProduct) {
    return (
      <div className="text-center py-8">
        <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Alle Bestellungen abgeschlossen!</h3>
        <p className="text-muted-foreground mt-2">
          Du kannst jetzt zum nächsten Schritt gehen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schritt-Anzeige */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Schritt {currentIndex + 1} von {sortedProducts.length}
        </p>
      </div>

      {/* Einzelnes Produkt groß darstellen */}
      <div className="bg-card rounded-2xl p-6 shadow-lg">
        {/* Produktbild */}
        <div className="aspect-square max-w-xs mx-auto rounded-xl bg-muted overflow-hidden mb-6">
          <img 
            src={currentProduct.bildUrl || '/placeholder.svg'} 
            alt={currentProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Produkt-Info */}
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-bold">{currentProduct.name}</h3>
          <p className="text-muted-foreground">{currentProduct.beschreibung}</p>
          
          {/* Preis */}
          <div className="flex items-center justify-center gap-2">
            {currentProduct.preisBrutto > 0 ? (
              <span className="text-2xl font-bold">
                {currentProduct.preisBrutto.toLocaleString('de-DE', { 
                  style: 'currency', 
                  currency: 'EUR' 
                })}
              </span>
            ) : (
              <span className="text-2xl font-bold">Preis im Shop</span>
            )}
            <Badge variant="secondary">
              {currentProduct.preisTyp === 'monatlich' ? '/Monat' : 'einmalig'}
            </Badge>
          </div>
        </div>

        {/* Bestell-Button */}
        <Button
          size="lg"
          className="w-full mt-6"
          onClick={() => {
            window.open(currentProduct.externLink, '_blank');
            setConfirmingProduct(currentProduct);
          }}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Jetzt bestellen
        </Button>
      </div>

      {/* Progress-Dots */}
      <div className="flex justify-center gap-2">
        {sortedProducts.map((product, index) => (
          <div
            key={product.id}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              orderedProducts.includes(product.id)
                ? 'bg-green-500'
                : index === currentIndex
                  ? 'bg-primary'
                  : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Bestätigungs-Dialog */}
      <AlertDialog 
        open={!!confirmingProduct} 
        onOpenChange={() => setConfirmingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestellung abgeschlossen?</AlertDialogTitle>
            <AlertDialogDescription>
              Hast du <strong>{confirmingProduct?.name}</strong> im Shop bestellt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nein, noch nicht</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmingProduct) {
                onProductOrder(confirmingProduct.id);
                setConfirmingProduct(null);
              }
            }}>
              Ja, bestellt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

## Reihenfolge der Bestellungen

1. **T-Shirt** - Thermocheck T-Shirt mit Namen
2. **Schlappen** - Thermocheck Hausschuhe
3. **Pullover** - Thermocheck Pullover/Zipper
4. **Ausweiskarte** - Offizielle Thermocheck-Ausweiskarte
5. **Google Workspace** - @galvanic-bau.de E-Mail-Adresse (34,99€/Monat)

## Hinweis: E-Mail-Domain

Gemäß Anforderung wird die E-Mail-Domain von `@thermocheck.de` auf `@galvanic-bau.de` geändert.
