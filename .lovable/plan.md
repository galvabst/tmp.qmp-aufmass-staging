## Fix

Vorherige Migration nutzte falschen Enum-Namen. Echter Name: `thermocheck.terminvorschlag_status` (nicht `thermocheck_terminvorschlag_status`).

Neue Migration ersetzt `thermocheck.accept_thermocheck_reschedule` mit korrektem Enum-Cast:

- `status = 'angenommen'::thermocheck.terminvorschlag_status`
- `status = 'abgelehnt'::thermocheck.terminvorschlag_status`
- `status = 'vorgeschlagen'::thermocheck.terminvorschlag_status` im WHERE
- `pipeline_status = 'wc1_durchfuehren'::thermocheck.thermocheck_auftrags_pipeline_status` (bereits korrekt)

Logik unverändert. Keine Frontend-Änderungen.
