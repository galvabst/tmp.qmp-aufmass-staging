
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
