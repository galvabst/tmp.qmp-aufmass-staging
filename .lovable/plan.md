

# "In Verzug" KPI: Onboarding-Deadline statt Pipeline-Status

## Problem
Die KPI-Karte "In Verzug" zählt aktuell nur Aufträge mit `pipeline_status === 'in_verzug'`. Der User will aber wissen, wie viele **Techniker im Onboarding ihre 7-Tage-Deadline überschritten haben** (ab Registrierung/`erstellt_am` haben sie 7 Tage, um die Akademie abzuschließen).

## Lösung

Die "In Verzug"-Zahl wird aus den bereits geladenen `contractors`-Daten berechnet, nicht aus den Auftrags-Daten. Ein Techniker gilt als "in Verzug" wenn:

1. Er ist **nicht** ready, nicht deaktiviert, kein Trainer
2. `erstellt_am` liegt mehr als 7 Tage in der Vergangenheit
3. Die Akademie ist **nicht** abgeschlossen (`completedSteps` enthält nicht `'akademie'`)

### Änderungen

**`src/features/admin/ui/AdminDashboardView.tsx`**:
- Die "In Verzug" KPI-Karte berechnet den Wert aus `contractors` statt aus `stats.inVerzug`
- Logik: `activeTechs.filter(c => erstellt_am + 7 Tage < heute && !completedSteps.includes('akademie')).length`
- Optional: `stats.inVerzug` (Pipeline-basiert) kann als zweite Zeile "Aufträge in Verzug" bleiben oder entfernt werden

**`src/features/admin/hooks/useAdminDashboardStats.ts`**: Keine Änderung nötig (Pipeline-Verzug bleibt als separater Datenpunkt erhalten).

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/admin/ui/AdminDashboardView.tsx` | "In Verzug" KPI aus Onboarding-Deadline berechnen |

