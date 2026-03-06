

# Dashboard Performance: Verspätungen + Farbkodierte Bewertungslinie

## Anforderung
1. **Verspätungen aggregiert** in die Performance-Sektion einbauen (Pünktlichkeitsquote über alle Techniker)
2. **Bewertungslinie farbkodiert**: grün ≥ 4.5, gelb 4.0–4.5, rot < 4.0

## Umsetzung

### A. Hook erweitern: `useAdminAggregatedStats`

Zusätzlich zur bestehenden Abfrage parallel `contractor_verspaetungen` und die Gesamtzahl erledigter Aufträge (Status `wc1_durchfuehren`) fetchen. Pro Monat berechnen:
- `lateCount`: Anzahl Verspätungen
- `totalFee`: Summe Gebühren
- `onTimePercent`: Pünktlichkeitsquote

Neue Felder im Interface:
```text
MonthlyAggregatedPoint += { lateCount, totalFee, onTimePercent }
AggregatedPerformance  += { overallOnTimePercent, overallLateFees, totalLateCount }
```

### B. Bewertungslinie farbkodiert

Die Rating-LineChart bekommt dynamische Farben pro Datenpunkt. Recharts unterstützt das über eine custom `dot`-Render-Funktion und `stroke` per Segment (via `<Line>` mit custom `stroke` function oder mehrere überlagerte Lines mit Referenzlinien).

Einfachste Lösung: Drei horizontale Referenzlinien + farbige Dots:
- Dot-Farbe: grün wenn avgRating ≥ 4.5, gelb wenn ≥ 4.0, rot wenn < 4.0
- Zwei `<ReferenceLine>`s bei y=4.0 und y=4.5 als dezente Schwellwerte
- Die Linie selbst bleibt neutral, die Dots zeigen den Zustand

### C. Pünktlichkeits-Chart im Dashboard

Neues drittes Chart in der Performance-Card:
- **Pünktlichkeit / Monat** als BarChart oder LineChart mit `onTimePercent`
- Gesamtquote als Badge im Header neben dem Rating-Badge

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/admin/hooks/useAdminAggregatedStats.ts` | Verspätungen + Pünktlichkeit aggregieren |
| `src/features/admin/ui/AdminDashboardView.tsx` | Pünktlichkeits-Chart + farbkodierte Rating-Dots + Referenzlinien |

