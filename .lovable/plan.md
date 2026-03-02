
# Fix: Check-in RPC Enum Cast Bug + Allowed Stages

## Two Bugs

### Bug 1: PostgreSQL enum cast error
Line 42 in the checkin RPC: `coalesce(v_row.pipeline_status, 'NULL')` -- since `pipeline_status` is an enum column, PostgreSQL tries to cast the string `'NULL'` to the enum type, which crashes with "invalid input value for enum". Fix: `coalesce(v_row.pipeline_status::text, 'NULL')`.

### Bug 2: Missing allowed stage
User confirms check-in should be allowed at three stages (verified against actual enum values):
- `vot_formular_abfragen`
- `vot_formular_in_verzug`
- `termin_abwarten` (the user called it "VOT-Termin abwarten" but the enum value is `termin_abwarten`)

Currently only the first two are allowed.

## Changes

### DB Migration
- `CREATE OR REPLACE` for `thermocheck.checkin_thermocheck_auftrag`:
  1. Add `termin_abwarten` to the allowed `pipeline_status` list
  2. Fix `coalesce(v_row.pipeline_status::text, 'NULL')` cast
- Recreate public wrapper

### Frontend
- `useMyAssignedOrders.ts`: No change needed -- `deriveStatus` logic is based on timestamps, not pipeline_status for `booked`/`in_progress`.
