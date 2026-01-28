
# Plan: Ausweiskarte-Bilder hinzufuegen

## Zusammenfassung

Die beiden hochgeladenen Bilder (Vorderseite und Rueckseite der Thermocheck-Ausweiskarte) werden in das Projekt kopiert und in der Produkt-Slideshow angezeigt - genau wie bei T-Shirt, Poloshirt und Pullover.

## Bilder

| Bild | Beschreibung |
|------|--------------|
| Vorderseite | Profilfoto, Name, "Thermocheck 3D", Telefon, DUMMY-ID |
| Rueckseite | Galvanek Logo, www.galvanek-bau.de |

## Aenderungen

### 1. Bilder in Projekt kopieren

Die beiden Bilder werden nach `src/assets/onboarding/kleidung/` kopiert:

```text
src/assets/onboarding/kleidung/
  ├── ausweiskarte-vorne.png  (NEU - Vorderseite)
  ├── ausweiskarte-hinten.png (NEU - Rueckseite)
  ├── tshirt-vorne.png
  ├── tshirt-hinten.png
  ├── poloshirt-vorne.png
  ├── poloshirt-hinten.png
  ├── pullover-vorne.png
  ├── pullover-hinten.png
  └── schlappen.png
```

### 2. Imports in OrdersStep.tsx hinzufuegen

```typescript
// Bestehende Imports
import tshirtVorne from '@/assets/onboarding/kleidung/tshirt-vorne.png';
// ...

// NEU: Ausweiskarte-Bilder
import ausweiskarteVorne from '@/assets/onboarding/kleidung/ausweiskarte-vorne.png';
import ausweiskarteHinten from '@/assets/onboarding/kleidung/ausweiskarte-hinten.png';

// NEU: Konstante fuer Slideshow
export const AUSWEISKARTE_BILDER = [ausweiskarteVorne, ausweiskarteHinten];
```

### 3. Rendering-Logik erweitern

Im Standard-Produkt-Bereich (ab Zeile 336) wird eine neue Bedingung fuer die Ausweiskarte hinzugefuegt:

```typescript
{/* Produktbild - mit Slideshow falls mehrere Bilder */}
{currentProduct.id === 'schlappen' ? (
  // Einzelbild fuer Schlappen
) : currentProduct.id === 'pullover' ? (
  <ProductImageSlideshow images={PULLOVER_BILDER} ... />
) : currentProduct.id === 'ausweiskarte' ? (
  // NEU: Slideshow fuer Ausweiskarte
  <ProductImageSlideshow
    images={AUSWEISKARTE_BILDER}
    alt={currentProduct.name}
    className="mb-6"
  />
) : currentProduct.bildUrls && currentProduct.bildUrls.length > 1 ? (
  // Dynamische bildUrls
) : (
  // Fallback einzelnes Bild
)}
```

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/assets/onboarding/kleidung/ausweiskarte-vorne.png` | NEU - Kopie von Upload |
| `src/assets/onboarding/kleidung/ausweiskarte-hinten.png` | NEU - Kopie von Upload |
| `src/components/onboarding/steps/OrdersStep.tsx` | Imports + Rendering-Logik |

## Erwartetes Ergebnis

Wenn der User zur Ausweiskarte-Bestellung kommt, sieht er:
- Eine Slideshow mit Vorder- und Rueckseite
- Slide-Indicator (Punkte) wie bei T-Shirt/Poloshirt/Pullover
- Klickbare Bilder fuer Lightbox-Vergroesserung
