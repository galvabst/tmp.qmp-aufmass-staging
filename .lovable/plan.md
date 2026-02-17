

## Fix: Saubere Datenpflege bei Auftragsannahme (accept_pool_order)

### IST-Stand (Probleme)

Aktuell passiert bei `accept_pool_order` nur EIN Update:
- `zugewiesener_techniker_id` wird auf dem Auftrag gesetzt

Was NICHT passiert:
1. `terminvorschlaege.status` bleibt `vorgeschlagen` (statt `angenommen`/`abgelehnt`)
2. `terminvorschlaege.angenommen_von` bleibt `NULL`
3. `terminvorschlaege.angenommen_am` bleibt `NULL`
4. `pipeline_status` bleibt `termin_abwarten` (statt naechster Status)

Beweis aus der Live-DB: Alle 4 zugewiesenen Termine stehen auf `status = 'vorgeschlagen'` mit `angenommen_von = NULL` und `angenommen_am = NULL`.

### Pipeline-Status-Frage

Die Enum `thermocheck_pipeline_status` hat folgende Werte:

```text
neuer_thermocheck_auftrag
  -> termin_abwarten
    -> wc1_durchfuehren       <-- logischer naechster Status nach Annahme
      -> vot_formular_abfragen
        -> vot_auswertung_ag
          -> ergebnis_abwarten
            -> angebotstermin_abfragen
              -> angebotstermin_abwarten
                -> gewonnen / verloren / widerruf
```

Nach Annahme sollte der Status auf `wc1_durchfuehren` wechseln (= Techniker muss den Thermocheck vor Ort durchfuehren).

---

### Loesung: accept_pool_order RPC erweitern

Eine neue Migration erstellt die Funktion `thermocheck.accept_pool_order` neu mit 3 zusaetzlichen Statements:

```text
VORHER (nur 1 UPDATE):
  UPDATE thermocheck_auftraege SET zugewiesener_techniker_id = ...

NACHHER (4 UPDATES):
  1. UPDATE thermocheck_auftraege SET zugewiesener_techniker_id = ..., pipeline_status = 'wc1_durchfuehren'
  2. UPDATE thermocheck_terminvorschlaege SET status = 'angenommen', angenommen_von = ..., angenommen_am = now() WHERE id = p_termin_id
  3. UPDATE thermocheck_terminvorschlaege SET status = 'abgelehnt' WHERE thermocheck_auftrag_id = ... AND id != p_termin_id
```

Alles bleibt atomar in derselben Transaktion mit FOR UPDATE Lock.

### Datenmigration (bestehende Dirty Data bereinigen)

Nach der Schema-Migration muessen die 4 existierenden, unsauberen Datensaetze bereinigt werden:

```sql
-- Alle Termine zu zugewiesenen Auftraegen als 'angenommen' markieren
-- (da jeder Auftrag aktuell nur 1 Termin hat, ist angenommen korrekt)
UPDATE thermocheck.thermocheck_terminvorschlaege t
SET status = 'angenommen',
    angenommen_am = now()
FROM thermocheck.thermocheck_auftraege a
WHERE t.thermocheck_auftrag_id = a.id
  AND a.zugewiesener_techniker_id IS NOT NULL
  AND t.status = 'vorgeschlagen';

-- Pipeline-Status der zugewiesenen Auftraege korrigieren
UPDATE thermocheck.thermocheck_auftraege
SET pipeline_status = 'wc1_durchfuehren'
WHERE zugewiesener_techniker_id IS NOT NULL
  AND pipeline_status = 'termin_abwarten';
```

### Zukunftssicherung: useMyAssignedOrders filtern

Aktuell holt `useMyAssignedOrders` ALLE Termine eines zugewiesenen Auftrags. Sobald Auftraege 3 Terminvorschlaege haben, wuerden alle 3 im Bookings-Tab erscheinen. Fix: Nur Termine mit `status=eq.angenommen` laden.

Zeile 90 in `src/hooks/useMyAssignedOrders.ts` aendern:
```text
VORHER:  thermocheck_terminvorschlaege?thermocheck_auftrag_id=in.(...)
NACHHER: thermocheck_terminvorschlaege?thermocheck_auftrag_id=in.(...)&status=eq.angenommen
```

### Rollen-Matrix

| Rolle | accept_pool_order ausfuehren? | Wer profitiert? |
|---|---|---|
| user (Techniker mit contractor_onboarding) | Ja -- SECURITY DEFINER RPC | Nur eigene Auftraege annehmbar |
| user (ohne contractor_onboarding) | Nein -- Fehler "Kein Contractor-Profil" | Korrekt blockiert |
| admin/manager | Nein -- haben kein contractor_onboarding | Korrekt blockiert |
| superadmin | Nein -- haben kein contractor_onboarding | Korrekt blockiert |

RLS ist nicht betroffen, da die Funktion SECURITY DEFINER ist und direkt auf dem thermocheck-Schema arbeitet.

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Auftrag mit 3 Terminen, einer wird angenommen | Angenommener -> `angenommen`, die anderen 2 -> `abgelehnt` |
| Auftrag mit 1 Termin | Termin -> `angenommen`, kein abgelehnt noetig |
| Gleichzeitige Annahme (Race Condition) | FOR UPDATE Lock, zweiter bekommt "bereits vergeben" |
| Auftrag nicht mehr im Pool (pipeline_status != termin_abwarten) | Fehler "nicht mehr im Pool" |
| User ohne contractor_onboarding | Fehler "Kein Contractor-Profil" |

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Neue SQL-Migration | `CREATE OR REPLACE FUNCTION thermocheck.accept_pool_order` + Public Wrapper + Daten-Bereinigung |
| `src/hooks/useMyAssignedOrders.ts` (Zeile 90) | Filter `&status=eq.angenommen` hinzufuegen |

### Keine weiteren Aenderungen noetig

- `usePoolOrders.ts`: Filtert bereits auf `zugewiesener_techniker_id=is.null` -- funktioniert weiterhin korrekt
- `OnboardingScreen.tsx` / `Index.tsx`: Nicht betroffen
- RLS Policies: Nicht betroffen (SECURITY DEFINER)
- Frontend-UI: Keine Aenderung noetig

