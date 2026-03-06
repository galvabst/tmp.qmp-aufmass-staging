
# Einweisungen auf Performance-Graphen drauflegen

## Ziel
Zweite Linie "Einweisungen" (in einer anderen Farbe) auf dem "Thermochecks / Monat"-Chart im Admin-Dashboard, damit man sieht ob beide Auftragstypen parallel verlaufen. Auch in der Contractor-Detailansicht.

## Daten-Änderungen

### `useAdminAggregatedStats.ts`
- Termine-Query erweitern: Statt nur `datum` auch den Auftragstyp laden. Da `thermocheck_terminvorschlaege` keinen `auftragstyp` hat, müssen wir die Aufträge parallel laden und joinen.
- Zusätzliche Query: `v_thermocheck_auftraege` mit `id, auftragstyp` für alle Aufträge der letzten 6 Monate laden
- Termine mit Auftragstyp matchen via `thermocheck_auftrag_id`
- `MonthlyAggregatedPoint` bekommt neues Feld `einweisungen: number`
- `AggregatedPerformance` bekommt `totalEinweisungenLast6: number`
- Monatliche Aggregation: `checks` bleibt für Thermochecks, `einweisungen` zählt separat

### `useContractorActivityStats.ts`
- Aufträge-Query erweitert bereits `auftragstyp` (wird schon geladen via `v_thermocheck_auftraege`)
- Auftragstyp an Termine joinen, dann pro Monat in `checks` (thermocheck) und `einweisungen` (einweisung) aufteilen
- `MonthlyActivityPoint` bekommt `einweisungen: number`

## UI-Änderungen

### `AdminDashboardView.tsx`
- Chart-Titel von "Thermochecks / Monat" zu "Aufträge / Monat"
- Zweite `<Line>` für `einweisungen` in einer anderen Farbe (z.B. `hsl(280 60% 55%)` — Lila)
- Legende hinzufügen (einfach als farbige Punkte + Labels über dem Chart)
- Summary-Text: `35 Thermochecks · 8 Einweisungen · ...`

### `ContractorDetailView.tsx` (Aktivitäts-Chart)
- Gleiche zweite Linie für Einweisungen im Volumen-Chart

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/admin/hooks/useAdminAggregatedStats.ts` | Auftragstyp laden, `einweisungen` pro Monat aggregieren |
| `src/features/contractors/hooks/useContractorActivityStats.ts` | Auftragstyp-Split in Monats-Buckets |
| `src/features/admin/ui/AdminDashboardView.tsx` | Zweite Linie + Legende + Summary-Text |
| `src/features/contractors/ui/ContractorDetailView.tsx` | Zweite Linie im Aktivitäts-Chart |
