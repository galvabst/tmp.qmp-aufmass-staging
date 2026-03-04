# Validation: Coaching-Bewertung pro Auftrag + Trainer-Workflow

**Datum:** 2026-03-04
**Feature:** Trainer-Mitfahrten mit 4-Ergebnis-Bewertung + Past/Future Split

---

## Änderungen

### DB-Migration
- `thermocheck.coaching_bewertung_enum`: +`abgesagt`, +`no_show`
- `thermocheck.thermocheck_auftraege`: +`coaching_bewertung` (enum, default 'ausstehend'), +`coaching_bewertung_am`, +`coaching_bewertung_von`
- RPC `thermocheck.bewerte_coaching_mitfahrt` aktualisiert: 4 Entscheidungen, Bewertung auf ORDER schreiben, `coaching_gebucht_von` bleibt erhalten (Historie!)
- Bei bestanden: Onboarding freischalten
- Bei nicht_bestanden/abgesagt/no_show: Onboarding-Step + nachweise zurücksetzen, Trainee muss neu buchen

### Frontend
| Datei | Änderung |
|---|---|
| `src/hooks/useMyCoachingRideAlongs.ts` | Bewertung vom Auftrag lesen (nicht Onboarding), 4 Statuses |
| `src/components/trainer/TrainerRideAlongs.tsx` | Past/Future Split, 4 Aktions-Buttons, erweiterte Badges |
| `src/hooks/useCoachingSlots.ts` | `useMyBookedRide` filtert auf `coaching_bewertung = 'ausstehend'` |

---

## User Flows

### Trainer bewertet vergangene Mitfahrt
1. Profil-Tab → "Vergangene Mitfahrten" → Karte
2. 4 Buttons: Bestanden / Nicht bestanden / Abgesagt / No-Show
3. Confirm-Dialog → RPC → Bewertung auf ORDER gespeichert
4. Bei bestanden: Trainee Onboarding freigeschaltet
5. Bei Rest: Trainee zurück auf Coaching-Step

### Trainee nach nicht bestanden
1. App öffnen → Onboarding → current_step='coaching'
2. Verfügbare Coaching-Termine sichtbar (datum >= heute + coaching_gebucht_von IS NULL)
3. Alte Buchung bleibt im Trainer-Verlauf sichtbar

---

## Rollen-Matrix

| Rolle | Sieht Mitfahrten? | Kann bewerten? | 4 Optionen? |
|---|---|---|---|
| Trainer (is_trainer=true) | ✅ Past/Future Split | ✅ Nur vergangene | ✅ |
| Trainee | ❌ | ❌ | ❌ |
| Admin | ❌ (kein UI) | ❌ | ❌ |

---

## RLS / Security

| Prüfung | Status |
|---|---|
| RPC SECURITY DEFINER | ✅ |
| auth.uid() = Trainer des Auftrags | ✅ FOR UPDATE |
| Doppelbewertung verhindert | ✅ (coaching_bewertung != 'ausstehend' check) |
| Nicht-Trainer blocked | ✅ (is_trainer check) |

---

## Edge Cases

| Szenario | Verhalten | Status |
|---|---|---|
| Vergangene Mitfahrt, ausstehend | 4 Buttons sichtbar | ✅ |
| Zukünftige Mitfahrt | Nur Anzeige, keine Aktionen | ✅ |
| Bereits bewertet | Badge angezeigt, keine Buttons | ✅ |
| Doppelbewertung (Race Condition) | RPC gibt Fehler | ✅ |
| coaching_gebucht_von bleibt nach Ablehnung | Historie erhalten | ✅ |
| Trainee BookedRide nach Ablehnung | Filtert auf bewertung='ausstehend', zeigt null | ✅ |
| nachweise-Step nach Ablehnung | Wird aus completed_steps entfernt | ✅ |

---

## Known Issues
- Bestehende Security-Linter-Warnings (pre-existing)
- Statusfarben in Badges sind hardcoded (intentional, kein Design-Token-Mapping für semantische Status-Farben)
