

# ENUM fuer `braucht_groesse` + T-Shirt Test-Preis

## Aenderungen

### 1. Datenbank-Migration: TEXT zu ENUM

Neuen ENUM-Typ `thermocheck.contractor_groesse_typ` mit den Werten `kleidung` und `schuhe` erstellen. Danach die Spalte `braucht_groesse` in `contractor_produkte` von TEXT auf diesen ENUM umstellen.

```text
braucht_groesse (vorher):  TEXT     -> 'kleidung', 'schuhe', NULL
braucht_groesse (nachher):  ENUM    -> 'kleidung', 'schuhe', NULL (nullable)
```

### 2. T-Shirt Test-Preis eintragen

Den aktuellen Live-Preis des T-Shirts in `stripe_test_price_id` sichern und den neuen Test-Preis `price_1SxlelLnjPqrEfxxwdrSMrZ6` als aktiven `stripe_price_id` setzen.

### 3. Kein Code-Change noetig

Die Frontend-Funktion `brauchtGroessenauswahl()` gibt bereits die Strings `'kleidung'` und `'schuhe'` zurueck -- identisch mit den ENUM-Werten. Keine Anpassung erforderlich.

## Technische Details

### SQL-Migration (Schema-Aenderung)

```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'contractor_groesse_typ' AND n.nspname = 'thermocheck'
  ) THEN
    CREATE TYPE thermocheck.contractor_groesse_typ AS ENUM ('kleidung', 'schuhe');
  END IF;
END $$;

ALTER TABLE thermocheck.contractor_produkte
  ALTER COLUMN braucht_groesse TYPE thermocheck.contractor_groesse_typ
  USING braucht_groesse::thermocheck.contractor_groesse_typ;
```

### Daten-Update (T-Shirt Preis)

```sql
UPDATE thermocheck.contractor_produkte
SET stripe_test_price_id = stripe_price_id,
    stripe_price_id = 'price_1SxlelLnjPqrEfxxwdrSMrZ6'
WHERE produkt_key = 'tshirt';
```

## Zusammenfassung

| Bereich | Aenderung |
|---------|-----------|
| DB-Schema | Neuer ENUM `contractor_groesse_typ` (kleidung, schuhe) |
| DB-Schema | Spalte `braucht_groesse` von TEXT zu ENUM |
| DB-Daten | T-Shirt: Test-Preis eintragen, Live-Preis sichern |
| Frontend | Keine Aenderung noetig |

