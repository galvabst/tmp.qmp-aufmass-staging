

# Fix: Aktivitäts-Diagramme — Daten korrekt fetchen + kombinieren + Umsatz

## Problem-Analyse

1. **Thermochecks zeigen 0**: Der Hook filtert auf `vor_ort_checkin_at != null` — das sind nur Aufträge mit Check-in. Die meisten Aufträge haben noch keinen Check-in. Stattdessen muss über `thermocheck_terminvorschlaege` (angenommene Termine) nach `datum` gruppiert werden.

2. **Zwei getrennte Charts**: Sollen in ein kombiniertes Diagramm (ComposedChart) mit zwei Y-Achsen — Thermochecks links (Anzahl), Bewertung rechts (1-5 Skala).

3. **Umsatz fehlt**: Pro Monat soll der Umsatz angezeigt werden (`vereinbarter_preis` aus Aufträgen + Boni aus `contractor_boni`).

## Daten-Strategie

Der Hook muss 4 Quellen parallel fetchen:

1. **Aufträge** (`v_thermocheck_auftraege`): `id, vereinbarter_preis` wo `zugewiesener_techniker_id = contractorId`
2. **Termine** (`thermocheck_terminvorschlaege`): `datum, thermocheck_auftrag_id` wo `thermocheck_auftrag_id` in den Auftrags-IDs + `status = angenommen`
3. **Bewertungen** (`techniker_bewertungen`): `bewertung, created_at` wo `techniker_id = contractorId`
4. **Boni** (`contractor_boni`): `betrag, created_at` wo `contractor_onboarding_id = contractorId`

Gruppierung nach Monat von `termin.datum` (nicht Check-in!), Umsatz = Summe `vereinbarter_preis` der zugehörigen Aufträge + Boni-Betrag.

## Umsetzung

### Hook: `useContractorActivityStats.ts` — komplett neu

Erweitertes Interface:
```ts
interface MonthlyActivityPoint {
  month: string;       // "Jan", "Feb"
  checks: number;      // Anzahl Termine
  avgRating: number | null;
  umsatz: number;      // vereinbarter_preis + boni
}
```

Ablauf:
1. Aufträge fetchen → IDs + Preis-Map
2. Parallel: Termine (gefiltert auf Auftrags-IDs), Bewertungen, Boni
3. 6-Monats-Buckets: Termine nach `datum` zählen, Umsatz = Preis der zugehörigen Aufträge + Boni, Bewertung = Durchschnitt

### UI: Beide Views (`ContractorDetailView.tsx` + `ProfileView.tsx`)

Statt 2 separate AreaCharts → 1 `ComposedChart`:
- **Area** (primary/orange): Thermochecks pro Monat (linke Y-Achse)
- **Line** (grün, mit Dots): Ø Bewertung (rechte Y-Achse, 1-5)
- Tooltip zeigt alle Werte inkl. Umsatz
- Unter dem Chart: Umsatz-Summe als kompakte Zeile pro Monat oder im Tooltip

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/contractors/hooks/useContractorActivityStats.ts` | Komplett neu: 4 Quellen, Termin-basierte Gruppierung, Umsatz |
| `src/features/contractors/ui/ContractorDetailView.tsx` | 2 AreaCharts → 1 ComposedChart |
| `src/components/ProfileView.tsx` | 2 AreaCharts → 1 ComposedChart |

### Edge Cases
- Keine Termine → Sektion hidden (wie bisher)
- Auftrag ohne `vereinbarter_preis` → 0 € für den Auftrag
- Monat ohne Bewertung → `null` (keine Linie)
- Boni ohne Auftragszuordnung → nach `created_at` dem Monat zugeordnet

