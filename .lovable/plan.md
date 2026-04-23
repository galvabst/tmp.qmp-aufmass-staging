

## Problem

Till hat in der DB **1 Bonus** (50 € Lead-Conversion, Status `ausstehend`) — das wird unten in der ausgeklappten Boni-Liste auch korrekt gezählt (`1 Boni`). Aber die Summary-Card oben zeigt **0 €**, weil sie nur `boniSummary.freigegeben` anzeigt — also nur Boni mit Status `freigegeben` oder `ausgezahlt`. Boni im Status `ausstehend` werden im Betrag ignoriert, obwohl sie in der Anzahl mitgezählt werden.

Verifiziert via DB-Query:
```
bonus_typ        | betrag | status
lead_conversion  | 50     | ausstehend
```

`useBoniSummary` (in `src/hooks/useContractorBoni.ts`) berechnet drei separate Werte (`ausstehend`, `freigegeben`, `ausgezahlt`) — die Card zeigt aber nur `freigegeben` an. Inkonsistent zur Anzahl `1 Boni` und zur Detail-Liste, die alle Boni inkl. „Offen" listet.

## Lösung

In `src/components/ReviewView.tsx` (Zeile 98) den angezeigten Betrag der Boni-Summary-Card auf **die Gesamtsumme aller Boni** umstellen, also `boniSummary.gesamt` statt `boniSummary.freigegeben`. Das ist konsistent mit:
- der Auftrags-Cards „Ausstehend" und „Abgenommen", die ebenfalls den **Gesamtwert pro Status-Topf** zeigen
- der ausgeklappten Detail-Ansicht, die alle Boni mit „Offen"/„Abgerechnet"-Markierung listet
- der Anzahl-Subline `${count} Boni`

Damit die Information „wie viel ist davon noch offen" nicht verloren geht: in der Sub-Zeile statt `${count} Boni` schreiben:
- wenn `ausstehend > 0`: `${count} Boni · ${ausstehend} € offen`
- sonst: `${count} Boni`

## Technische Änderung

**Datei:** `src/components/ReviewView.tsx`, Zeilen 95–103

- `amount` der Boni-`SummaryCard`: `boniSummary.gesamt.toFixed(0) + ' €'`
- `sub`: dynamisch je nach `boniSummary.ausstehend`

Keine DB-Migration, keine Änderung am Hook, keine Edge-Function-Änderung nötig.

## Validierung

1. Als Till einloggen → Boni-Card zeigt **50 €** und Subtext **„1 Boni · 50 € offen"**
2. Card aufklappen → Lead-Conversion-Bonus mit Label „Offen" sichtbar (unverändert)
3. Als Techniker ohne Boni einloggen → **0 €**, **„0 Boni"**, Klick zeigt Empty State (unverändert)
4. Console + Network: keine neuen Fehler

