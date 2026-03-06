

# Aktivitäts-Diagramm im Contractor Profil

## Was wird gebaut
Dieselben zwei Area Charts (Thermochecks pro Monat + Ø Bewertung) aus der Admin-Detailansicht werden in die `ProfileView` des Contractors eingefügt. Der bestehende Hook `useContractorActivityStats` kann 1:1 wiederverwendet werden.

## Umsetzung

**Datei:** `src/components/ProfileView.tsx`

- Import `useContractorActivityStats` + `AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` aus recharts + `Activity` Icon
- Hook aufrufen mit `contractorOnboardingId`
- Neue "Aktivität"-Sektion nach "Pünktlichkeit" und vor dem Trainer-Profil einfügen
- Zwei gestapelte AreaCharts (identisch zum Admin-Design in `ContractorDetailView`)
- Sektion nur anzeigen wenn mindestens ein Monat Daten hat

Einzige Datei betroffen. Hook existiert bereits, kein neuer Code nötig.

