-- RPC-Funktion für Größen-Updates in contractor_onboarding
CREATE OR REPLACE FUNCTION thermocheck.update_contractor_onboarding_size(
  p_spalte text,
  p_groesse text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_allowed_columns text[] := ARRAY['tshirt_groesse', 'poloshirt_groesse', 'pullover_groesse', 'schuh_groesse'];
BEGIN
  -- Validierung: Nur erlaubte Spalten
  IF NOT (p_spalte = ANY(v_allowed_columns)) THEN
    RAISE EXCEPTION 'Invalid column name: %', p_spalte;
  END IF;
  
  -- Dynamisches UPDATE mit quote_ident für Sicherheit
  EXECUTE format(
    'UPDATE thermocheck.contractor_onboarding SET %I = $1 WHERE profile_id = auth.uid()',
    p_spalte
  ) USING p_groesse;
END;
$$;

-- Berechtigungen
GRANT EXECUTE ON FUNCTION thermocheck.update_contractor_onboarding_size(text, text) TO authenticated;