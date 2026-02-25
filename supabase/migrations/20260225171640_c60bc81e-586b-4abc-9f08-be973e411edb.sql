
-- Alles in einer Migration: ENUMs + Trigger-Funktion + Tabelle + RLS

-- ENUMs
DO $$ BEGIN
  CREATE TYPE thermocheck.pv_denkmalschutz_enum AS ENUM ('denkmalschutz', 'ensembleschutz', 'nein');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE thermocheck.pv_ziegel_lose_enum AS ENUM ('ja', 'nein', 'nicht_erkennbar');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE thermocheck.pv_ziegel_neigung_enum AS ENUM ('positiv', 'negativ');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE thermocheck.pv_hauszufuehrung_enum AS ENUM ('keller', 'freileitung');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger-Funktion
CREATE OR REPLACE FUNCTION thermocheck.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = thermocheck;

-- Tabelle
CREATE TABLE thermocheck.thermocheck_pv_formulare (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vot_formular_id UUID NOT NULL UNIQUE REFERENCES thermocheck.thermocheck_vot_formulare(id) ON DELETE CASCADE,
  eingereicht_von UUID,
  status thermocheck.vot_formular_status_enum NOT NULL DEFAULT 'entwurf',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  solarthermie_vorhanden BOOLEAN,
  denkmalschutz thermocheck.pv_denkmalschutz_enum,
  lagermoeglichkeit BOOLEAN,
  lagermoeglichkeit_beschreibung TEXT,
  dachform TEXT,
  dachausrichtung TEXT,
  dachneigung NUMERIC,
  sparrenabstand TEXT,
  trapezdach BOOLEAN,
  trapezdach_art TEXT,
  attika_vorhanden BOOLEAN,
  attika_masse TEXT,
  aufdachdaemmung BOOLEAN,
  aufdachdaemmung_dicke NUMERIC,
  thermodach BOOLEAN,
  ziegel_lose thermocheck.pv_ziegel_lose_enum,
  dacheindeckung_art TEXT,
  ziegel_neigung thermocheck.pv_ziegel_neigung_enum,
  ziegel_neigung_grad NUMERIC,
  hindernisse_vorhanden BOOLEAN,
  fassade_gedaemmt BOOLEAN,
  fassade_daemmung_dicke TEXT,
  oeffentliche_flaeche BOOLEAN,
  dc_fassade_moeglich BOOLEAN,
  dc_dachhaut_moeglich BOOLEAN,
  dc_ueber_10m BOOLEAN,
  module_gleiches_gebaeude BOOLEAN,
  gebaeude_entfernung NUMERIC,
  verschattungen_vorhanden BOOLEAN,
  verschattungen_beschreibung TEXT,
  belueftungsrohre BOOLEAN,
  blitzschutz_vorhanden BOOLEAN,
  hauszufuehrung thermocheck.pv_hauszufuehrung_enum,
  blitzschutz_geprueft BOOLEAN,
  blitzschutz_abbaubar BOOLEAN,
  pv_kommentar TEXT,
  pv_bestaetigung BOOLEAN,
  pv_unterschrift TEXT
);

CREATE INDEX idx_pv_formulare_vot ON thermocheck.thermocheck_pv_formulare(vot_formular_id);

CREATE TRIGGER update_pv_formulare_updated_at
  BEFORE UPDATE ON thermocheck.thermocheck_pv_formulare
  FOR EACH ROW
  EXECUTE FUNCTION thermocheck.update_updated_at_column();

ALTER TABLE thermocheck.thermocheck_pv_formulare ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read PV formulare"
  ON thermocheck.thermocheck_pv_formulare FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert PV formulare"
  ON thermocheck.thermocheck_pv_formulare FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update PV formulare"
  ON thermocheck.thermocheck_pv_formulare FOR UPDATE
  USING (auth.uid() IS NOT NULL);
