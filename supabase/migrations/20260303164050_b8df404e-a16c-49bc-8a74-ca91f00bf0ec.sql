-- Fix the trigger function for forum tables - they use aktualisiert_am not updated_at
CREATE OR REPLACE FUNCTION thermocheck.update_forum_aktualisiert_am()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aktualisiert_am = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = thermocheck;

-- Replace triggers
DROP TRIGGER IF EXISTS update_forum_threads_updated_at ON thermocheck.contractor_forum_threads;
DROP TRIGGER IF EXISTS update_forum_antworten_updated_at ON thermocheck.contractor_forum_antworten;

CREATE TRIGGER update_forum_threads_updated_at
  BEFORE UPDATE ON thermocheck.contractor_forum_threads
  FOR EACH ROW EXECUTE FUNCTION thermocheck.update_forum_aktualisiert_am();

CREATE TRIGGER update_forum_antworten_updated_at
  BEFORE UPDATE ON thermocheck.contractor_forum_antworten
  FOR EACH ROW EXECUTE FUNCTION thermocheck.update_forum_aktualisiert_am();
