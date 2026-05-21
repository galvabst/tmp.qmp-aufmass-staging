## Problem
Im Trainer-Detail bei Arthur Penner zeigt das Dropdown "Coaching-Mitfahrt manuell zuweisen" **„Keine Aufträge für diesen Trainer"** — obwohl Arthur über 25 zugewiesene Thermocheck-Aufträge mit Terminen hat (von 2026-03-31 bis 2026-11-13).

## Ursache
`useTrainerAuftraege` in `src/features/contractors/hooks/useAdminContractorActions.ts` liest direkt aus der Basistabelle `thermocheck.thermocheck_auftraege` und versucht die Spalten `kunde_vorname`, `kunde_nachname`, `kunde_ort` zu selektieren. **Diese Spalten existieren dort nicht** — sie kommen erst durch den Join in der View `v_thermocheck_auftraege` zustande.

Der Query wirft also einen `column does not exist`-Fehler, react-query liefert `undefined`, das Default-`[]` greift, und das Dropdown zeigt den Leer-Zustand.

Beweis aus der DB:
- Spalten-Check auf `thermocheck_auftraege`: keine `kunde_*` Spalten vorhanden
- 28 Aufträge mit `zugewiesener_techniker_id = Arthur` existieren, alle mit `coaching_bewertung = 'ausstehend'` und mindestens einem Termin

## Fix (1 Datei, ~3 Zeilen)
In `useTrainerAuftraege` (Zeile 64-67) die Quelle von `thermocheck_auftraege` auf `v_thermocheck_auftraege` umstellen — analog zu `useAdminPoolTermine`, das die View bereits korrekt nutzt. Selektierte Felder bleiben identisch (`kunde_vorname, kunde_nachname, kunde_ort, coaching_gebucht_von, coaching_bewertung`).

## Validierung
1. Trainer-Detail Arthur Penner öffnen → Dropdown muss alle 28 Aufträge zeigen, sortiert nach Datum absteigend, mit Kundenname + Ort + Datum.
2. Bereits belegte Termine (z. B. die 3 von Michel/Brian) erscheinen mit Badge **belegt** und sind disabled.
3. Vergangene Termine bekommen das **vergangen**-Badge (Nacherfassung weiter möglich).
4. Eine Test-Zuweisung an einen Trainee funktioniert wie zuvor (kein RPC-Change nötig).

## Nicht im Scope
- Keine DB-Migration.
- Kein UI-Change.
- Kein Verhalten anderer Trainer-Listen.
