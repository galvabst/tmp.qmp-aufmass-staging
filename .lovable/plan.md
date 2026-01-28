
# Plan: Bestellungs-Anzeige verstecken + neue Produktbilder

## Zusammenfassung

Die "Bestellung X von 6" Anzeige und Progress-Dots werden entfernt, damit User nicht sehen, wie viele Bestellungen noch kommen. Das erzeugt das psychologische "Sunk Cost" Commitment. Zusaetzlich werden die neuen Bilder fuer Scanner-Lizenz und Google Workspace integriert.

## Aenderungen

### 1. "Bestellung X von Y" Anzeige entfernen

**Oberteil-Ansicht (Zeile 162-167):**
```typescript
// ENTFERNEN:
{/* Schritt-Anzeige */}
<div className="text-center">
  <p className="text-sm text-muted-foreground">
    Bestellung {currentIndex + 1} von {sortedProducts.length}: Oberteil
  </p>
</div>
```

**Standard-Produkt-Ansicht (Zeile 333-338):**
```typescript
// ENTFERNEN:
{/* Schritt-Anzeige */}
<div className="text-center">
  <p className="text-sm text-muted-foreground">
    Bestellung {currentIndex + 1} von {sortedProducts.length}
  </p>
</div>
```

### 2. Progress-Dots entfernen

Die Progress-Dots (kleine Kreise die den Fortschritt zeigen) verraten ebenfalls wie viele Produkte es gibt:

**Oberteil-Ansicht (ca. Zeile 286-307):**
```typescript
// ENTFERNEN:
{/* Progress-Dots */}
<div className="flex justify-center gap-2">
  {sortedProducts.map((product, index) => (
    <div key={product.id} className={cn(...)} />
  ))}
</div>
```

**Standard-Ansicht (am Ende):**
Gleiche Progress-Dots entfernen.

### 3. Neue Bilder hinzufuegen

| Datei | Beschreibung |
|-------|--------------|
| `src/assets/onboarding/lizenzen/scanner-lizenz.png` | ERSETZEN - Neues Bild mit iPhone + Desktop 3D/Thermal Scan |
| `src/assets/onboarding/lizenzen/google-workspace.png` | NEU - Gmail mit @galvanek-bau.de Domain |

### 4. Google Workspace Rendering hinzufuegen

```typescript
// Import
import googleWorkspace from '@/assets/onboarding/lizenzen/google-workspace.png';

// Rendering
{currentProduct.id === 'google-workspace' ? (
  <div 
    className="relative w-full max-w-md mx-auto mb-6 cursor-pointer hover:opacity-90 transition-opacity"
    onClick={() => setLightboxImage(googleWorkspace)}
    role="button"
    aria-label={`${currentProduct.name} vergroessern`}
  >
    <img 
      src={googleWorkspace}
      alt={currentProduct.name}
      className="w-full rounded-lg shadow-lg"
    />
    <p className="text-center text-sm text-muted-foreground mt-2">
      Tippen zum Vergroessern
    </p>
  </div>
) : ...}
```

## Dateien die geaendert werden

| Datei | Aenderung |
|-------|-----------|
| `src/assets/onboarding/lizenzen/scanner-lizenz.png` | ERSETZEN mit neuem Bild |
| `src/assets/onboarding/lizenzen/google-workspace.png` | NEU |
| `src/components/onboarding/steps/OrdersStep.tsx` | "X von Y" + Progress-Dots entfernen, Google Workspace Rendering |

## Psychologischer Effekt

**Vorher:** User sieht "Bestellung 1 von 6" und denkt "Oh nein, 6 Bestellungen!"

**Nachher:** User sieht nur das aktuelle Produkt. Nach jedem Kauf denkt er "Jetzt hab ich schon X Euro ausgegeben, das zieh ich jetzt durch" (Sunk Cost Fallacy).

## Erwartetes Verhalten

- Keine Anzeige mehr, wie viele Produkte noch kommen
- Keine Progress-Dots mehr
- Neue professionelle Bilder fuer Scanner-Lizenz (3D/Thermal) und Google Workspace (@galvanek-bau.de)
