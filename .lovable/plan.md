
# Plan: Schlappen-Bild hinzufuegen

## Zusammenfassung

Das hochgeladene Bild der Thermocheck-Hausschuhe wird in die Assets integriert und im Bestellungs-Flow angezeigt.

## Hochgeladenes Bild

| Bild | Verwendung |
|------|------------|
| `image-20.png` | Thermocheck Hausschuhe (Schlappen) |

## Neue Asset-Struktur

```text
src/assets/onboarding/kleidung/
  ├── tshirt-vorne.png        (vorhanden)
  ├── tshirt-hinten.png       (vorhanden)
  ├── poloshirt-vorne.png     (vorhanden)
  ├── poloshirt-hinten.png    (vorhanden)
  ├── pullover-vorne.png      (vorhanden)
  ├── pullover-hinten.png     (vorhanden)
  └── schlappen.png           (NEU)
```

## Aenderungen

### 1. Bild in Assets kopieren

Das Schlappen-Bild wird nach `src/assets/onboarding/kleidung/schlappen.png` kopiert.

### 2. OrdersStep.tsx erweitern

```typescript
// Neuer Import
import schlappen from '@/assets/onboarding/kleidung/schlappen.png';

// Bei der Standard-Produkt-Ansicht fuer 'schlappen'
{currentProduct.id === 'schlappen' ? (
  <div className="aspect-square max-w-xs mx-auto rounded-xl bg-muted overflow-hidden mb-6">
    <img
      src={schlappen}
      alt={currentProduct.name}
      className="w-full h-full object-contain cursor-pointer"
      onClick={() => setLightboxImage(schlappen)}
    />
  </div>
) : ...}
```

### 3. Lightbox-Funktion integrieren

Das Schlappen-Bild wird klickbar gemacht, um es in der Lightbox vergroessert anzuzeigen (wie bereits bei den anderen Produktbildern).

## Dateien die geaendert werden

| Datei | Aktion |
|-------|--------|
| `src/assets/onboarding/kleidung/schlappen.png` | Neu (kopiert) |
| `src/components/onboarding/steps/OrdersStep.tsx` | Import + Spezialfall fuer Schlappen mit Lightbox |

## Hinweis

Da nur ein Bild vorhanden ist, wird keine Slideshow benoetigt. Das Bild wird aber trotzdem klickbar sein, damit man es in der Lightbox im Detail betrachten kann.
