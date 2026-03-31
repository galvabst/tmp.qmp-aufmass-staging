

# Praxistest: Klarere Anweisungen + Admin-Test-Upload

## Problem
1. Die Beschreibung im Praxistest-Formular ist zu knapp — Techniker wissen nicht genau, was erwartet wird
2. Im Admin-Vorschau-Modus kann man das Einreichen nicht wirklich testen, weil `savePraxistest` und `uploadPraxistestVideo` den eingeloggten Admin-User verwenden, nicht einen ausgewählten Contractor

## Lösung

### 1. Klarere Anweisungen in `PraxistestSection.tsx`
- Detailliertere Beschreibung mit konkreten Anforderungen als Checkliste:
  - Autarc-Projekt anlegen
  - Alle Räume mit 3D-Scan erfassen
  - Kompletten Thermocheck-Durchlauf durchführen (Heizlastberechnung, Aufmaß)
  - Drohnenflug des Gebäudes aufnehmen
- Klarere Formulierung, dass es das **eigene Haus** sein muss

### 2. Admin-Preview: Contractor-Auswahl + simuliertes Einreichen
- Im Admin-Vorschau-Modus wird über dem Praxistest-Formular ein **Contractor-Dropdown** angezeigt (aus `thermocheck.contractor_onboarding` mit `profile_id` → Name)
- Wenn der Admin "Praxistest einreichen" klickt, wird der Scan-Link und das Video dem **ausgewählten Contractor** zugeordnet (nicht dem Admin selbst)
- Das RPC `update_contractor_praxistest` wird um einen optionalen Parameter `p_target_profile_id` erweitert, der nur von Admins genutzt werden kann (RLS/Security-Definer prüft Admin-Rolle)
- Nach dem Einreichen zeigt die UI eine Bestätigung mit: Contractor-Name, Einreichungsdatum, Links

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/onboarding/steps/PraxistestSection.tsx` | Ausführlichere Anweisungen als Checkliste |
| `src/components/onboarding/steps/AcademyStep.tsx` | Contractor-Dropdown im Preview-Modus, `targetProfileId` prop durchreichen |
| `src/components/OnboardingScreen.tsx` | Contractor-Liste laden im Preview, `targetProfileId` an `savePraxistest` übergeben |
| `src/hooks/useContractorProfile.ts` | `savePraxistest` um optionalen `targetProfileId` erweitern |
| DB-Migration | RPC `update_contractor_praxistest` um `p_target_profile_id` Parameter erweitern mit Admin-Check |

### Technische Details

**Contractor-Dropdown**: Query auf `thermocheck.contractor_onboarding` join `thermocheck.contractors` für Name, gefiltert auf `onboarding_status != 'ready'` (nur aktive Onboarder). Wird nur im `isPreview`-Modus gerendert.

**RPC-Erweiterung**: 
```sql
-- Wenn p_target_profile_id gesetzt, prüfe ob Aufrufer Admin ist
-- Dann schreibe in die Zeile des Ziel-Contractors statt auth.uid()
```

**Nach Einreichen**: Das Quality-Gate (`QGQueueView`) zeigt den Test automatisch an, da die bestehende Query `get_pending_praxistests` alle eingereichten/nicht-freigegebenen Tests lädt.

