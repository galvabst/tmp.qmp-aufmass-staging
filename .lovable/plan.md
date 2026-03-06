

# Fix: Aktivitäts-Diagramm — Zwei separate Liniendiagramme statt ComposedChart

## Problem

Die aktuelle ComposedChart mit zwei Y-Achsen funktioniert schlecht, weil Thermochecks (0-40) und Bewertung (1-5) komplett unterschiedliche Skalen haben. Bei 30+ Checks wird die Bewertungslinie quasi unsichtbar am Boden. Außerdem soll die Bewertung ebenfalls als Liniendiagramm dargestellt werden.

## Lösung

**Zwei separate, gestapelte Liniendiagramme** statt einem kombinierten Chart:

1. **Chart 1 — Thermochecks pro Monat**: Line/AreaChart mit dynamischer Y-Achse (auto-skaliert auf max Checks). Orange Linie mit leichtem Gradient.

2. **Chart 2 — Ø Bewertung pro Monat**: LineChart mit fester Y-Achse 1-5. Grüne Linie mit Dots. `connectNulls={false}` für Monate ohne Bewertung.

Beide teilen dieselbe X-Achse (Monate). Darunter bleibt die Umsatz-Zeile wie bisher.

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/ProfileView.tsx` | ComposedChart → 2 separate Charts |
| `src/features/contractors/ui/ContractorDetailView.tsx` | ComposedChart → 2 separate Charts |

## Details

- Chart 1: `AreaChart` mit `dataKey="checks"`, auto Y-Achse, Höhe ~120px
- Chart 2: `AreaChart` mit `dataKey="avgRating"`, Y-Achse `domain={[0, 5]}`, `ticks={[1,2,3,4,5]}`, Höhe ~100px
- Kleine Labels über jedem Chart ("Thermochecks", "Ø Bewertung")
- Tooltip pro Chart zeigt nur den relevanten Wert
- Umsatz-Zeile bleibt unverändert darunter

