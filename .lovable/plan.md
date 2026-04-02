

# Penner, Lauschke & Heth auf "ready" setzen

## Problem
Die drei Techniker sind trotz vorheriger Migration noch nicht auf `ready` — vermutlich hat der DB-Trigger `sync_onboarding_status` den Status zurückgesetzt, weil nicht alle Flags gesetzt waren.

## Lösung
Eine neue Migration, die für alle drei gleichzeitig setzt:
- `onboarding_status = 'ready'`
- `completed_steps` = alle 7 Steps
- Alle internen Flags (`trainer_freigabe`, `vertrag_geprueft_intern`, `kleidung_bestellt_intern`, `lizenzen_bereitgestellt_intern`) auf `true`

**IDs** (aus vorheriger Abfrage):
- Artur Penner: `d27fc078-562f-423b-b0cf-b7d5353c30b1`
- Torsten Lauschke: `f52afad9-484e-4ee8-8743-7c3429afbd14`
- Vincent Heth: `07d92f25-fb65-4f71-8342-29a0a2821ebd`

```sql
UPDATE thermocheck.contractor_onboarding
SET onboarding_status = 'ready',
    onboarding_substatus = NULL,
    completed_steps = ARRAY['profil','dokumente','bestellungen','equipment','akademie','coaching','nachweise'],
    trainer_freigabe = true,
    trainer_freigabe_am = now(),
    vertrag_geprueft_intern = true,
    kleidung_bestellt_intern = true,
    lizenzen_bereitgestellt_intern = true
WHERE id IN (
  'd27fc078-562f-423b-b0cf-b7d5353c30b1',
  'f52afad9-484e-4ee8-8743-7c3429afbd14',
  '07d92f25-fb65-4f71-8342-29a0a2821ebd'
);
```

Diesmal werden auch die internen Admin-Flags gesetzt, damit der Trigger den Status nicht wieder zurücksetzt.

