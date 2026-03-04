
-- Step 1: Create ENUM for abrechnung status
CREATE TYPE thermocheck.abrechnung_status AS ENUM (
  'offen',
  'rechnung_eingegangen',
  'in_pruefung',
  'bezahlt'
);

-- Step 2: Create table
CREATE TABLE thermocheck.contractor_abrechnungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thermocheck_auftrag_id UUID NOT NULL REFERENCES thermocheck.thermocheck_auftraege(id),
  contractor_id UUID NOT NULL REFERENCES thermocheck.contractor_onboarding(id),
  status thermocheck.abrechnung_status NOT NULL DEFAULT 'offen',
  betrag NUMERIC(10,2),
  rechnung_eingegangen_am TIMESTAMPTZ,
  geprueft_am TIMESTAMPTZ,
  bezahlt_am TIMESTAMPTZ,
  zahlungsart TEXT,
  referenz TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thermocheck_auftrag_id)
);

-- Step 3: Enable RLS
ALTER TABLE thermocheck.contractor_abrechnungen ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS - Techniker sieht eigene Rows
CREATE POLICY "contractor_select_own_abrechnungen"
  ON thermocheck.contractor_abrechnungen
  FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM thermocheck.contractor_onboarding WHERE profile_id = auth.uid()
    )
  );

-- Step 5: RLS - Innendienst sieht alle
CREATE POLICY "innendienst_select_all_abrechnungen"
  ON thermocheck.contractor_abrechnungen
  FOR SELECT
  TO authenticated
  USING (thermocheck.is_innendienst());

-- Step 6: RLS - Innendienst kann einfügen
CREATE POLICY "innendienst_insert_abrechnungen"
  ON thermocheck.contractor_abrechnungen
  FOR INSERT
  TO authenticated
  WITH CHECK (thermocheck.is_innendienst());

-- Step 7: RLS - Innendienst kann updaten
CREATE POLICY "innendienst_update_abrechnungen"
  ON thermocheck.contractor_abrechnungen
  FOR UPDATE
  TO authenticated
  USING (thermocheck.is_innendienst())
  WITH CHECK (thermocheck.is_innendienst());

-- Step 8: updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON thermocheck.contractor_abrechnungen
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.set_updated_at();
