## Ziel

Drei klare Tabs in der Techniker-Liste, damit niemand mehr unsichtbar bleibt (Justin Balk, Jonas Magdeburg, Olaf Markmann etc.):

```
[ Onboarding ]   [ Aktive ]   [ Ehemalige ]
```

Innerhalb von **Ehemalige** wird über Status-Chips weiter aufgedröselt:

- **Onboarding abgebrochen** — hat nie einen Auftrag gefahren (nie gestartet ODER mittendrin raus)
- **Freiwillig ausgestiegen** — war aktiv, hat selbst gekündigt
- **Gefeuert** — war aktiv, wurde rausgeworfen

## Datenquelle

Heute liefert `useAdminContractorList` nur Datensätze aus `thermocheck.contractor_onboarding`. Ex-Techniker ohne Onboarding-Record fehlen komplett.

Neue SECURITY-DEFINER-RPC `thermocheck.get_potential_technicians()`:
- Liefert alle Profile mit `@galvanek-bau.de`-Mail
- die **keinen** `contractor_onboarding`-Datensatz haben
- und **keine** Admin-/Superadmin-/Manager-Rolle besitzen
- geschützt durch `thermocheck.is_innendienst()`

Diese Profile werden im Hook als synthetische Einträge mit Pseudo-Status `onboarding_abgebrochen` ergänzt (kein DB-Enum-Wert, nur UI).

## Status-Mapping

| Bucket | onboarding_status | Bedingung |
|---|---|---|
| Onboarding | `angelegt`, `invited`, `started`, `in_progress`, `blocked` | Kein Auftrag gefahren |
| Aktive | `ready`, `mitfahrt` | Kann Aufträge annehmen |
| Ehemalige → Onboarding abgebrochen | `inaktiv` ohne je gefahrenen Auftrag, plus synthetische „kein Datensatz" Einträge | Nie aktiv gewesen |
| Ehemalige → Ausgestiegen | `ausgestiegen` | War aktiv, selbst raus |
| Ehemalige → Gefeuert | `gefeuert` | War aktiv, rausgeworfen |

`inaktiv` (pausiert) verschwindet als eigener Tab — wird je nach „je gefahren?" in **Aktive** (pausiert) oder **Ehemalige → abgebrochen** einsortiert. Falls das zu kompliziert wird: `inaktiv` immer unter Aktive mit Sub-Chip „Pausiert".

## Änderungen

### 1. DB-Migration
- Neue Funktion `thermocheck.get_potential_technicians()` (SECURITY DEFINER, nur Innendienst)

### 2. `useAdminContractorList.ts`
- Filter `.not('onboarding_status', 'in', '("deaktiviert")')` entfernen — wir wollen alles sehen
- Zusätzlich `get_potential_technicians()` aufrufen
- Synthetische `AdminContractor`-Einträge bauen (`id = profile.id`, `onboardingStatus = 'onboarding_abgebrochen'`)
- `OnboardingStatusEnum` um Pseudo-Werte `onboarding_abgebrochen` erweitern + Label

### 3. `ContractorListView.tsx`
- Tabs reduzieren auf **Onboarding | Aktive | Ehemalige**
- Tab „Alle" und „Inaktiv" entfernen
- Im Tab Ehemalige: Status-Chips „Onboarding abgebrochen | Ausgestiegen | Gefeuert" (nur sichtbar wenn count > 0)
- Counts in Chip-Labels einbetten

### 4. `ContractorCard.tsx`
- Für synthetische „nie gestartet" Einträge: Badge „Nie angefangen", keine Onboarding-Progress-Bar, keine Akademie/Bestellungen-Stats (existieren nicht)
- Für `gefeuert`/`ausgestiegen`: Austrittsdatum prominent zeigen (falls vorhanden)

## Offene Detailfrage (im Bauen klärbar)

Wie unterscheiden wir „inaktiv und nie gefahren" von „inaktiv und war aktiv"? Vorschlag: Wenn der Techniker je einen Auftrag mit Status `approved` hatte → war aktiv. Sonst → abgebrochen. Wird im Hook über einen leichten Count-Query gelöst.

## Geänderte Dateien
- DB: neue Funktion `thermocheck.get_potential_technicians`
- `src/features/contractors/hooks/useAdminContractorList.ts`
- `src/features/contractors/ui/ContractorListView.tsx`
- `src/features/contractors/ui/ContractorCard.tsx`
