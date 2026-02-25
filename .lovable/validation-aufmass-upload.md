# Validation: Aufmaß Upload & Kundenname Fix

**Datum:** 2026-02-25
**Getestete Rolle:** user (authentifizierter Techniker)

## Problem

Navigation zur Aufmaß-Seite verwendete `terminvorschlag_id` statt `auftrag_id` → Kundenname "Unbekannt", Upload-Buttons disabled (FK-Verletzung beim Auto-Create).

## Fix

1. `TechnicianOrderDetail.tsx`: Navigation mit `order.auftragId || order.id`
2. `useVotBilder.ts`: Dateiname `kunde_{name}_{kategorie}_{nr}.{ext}`
3. `AufmassFormPage.tsx`: Robustere FK-Fehlerbehandlung im Auto-Create

## RLS Policy Matrix

| Tabelle | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| v_thermocheck_auftraege | USING(true) | — | — | — |
| thermocheck_vot_formulare | USING(true) | WITH CHECK(true) | — | — |
| thermocheck_vot_bilder | USING(auth.uid() IS NOT NULL) | WITH CHECK(auth.uid() IS NOT NULL) | — | — |
| storage.objects (galvanek_bau) | bucket_id check + auth.uid() | bucket_id check + auth.uid() | — | — |

## Edge Cases

| Szenario | Status |
|---|---|
| Alter Link mit terminId | Graceful: auftrag=null, Auto-Create FK-Fehler abgefangen |
| order.auftragId fehlt | Fallback auf order.id |
| Concurrent auto-create (StrictMode) | autoCreatingRef Flag verhindert Duplikate |
| Formular existiert bereits | Auto-Create wird übersprungen |

## Known Issues

- Alte Links mit terminvorschlag_id zeigen weiterhin "Unbekannt" — kein Redirect implementiert (by design)
