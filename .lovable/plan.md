

# Thermochecks-Chart: Linie statt Area + dynamische Y-Achse

## Problem

1. Der Thermochecks-Chart ist ein AreaChart (gefüllte Fläche), soll aber ein **Liniendiagramm** sein
2. Die Y-Achse ist nicht dynamisch — bei Technikern mit 30-40 Checks/Monat muss sie automatisch skalieren (kein festes Maximum)

## Lösung

Beide Charts (ProfileView + ContractorDetailView) ändern:

- **Thermochecks**: `AreaChart` → `LineChart` mit `Line` statt `Area`. Y-Achse bleibt `allowDecimals={false}` ohne festes `domain` — recharts skaliert automatisch
- **Bewertung**: Ebenfalls `AreaChart` → `LineChart` mit `Line`. Y-Achse bleibt fix bei `domain={[0, 5]}`
- Beide behalten Dots, Tooltip und CartesianGrid

Import `LineChart, Line` statt `AreaChart, Area` aus recharts. Die `defs`/`linearGradient` entfallen.

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/ProfileView.tsx` | AreaChart → LineChart für beide Charts |
| `src/features/contractors/ui/ContractorDetailView.tsx` | AreaChart → LineChart für beide Charts |

