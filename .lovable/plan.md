

# Admin Dashboard: Aggregierte Performance + Techniker-Deeplink

## Anforderung
1. **Aggregierte Performance-Sektion** im Dashboard: Durchschnittliches Rating aller Techniker, Gesamt-Thermochecks der letzten 6 Monate — wie die Einzelansicht, aber kumuliert
2. **Klick auf Techniker-Zeile im Dashboard** navigiert direkt zum Techniker-Tab mit geöffneter Detailansicht

## Umsetzung

### A. Aggregierte Performance-Charts im Dashboard

Neuer Hook `useAdminAggregatedStats` — fetcht alle `thermocheck_terminvorschlaege` (angenommen) und `techniker_bewertungen` der letzten 6 Monate, gruppiert nach Monat. Ergebnis:
- **Thermochecks pro Monat** (LineChart, alle Techniker summiert)
- **Ø Bewertung pro Monat** (LineChart, Durchschnitt aller Bewertungen)
- **Ø Rating gesamt** als KPI-Karte

Darstellung in `AdminDashboardView.tsx` als neue Card unterhalb der KPIs (vor dem Onboarding-Funnel).

### B. Techniker-Zeile klickbar → Detail

In `Admin.tsx`:
- Neuer State `selectedContractorId: string | null`
- `AdminDashboardView` bekommt `onSelectContractor(id)` Callback
- Klick setzt `activeTab = 'contractors'` + `selectedContractorId`
- `ContractorListView` bekommt `initialSelectedId` Prop → öffnet sofort die Detailansicht

In `AdminDashboardView.tsx`:
- Techniker-Zeilen bekommen `onClick` → ruft `onSelectContractor(c.id)` auf
- Cursor-Pointer-Styling

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/admin/hooks/useAdminAggregatedStats.ts` | Neuer Hook: aggregierte Performance über alle Techniker |
| `src/features/admin/ui/AdminDashboardView.tsx` | Performance-Charts + klickbare Techniker-Zeilen |
| `src/pages/Admin.tsx` | State-Management für Cross-Tab-Navigation |
| `src/features/contractors/ui/ContractorListView.tsx` | `initialSelectedId` Prop |

