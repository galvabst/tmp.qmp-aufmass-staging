# Validation: VOT-Formular Zugang unabhängig vom Pipeline-Status

**Datum:** 2026-03-06

## Änderungen

### 1. UI: Button für alle Statuses sichtbar
**Datei:** `TechnicianOrderDetail.tsx`
- Button-Condition von `(isBookedOrder || isInProgress)` auf `!isPoolOrder` geändert
- Dynamisches Label: "Aufmaß-Formular ansehen" bei submitted/approved, sonst "Aufmaß-Formular öffnen"
- Formular öffnet im Read-Only-Modus wenn `formular.status === 'abgeschlossen'`

### 2. Check-in RPC: Pipeline-Guard erweitert
**Migration:** `checkin_thermocheck_auftrag`
- Erlaubte Pipeline-Statuses erweitert um `vot_auswertung_ag` und `ergebnis_abwarten`
- **Rework-Logik:** Wenn `nachbearbeitung_checkout_at` bereits gesetzt (= schon einmal eingereicht):
  - Reset: `nachbearbeitung_checkout_at`, `eingereicht_am`, `eingereicht_von` → NULL
  - Reset: `thermocheck_vot_formulare.status` → `entwurf` (damit Contractor editieren kann)
  - Setzt neuen `nachbearbeitung_checkin_at` Timestamp
  - Gibt `{ success: true, rework: true }` zurück

### 3. Kein Formular-Seiten-Guard
`AufmassFormPage.tsx` hat keinen Pipeline-Status-Check → funktioniert für jeden der die URL erreicht.
`isReadOnly` basiert ausschließlich auf `formular.status === 'abgeschlossen'`.

## Rollen-Matrix

| Aktion | Contractor (zugewiesen) | Contractor (nicht zugewiesen) | Admin |
|--------|------------------------|------------------------------|-------|
| Formular öffnen (Button) | ✅ alle Statuses | ❌ kein Button (Pool) | n/a |
| Formular editieren | ✅ wenn status ≠ abgeschlossen | ❌ | n/a |
| Check-in (vor_ort) | ✅ Owner + erlaubte Pipeline | ❌ Ownership-Check | ❌ |
| Check-in (nachbearbeitung) | ✅ Owner + erlaubte Pipeline | ❌ Ownership-Check | ❌ |
| Rework-Checkin | ✅ Reset Timestamps + Formular | ❌ | ❌ |
| Formular einreichen | ✅ via Nachbearbeitung-Checkout | ❌ | ❌ |

## RLS Policy Matrix

| Tabelle | SELECT | INSERT | UPDATE |
|---------|--------|--------|--------|
| v_thermocheck_auftraege | USING(true) | — | — |
| thermocheck_vot_formulare | USING(true) | WITH CHECK(true) | — |
| thermocheck_auftraege | — | — | USING(true) (via SECURITY DEFINER RPCs) |

## Edge Cases

| Szenario | Status |
|----------|--------|
| Formular bei `booked` öffnen | ✅ Editierbar |
| Formular bei `in_progress` öffnen | ✅ Editierbar |
| Formular bei `submitted` öffnen | ✅ Read-Only (formular.status = abgeschlossen) |
| Formular bei `approved` öffnen | ✅ Read-Only |
| Formular bei `rework_required` öffnen | ✅ Editierbar nach Rework-Checkin (formular.status reset) |
| Rework-Checkin: Doppelklick | ✅ Idempotent (nachbearbeitung_checkin_at wird nur 1x gesetzt) |
| Rework: Formular nochmal einreichen | ✅ Nachbearbeitung-Checkout setzt pipeline_status zurück |
| Pipeline in `vot_auswertung_ag` + Checkin | ✅ Erlaubt durch erweiterten Guard |
| Pipeline in `ergebnis_abwarten` + Checkin | ✅ Erlaubt durch erweiterten Guard |
| Pipeline in `gewonnen` + Checkin | ❌ Nicht erlaubt (korrektes Verhalten) |
| Anderer Techniker Rework-Checkin | ❌ Ownership-Check blockiert |
| Pool-Auftrag Formular öffnen | ❌ Button nicht sichtbar (!isPoolOrder) |

## Datenintegrität

- Rework-Reset ist transaktional (SELECT FOR UPDATE → Reset → Insert)
- Formular-Status-Reset auf `entwurf` nur bei `status = 'abgeschlossen'` (schützt vor versehentlichem Reset)
- `eingereicht_am` und `eingereicht_von` werden bei Rework-Checkin genullt → deriveStatus gibt `in_progress` zurück

## Known Issues

- Kein expliziter `rework_required` Pipeline-Status im Frontend-Mapping → wird als `in_progress` behandelt (korrekt, da der Contractor arbeiten muss)
