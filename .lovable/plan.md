

## Trainer-Flag automatisch aus IAM synchronisieren

### Architektur-Entscheidung
- **IAM-Schema** (`iam.user_app_roles`): Definiert WER Trainer ist (Rolle `aufmass_trainer`) -- wird im Directory gepflegt
- **Domain-Schema** (`thermocheck.contractor_onboarding.is_trainer`): Wird vom Frontend gelesen -- Single Source of Truth fuer Onboarding-Logik
- **Sync-Mechanismus**: Ein Trigger auf `iam.user_app_roles` haelt das Flag automatisch aktuell -- keine doppelte Pflege noetig

### Technischer Plan

| Schritt | Beschreibung |
|---|---|
| **SQL-Migration** | Trigger-Funktion + Trigger + einmaliger Backfill |

#### 1. Trigger-Funktion

```text
CREATE FUNCTION thermocheck.sync_is_trainer_from_iam()
RETURNS TRIGGER

Logik:
- Bei INSERT auf iam.user_app_roles:
  Pruefe ob die app_role_id zur Rolle 'aufmass_trainer' gehoert
  Falls ja: UPDATE contractor_onboarding SET is_trainer = true WHERE profile_id = NEW.user_id

- Bei DELETE auf iam.user_app_roles:
  Pruefe ob die app_role_id zur Rolle 'aufmass_trainer' gehoert
  Falls ja: UPDATE contractor_onboarding SET is_trainer = false WHERE profile_id = OLD.user_id
```

#### 2. Trigger

```text
CREATE TRIGGER trg_sync_is_trainer
AFTER INSERT OR DELETE ON iam.user_app_roles
FOR EACH ROW
EXECUTE FUNCTION thermocheck.sync_is_trainer_from_iam();
```

#### 3. Backfill (einmalig, in derselben Migration)

Alle bestehenden User mit `aufmass_trainer`-Rolle bekommen `is_trainer = true`:

```text
UPDATE thermocheck.contractor_onboarding co
SET is_trainer = true
FROM iam.user_app_roles uar
JOIN iam.app_roles ar ON ar.id = uar.app_role_id
WHERE ar.role_code = 'aufmass_trainer'
  AND uar.user_id = co.profile_id
  AND co.is_trainer = false;
```

### Kein Frontend-Code betroffen
- `useIsTrainer` liest bereits aus `contractor_onboarding.is_trainer` -- bleibt wie es ist
- `useOnboardingState` nutzt bereits `isTrainer` fuer den Bypass -- bleibt wie es ist

### Datenfluss

```text
Directory (Admin UI)
       |
       v
iam.user_app_roles (aufmass_trainer)
       |
       v  [Trigger: sync_is_trainer_from_iam]
       |
thermocheck.contractor_onboarding.is_trainer = true
       |
       v  [useIsTrainer Hook]
       |
Frontend: Trainer-Bypass aktiv
```

### Auswirkung
- Artur Penner wird sofort als Trainer erkannt (Backfill)
- Zukuenftige Rollenaenderungen im Directory werden automatisch synchronisiert
- Keine doppelte Datenpflege -- IAM ist die einzige Eingabestelle
- Domain-Schema bleibt sauber getrennt vom IAM-Schema
