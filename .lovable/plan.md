

## Echte Auftraege aus `thermocheck_terminvorschlaege` laden

### Problem

Der Pool zeigt Dummy-Daten aus einer Mock-Datei. Die echten Auftraege stehen in `thermocheck_terminvorschlaege` (Termine) verknuepft mit `v_thermocheck_auftraege` (Kundendaten).

### Datenquelle

Aktuell 1 Datensatz in `thermocheck_terminvorschlaege`:

| Feld | Wert |
|---|---|
| datum | 2026-02-26 |
| zeit_von / zeit_bis | 11:00 - 15:00 |
| Kunde | Ferizi Arsim |
| Adresse | Stettinerstrasse 7, 37574 Einbeck |
| pipeline_status | termin_abwarten |

### Umsetzung

**1. Neuer Hook: `src/hooks/usePoolOrders.ts`**

- Fetcht per REST-API (wie `useContractorOrders`) aus dem `thermocheck`-Schema
- JOIN: `thermocheck_terminvorschlaege` + `v_thermocheck_auftraege` (via `thermocheck_auftrag_id`)
- Filter: `pipeline_status = termin_abwarten` und `zugewiesener_techniker_id` ist leer (offene Auftraege)
- Mappt die DB-Felder auf das `TechnicianOrder`-Interface:
  - `customerName` = `kunde_vorname` + `kunde_nachname`
  - `address` = `kunde_strasse` + `kunde_hausnummer`
  - `city` = `kunde_ort`, `postalCode` = `kunde_plz`
  - `scheduledDate` = `datum`, `scheduledTime` = `zeit_von` - `zeit_bis`
  - `status` = `published` (da im Pool)
  - `contactPhone` = `kunde_telefon`, `contactEmail` = `kunde_email`
  - `auftragstyp` = `thermocheck` (default)

**2. Aenderung: `src/pages/Index.tsx`**

- Import von `mockTechnicianOrders` entfernen
- `usePoolOrders(profileId)` aufrufen
- `orders` State initial leer setzen, mit DB-Daten befuellen sobald geladen
- Loading-State waehrend Daten geladen werden

### Technische Details

- Verwendet den gleichen REST-Fetch-Pattern wie `useContractorOrders` mit `Accept-Profile: thermocheck` Header
- Query: Erst Terminvorschlaege laden mit `select=*,thermocheck_auftrag_id(kunde_vorname,kunde_nachname,kunde_strasse,kunde_hausnummer,kunde_plz,kunde_ort,kunde_telefon,kunde_email,pipeline_status)` oder zwei separate Queries
- Lokale Aktionen (Annehmen, Check-in) bleiben vorerst im Frontend-State

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/hooks/usePoolOrders.ts` | Neu: Hook fuer echte Termine aus DB |
| `src/pages/Index.tsx` | Mock-Import entfernen, echten Hook einbinden |

