BEGIN;

-- 1) Disable the faulty automatic cleanup that cancelled accepted technician appointments too broadly.
DROP TRIGGER IF EXISTS trg_auftrag_lost_or_cancelled ON thermocheck.thermocheck_auftraege;
DROP FUNCTION IF EXISTS thermocheck.on_auftrag_lost_or_cancelled();

-- 2) Restore appointments that were cancelled by the erroneous backfill.
-- These rows are identifiable by the notification batch created by that migration.
UPDATE thermocheck.thermocheck_terminvorschlaege AS t
   SET status = 'angenommen'
  FROM thermocheck.techniker_benachrichtigungen AS n
 WHERE n.auftrag_id = t.thermocheck_auftrag_id
   AND n.erstellt_am = TIMESTAMPTZ '2026-05-19 14:07:50.064528+00'
   AND t.status::text = 'storniert'
   AND t.angenommen_von IS NOT NULL
   AND t.angenommen_am IS NOT NULL;

-- 3) Remove the incorrect notification batch so technicians do not see false removals.
DELETE FROM thermocheck.techniker_benachrichtigungen
 WHERE erstellt_am = TIMESTAMPTZ '2026-05-19 14:07:50.064528+00';

COMMIT;