

# "In Verzug" KPI klickbar machen — Verzug-Liste anzeigen

## Umsetzung

### 1. KpiCard um `onClick` erweitern

Die `KpiCard`-Komponente bekommt einen optionalen `onClick`-Handler. Wenn gesetzt, wird der Cursor zu `pointer` und die Karte klickbar.

### 2. Dialog mit Verzug-Technikern

Beim Klick auf "In Verzug" öffnet sich ein Dialog/Sheet mit der Liste aller Techniker in Verzug. Jeder Eintrag zeigt:
- Avatar + Name
- Erstellt am / Tage seit Erstellung
- Aktueller Onboarding-Schritt
- Akademie-Fortschritt (x/y Lektionen)

Klick auf einen Eintrag ruft `onSelectContractor` auf (navigiert zur Contractor-Detailansicht).

### 3. Verzug-Liste als `useMemo`

Die bereits vorhandene Filter-Logik (Zeile 219-225) wird so refaktoriert, dass sie nicht nur die Anzahl, sondern auch die gefilterte Liste zurückgibt (`inVerzugList`), damit der Dialog sie direkt nutzen kann.

### Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/features/admin/ui/AdminDashboardView.tsx` | KpiCard onClick, Dialog mit Verzug-Liste, Refaktor inVerzug-Berechnung |

