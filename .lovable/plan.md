

# Fix: "Auswahl ändern"-Button für Oberteil-Auswahl hinzufügen

## Problem

Nachdem der Nutzer im Bestellungen-Schritt eine Oberteil-Auswahl getroffen hat (T-Shirt, Poloshirt oder Beides), gibt es keine Möglichkeit, diese Entscheidung zu revidieren. Der Nutzer muss das gewählte Produkt bestellen, um weiterzukommen.

## Lösung

Einen kleinen "Auswahl ändern"-Link/Button oberhalb der Produkt-Card hinzufügen, der die `oberteilAuswahl` zurücksetzt.

## Technische Details

### Betroffene Datei
`src/components/onboarding/steps/OrdersStep.tsx`

### Änderung
Im Abschnitt "Bestell-Ansicht nach Auswahl" (ca. Zeile 275-324) einen Link hinzufügen, der:
1. Nur angezeigt wird, wenn noch KEIN Oberteil bestellt wurde
2. Die `oberteilAuswahl` auf `null` zurücksetzt via `onOberteilAuswahl(null)`

### UI-Design
- Kleiner Text-Link unterhalb der "1 von 2" Anzeige oder als eigene Zeile
- Icon: Pfeil zurück oder Stift-Symbol
- Text: "Auswahl ändern" oder "Andere Variante wählen"
- Nicht anzeigen, wenn bereits ein Oberteil bestellt wurde (sonst Widerspruch)

## Vorschau der Änderung

```text
┌─────────────────────────────────────────────┐
│  [Falls "beides"]: 1 von 2: T-Shirt         │
│                                             │
│  ← Auswahl ändern    ← NEU: Dieser Link     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │      [Produkt-Slideshow]            │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Thermocheck T-Shirt                        │
│  Größe auswählen: [XS] [S] [M] [L] [XL]     │
│  [        Jetzt bestellen        ]          │
└─────────────────────────────────────────────┘
```

## Logik

```text
Kann Auswahl ändern?
├── oberteilAuswahl ist gesetzt (nicht null)?
│   └── JA
│       ├── Bereits ein Oberteil bestellt?
│       │   └── JA → Kein Button (zu spät zum Ändern)
│       │   └── NEIN → Button anzeigen
│   └── NEIN → Kein Button nötig (Auswahl-Screen wird gezeigt)
```

## Implementierung

In `OrdersStep.tsx` zwischen Zeile 275 und 276 einfügen:
- Prüfung: `oberteilAuswahl && !orderedProducts.includes('tshirt') && !orderedProducts.includes('poloshirt')`
- Button mit `onClick={() => onOberteilAuswahl(null)}`

