# Validation: Booking Confirmation Workflow

**Datum:** 2026-02-25

## Feature

Zwei-Stufen Buchungsbestätigung für Techniker (umgekehrte Reihenfolge):
1. **Anruf** – Techniker ruft Kunden sofort nach Annahme an (Termin absprechen, Adresse verifizieren, Raumzugang klären)
2. **E-Mail am Vortag** – Schriftlicher Nachweis, dass der Termin stattfindet

## DB-Änderungen

- `thermocheck.thermocheck_auftraege` + 2 Spalten: `buchung_bestaetigt_am`, `vortag_bestaetigt_am`
- View `v_thermocheck_auftraege` erweitert um diese Spalten
- 2 RPCs: `confirm_thermocheck_booking`, `confirm_thermocheck_vortag`
- 2 Public Wrappers (SECURITY DEFINER)

## Workflow-Details

### Schritt 1: Anruf (confirm_thermocheck_booking)
- Accordion öffnet sich automatisch wenn noch nicht erledigt
- Kopierbarer Anruf-Leitfaden mit dynamischen Daten
- Telefonnummer als reiner Text mit Kopier-Button
- **Interaktive Checkliste** (3 Checkboxen, lokaler State):
  - [ ] Termin mit Kunde abgesprochen
  - [ ] Adresse verifiziert – richtiges Objekt
  - [ ] Raumzugang bestätigt – alle Räume zugänglich
- Button "Als erledigt markieren" erst aktiv wenn alle 3 Checkboxen gesetzt
- Ruft `confirm_thermocheck_booking` RPC auf

### Schritt 2: E-Mail am Vortag (confirm_thermocheck_vortag)
- Wird erst sichtbar nach Anruf-Bestätigung
- Disclaimer: "Diese E-Mail dient als schriftlicher Nachweis"
- Kopierbarer Betreff + E-Mail-Text (kein mailto:, kein Gmail-Link)
- Kunden-E-Mail als Text mit Kopier-Button
- Ruft `confirm_thermocheck_vortag` RPC auf

## Navigation Fix

- `<a href={mapsUrl} target="_blank">` ersetzt durch `<button onClick={() => window.open(mapsUrl, '_blank')}>`
- Maps-URL auf `https://www.google.com/maps/dir/?api=1&destination=...` geändert
- Adresse zusätzlich mit Kopier-Button versehen
- Umgeht X-Frame-Options Blocking im Lovable-Preview-iframe

## RPC Ownership-Checks

- Ermittelt `contractor_onboarding.id` über `auth.uid()`
- Prüft `zugewiesener_techniker_id = contractor_id`
- Prüft `pipeline_status = 'wc1_durchfuehren'`
- `FOR UPDATE` Row-Lock gegen Race Conditions

## Rollen-Matrix

| Rolle | confirm_booking | confirm_vortag |
|---|---|---|
| Zugewiesener Techniker | ✅ | ✅ |
| Anderer Techniker | ❌ Ownership | ❌ Ownership |
| Admin/Superadmin | ❌ kein contractor_onboarding | ❌ |

## Edge Cases

| Szenario | Status |
|---|---|
| Doppelklick | ✅ Idempotent |
| Falscher pipeline_status | ✅ RPC blockt |
| E-Mail ohne vorherigen Anruf | ✅ UI zeigt Task 2 erst nach Task 1 |
| Checkboxen gesetzt aber nicht bestätigt | ✅ State verloren beim Verlassen, kein RPC |
| Nicht alle Checkboxen gesetzt | ✅ Button disabled |
| Stornierter Auftrag | ✅ Pipeline-Check |
| Navigation im iframe | ✅ window.open umgeht Blocking |

## Kontaktdaten

- E-Mail und Telefonnummer als **reiner Text** (kein mailto:, kein tel:)
- Kopier-Buttons für beide Kontaktdaten

## Frontend-Dateien

- `src/types/technician.ts` – +2 Felder
- `src/hooks/useMyAssignedOrders.ts` – SELECT erweitert, Mapping
- `src/components/BookingsView.tsx` – Task-Badges
- `src/components/TechnicianOrderDetail.tsx` – Accordion mit Anruf→E-Mail Reihenfolge, Checkliste, Navigation-Fix
- `src/pages/Index.tsx` – technicianName Prop durchreichen
