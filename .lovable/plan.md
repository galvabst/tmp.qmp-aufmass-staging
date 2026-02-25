

# Buchungsbestaetigung-Workflow fuer Techniker

## Problem

Nach der Annahme eines Pool-Auftrags erscheint der Termin sofort in "Meine Buchungen" mit Status "Gebucht". Der Kunde weiss aber nicht, wann der Techniker tatsaechlich kommt (er hat 3 Vorschlaege gemacht, einer wurde gewaehlt). Es fehlt ein Prozess, in dem der Techniker:

1. Den Kunden per E-Mail kontaktiert und den Termin bestaetigt
2. Am Vortag nochmal anruft und den Termin rueckbestaetigt

Aktuell gibt es keinerlei Tracking dafuer.

## User Stories

**Story 1 – Buchungsbestaetigung senden**
Nach Annahme → Techniker sieht in BookingsView "Buchung bestaetigen" als offene Aufgabe → kontaktiert Kunden per E-Mail → markiert als erledigt in der App

**Story 2 – Vortag-Bestaetigung**
Am Tag vor dem Termin → Karte zeigt "Vortag: Termin bestaetigen" → Techniker ruft an → markiert als erledigt

**Story 3 – Visuelles Feedback**
BookingsView zeigt pro Buchung den Aufgaben-Status: oranges Badge "Bestätigung ausstehend", oder gruenes Haekchen wenn erledigt

## Loesung

### 1. Datenbank: 2 neue Spalten auf `thermocheck_auftraege`

```sql
ALTER TABLE thermocheck.thermocheck_auftraege
  ADD COLUMN buchung_bestaetigt_am timestamptz,
  ADD COLUMN vortag_bestaetigt_am  timestamptz;
```

Kein neuer ENUM noetig. Kein Pipeline-Wechsel noetig – `wc1_durchfuehren` bleibt der Status, die Bestaetigungen sind Aufgaben-Tracking innerhalb dieses Status. Der existierende Pipeline-Status `termin_bestaetigt` koennte spaeter als automatischer Trigger verwendet werden, ist aber fuer MVP nicht noetig.

### 2. View aktualisieren: `v_thermocheck_auftraege`

Die View listet Spalten explizit auf (kein `ta.*`). Muss um `ta.buchung_bestaetigt_am` und `ta.vortag_bestaetigt_am` erweitert werden via `CREATE OR REPLACE VIEW`.

### 3. Zwei RPCs (mit Ownership-Check)

**`thermocheck.confirm_thermocheck_booking(p_auftrag_id uuid)`**
- Ermittelt `contractor_onboarding.id` fuer `auth.uid()`
- Prueft: `zugewiesener_techniker_id = contractor_id` (nur eigene Auftraege)
- Prueft: `pipeline_status = 'wc1_durchfuehren'`
- Setzt `buchung_bestaetigt_am = now()`
- Gibt `{success: true}` zurueck

**`thermocheck.confirm_thermocheck_vortag(p_auftrag_id uuid)`**
- Gleicher Ownership-Check
- Setzt `vortag_bestaetigt_am = now()`
- Gibt `{success: true}` zurueck

Beide mit Public Wrapper (`SECURITY DEFINER`, `SET search_path = 'public'`).

### 4. Frontend: `useMyAssignedOrders` erweitern

Der Hook fetcht aktuell nur von `v_thermocheck_auftraege`. Zwei neue Felder zum SELECT hinzufuegen: `buchung_bestaetigt_am,vortag_bestaetigt_am`. Diese an `TechnicianOrder` Interface durchreichen.

### 5. Frontend: `TechnicianOrder` Type erweitern

```typescript
// Neue optionale Felder
buchungBestaetigtAm?: string;
vortagBestaetigtAm?: string;
```

### 6. Frontend: `BookingsView` ueberarbeiten

Pro Buchungskarte zwei Aufgaben-Indikatoren anzeigen:

- **Aufgabe 1: "Buchung bestaetigen"** – Orange Badge wenn `buchungBestaetigtAm` null, gruenes Haekchen wenn gesetzt
- **Aufgabe 2: "Vortag bestaetigen"** – Nur sichtbar wenn Termin morgen oder heute ist UND `buchungBestaetigtAm` gesetzt. Orange Badge wenn `vortagBestaetigtAm` null, gruenes Haekchen wenn gesetzt

### 7. Frontend: `TechnicianOrderDetail` erweitern

Im Detail-View der Buchung:
- Wenn `buchungBestaetigtAm` null → "Buchung bestaetigen" Button zeigen (ruft `confirm_thermocheck_booking` RPC auf)
- Wenn Termin morgen/heute UND `vortagBestaetigtAm` null → "Vortag bestaetigen" Button zeigen (ruft `confirm_thermocheck_vortag` RPC auf)
- Kontaktdaten (Telefon, E-Mail) prominenter darstellen, da der Techniker sie fuer die Bestaetigung braucht

### 8. Types: `supabase/types.ts`

Neue RPC-Signaturen `confirm_thermocheck_booking` und `confirm_thermocheck_vortag` hinzufuegen.

## Rollen-Matrix

| Rolle | confirm_thermocheck_booking | confirm_thermocheck_vortag |
|---|---|---|
| Zugewiesener Techniker | Ja – eigener Auftrag | Ja – eigener Auftrag |
| Anderer Techniker | Nein – Ownership-Check | Nein – Ownership-Check |
| Admin/Superadmin | Nein – kein contractor_onboarding | Nein |

RLS auf `thermocheck_auftraege`: UPDATE ist `true` fuer authentifizierte User, aber die RPCs haben eigene Ownership-Checks. Kein RLS-Risiko weil die RPCs SECURITY DEFINER sind und intern validieren.

## Edge Cases

| Szenario | Handling |
|---|---|
| Doppelklick auf "Bestaetigen" | Idempotent – setzt `now()` erneut, kein Fehler |
| Buchung bestaetigen bei falschem pipeline_status | RPC prueft `wc1_durchfuehren` |
| Vortag bestaetigen ohne Buchungsbestaetigung | Frontend zeigt Button erst wenn Buchung bestaetigt |
| Auftrag wurde zwischenzeitlich storniert | Pipeline-Check im RPC blockt |
| Termin in der Vergangenheit | Kein technisches Problem – Techniker kann nachholen |

## Datenmigration

Bestehende 12 gebuchte Auftraege (alle `wc1_durchfuehren` mit `zugewiesener_techniker_id = d27fc078`) haben `buchung_bestaetigt_am = NULL` und `vortag_bestaetigt_am = NULL`. Das ist korrekt – sie erscheinen als "Bestaetigung ausstehend" in der UI. Keine Migration noetig.

## Dateien

| Datei | Aenderung |
|---|---|
| SQL Migration | ALTER TABLE + View-Update + 2 RPCs + 2 Public Wrappers |
| `src/types/technician.ts` | +2 optionale Felder |
| `src/hooks/useMyAssignedOrders.ts` | SELECT um 2 Spalten erweitern, Mapping ergaenzen |
| `src/components/BookingsView.tsx` | Aufgaben-Badges pro Karte |
| `src/components/TechnicianOrderDetail.tsx` | Bestaetigungs-Buttons + RPC-Calls |
| `src/integrations/supabase/types.ts` | 2 neue RPC-Signaturen |
| `.lovable/validation-booking-confirmation.md` | Validierungsdoku |

