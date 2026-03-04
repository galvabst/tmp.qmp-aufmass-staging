# Validation: Review-Status & Rating Fix

**Datum:** 2026-03-04

## User Stories
- US1: Techniker sieht Aufträge mit `pipeline_status = angebotstermin_abwarten` im Review-Tab (nicht leer)
- US2: Techniker sieht 5-Sterne-Bewertung im Profil (nicht hardcoded 0)

## Root Causes
1. `deriveStatus()` kannte `angebotstermin_abwarten` nicht → Auftrag wurde als `booked` gemappt
2. `profile.stats.rating` war hardcoded `0`

## Fixes
### A. useMyAssignedOrders.ts
- `SUBMITTED_PIPELINE_STATUSES` erweitert um: `angebotstermin_abwarten`, `angebotstermin_vereinbart`, `angebot_erstellt`, `angebot_versendet`, `nachfassen`, `widerruf`
- Neuer Fetch: `techniker_bewertungen` für alle geladenen Aufträge
- `deriveStatus()` Priorität: bewertung → submitted → in_progress → booked

### B. useTechnikerBewertungStats.ts (neu)
- Fetcht AVG/COUNT aus `thermocheck.techniker_bewertungen` für `techniker_id`
- Liefert `{ average, count }`

### C. Index.tsx
- Hook `useTechnikerBewertungStats` eingebunden
- `rating: bewertungStats?.average || 0`

## Rollen-Matrix
| Rolle | SELECT bewertungen | SELECT auftraege | Ergebnis |
|-------|-------------------|-----------------|----------|
| user (Till) | ✅ authenticated | ✅ authenticated | Orders + Rating sichtbar |
| admin | ✅ | ✅ | Kein Frontend-Sonderfall |

## Edge Cases
- [x] pipeline = angebotstermin_abwarten + keine Bewertung → submitted ✅
- [x] Bewertung vorhanden + beliebige Pipeline → approved ✅
- [x] eingereicht_am gesetzt → submitted ✅
- [x] aktive Check-in-Phase → in_progress ✅
- [x] Keine Termine → leere Liste ✅
- [x] Keine Bewertungen → rating = 0 ✅
- [x] Mehrere Bewertungen → Durchschnitt ✅

## DB-Migration
Keine erforderlich.

## Known Issues
Keine.
