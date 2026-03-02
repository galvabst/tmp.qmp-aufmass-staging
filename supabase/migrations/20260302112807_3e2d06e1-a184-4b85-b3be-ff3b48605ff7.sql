-- Backfill vereinbarter_preis for all existing assigned orders
UPDATE thermocheck.thermocheck_auftraege a
SET vereinbarter_preis = cg.betrag_netto
FROM thermocheck.contractor_grundpreise cg
WHERE a.zugewiesener_techniker_id = cg.contractor_id
  AND COALESCE(a.auftragstyp, 'thermocheck') = cg.auftragstyp
  AND a.vereinbarter_preis IS NULL;