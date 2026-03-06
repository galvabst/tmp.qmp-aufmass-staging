
ALTER TABLE thermocheck.thermocheck_vot_formulare
  ADD COLUMN heizungsraum_verlegen BOOLEAN,
  ADD COLUMN anschluss_vorlauf_vorhanden BOOLEAN,
  ADD COLUMN anschluss_vorlauf_distanz NUMERIC,
  ADD COLUMN anschluss_ruecklauf_vorhanden BOOLEAN,
  ADD COLUMN anschluss_ruecklauf_distanz NUMERIC,
  ADD COLUMN anschluss_warmwasser_vorhanden BOOLEAN,
  ADD COLUMN anschluss_warmwasser_distanz NUMERIC,
  ADD COLUMN anschluss_kaltwasser_vorhanden BOOLEAN,
  ADD COLUMN anschluss_kaltwasser_distanz NUMERIC,
  ADD COLUMN anschluss_zirkulation_vorhanden BOOLEAN,
  ADD COLUMN anschluss_zirkulation_distanz NUMERIC;
