

# Info-Banner — Apple-Redesign

## Problem

Aktuell: 4 Icons (Info + Palette + BadgeEuro + Receipt) in einer kleinen Box → visuell überladen, nicht minimalistisch.

## Apple-Ansatz

- **Ein** Icon (Info), kein Icon-Spam
- Fließtext statt drei separate Blöcke mit Icons
- Subtilere Farben — kein `border`, nur leichter Hintergrund
- Kompakter, weniger "laut"

## Neue Version

```tsx
function PriceInfoBanner() {
  return (
    <div className="rounded-2xl bg-muted/50 px-5 py-4">
      <div className="flex gap-3">
        <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Jedes Kleidungsstück wird <span className="text-foreground font-medium">individuell mit deinem Namen</span> bedruckt. 
          Die Druckereipreise geben wir <span className="text-foreground font-medium">1:1 ohne Aufschlag</span> weiter. 
          Die Kosten könnten als Betriebsausgaben absetzbar sein — sprich das mit deinem Steuerberater ab.
        </p>
      </div>
    </div>
  );
}
```

## Änderung

**Datei:** `src/components/onboarding/steps/OrdersStep.tsx`

- `PriceInfoBanner` Komponente ersetzen (Zeilen 49-73)
- Imports aufräumen: `Palette`, `BadgeEuro`, `Receipt` entfernen (nicht mehr benötigt)
- Platzierung bleibt identisch

