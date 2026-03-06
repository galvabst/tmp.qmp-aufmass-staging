

# Dashboard: Durchlaufzeiten-Analytik

## Ziel
Neue Sektion "Durchlaufzeiten" in der Performance-Card: Monatliche Durchschnittsdauer jeder Phase als LineCharts — wie lange brauchen Techniker im Schnitt für Vor-Ort-Arbeit, Nachbearbeitung und den Gesamtprozess.

## Verfügbare Timestamps

Aus `v_thermocheck_auftraege`:
- `vor_ort_checkin_at` → `vor_ort_checkout_at` = **Vor-Ort-Dauer**
- `nachbearbeitung_checkin_at` → `nachbearbeitung_checkout_at` = **Nachbearbeitungsdauer**
- `vor_ort_checkin_at` → `nachbearbeitung_checkout_at` = **Gesamtdurchlauf**

## Umsetzung

### A. Hook erweitern: `useAdminAggregatedStats`

Zusätzlich alle Aufträge mit mindestens einem gesetzten Timestamp fetchen:

```
v_thermocheck_auftraege?select=vor_ort_checkin_at,vor_ort_checkout_at,
  nachbearbeitung_checkin_at,nachbearbeitung_checkout_at
  &not.vor_ort_checkin_at=is.null
```

Pro Monat (gruppiert nach `vor_ort_checkin_at`) berechnen:
- `avgVorOrtMin`: Ø Minuten Vor-Ort (nur wo beide Timestamps gesetzt)
- `avgNachbearbeitungMin`: Ø Minuten Nachbearbeitung (nur wo beide gesetzt)
- `avgGesamtMin`: Ø Minuten Gesamt (vor_ort_checkin → nachbearbeitung_checkout)

Neue Felder im Interface:
```typescript
MonthlyAggregatedPoint += {
  avgVorOrtMin: number | null;
  avgNachbearbeitungMin: number | null;
  avgGesamtMin: number | null;
}
AggregatedPerformance += {
  overallAvgVorOrtMin: number | null;
  overallAvgNachbearbeitungMin: number | null;
  overallAvgGesamtMin: number | null;
}
```

### B. Drei neue LineCharts im Dashboard

Unterhalb der bestehenden Performance-Charts, drei weitere LineCharts:

1. **Ø Vor-Ort-Dauer / Monat** — Y-Achse in Minuten, orange Linie
2. **Ø Nachbearbeitung / Monat** — Y-Achse in Minuten, blaue Linie
3. **Ø Gesamtdurchlauf / Monat** — Y-Achse in Minuten, primärfarbene Linie

Tooltip zeigt z.B. "45 Min" an. Übersichts-Badges im Header mit den Gesamtdurchschnitten (z.B. "⌀ 42 Min Vor-Ort · ⌀ 28 Min Nachb.").

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/admin/hooks/useAdminAggregatedStats.ts` | Timestamps fetchen + Durchlaufzeiten berechnen |
| `src/features/admin/ui/AdminDashboardView.tsx` | 3 neue LineCharts für Durchlaufzeiten |

