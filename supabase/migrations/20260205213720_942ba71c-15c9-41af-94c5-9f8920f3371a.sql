-- =============================================================================
-- Schritt 1: ENUM für Produkttypen erstellen (falls nicht vorhanden)
-- =============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contractor_produkt_typ' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'thermocheck')) THEN
    CREATE TYPE thermocheck.contractor_produkt_typ AS ENUM ('kleidung', 'lizenz', 'zubehoer');
  END IF;
END $$;

-- =============================================================================
-- Schritt 2: Neue Tabelle contractor_produkte (Produkt-Katalog)
-- =============================================================================
CREATE TABLE IF NOT EXISTS thermocheck.contractor_produkte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produkt_key text NOT NULL UNIQUE,
  name text NOT NULL,
  beschreibung text,
  produkt_typ thermocheck.contractor_produkt_typ NOT NULL,
  preis_netto numeric(10,2),
  preis_brutto numeric(10,2),
  ist_abo boolean NOT NULL DEFAULT false,
  abo_intervall text,
  stripe_price_id text,
  stripe_test_price_id text,
  extern_link text,
  reihenfolge integer NOT NULL DEFAULT 0,
  braucht_groesse text, -- 'kleidung' | 'schuhe' | null
  ist_pflicht boolean NOT NULL DEFAULT false,
  ist_aktiv boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger für updated_at
DROP TRIGGER IF EXISTS update_contractor_produkte_updated_at ON thermocheck.contractor_produkte;
CREATE TRIGGER update_contractor_produkte_updated_at
  BEFORE UPDATE ON thermocheck.contractor_produkte
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS aktivieren
ALTER TABLE thermocheck.contractor_produkte ENABLE ROW LEVEL SECURITY;

-- Alle eingeloggten User können Produkte lesen (Stammdaten)
DROP POLICY IF EXISTS "Produkte sind für alle eingeloggten User lesbar" ON thermocheck.contractor_produkte;
CREATE POLICY "Produkte sind für alle eingeloggten User lesbar"
  ON thermocheck.contractor_produkte
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins können Produkte verwalten
DROP POLICY IF EXISTS "Admins können Produkte verwalten" ON thermocheck.contractor_produkte;
CREATE POLICY "Admins können Produkte verwalten"
  ON thermocheck.contractor_produkte
  FOR ALL
  USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contractor_produkte_reihenfolge ON thermocheck.contractor_produkte(reihenfolge);
CREATE INDEX IF NOT EXISTS idx_contractor_produkte_aktiv ON thermocheck.contractor_produkte(ist_aktiv) WHERE ist_aktiv = true;

-- =============================================================================
-- Schritt 3: Initiale Produktdaten einfügen
-- =============================================================================
INSERT INTO thermocheck.contractor_produkte 
  (produkt_key, name, beschreibung, produkt_typ, preis_netto, preis_brutto, ist_abo, abo_intervall, stripe_price_id, braucht_groesse, ist_pflicht, reihenfolge)
VALUES
  ('tshirt', 'Thermocheck T-Shirt', 'Offizielles Thermocheck T-Shirt für den Einsatz vor Ort', 'kleidung', 24.95, 29.69, false, null, 'price_1SvgcrLnjPqrEfxxgvConSYk', 'kleidung', true, 1),
  ('poloshirt', 'Thermocheck Poloshirt', 'Professionelles Poloshirt mit Thermocheck-Branding', 'kleidung', 34.95, 41.59, false, null, 'price_1SvgtgLnjPqrEfxxEneJQgW0', 'kleidung', true, 2),
  ('schlappen', 'Thermocheck Hausschuhe', 'Bequeme Hausschuhe für Kundentermine', 'kleidung', 19.95, 23.74, false, null, 'price_1SvgwYLnjPqrEfxxldTsLr6R', 'schuhe', true, 3),
  ('pullover', 'Thermocheck Pullover', 'Warmer Pullover mit Thermocheck-Logo', 'kleidung', 49.95, 59.44, false, null, 'price_1SvgvELnjPqrEfxx4N5BArSC', 'kleidung', false, 4),
  ('ausweiskarte', 'Thermocheck Ausweiskarte', 'Offizieller Dienstausweis', 'zubehoer', 9.95, 11.84, false, null, 'price_1SvgZrLnjPqrEfxx9ByGa0UB', null, true, 5),
  ('scanner-lizenz', 'Room Scanner Lizenz', 'Monatliche Lizenz für die Room Scanner App', 'lizenz', 167.23, 199.00, true, 'monatlich', 'price_1SvhF0LnjPqrEfxxNZn53Ydt', null, true, 6),
  ('google-workspace', 'Google Workspace', 'E-Mail und Kalender für professionelle Kommunikation', 'lizenz', 29.40, 34.99, true, 'monatlich', 'price_1Svh1QLnjPqrEfxxhoLlUgo6', null, true, 7)
ON CONFLICT (produkt_key) DO NOTHING;