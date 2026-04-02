CREATE TABLE IF NOT EXISTS thermocheck.plz_geocode_cache (
  plz TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE thermocheck.plz_geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read geocode cache"
  ON thermocheck.plz_geocode_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert geocode cache"
  ON thermocheck.plz_geocode_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);