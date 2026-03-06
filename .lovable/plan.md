

# Farbige Progress-Bars: Kontingent + Pünktlichkeit

## Kontingent-Balken (Dual-Segment)

Der aktuelle einfarbige `<Progress>` wird durch einen **Custom-Doppelbalken** ersetzt:
- **Tiefes Orange** (links): Abgenommene Aufträge (z.B. 5/24)
- **Pastell-Orange** (rechts daneben): Restliche angenommene, aber noch nicht abgenommene (z.B. 10/24)
- **Grauer Hintergrund**: Verbleibend bis Ziel

Implementierung als eigener `<div>`-basierter Balken statt `<Progress>`, da zwei Segmente nötig sind.

## Pünktlichkeits-Balken (Farbstufen)

Der `<Progress>` für Pünktlichkeit bekommt eine **dynamische Farbe** basierend auf dem Prozentsatz:
- **Grün** (`bg-green-500`): ≥ 85%
- **Orange** (`bg-orange-500`): 70–84%
- **Rot** (`bg-destructive`): < 70%

Die Textfarbe der Prozentzahl passt sich analog an.

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/components/ProfileView.tsx` | Kontingent: Custom Dual-Bar; Pünktlichkeit: Farbstufen-Logik |

