

# Deaktivierte aus TC-Contractor-Liste ausblenden

## Änderung
Ein Einzeiler in der Datenbank-Query: Deaktivierte Einträge werden beim Laden gar nicht mehr abgerufen. Die Personen bleiben in der DB und in anderen Galvanek-Apps vollständig erhalten.

## Technisch

**Datei: `src/features/contractors/hooks/useAdminContractorList.ts`** (~Zeile 121)

Aktuelle Query:
```ts
.from('contractor_onboarding')
.select('*');
```

Wird zu:
```ts
.from('contractor_onboarding')
.select('*')
.neq('onboarding_status', 'deaktiviert');
```

Damit verschwinden Isabel Griffith, Tiago Reinhold, Login THC-Test, "kein Profil" etc. aus der Contractor-Liste, Pipeline-Cards, KPIs und Hiring-Map — aber nur in der TC-Admin-Ansicht. Ihre Supabase-Auth-Accounts und IAM-Zugänge zu anderen Apps bleiben unangetastet.

