

# Aktivitäts-Diagramme in der Admin Contractor-Detailansicht

## Was wird gebaut
Zwei Liniendiagramme (Area Charts) in der `ContractorDetailView`, die für den ausgewählten Techniker zeigen:
1. **Thermochecks pro Monat** — Anzahl durchgeführter Checks
2. **Durchschnittliche Bewertung pro Monat** — Rating-Verlauf

Beide Charts teilen dieselbe X-Achse (Monate, letzte 6) und werden übereinander in einer neuen "Aktivität"-Sektion platziert (nach den Quick Stats, vor den Accordions).

## Datenquellen

**Thermochecks:** `v_thermocheck_auftraege` gefiltert auf `zugewiesener_techniker_id = contractor.id`, gruppiert nach Monat von `vor_ort_checkin_at` (= tatsächlich durchgeführt).

**Bewertungen:** `techniker_bewertungen` gefiltert auf `techniker_id = contractor.id`, mit `bewertung` und `created_at`. Gruppiert nach Monat → Durchschnitt pro Monat.

## Umsetzung

### Neuer Hook: `src/features/contractors/hooks/useContractorActivityStats.ts`
- Nimmt `contractorOnboardingId` als Parameter
- Zwei parallele Queries via `supabaseTC`:
  1. `v_thermocheck_auftraege` → `vor_ort_checkin_at` wo `zugewiesener_techniker_id = id`
  2. `techniker_bewertungen` → `bewertung, created_at` wo `techniker_id = id`
- Aggregiert in 6-Monats-Buckets: `{ month: string, checks: number, avgRating: number | null }`
- Einzelner `useQuery` mit `Promise.all`

### UI: `ContractorDetailView.tsx`
- Neue Sektion "Aktivität" mit zwei `AreaChart` (recharts) übereinander
- Chart 1: Thermochecks — orange/primary Fläche, Y-Achse ganzzahlig
- Chart 2: Bewertung — grüne Linie/Fläche, Y-Achse 1-5, Punkte auf der Linie
- Gemeinsame X-Achse (Monatsname: "Jan", "Feb", etc.)
- Tooltip zeigt exakten Wert
- Wenn keine Daten → Sektion ausblenden

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/contractors/hooks/useContractorActivityStats.ts` | Neu — Monats-Aggregation |
| `src/features/contractors/ui/ContractorDetailView.tsx` | Neue "Aktivität"-Sektion mit 2 AreaCharts |

### Edge Cases
- Keine Aufträge/Bewertungen → Sektion hidden
- Monat ohne Bewertungen → `null` (Lücke in der Linie, kein Punkt)
- Monat ohne Checks → 0 anzeigen
- Nur 1-2 Monate Daten → trotzdem 6 Monate auf X-Achse (leere = 0/null)

