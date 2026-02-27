

# Info-Banner auf der Bestellseite

## Aenderung

**Datei:** `src/components/onboarding/steps/OrdersStep.tsx`

Ein Info-Banner oberhalb der Produktkarten einfuegen (vor dem `<div className="bg-card rounded-2xl ...">`) — sowohl in der Oberteil-Ansicht als auch in der Standard-Produkt-Ansicht.

### Design

Dezentes Info-Banner mit hellblauem/neutralem Hintergrund, abgerundete Ecken, Info-Icon (`Info` von lucide-react). Drei kurze Punkte:

1. **Individualdruck** — Alle Kleidungsstuecke werden mit deinem Namen individuell bedruckt
2. **Faire Preise** — Wir geben die Preise der Druckerei 1:1 an dich weiter, ohne Aufschlag
3. **Steuerlich absetzbar** — Die Kosten koennten als Betriebsausgaben absetzbar sein — bitte sprich das mit deinem Steuerberater ab

### Komponente

Neue Komponente `PriceInfoBanner` direkt in `OrdersStep.tsx` (oder als separate kleine Datei). Wird nur bei Kleidungs-Produkten angezeigt (nicht bei Lizenzen wie Scanner/Google Workspace).

### Platzierung

- **Oberteil-Ansicht (Zeile ~197):** Direkt nach `<div className="space-y-6">`, vor den Auswahl-Buttons
- **Standard-Produkt-Ansicht (Zeile ~436):** Direkt nach `<div className="space-y-6">`, vor der Produkt-Card — aber nur wenn `currentProduct` ein Kleidungsprodukt ist (`tshirt`, `poloshirt`, `pullover`, `schlappen`, `ausweiskarte`)
- **Beides-Ansicht (Zeile ~349):** Nach dem "Auswahl aendern"-Button

### Code-Skizze

```tsx
function PriceInfoBanner() {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-2.5">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="space-y-1.5 text-sm text-blue-900">
          <p><span className="font-medium">Individualdruck</span> — Jedes Stueck wird mit deinem Namen personalisiert</p>
          <p><span className="font-medium">Faire Preise</span> — Druckereipreise 1:1 weitergegeben, ohne Aufschlag</p>
          <p><span className="font-medium">Steuerlich absetzbar?</span> — Die Kosten koennten als Betriebsausgaben absetzbar sein. Sprich das bitte mit deinem Steuerberater ab.</p>
        </div>
      </div>
    </div>
  );
}
```

### Sichtbarkeit

Nur bei Kleidungsprodukten anzeigen. Bei Lizenzen (scanner-lizenz, google-workspace) und Coaching nicht anzeigen — dort passt "Individualdruck" und "Druckereipreise" nicht.

| Aktion | Datei |
|---|---|
| Aendern | `src/components/onboarding/steps/OrdersStep.tsx` |

