

## Coaching-Slots: Ganztaegige Mitfahrt statt Einzeltermine

### Was sich aendert

Die Coaching-Karten zeigen aktuell einzelne Auftraege mit Uhrzeiten (z.B. "09:00 - 11:00 Uhr"). Stattdessen soll dargestellt werden, dass der Trainee den **ganzen Tag** mit dem Trainer mitfaehrt. Ausserdem sollen keine Objekt-Details (PLZ, Ort, Objekttyp) mehr angezeigt werden -- nur der **Trainer-Name**, die **Region**, das **Datum** und der **Preis**.

### Aenderungen

**1. Mock-Daten anpassen (`src/lib/onboarding-config.ts`)**
- Uhrzeiten entfernen oder auf "Ganztaegig" setzen (z.B. `uhrzeitVon: 'Ganztägig'`, `uhrzeitBis: ''`)
- `objektPlz`, `objektOrt`, `objektTyp`, `objektAdresse` aus den Mock-Slots entfernen -- diese Details sind fuer den Trainee nicht relevant, da der Trainer den Treffpunkt mitteilt

**2. Coaching-Karten vereinfachen (`src/components/onboarding/steps/CoachingStep.tsx`)**

Vorher (pro Karte):
- Coach-Name + Region
- Datum + Uhrzeit
- PLZ + Ort
- Objekttyp (Einfamilienhaus etc.)

Nachher (pro Karte):
- Coach-Name + Region
- Datum (nur Tag, z.B. "Mi., 28.01.2026") + "Ganztaegig"
- Kein Ort, kein Objekttyp

Konkrete Aenderungen in der Slot-Karte:
- Uhrzeit-Anzeige aendern: Statt `{slot.uhrzeitVon} - {slot.uhrzeitBis} Uhr` nur **"Ganztägig"** anzeigen
- PLZ/Ort-Zeile (`objektPlz`, `objektOrt`) komplett entfernen
- Objekttyp-Zeile (`objektTyp`) komplett entfernen

**3. Bestaetigungsansicht anpassen (gebuchter Slot)**
- Uhrzeit-Zeile: "Ganztägig" statt Von-Bis
- Adresse und Objekttyp entfernen (Trainer teilt Treffpunkt per E-Mail mit)
- Hinweis-Text anpassen: "Der Trainer wird dir den Treffpunkt rechtzeitig mitteilen"

**4. Button-Text anpassen**
- "Mitfahrt buchen" statt "Mitfahrt buchen - 149€" (Preis bleibt im Badge der Karte sichtbar)

### Keine DB- oder Typ-Aenderungen noetig
Die `CoachingSlot`-Felder (`uhrzeitVon`, `objektPlz` etc.) bleiben im Interface bestehen, da sie spaeter aus der DB kommen koennten. Wir blenden sie nur im UI aus.

