

## Plan: Sequenzielle Modul-Freischaltung + Testdaten fuer Akademie-Fortschritt

### Teil 1: Sequenzielle Modul-Freischaltung

Aktuell sind die Funktionen `isHauptmodulUnlocked` und `isUnterpunktUnlocked` in `AcademyStep.tsx` mit `return true` ueberbrueckt (TEMP-Kommentare). Diese werden durch echte Logik ersetzt:

**Regel:** Ein Hauptmodul ist freigeschaltet, wenn alle vorherigen Module vollstaendig abgeschlossen sind. Das erste Modul ist immer offen.

**Betroffene Datei:** `src/components/onboarding/steps/AcademyStep.tsx`

Aenderungen:
- `isHauptmodulUnlocked(index, hauptmodule)`: Gibt `true` zurueck wenn `index === 0` ODER wenn das vorherige Modul (`index - 1`) komplett abgeschlossen ist (alle Leaf-Unterpunkte `abgeschlossen === true`).
- `isUnterpunktUnlocked()` wird entfernt (wird nicht mehr benoetigt, da die Sperre auf Modul-Ebene greift -- gesperrte Module koennen gar nicht aufgeklappt werden).
- Klick auf Lektionen in gesperrten Modulen wird blockiert (ist bereits durch `disabled={!isUnlocked}` am AccordionItem umgesetzt).

### Teil 2: Testdaten fuer Akademie-Fortschritt

Fuer den Testkunden `livab32434@advarm.com` (contractor_id: `66912458-4735-4e2a-9942-9c3bb525f447`) werden 24 von 25 sichtbaren Lektionen als `completed` in `contractor_akademie_lektions_fortschritt` eingetragen.

**Ausgenommen:** "Fehlerbibliothek" (ID: `dfd70ccc-6ea0-4193-8f3a-4e2bf51cbf53`, Code: 10-4)

Die 24 Lektionen, die als abgeschlossen markiert werden:
- Modul 0: Ziel der Akademie
- Modul 1: Was ist der Thermocheck?, Verhalten bei den Kunden
- Modul 2: Begruessung & Vertrauen
- Modul 3: Arbeitssicherheit allgemein, Verhalten in Privatwohnungen, Datenschutz & Einwilligungen, Grenzen & Eskalation
- Modul 4: Zeitplanung & Routenlogik
- Modul 5: Zeitmanagement vor Ort
- Modul 6: Raumweise Gebaeude Daten..., Heizlastberechnung...
- Modul 7: Praxis: Raeume scannen, Praxis: Zoho Forms, Praxis: Raumscann APP
- Modul 8: Zusammenfassung geben, Naechste Schritte erklaeren, Offene Punkte klaeren
- Modul 9: Zugang fehlt / Termin anpassen, Sicherheitskritische Situationen, Unklare Bestandssituation, Beschwerden & Konflikte
- Modul 10: Selbstcheck vor Abgabe, Audit & Feedbackprozess (NICHT Fehlerbibliothek)

Dies erfolgt per INSERT in die DB-Tabelle `thermocheck.contractor_akademie_lektions_fortschritt`.

### Technische Details

| Datei | Aenderung |
|---|---|
| `src/components/onboarding/steps/AcademyStep.tsx` | `isHauptmodulUnlocked` mit echter Logik, `isUnterpunktUnlocked` entfernen |
| DB (Insert, kein Schema-Change) | 24 Eintraege in `contractor_akademie_lektions_fortschritt` mit `status = 'completed'` |

Keine DB-Migration noetig (nur Daten-Insert). Keine Edge-Function-Aenderung.
