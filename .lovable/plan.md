

## Auftrag annehmen: DB-Persistierung + fehlende Terminvorschlaege

### Zusammenfassung der Probleme

1. **Nur 1 statt 3 Terminvorschlaege in der DB** -- In `thermocheck_terminvorschlaege` existiert genau 1 Eintrag. Die anderen 2 wurden nie eingetragen. Das ist ein Datenproblem, kein Code-Problem.
2. **"Annehmen" schreibt nichts in die DB** -- `handleStatusChange` in Index.tsx aendert nur den lokalen React-State. `zugewiesener_techniker_id` auf `thermocheck_auftraege` wird nie gesetzt. Beim Neuladen sind alle Aenderungen weg.
3. **Coaching-Logik** -- Die `book_coaching_ride` RPC existiert bereits und funktioniert korrekt. Sie setzt voraus, dass `zugewiesener_techniker_id` gesetzt ist (= ein Trainer hat den Auftrag angenommen). Ohne Punkt 2 kann Punkt 3 nie funktionieren.

---

### Loesung

#### Schritt 1: Neue RPC `thermocheck.accept_pool_order(p_termin_id UUID)`

Atomare Server-Funktion die den Auftrag einem Techniker zuweist:

```text
1. Termin-ID --> thermocheck_auftrag_id aufloesen
2. Auftrag-Row mit FOR UPDATE locken (Race-Condition-Schutz)
3. Pruefen: pipeline_status = 'termin_abwarten' UND zugewiesener_techniker_id IS NULL
4. zugewiesener_techniker_id = auth.uid() setzen
5. Erfolg zurueckgeben mit Kundenname + Adresse
```

Fehlerszenarien:
- Termin nicht gefunden --> Fehler
- Auftrag bereits vergeben --> "Dieser Auftrag wurde bereits von einem anderen Techniker angenommen"
- Falscher pipeline_status --> "Auftrag ist nicht mehr verfuegbar"

#### Schritt 2: `TechnicianOrder` um `auftragId` erweitern

Das `TechnicianOrder`-Interface bekommt ein neues Feld `auftragId: string` (die `thermocheck_auftrag_id`), damit die RPC aufgerufen werden kann. Der `usePoolOrders`-Hook mappt das bereits vorhandene `thermocheck_auftrag_id` auf dieses Feld.

#### Schritt 3: `handleStatusChange` in Index.tsx persistieren

Wenn der Techniker "Annehmen" klickt:

```text
1. RPC accept_pool_order(termin_id) aufrufen
2. Bei Erfolg: lokalen State updaten + Toast + zu "Buchungen" wechseln
3. Pool-Query invalidieren (damit der Auftrag fuer andere verschwindet)
4. Bei Fehler: Toast mit Fehlermeldung, State nicht aendern
```

#### Schritt 4: Public Wrapper fuer RPC

Da der Supabase-Client im `public`-Schema arbeitet, wird ein Wrapper `public.accept_pool_order` erstellt der `thermocheck.accept_pool_order` aufruft.

---

### Datenkorrektur: Fehlende Terminvorschlaege

Die 2 fehlenden Terminvorschlaege muessen manuell in der DB eingetragen werden. Hier ist ein Beispiel-SQL (die konkreten Daten/Zeiten muessen angepasst werden):

```text
INSERT INTO thermocheck.thermocheck_terminvorschlaege 
  (thermocheck_auftrag_id, datum, ganztaegig, zeit_von, zeit_bis, sortierung)
VALUES
  ('c9f59cdc-c64e-485d-8573-3e4b0e824d54', '2026-02-27', false, '09:00', '13:00', 2),
  ('c9f59cdc-c64e-485d-8573-3e4b0e824d54', '2026-02-28', false, '10:00', '14:00', 3);
```

---

### User Flow nach Implementierung

```text
Pool (published) 
  --> Techniker klickt Auftrag
  --> Detail-Ansicht mit "Annehmen" / "Ablehnen"
  --> "Annehmen" --> RPC accept_pool_order
      --> DB: zugewiesener_techniker_id = user_id
      --> Auftrag verschwindet aus Pool (fuer alle)
      --> Wechsel zu "Buchungen"-Tab
  --> Spaeter: Check-in Vor-Ort --> Check-out --> Nachbearbeitung --> Einreichen
```

---

### Rollen-Matrix

| Rolle | Pool sehen | Annehmen | Ergebnis in DB |
|---|---|---|---|
| Techniker (is_trainer=false) | Ja, nur termin_abwarten + unassigned | Ja | zugewiesener_techniker_id gesetzt |
| Trainer (is_trainer=true) | Ja | Ja | zugewiesener_techniker_id gesetzt, Coaching-Buchung dann moeglich |
| Admin/Manager | Ja (via RLS) | Theoretisch ja, aber kein Onboarding-Record | Sollte nicht vorkommen (Admins nutzen Admin-Panel) |

### RLS-Analyse

| Tabelle | Operation | Policy | Status |
|---|---|---|---|
| thermocheck_auftraege | SELECT | "Authenticated users can view" (qual: true) | OK |
| thermocheck_auftraege | UPDATE | "Authenticated users can update" (qual: true) | OK (RPC nutzt SECURITY DEFINER) |
| thermocheck_terminvorschlaege | SELECT | "Authenticated users can view" (qual: true) | OK |

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Zwei Techniker klicken gleichzeitig "Annehmen" | FOR UPDATE Lock, zweiter bekommt Fehlermeldung |
| Auftrag wurde zwischenzeitlich storniert | pipeline_status-Check schlaegt fehl, Fehlermeldung |
| Techniker hat keinen contractor_onboarding-Record | RPC prueft nicht (jeder Auth-User kann annehmen) -- spaeter einschraenken |
| Termin-ID existiert nicht | RPC gibt Fehler zurueck |
| Seite wird nach Annahme neu geladen | Auftrag ist weg aus Pool (DB-persistent) |

---

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration (SQL) | Neue RPC `thermocheck.accept_pool_order` + Public Wrapper |
| `src/types/technician.ts` | `auftragId: string` zu `TechnicianOrder` hinzufuegen |
| `src/hooks/usePoolOrders.ts` | `auftragId` aus `thermocheck_auftrag_id` mappen |
| `src/pages/Index.tsx` | `handleStatusChange` um RPC-Aufruf erweitern, Query invalidieren |

