## Befund

Die letzte Änderung ist noch nicht ausreichend: Die App fragt jetzt zwar `v_thermocheck_auftraege` ab, aber diese View enthält die Spalten `coaching_gebucht_von` und `coaching_bewertung` nicht. Dadurch antwortet Supabase mit `400` und der Dropdown bleibt leer.

## Plan

1. **Query robust korrigieren**
   - In `useTrainerAuftraege` wieder die Basistabelle `thermocheck_auftraege` für die Coaching-Spalten verwenden.
   - Dort nur technische Auftragsdaten laden: `id`, `lead_id`, `coaching_gebucht_von`, `coaching_bewertung`, `zugewiesener_techniker_id`.

2. **Kundendaten getrennt laden**
   - Die zugehörigen `lead_id`s sammeln.
   - Kundennamen und Ort separat aus `leads` laden.
   - Das folgt der vorhandenen Projektlogik aus `useCoachingSlots` und vermeidet die kaputte View-Spaltenmischung.

3. **Termine wie bisher laden**
   - `thermocheck_terminvorschlaege` bleibt unverändert.
   - Danach Aufträge, Kundendaten und Termine sauber zusammenführen.

4. **Fehler sichtbar behandeln**
   - Supabase-Fehler weiter explizit werfen, damit nicht wieder still `[]` angezeigt wird.
   - React Query invalidation bleibt unverändert.

## Ergebnis

Arthur sollte danach seine vorhandenen Aufträge im Mitfahrt-/Coaching-Dropdown sehen, ohne Datenbankmigration und ohne Änderung an anderen Trainer- oder Auftragslisten.