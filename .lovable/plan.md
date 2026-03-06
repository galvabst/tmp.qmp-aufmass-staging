

# Fix: Header-Transparenz in BookingsView

## Problem
Der sticky Header in `BookingsView.tsx` nutzt `from-primary to-primary/85` — die 85% Opacity am Ende des Gradients lässt darunter liegende Karten-Inhalte (Preise, Text) durchscheinen beim Scrollen.

## Lösung

In `src/components/BookingsView.tsx`, Zeile 45:

**Vorher:**
```
bg-gradient-to-br from-primary to-primary/85
```

**Nachher:**
```
bg-gradient-to-br from-primary to-primary/90
```

Zusätzlich ein `backdrop-blur-sm` als Fallback hinzufügen, damit bei schnellem Scroll nichts durchschimmert. Der Gradient bleibt visuell erhalten, aber die Opacity wird von 85% auf 90% erhöht und mit Blur abgesichert.

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/components/BookingsView.tsx` | Header-Gradient Opacity erhöhen + backdrop-blur |

