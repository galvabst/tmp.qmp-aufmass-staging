## Problem

Alexandra (and any technician) cannot accept a reschedule proposal. The RPC `public.accept_thermocheck_reschedule` returns:

```
column "pipeline_status" is of type thermocheck.thermocheck_auftrags_pipeline_status 
but expression is of type text
```

Confirmed via network log: `POST /rest/v1/rpc/accept_thermocheck_reschedule` → 400.

## Root Cause

In `supabase/migrations/20260225104016_*.sql` the function `thermocheck.accept_thermocheck_reschedule`:

1. Declares `v_pipeline_status text` and `v_termin_status text` (lines 17-18) but reads from enum columns (`pipeline_status`, `terminvorschlaege.status`) without casting.
2. Updates `pipeline_status = 'wc1_durchfuehren'` and `status = 'angenommen' / 'abgelehnt'` with bare text literals — PostgreSQL refuses these assignments because the columns are native ENUMs (per project DB standards).

This is the same pattern that works correctly in `accept_pool_order` because that function uses proper enum casts.

## Fix

Create a new migration that replaces `thermocheck.accept_thermocheck_reschedule` with corrected enum handling:

- Change local variable types from `text` to the actual enum types (`thermocheck.thermocheck_auftrags_pipeline_status`, and the terminvorschlag status enum), OR cast reads with `::text` and writes with `::enum_type`.
- Cast literals on every UPDATE:
  - `pipeline_status = 'wc1_durchfuehren'::thermocheck.thermocheck_auftrags_pipeline_status`
  - `status = 'angenommen'::<enum>` and `status = 'abgelehnt'::<enum>` on the terminvorschlaege updates
  - Comparison: `v_pipeline_status <> 'termin_abwarten'` keep working by using text variables fed by `pipeline_status::text`.
- Keep the public wrapper unchanged.

## Verification After Migration

1. Re-run Alexandra's "Termin annehmen" action — RPC should return `{success: true}`.
2. Confirm in DB:
   - The chosen `terminvorschlaege` row → `status = 'angenommen'`, `angenommen_von`, `angenommen_am` set.
   - Sibling proposals → `status = 'abgelehnt'`.
   - The `thermocheck_auftraege` row → `pipeline_status = 'wc1_durchfuehren'`.
3. Spot-check that `useMyAssignedOrders` now returns the order in the active list.

## Out of Scope

- Alexandra's poloshirt payment (already fixed in previous step).
- No frontend changes required — the bug is purely in the SQL function.
