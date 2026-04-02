

# "Aktive" und "Onboarding" als getrennte Filter-Buttons

## Änderung
Der kombinierte Button "Aktive / Onboarding" wird in zwei separate Buttons aufgeteilt, sodass man Aktive und Onboarding-Techniker unabhängig voneinander ein- und ausblenden kann.

## Technisch

**Datei: `src/features/admin/ui/AdminHiringMap.tsx`**

1. **State aufteilen** (Zeile 121):
   - `showContractors` ersetzen durch `showActive` und `showOnboarding` (beide default `true`)

2. **Contractor-Marker-Effect** (ab Zeile 196):
   - Statt `if (!showContractors) return` → Contractors filtern nach Status:
     - `active`-Techniker nur anzeigen wenn `showActive` aktiv
     - Onboarding-Techniker nur wenn `showOnboarding` aktiv
     - Inaktive weiterhin über bestehende Logik

3. **Toggle-Buttons** (Zeile 356-366):
   - Einen Button "Aktive" (grün) mit eigenem Toggle
   - Einen Button "Onboarding" (orange) mit eigenem Toggle

