## Ziel
Michel Süße und Brian Maina als Coaching-Mitfahrer bei Arthur Penner eintragen, sodass Arthur sie in seinem Trainer-Tab unter „Vergangene Mitfahrten" sieht und mit *Bestanden* freigeben kann.

## Treffer in der DB

| Trainee | Datum | Ort | Auftrag-ID | Kunde |
|---|---|---|---|---|
| Michel Süße | 24.04.2026 | Chemnitz (09224) | `ac1db288-…5b3f8f26577a` | Michael Gerlach |
| Brian Maina | 22.04.2026 | Witten (58453) | `b3ccb43a-…0a2a2e8c40f6` | Heinz Hetschold |
| Brian Maina | 22.04.2026 | Essen (45133) | `9f99fdcf-…4e73b4373987` | Erik Kolstø |

Aalen am 22.04. (von dir erwähnt) existiert bei Arthur nicht — wird weggelassen.

## Wichtige Einschränkung der bestehenden RPC
`admin_book_coaching_ride` erlaubt pro Trainee nur **eine aktive** Buchung mit `coaching_bewertung = 'ausstehend'`. Eine zweite Buchung würde die erste automatisch wieder freigeben.

→ Für Brian müssen wir die beiden Buchungen **direkt mitbewerten**, sonst überschreibt die zweite die erste. Das bedeutet: ich buche die Mitfahrt **und** setze sie sofort auf `bestanden` (mit dir als `coaching_bewertung_von`, Notiz: „Nachträglich durch Innendienst eingetragen").

Da Brian und Michel laut deiner Aussage sowieso „auf die Freigabe warten" und Arthur die Mitfahrten faktisch schon gemacht hat, ist das die saubere Lösung. Wenn du das nicht willst, sag Bescheid — dann buche ich pro Trainee nur einen Auftrag.

## Vorgehen (3 SQL-Schritte via `INSERT/UPDATE`-Tool, transaktional pro Trainee)

1. **Michel Süße** auf Chemnitz-Auftrag buchen + direkt `bestanden`
   - `admin_book_coaching_ride(michel_profile, ac1db288…)` → setzt `coaching_gebucht_von`, aktualisiert Onboarding (`gebuchter_coaching_termin`, `gebuchter_coach_name`)
   - `bewerte_coaching_mitfahrt(ac1db288…, 'bestanden', 'Nachträglich eingetragen')` → schaltet Onboarding frei (Step → `nachweise`)

2. **Brian Maina** auf Witten-Auftrag → buchen + `bestanden`
   - gleiche zwei Calls mit `b3ccb43a…`
   - schaltet Brians Onboarding frei

3. **Brian Maina** auf Essen-Auftrag → buchen + `bestanden`
   - gleiche zwei Calls mit `9f99fdcf…`
   - Onboarding ist schon frei, aber Auftrag erscheint zusätzlich in Arthurs Verlauf

Falls einer der Schritte fehlschlägt, bricht der Plan an dieser Stelle ab und meldet den Fehler — keine halbgaren Zustände.

## Validierung danach
- `SELECT id, coaching_gebucht_von, coaching_bewertung FROM thermocheck_auftraege WHERE id IN (3 IDs)` → alle drei zeigen den richtigen Trainee + `bestanden`
- `SELECT current_step, coaching_freigabe FROM contractor_onboarding WHERE profile_id IN (Michel, Brian)` → beide auf `nachweise` (oder weiter)
- In Arthurs Trainer-Tab unter „Vergangene Mitfahrten" tauchen 3 Karten mit Badge **Bestanden** auf

## Was du tun musst
Nur freigeben. Ich führe alle DB-Operationen aus, sobald du den Plan akzeptierst.
