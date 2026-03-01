

# Fix: Native Date-Inputs durch Shadcn DatePicker ersetzen

## Problem

Die nativen `<input type="date">` Felder zeigen auf mobilen Geräten und in manchen Browsern einen Year-Scroller, der bei historischen Daten (Bauantrag 1950er, Heizungs-Inbetriebnahme 1990er) extrem umständlich zu bedienen ist. Man muss ewig scrollen.

## Lösung

Alle 3 `type="date"` Inputs im Aufmaß-Formular durch Shadcn Popover + Calendar ersetzen. Die Calendar-Komponente bekommt eine Jahres-/Monats-Dropdown-Navigation, damit man direkt z.B. "1985" auswählen kann statt jahrelang zu scrollen.

### Betroffene Dateien

| Datei | Felder |
|---|---|
| `KundendatenSection.tsx` | `heizung_inbetriebnahme_datum`, `bauantrag_datum` |
| `TechnikerDatenSection.tsx` | `thermocheck_datum` |

### Umsetzung

1. **Neue Komponente `AufmassDatePicker.tsx`** erstellen — wiederverwendbar für alle 3 Felder:
   - Shadcn Popover + Calendar
   - Dropdown-Selects für Jahr (1900-2026) und Monat oben im Calendar
   - Wert wird als `YYYY-MM-DD` String gespeichert (kompatibel mit bestehendem Schema)
   - Props: `value`, `onChange`, `disabled`, `placeholder`

2. **KundendatenSection** und **TechnikerDatenSection** aktualisieren — `<Input type="date">` durch `<AufmassDatePicker>` ersetzen, mit `form.watch()` / `form.setValue()` statt `register()`.

### Verhalten

- Klick öffnet Popover mit Kalender
- Oben: Jahr-Select (1900-2026) + Monat-Select — direktes Springen
- Kalender zeigt Tage des gewählten Monats
- Auswahl schließt Popover und setzt den Wert

