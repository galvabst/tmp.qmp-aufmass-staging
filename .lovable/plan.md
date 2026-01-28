
# Plan: T-Shirt & Poloshirt Auswahl mit Slideshow

## Zusammenfassung

Das Oberteile-Bestellmodul wird erweitert:
1. **Produktbilder** - 4 echte Bilder (T-Shirt vorne/hinten, Poloshirt vorne/hinten)
2. **Slideshow-Ansicht** - Vorder- und Rückseite per Swipe/Klick wechselbar
3. **Auswahl-Logik** - User kann T-Shirt, Poloshirt oder beides bestellen

## Hochgeladene Bilder

| Bild | Verwendung |
|------|------------|
| `image-15.png` | T-Shirt Vorderseite |
| `image-16.png` | T-Shirt Rückseite |
| `image-17.png` | Poloshirt Vorderseite |
| `image-18.png` | Poloshirt Rückseite |

## UI-Konzept

```text
┌──────────────────────────────────────────────────────────┐
│                    Bestellungen                          │
│              Bestellung 1 von 5: Oberteil                │
│                                                          │
│  Was moechtest du bestellen?                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  [x] T-Shirt        [ ] Poloshirt       [ ] Beides  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │            < [Produktbild Slideshow] >             │  │
│  │              Vorderseite / Rueckseite              │  │
│  │                     ○ ●                            │  │
│  │                                                    │  │
│  │         Thermocheck T-Shirt                        │  │
│  │                                                    │  │
│  │    Hochwertige Arbeitskleidung mit deinem          │  │
│  │    Namen und Thermocheck-Branding                  │  │
│  │                                                    │  │
│  │              Preis im Shop (einmalig)              │  │
│  │                                                    │  │
│  │    ┌────────────────────────────────────────┐     │  │
│  │    │         Jetzt bestellen                 │     │  │
│  │    └────────────────────────────────────────┘     │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│           ○ ○ ○ ○ ○  (Progress-Dots)                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Architektur-Aenderungen

### 1. Neue Asset-Struktur

```text
src/assets/onboarding/kleidung/
  ├── tshirt-vorne.png
  ├── tshirt-hinten.png
  ├── poloshirt-vorne.png
  └── poloshirt-hinten.png
```

### 2. Produkt-Datenmodell erweitern

Aktuell hat `OnboardingProduct` nur ein `bildUrl`. Fuer die Slideshow brauchen wir mehrere Bilder:

```typescript
// In src/types/onboarding.ts
export interface OnboardingProduct {
  id: string;
  name: string;
  beschreibung: string;
  // ... bestehende Felder
  bildUrl?: string;
  bildUrls?: string[]; // NEU: Array fuer Slideshow (vorne, hinten)
}
```

### 3. Neue Produktstruktur (Oberteil-Auswahl)

Das erste Produkt wird zu einem "Auswahl-Produkt":

```typescript
// Neuer Produkt-Typ fuer Kleidungsauswahl
export interface ClothingVariant {
  id: string;
  name: string;
  bildUrls: string[]; // [vorne, hinten]
}

// Produkt mit Varianten
{
  id: 'oberteil',
  name: 'Thermocheck Oberteil',
  beschreibung: 'Wähle dein Oberteil: T-Shirt, Poloshirt oder beides',
  produktTyp: 'kleidung',
  varianten: [
    { id: 'tshirt', name: 'T-Shirt', bildUrls: ['...vorne', '...hinten'] },
    { id: 'poloshirt', name: 'Poloshirt', bildUrls: ['...vorne', '...hinten'] },
  ],
  // User kann 'tshirt', 'poloshirt' oder 'beides' waehlen
}
```

## Komponenten-Struktur

### Neue Komponente: ProductImageSlideshow

```tsx
// src/components/onboarding/ProductImageSlideshow.tsx
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface ProductImageSlideshowProps {
  images: string[];
  alt: string;
}

export function ProductImageSlideshow({ images, alt }: ProductImageSlideshowProps) {
  return (
    <Carousel className="w-full max-w-xs mx-auto">
      <CarouselContent>
        {images.map((img, index) => (
          <CarouselItem key={index}>
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted">
              <img 
                src={img} 
                alt={`${alt} - ${index === 0 ? 'Vorderseite' : 'Rueckseite'}`}
                className="w-full h-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      {/* Progress-Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {images.map((_, index) => (
          <div 
            key={index} 
            className="w-2 h-2 rounded-full bg-muted"
          />
        ))}
      </div>
    </Carousel>
  );
}
```

### OrdersStep.tsx - Oberteil-Auswahl Logik

```tsx
// Spezielle Behandlung fuer Oberteil-Schritt
const [oberteilAuswahl, setOberteilAuswahl] = useState<'tshirt' | 'poloshirt' | 'beides' | null>(null);

// Bei Oberteil-Produkt: Auswahl-UI anzeigen
{currentProduct.id === 'oberteil' && (
  <div className="flex gap-2 justify-center mb-4">
    <Button 
      variant={oberteilAuswahl === 'tshirt' ? 'default' : 'outline'}
      onClick={() => setOberteilAuswahl('tshirt')}
    >
      T-Shirt
    </Button>
    <Button 
      variant={oberteilAuswahl === 'poloshirt' ? 'default' : 'outline'}
      onClick={() => setOberteilAuswahl('poloshirt')}
    >
      Poloshirt
    </Button>
    <Button 
      variant={oberteilAuswahl === 'beides' ? 'default' : 'outline'}
      onClick={() => setOberteilAuswahl('beides')}
    >
      Beides
    </Button>
  </div>
)}
```

## Dateien die erstellt/geaendert werden

| Datei | Aktion |
|-------|--------|
| `src/assets/onboarding/kleidung/tshirt-vorne.png` | Neu (kopiert) |
| `src/assets/onboarding/kleidung/tshirt-hinten.png` | Neu (kopiert) |
| `src/assets/onboarding/kleidung/poloshirt-vorne.png` | Neu (kopiert) |
| `src/assets/onboarding/kleidung/poloshirt-hinten.png` | Neu (kopiert) |
| `src/types/onboarding.ts` | Erweitert (bildUrls Array, ClothingVariant) |
| `src/lib/onboarding-config.ts` | Produkte mit echten Bildern und Varianten |
| `src/components/onboarding/ProductImageSlideshow.tsx` | Neu (Carousel-Wrapper) |
| `src/components/onboarding/steps/OrdersStep.tsx` | Erweitert (Oberteil-Auswahl, Slideshow) |

## Technische Details

### Import der Bilder in OrdersStep

```typescript
// Dynamischer Import basierend auf Produkt
import tshirtVorne from '@/assets/onboarding/kleidung/tshirt-vorne.png';
import tshirtHinten from '@/assets/onboarding/kleidung/tshirt-hinten.png';
import poloshirtVorne from '@/assets/onboarding/kleidung/poloshirt-vorne.png';
import poloshirtHinten from '@/assets/onboarding/kleidung/poloshirt-hinten.png';

const OBERTEIL_BILDER = {
  tshirt: [tshirtVorne, tshirtHinten],
  poloshirt: [poloshirtVorne, poloshirtHinten],
};
```

### Bestell-Flow bei "Beides"

Wenn User "Beides" waehlt:
1. Beide Produkt-IDs werden zur `bestellungenBestaetigt` Liste hinzugefuegt
2. Im Admin-Task werden beide Produkte als separate Zeilen erstellt
3. UI zeigt beide Varianten als bestellt an

### Slideshow-Verhalten

- Embla Carousel (bereits im Projekt vorhanden)
- Swipe-Unterstuetzung fuer Mobile
- Dots fuer aktuelle Position
- Optional: Prev/Next Buttons fuer Desktop

## Reihenfolge der Implementation

1. Bilder in Assets kopieren
2. Type-Definition erweitern (bildUrls)
3. ProductImageSlideshow Komponente erstellen
4. MOCK_PRODUCTS mit echten Bildern aktualisieren
5. OrdersStep mit Oberteil-Auswahl erweitern
6. Integration testen
