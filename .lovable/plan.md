

# Plan: Arbeitsanweisungen mit kopierbaren E-Mail-Templates & Anruf-Leitfaden

## Was sich aendert

Die Aufgaben-Card in `TechnicianOrderDetail.tsx` wird zu einer detaillierten Arbeitsanweisung umgebaut. Keine Links (kein `mailto:`, kein `tel:`, kein Gmail-Link). Stattdessen:

### Aufgabe 1 – Buchung bestaetigen

Accordion klappt auf und zeigt:

1. **Schritt-fuer-Schritt Arbeitsanweisung** als nummerierte Liste
2. **Kopierbarer E-Mail-Betreff** in einem grauen Textfeld mit "Kopieren"-Button
3. **Kopierbarer E-Mail-Text** in einem grauen Textfeld mit "Kopieren"-Button (dynamisch mit Kundenname, Datum, Uhrzeit, Adresse, Techniker-Name)
4. **Hinweis**: "Bitte in Gmail einfuegen – die Signatur wird automatisch angehaengt."
5. **Kunden-E-Mail** als reiner Text zum Abtippen/Kopieren
6. **"Als erledigt markieren"** Button

### Aufgabe 2 – Vortag Anruf

Accordion klappt auf und zeigt:

1. **Anruf-Leitfaden** als Textblock (kopierbares Skript)
2. **Telefonnummer** als reiner Text (kein Link)
3. **"Als erledigt markieren"** Button

### Kontaktdaten-Card

- E-Mail und Telefonnummer werden als **reiner Text** dargestellt (kein `<a href="mailto:">`, kein `<a href="tel:">`)
- Kopier-Button neben der E-Mail-Adresse

## Techniker-Name fuer Template

Der Techniker-Name wird ueber `useContractorProfile` geladen. Die Komponente bekommt den `profileId` als neuen optionalen Prop, oder wir laden ihn direkt ueber `useSupabaseSession`. Da `TechnicianOrderDetail` keine Session kennt, fuegen wir einen optionalen `technicianName`-Prop hinzu, der vom Parent (Index.tsx) durchgereicht wird.

## E-Mail Template

**Betreff:**
```
Terminbestätigung Feinaufmaß – {Datum}
```

**Text:**
```
Sehr geehrte/r {Kundenname},

vielen Dank für Ihre Terminanfrage.

Hiermit bestätige ich Ihren Termin für das Feinaufmaß:

Datum: {Datum}
Uhrzeit: {Uhrzeit} Uhr
Adresse: {Strasse}, {PLZ} {Ort}

Ich werde als Ihr Feinaufmaßtechniker vor Ort sein.

Falls Sie Fragen haben, erreichen Sie mich unter dieser E-Mail-Adresse.

Mit freundlichen Grüßen
```

(Ohne "Mit freundlichen Gruessen" + Name, da die Gmail-Signatur das uebernimmt)

## Anruf-Leitfaden

```
"Guten Tag, mein Name ist [Ihr Name] von der Galvanek Bau GmbH.
Ich bin Ihr Feinaufmaßtechniker und rufe an, weil morgen
Ihr Termin am {Datum} um {Uhrzeit} Uhr ansteht.

Ich wollte kurz bestätigen, dass der Termin bei Ihnen
stattfinden kann. Passt das so?"
```

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/TechnicianOrderDetail.tsx` | Aufgaben-Card → Accordion mit kopierbaren Templates, Kontaktdaten ohne Links |
| `src/pages/Index.tsx` | `technicianName` Prop durchreichen (aus Contractor-Profil) |

Keine DB-Aenderungen noetig. Keine neuen Abhaengigkeiten.

## Technische Details

- Accordion: Nutzt bereits vorhandene `@radix-ui/react-accordion`-Komponente
- Copy-to-Clipboard: `navigator.clipboard.writeText()` mit Toast-Feedback
- Template-Generierung: Reine String-Interpolation im Frontend mit den Order-Daten

