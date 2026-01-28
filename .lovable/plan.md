

# Plan: Room Scanner Lizenz Bild hinzufuegen

## Zusammenfassung

Das hochgeladene Bild zeigt die "Advanced Spatial & Thermal Analytics Suite" - die Room Scanner Software-Lizenz. Es wird als Produktbild im Bestellungs-Flow angezeigt.

## Bild-Details

| Element | Beschreibung |
|---------|--------------|
| Logo | Galvanek Energiesysteme |
| Titel | Advanced Spatial & Thermal Analytics Suite |
| Untertitel | Professional License // Tier: Enterprise |
| Module | Precision 3D Geometry Scan, Dynamic Heat Load Calculation |
| Status | Validated & Secure |

## Aenderungen

### 1. Bild in Projekt kopieren

```text
src/assets/onboarding/lizenzen/
  └── scanner-lizenz.png (NEU)
```

Neuer Ordner `lizenzen/` fuer Software-Produkte (Trennung von Kleidung).

### 2. Import in OrdersStep.tsx

```typescript
// NEU: Lizenz-Bilder
import scannerLizenz from '@/assets/onboarding/lizenzen/scanner-lizenz.png';
```

### 3. Rendering-Logik erweitern

Im Standard-Produkt-Bereich eine Bedingung fuer die Scanner-Lizenz hinzufuegen:

```typescript
{currentProduct.id === 'scanner-lizenz' ? (
  // Einzelbild fuer Scanner-Lizenz (kein Slideshow noetig)
  <div 
    className="relative w-full max-w-md mx-auto mb-6 cursor-pointer"
    onClick={() => setLightboxImage(scannerLizenz)}
  >
    <img 
      src={scannerLizenz}
      alt={currentProduct.name}
      className="w-full rounded-lg shadow-lg"
    />
  </div>
) : currentProduct.id === 'ausweiskarte' ? (
  // ... bestehender Code
)}
```

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/assets/onboarding/lizenzen/scanner-lizenz.png` | NEU - Kopie von Upload |
| `src/components/onboarding/steps/OrdersStep.tsx` | Import + Rendering fuer scanner-lizenz |

## Erwartetes Ergebnis

Wenn der User zur Scanner-Lizenz-Bestellung kommt (nach Ausweiskarte, vor Google Workspace), sieht er:
- Das professionelle Lizenzbild mit Galvanek-Branding
- Klickbar fuer Lightbox-Vergroesserung
- Produktinfos: 199 Euro/Monat, monatliche Lizenz

