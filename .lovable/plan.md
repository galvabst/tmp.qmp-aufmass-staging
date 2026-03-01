

# Fix: Trainer `is_trainer` wird nicht gesetzt (Race Condition + fehlender UPDATE-Trigger)

## Root Cause (verifiziert via DB-Abfrage)

Mark Röder (`7db5fbb8`): Rolle zugewiesen um `15:25:35.274`, Onboarding-Record erstellt um `15:25:35.327` — **53ms später**. Der bestehende Trigger `trg_sync_is_trainer` auf `iam.user_app_roles` feuert ein `UPDATE` auf ein Record, das noch nicht existiert → 0 Zeilen betroffen → `is_trainer` bleibt `false`.

Zusätzlich: Der bestehende Trigger reagiert nur auf `INSERT` und `DELETE`, nicht auf `UPDATE`. Rollenwechsel werden nicht erfasst.

## Fix: 2 Trigger-Änderungen

### 1. BEFORE INSERT Trigger auf `contractor_onboarding`
Beim Erstellen des Onboarding-Records wird geprüft, ob der User bereits die `aufmass_trainer`-Rolle hat. Falls ja → `is_trainer := true` direkt im `NEW` Record setzen.

```sql
CREATE OR REPLACE FUNCTION thermocheck.sync_is_trainer_on_onboarding_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM iam.user_app_roles uar
    JOIN iam.app_roles ar ON ar.id = uar.app_role_id
    WHERE uar.user_id = NEW.profile_id AND ar.role_code = 'aufmass_trainer'
  ) THEN
    NEW.is_trainer := true;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sync_is_trainer_on_insert
  BEFORE INSERT ON thermocheck.contractor_onboarding
  FOR EACH ROW EXECUTE FUNCTION thermocheck.sync_is_trainer_on_onboarding_insert();
```

### 2. Bestehenden IAM-Trigger erweitern (INSERT+UPDATE+DELETE)

```sql
-- Drop + Recreate mit UPDATE-Support
DROP TRIGGER IF EXISTS trg_sync_is_trainer ON iam.user_app_roles;

CREATE OR REPLACE FUNCTION thermocheck.sync_is_trainer_from_iam()
-- ... erweitert um TG_OP = 'UPDATE' Handling
-- Bei UPDATE: altes role_code prüfen (false setzen), neues role_code prüfen (true setzen)

CREATE TRIGGER trg_sync_is_trainer
  AFTER INSERT OR UPDATE OR DELETE ON iam.user_app_roles
  FOR EACH ROW EXECUTE FUNCTION thermocheck.sync_is_trainer_from_iam();
```

### 3. Backfill: Bestehende Inkonsistenzen korrigieren

```sql
UPDATE thermocheck.contractor_onboarding co
SET is_trainer = true
FROM iam.user_app_roles uar
JOIN iam.app_roles ar ON ar.id = uar.app_role_id
WHERE ar.role_code = 'aufmass_trainer'
  AND uar.user_id = co.profile_id
  AND co.is_trainer = false;
```

Dies betrifft aktuell Mark Röder (`7db5fbb8`), der `is_trainer = false` hat obwohl die Rolle zugewiesen ist.

## Keine Frontend-Änderungen nötig

Die Frontend-Logik ist korrekt — das Problem liegt ausschließlich in der Datenbank-Trigger-Reihenfolge.

## Änderungen

| Was | Datei/Ort |
|---|---|
| Neuer BEFORE INSERT Trigger | Migration (DB) |
| Bestehenden IAM-Trigger erweitern | Migration (DB) |
| Backfill falsche Records | Migration (DB) |

