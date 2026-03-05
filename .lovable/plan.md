

# Pool-Tab Fix: Alle Thermocheck-Aufträge anzeigen

## Problem
1. **Endlos-Laden**: Der Hook filtert auf `zugewiesener_techniker_id = null`, findet ~70 Aufträge, holt dann deren Terminvorschläge mit Status `vorgeschlagen`/`angenommen`. Da die meisten unassigned Orders gar keine Terminvorschläge haben UND der Status-Filter (`vorgeschlagen`) nichts zurückgibt, erscheinen viele Aufträge in keiner Kategorie.
2. **Falscher Scope**: Der Admin will ALLE Thermocheck-Aufträge sehen, nicht nur unzugewiesene.

## Lösung

### Hook `useAdminObjectOrders.ts` — komplett neu
- **Keine Filter** auf `zugewiesener_techniker_id` oder `pipeline_status` — alle Aufträge laden
- Alle `thermocheck_terminvorschlaege` dazu laden (ohne Status-Filter)
- Kategorisierung:
  - **Ohne Terminvorschläge**: Aufträge ohne Einträge in `thermocheck_terminvorschlaege`
  - **Mit Terminvorschlägen**: Aufträge mit mindestens einem Terminvorschlag (Anzahl + nächstes Datum anzeigen)
- Zusätzlich `pipeline_status` und `zugewiesener_techniker_id` als Info mitgeben

### View `ObjectOrderListView.tsx` — Tabs anpassen
- Tab 1: **Alle** (Gesamtzahl)
- Tab 2: **Ohne Termin** (Aufträge ohne Terminvorschläge)
- Tab 3: **Mit Termin** (Aufträge mit Terminvorschlägen)
- Jede Karte zeigt: Kundenname, Adresse, PLZ/Ort, Pipeline-Status, Anzahl Terminvorschläge, nächstes Datum

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `useAdminObjectOrders.ts` | Filter entfernen, alle Aufträge + alle Termine laden, neue Kategorisierung |
| `ObjectOrderListView.tsx` | Tabs umbenennen, Karten mit Termin-Info erweitern |

