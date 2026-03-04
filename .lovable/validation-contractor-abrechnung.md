# Validation: Contractor Abrechnung (Billing Progress)

**Datum:** 2026-03-04

## User Stories

- US1: Techniker sieht nach Abnahme keinen Navigations-Button und keine Kundenkontaktdaten mehr
- US2: Techniker sieht einen Fortschrittsbalken: Abgenommen → Rechnung → Prüfung → Bezahlt
- US3: Innendienst kann Abrechnungsstatus pro Auftrag pflegen (INSERT/UPDATE)

## DB-Tabelle

- Schema: `thermocheck`
- Tabelle: `contractor_abrechnungen`
- ENUM: `thermocheck.abrechnung_status` (offen, rechnung_eingegangen, in_pruefung, bezahlt)
- UNIQUE on `thermocheck_auftrag_id`

## RLS Policies

| Policy | Operation | Bedingung |
|--------|-----------|-----------|
| contractor_select_own_abrechnungen | SELECT | contractor_id matches own contractor_onboarding |
| innendienst_select_all_abrechnungen | SELECT | is_innendienst() |
| innendienst_insert_abrechnungen | INSERT | is_innendienst() |
| innendienst_update_abrechnungen | UPDATE | is_innendienst() |

## Rollen-Matrix

| Rolle | SELECT | INSERT | UPDATE |
|-------|--------|--------|--------|
| user (Techniker) | eigene | ✗ | ✗ |
| admin/superadmin/manager | alle | ✓ | ✓ |

## Edge Cases

- ✅ Kein Abrechnungs-Eintrag → UI zeigt "Offen" (Default)
- ✅ Mehrere approved Aufträge → je eigener Abrechnungsstatus
- ✅ betrag kann von vereinbarter_preis abweichen
- ✅ bezahlt_am erst gesetzt wenn Innendienst markiert
- ✅ Hook graceful bei 403/500 → Default "offen"

## UI Changes

- Approved: Navigation-Button ausgeblendet
- Approved: Adresse auf PLZ + Ort reduziert
- Approved: Kontaktdaten + Chat ausgeblendet
- Approved: 4-Stufen-Fortschrittsbalken (Abgenommen → Rechnung → Prüfung → Bezahlt)

## Known Issues

- Admin-UI zum Setzen des Abrechnungsstatus noch nicht implementiert
