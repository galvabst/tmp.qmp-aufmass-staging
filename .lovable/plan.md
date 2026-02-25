

# Plan: Workflow-Reihenfolge umkehren, Navigation fixen, Checkliste hinzufuegen

## Analyse der 3 Probleme

### Problem 1: Workflow-Reihenfolge ist falsch
Aktuell: Erst E-Mail → dann Anruf am Vortag.
Richtig: **Erst Anruf** (Termin absprechen, sofort nach Annahme) → **dann E-Mail am Vortag** (schriftliche Bestaetigung als Nachweis).

### Problem 2: "Navigation starten" oeffnet Google Maps im iframe → ERR_BLOCKED_BY_RESPONSE
Google Maps blockiert iframe-Embedding via X-Frame-Options. Der Link `https://maps.google.com/maps?daddr=...` funktioniert nur in einem nativen Browser-Tab. Da die App in einem Lovable-Preview-iframe laeuft, wird der Link geblockt. Loesung: Statt `<a>` mit `target="_blank"` → `window.open()` verwenden, oder die Adresse einfach als kopierbaren Text darstellen (konsistent mit dem "keine Links"-Prinzip). Da auf dem Handy Google Maps per Deep-Link (`geo:` oder `https://www.google.com/maps/dir/...`) oeffnet, reicht `window.open` mit der URL.

### Problem 3: Checkliste fehlt
Es sollen Abhak-Schritte als Arbeitspaket erscheinen:
- Adresse verifiziert (stimmt die Adresse? Richtiges Objekt?)
- Raumzugang bestaetigt (alle Raeume zugaenglich fuer Heizlastberechnung?)

Diese Checkliste ist Teil der Anruf-Aufgabe (wird im Telefonat geklaert).

## Loesung

### Aufgabe 1 – Anruf direkt nach Annahme
- Accordion "Termin telefonisch absprechen"
- Anruf-Leitfaden mit Skript (kopierbarer Text)
- Telefonnummer als Text mit Kopier-Button
- **Checkliste** (interaktive Checkboxen, lokaler State):
  - [ ] Termin mit Kunde abgesprochen
  - [ ] Adresse verifiziert – richtiges Objekt
  - [ ] Raumzugang bestaetigt – alle Raeume zugaenglich
- "Als erledigt markieren" Button → erst aktiv wenn alle 3 Checkboxen gesetzt
- Ruft `confirm_thermocheck_booking` RPC auf

### Aufgabe 2 – E-Mail am Vortag (schriftlicher Nachweis)
- Accordion "Terminbestaetigung per E-Mail senden"
- Hinweis/Disclaimer: "Diese E-Mail dient als schriftlicher Nachweis, dass der Termin stattfindet."
- Arbeitsanweisung (nummerierte Liste)
- Kopierbarer Betreff + E-Mail-Text
- Kunden-E-Mail als Text mit Kopier-Button
- "Als erledigt markieren" Button → ruft `confirm_thermocheck_vortag` RPC auf

### Navigation starten → Fix
- `<a href={mapsUrl} target="_blank">` durch `<button onClick={() => window.open(mapsUrl, '_blank')}>` ersetzen. Das oeffnet Google Maps in einem neuen Tab statt im iframe.
- Alternativ: Adresse als kopierbaren Text + Hinweis "In Google Maps oeffnen" als Button mit `window.open`.

## E-Mail Template (angepasst – jetzt fuer Vortag-Bestaetigung)

**Betreff:**
```
Terminbestätigung Feinaufmaß – {Datum}
```

**Text:**
```
Sehr geehrte/r {Kundenname},

wie soeben telefonisch besprochen, bestätige ich hiermit schriftlich Ihren Termin für das Feinaufmaß:

Datum: {Datum}
Uhrzeit: {Uhrzeit} Uhr
Adresse: {Strasse}, {PLZ} {Ort}

Bitte stellen Sie sicher, dass alle Räume am Termintag zugänglich sind, damit die Heizlastberechnung vollständig durchgeführt werden kann.

Falls sich etwas ändern sollte, melden Sie sich bitte zeitnah unter dieser E-Mail-Adresse.

Mit freundlichen Grüßen
```

## Anruf-Leitfaden (angepasst – jetzt fuer Erstanruf)

```
"Guten Tag, mein Name ist [Ihr Name] von der Galvanek Bau GmbH.
Ich bin Ihr Feinaufmaßtechniker. Sie hatten einen Terminvorschlag
für den {Datum} um {Uhrzeit} Uhr gemacht.

Ich wollte den Termin kurz mit Ihnen absprechen – passt das bei Ihnen?

Außerdem möchte ich sicherstellen:
- Ist die Adresse {Adresse} korrekt?
- Sind am Termin alle Räume für mich zugänglich?
  Das ist wichtig für die korrekte Heizlastberechnung.

[Falls ja:] Sehr gut, ich schicke Ihnen vorab noch eine
schriftliche Bestätigung per E-Mail.
[Falls nein:] Kein Problem, dann klären wir einen neuen Termin."
```

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/TechnicianOrderDetail.tsx` | Aufgaben-Reihenfolge tauschen, Checkliste mit Checkboxen einbauen, E-Mail wird zu Vortag-Aufgabe, Navigation-Fix |

Keine DB-Aenderungen noetig. RPCs bleiben gleich (`confirm_thermocheck_booking` = Anruf erledigt, `confirm_thermocheck_vortag` = E-Mail gesendet). Keine neuen Abhaengigkeiten.

## Edge Cases

| Szenario | Handling |
|---|---|
| Checkboxen werden gesetzt aber Button nicht geklickt | State geht beim Verlassen verloren → kein Problem, RPC nicht aufgerufen |
| Navigation-Button im iframe | `window.open` oeffnet neuen Tab, umgeht iframe-Blocking |
| Techniker vergisst Checkbox | Button disabled solange nicht alle gesetzt |
| Vortag-E-Mail ohne vorherigen Anruf | UI zeigt E-Mail-Task erst wenn Anruf bestaetigt |

## Technische Details

- Checkboxen: `@radix-ui/react-checkbox` (bereits installiert) + lokaler `useState<Record<string, boolean>>`
- `window.open(url, '_blank')` statt `<a target="_blank">` fuer Maps
- Datei bleibt unter 600 Zeilen (aktuell 596, Checkliste ersetzt bestehenden Content)

