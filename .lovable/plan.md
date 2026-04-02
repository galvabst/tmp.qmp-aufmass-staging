

# "Login Test THC" und "Anton Berger" aus der Datenbank löschen

## Problem
Zwei Einträge in `thermocheck.contractor_onboarding` sind Test- bzw. nicht-relevante Datensätze und sollen komplett gelöscht werden (nicht nur deaktiviert).

## Vorgehen

### Schritt 1: Supabase-Verbindung erneuern
Die Supabase-Verbindung ist abgelaufen — muss zuerst reconnected werden, bevor ich Daten lesen oder löschen kann.

### Schritt 2: Betroffene Records identifizieren
SQL-Query um die exakten IDs und `profile_id`s der beiden Einträge zu finden:
```sql
SELECT id, profile_id, ag_domain_email, onboarding_status
FROM thermocheck.contractor_onboarding
WHERE ag_domain_email ILIKE '%berger%'
   OR ag_domain_email ILIKE '%test%';
```

### Schritt 3: Abhängige Daten löschen
Vor dem Löschen der Onboarding-Records müssen abhängige Tabellen bereinigt werden (FK-Constraints):
- `thermocheck.contractor_akademie_lektions_fortschritt` (contractor_id)
- `thermocheck.contractor_akademie_quiz_ergebnis` (contractor_id)
- `thermocheck.contractor_bestellungen` (onboarding_id)
- Ggf. weitere abhängige Tabellen

### Schritt 4: Onboarding-Records löschen
```sql
DELETE FROM thermocheck.contractor_onboarding WHERE id IN ('<id1>', '<id2>');
```

**Wichtig:** Die Supabase Auth-Accounts und Profile bleiben bestehen — es werden nur die TC-Onboarding-Einträge entfernt.

## Blocker
Die Supabase-Verbindung muss zuerst erneuert werden. Bitte bestätige, dass ich die Verbindung reconnecten soll.

