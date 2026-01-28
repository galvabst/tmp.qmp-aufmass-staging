
# Plan: Jackenbilder hinzufuegen + Lightbox-Zoom-Funktion

## Zusammenfassung

Zwei Erweiterungen werden umgesetzt:
1. **Jackenbilder** - Pullover/Zipper vorne + hinten zu den Assets hinzufuegen
2. **Lightbox-Komponente** - Bilder koennen per Klick vergroessert angezeigt werden (fuer Slideshow UND Beispielbilder im ProfileStep)

## Hochgeladene Bilder

| Bild | Verwendung |
|------|------------|
| `image-19.png` | Jacke/Zipper Vorderseite |
| `Gemini_Generated_Image_yioadiyioadiyioa_1.png` | Jacke/Zipper Rueckseite |

## Neue Assets-Struktur

```text
src/assets/onboarding/kleidung/
  ├── tshirt-vorne.png        (vorhanden)
  ├── tshirt-hinten.png       (vorhanden)
  ├── poloshirt-vorne.png     (vorhanden)
  ├── poloshirt-hinten.png    (vorhanden)
  ├── pullover-vorne.png      (NEU)
  └── pullover-hinten.png     (NEU)
```

## Lightbox-Konzept

```text
┌──────────────────────────────────────────────────────────┐
│ [X]                                                      │
│                                                          │
│                                                          │
│           ┌─────────────────────────────────┐            │
│           │                                 │            │
│           │                                 │            │
│           │      [BILD GROSS ANGEZEIGT]     │            │
│           │                                 │            │
│           │                                 │            │
│           └─────────────────────────────────┘            │
│                                                          │
│                    Vorderseite                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Architektur

### 1. Neue Komponente: ImageLightbox

Eine wiederverwendbare Lightbox-Komponente basierend auf dem vorhandenen Dialog:

```tsx
// src/components/ui/image-lightbox.tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageLightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({ src, alt, open, onOpenChange }: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-2 bg-black/95">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
          <DialogDescription>Detailansicht des Bildes</DialogDescription>
        </VisuallyHidden>
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
```

### 2. ProductImageSlideshow erweitern

```tsx
// Bilder werden klickbar
<img
  src={img}
  alt={...}
  className="w-full h-full object-cover cursor-pointer"
  onClick={() => setLightboxImage(img)}
/>

// Lightbox am Ende
<ImageLightbox 
  src={lightboxImage} 
  alt={alt} 
  open={!!lightboxImage}
  onOpenChange={() => setLightboxImage(null)}
/>
```

### 3. ProfileStep erweitern

```tsx
// Beispielbilder klickbar machen
const [lightboxImage, setLightboxImage] = useState<string | null>(null);

<img 
  src={fotoGut} 
  alt="Gutes Beispiel" 
  className="... cursor-pointer hover:scale-105 transition-transform"
  onClick={() => setLightboxImage(fotoGut)}
/>

<ImageLightbox 
  src={lightboxImage || ''} 
  alt="Beispielbild"
  open={!!lightboxImage}
  onOpenChange={() => setLightboxImage(null)}
/>
```

### 4. OrdersStep mit Jacken-Slideshow

Das Pullover-Produkt bekommt die neuen Bilder:

```typescript
// In onboarding-config.ts
{
  id: 'pullover',
  name: 'Thermocheck Pullover',
  beschreibung: 'Warme Arbeitskleidung fuer kalte Tage',
  bildUrls: [pulloverVorne, pulloverHinten], // NEU
  // ...
}
```

## Dateien die erstellt/geaendert werden

| Datei | Aktion |
|-------|--------|
| `src/assets/onboarding/kleidung/pullover-vorne.png` | Neu (kopiert) |
| `src/assets/onboarding/kleidung/pullover-hinten.png` | Neu (kopiert) |
| `src/components/ui/image-lightbox.tsx` | Neu (Lightbox-Komponente) |
| `src/components/onboarding/ProductImageSlideshow.tsx` | Erweitert (Klick -> Lightbox) |
| `src/components/onboarding/steps/ProfileStep.tsx` | Erweitert (Beispielbilder klickbar) |
| `src/components/onboarding/steps/OrdersStep.tsx` | Pullover-Bilder importieren |
| `src/lib/onboarding-config.ts` | Pullover mit bildUrls |

## Technische Details

### ImageLightbox Features

- Basiert auf bestehendem Radix Dialog
- Dunkler Overlay-Hintergrund
- X-Button zum Schliessen
- Klick ausserhalb schliesst
- Responsive: Bild passt sich an Bildschirmgroesse an
- Touch-freundlich fuer Mobile

### Accessibility

- VisuallyHidden fuer DialogTitle/Description (Radix erfordert dies)
- aria-label fuer klickbare Bilder
- Fokus-Management durch Radix Dialog

## Reihenfolge der Implementation

1. Jackenbilder in Assets kopieren
2. ImageLightbox Komponente erstellen
3. ProductImageSlideshow mit Lightbox erweitern
4. ProfileStep mit Lightbox erweitern
5. OrdersStep: Pullover-Bilder importieren
6. onboarding-config: Pullover bildUrls hinzufuegen
