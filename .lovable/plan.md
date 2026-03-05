

# Pool-View: Nur unzugewiesene Aufträge zeigen

## Problem
Aktuell zeigt der Pool-Tab ALLE Thermocheck-Aufträge, auch die bereits einem Techniker zugewiesenen. Diese sind aber schon unter "Buchungen" sichtbar — doppelt und nutzlos. Der Admin will hier nur die offenen, unbedienten Aufträge sehen, aufgeteilt in:

- **Ohne Termin**: Kein Techniker zugewiesen UND keine Terminvorschläge vorhanden
- **Mit Termin**: Kein Techniker zugewiesen, ABER Terminvorschläge existieren (warten auf Annahme)

## Änderungen

| Datei | Änderung |
|-------|----------|
| `useAdminObjectOrders.ts` | Filter: `zugewiesener_techniker_id = null` auf der Query hinzufügen, sodass nur unzugewiesene Aufträge geladen werden |
| `ObjectOrderListView.tsx` | Subtitle/Beschreibung anpassen: "Ohne Termin" = noch keine Vorschläge, "Mit Termin" = Vorschläge vorhanden, wartet auf Annahme |

### Hook-Änderung (1 Zeile)
In `useAdminObjectOrders.ts` wird die Query um `.is('zugewiesener_techniker_id', null)` ergänzt, sodass bereits zugewiesene Aufträge herausgefiltert werden.

### View-Änderung
Tab-Labels verdeutlichen: "Ohne Vorschlag" und "Mit Vorschlag (offen)" oder ähnlich, damit klar ist, dass es um ungebuchte Aufträge geht.

