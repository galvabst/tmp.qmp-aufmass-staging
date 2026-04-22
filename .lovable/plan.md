

# Bug-Fix: DB-Trigger überschreibt Status zurück auf `in_progress`

## Was wirklich passiert

1. Du klickst "Endgültig deaktivieren" → Frontend macht `UPDATE contractor_onboarding SET onboarding_status='gefeuert' WHERE id=…`.
2. Der **BEFORE-UPDATE-Trigger `trg_sync_onboarding_status`** feuert **vor** dem Schreiben.
3. Die Trigger-Funktion `sync_onboarding_status()` lässt nur `'blocked'` und `'deaktiviert'` durch (early return). `'inaktiv'` und `'gefeuert'` fehlen in der Whitelist.
4. Der Trigger berechnet den Status neu aus `completed_steps` (4 Schritte → `'in_progress'`) und überschreibt deinen Wert.
5. Ergebnis in der DB: `onboarding_status='in_progress'` statt `'gefeuert'`. Achim bleibt überall sichtbar.

Ich habe das eben in der DB direkt geprüft: Achim Mönning (`fd6c2e4d-…`) hat **`is_trainer: false`** und **`onboarding_status: 'in_progress'`** mit `aktualisiert_am` exakt zur Klick-Zeit. Der UPDATE ist durchgelaufen, der Trigger hat ihn revidiert.

## Die Lösung

### 1. DB-Migration: Trigger-Whitelist erweitern

Funktion `thermocheck.sync_onboarding_status` anpassen, sodass auch `'inaktiv'` und `'gefeuert'` (und konsistent `'ready'`, falls manuell gesetzt) **nicht** überschrieben werden:

```sql
IF NEW.onboarding_status IN ('blocked', 'deaktiviert', 'inaktiv', 'gefeuert') THEN
  RETURN NEW;
END IF;
```

Damit respektiert der Trigger künftig manuelle Admin-Statuswechsel und rechnet nur, wenn der Techniker im normalen Onboarding-Flow ist.

### 2. Reaktivieren-Pfad bleibt funktionsfähig

"Reaktivieren" setzt den Status zurück auf `'in_progress'` — der Trigger läuft dann durch und berechnet den korrekten Stand aus `completed_steps` neu. Das ist genau richtig.

### 3. Frontend: UPDATE-Result prüfen

Zusätzlich in `ContractorListView.tsx` und `useAdminHiringMap.ts`: `.select('id, onboarding_status')` ans UPDATE hängen und das zurückgegebene `onboarding_status` mit dem gewünschten vergleichen. Wenn die DB einen anderen Wert zurückliefert (z. B. weil ein anderer Trigger reingrätscht), zeigen wir Toast "Status konnte nicht gesetzt werden" statt fälschlich Erfolg.

### 4. Map-Filter konsistent halten

`useAdminHiringMap` filtert bereits `('deaktiviert','invited','gefeuert')` raus — das passt. Nach dem Fix verschwindet ein gefeuerter Techniker beim nächsten Refetch sofort.

## Was sich nicht ändert

- Kein Trainer-Override-Bug (mein vorheriger Verdacht war falsch — `is_trainer` ist hier `false`, dieser Code-Pfad greift gar nicht).
- Keine RLS-Änderung nötig (UPDATE läuft offensichtlich durch, sonst hätte sich `aktualisiert_am` nicht geändert).
- Keine Schema-Änderung am Enum.

## Technische Details

- **Migration**: `CREATE OR REPLACE FUNCTION thermocheck.sync_onboarding_status()` mit erweiterter Whitelist-Zeile.
- **`src/features/contractors/ui/ContractorListView.tsx`** `handleStatusChange`: `.select()` an UPDATE, Result-Check + spezifischer Fehler-Toast, `refetchQueries` statt nur `invalidateQueries` (wegen `staleTime: 30_000`).
- **`src/features/admin/hooks/useAdminHiringMap.ts`** `setContractorOnboardingStatus`: gleiche Result-Check-Logik.

## Erwartetes Ergebnis

- "Endgültig deaktivieren" auf Achim → DB-Status sofort `'gefeuert'`, Achim verschwindet aus Aktiv-Liste und Map.
- "Pausieren" → DB-Status `'inaktiv'`, Achim wandert in den Inaktiv-Tab und wird auf der Map grau.
- Bestehende Techniker im Onboarding-Flow bleiben unberührt (Trigger berechnet weiter korrekt).

