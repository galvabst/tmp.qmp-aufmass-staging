ALTER TABLE thermocheck.thermocheck_vot_formulare
  ADD COLUMN distanz_ausseneinheit_kernloch numeric,
  ADD COLUMN distanz_kernloch_innengeraet numeric,
  ADD COLUMN anzahl_durchbrueche_kernloch integer,
  ADD COLUMN aufstellort_aenderung boolean,
  ADD COLUMN distanz_alter_neuer_aufstellort numeric,
  ADD COLUMN raumscan_url text;