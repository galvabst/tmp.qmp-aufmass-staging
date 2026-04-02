# Validation: Contractor Abrechnung (Billing Progress)

**Datum:** 2026-04-02

## User Stories

- US1: Techniker sieht nach Abnahme keinen Navigations-Button und keine Kundenkontaktdaten mehr
- US2: Techniker sieht einen Fortschrittsbalken: Abgenommen → Rechnung → Prüfung → Bezahlt
- US3: Techniker kann "Rechnung gestellt" klicken → Status wechselt zu "rechnung_eingegangen"
- US4: Innendienst kann Abrechnungsstatus pro Auftrag pflegen (in_pruefung, bezahlt)
- US5: Techniker kann Einsatzradius im Profil ändern (Slider 10-150 km)

## DB-Tabelle

- Schema: `thermocheck`
- Tabelle: `contractor_abrechnungen`
- ENUM: `thermocheck.abrechnung_status` (offen, rechnung_eingegangen, in_pruefung, bezahlt)
- UNIQUE on `thermocheck_auftrag_id`

## RPC

- `public.mark_rechnung_gestellt(p_auftrag_id uuid)` — SECURITY DEFINER
  - Prüft: Caller ist zugewiesener Techniker
  - Prüft: Status ist noch `offen`
  - UPSERT in `contractor_abrechnungen`

## RLS Policies

| Policy | Operation | Bedingung |
|--------|-----------|-----------|
| contractor_select_own_abrechnungen | SELECT | contractor_id matches own contractor_onboarding |
| innendienst_select_all_abrechnungen | SELECT | is_innendienst() |
| innendienst_insert_abrechnungen | INSERT | is_innendienst() |
| innendienst_update_abrechnungen | UPDATE | is_innendienst() |

## Rollen-Matrix

| Rolle | SELECT | "Rechnung gestellt" (RPC) | in_pruefung setzen | bezahlt setzen |
|-------|--------|---------------------------|--------------------|-----------------| 
| user (Techniker) | eigene | ✓ (via RPC) | ✗ | ✗ |
| admin/superadmin/manager | alle | irrelevant | ✓ | ✓ |

## Edge Cases

- ✅ Kein Abrechnungs-Eintrag → UI zeigt "Offen" (Default)
- ✅ Mehrere approved Aufträge → je eigener Abrechnungsstatus
- ✅ betrag kann von vereinbarter_preis abweichen
- ✅ bezahlt_am erst gesetzt wenn Innendienst markiert
- ✅ Hook graceful bei 403/500 → Default "offen"
- ✅ Techniker kann nur "offen" → "rechnung_eingegangen" setzen (RPC validiert)
- ✅ Doppelklick auf "Rechnung gestellt" → idempotent durch UPSERT

## UI Changes

- Approved: Navigation-Button ausgeblendet
- Approved: Adresse auf PLZ + Ort reduziert
- Approved: Kontaktdaten + Chat ausgeblendet
- Approved: 4-Stufen-Fortschrittsbalken + "Rechnung gestellt" Button
- Admin: Neuer "Abrechnung" Tab in Quality Gate View
- Profil: Einsatzradius-Slider (10-150 km)

## Known Issues

- Keine Benachrichtigung an Admin wenn Techniker Rechnung stellt (TODO)
