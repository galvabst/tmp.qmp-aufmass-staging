

## Abschlusspruefung: Anspruchsvolles Quiz auf Basis der Akademie-Inhalte

### Ueberblick

Die Abschlusspruefung wird als umfassender Wissenstest ueber alle Module der Akademie erstellt. Die Fragen basieren auf den echten Lerninhalten und sind bewusst so formuliert, dass sie nur mit aufmerksamem Durcharbeiten der Akademie beantwortbar sind. Mix aus Single-Choice und Multiple-Choice (4 Antwortmoeglichkeiten).

Die DB-Tabelle `thermocheck.contractor_akademie_quiz` existiert bereits mit der passenden Struktur (`frage`, `antworten` als JSONB, `modul_id`, `reihenfolge`, `ist_aktiv`).

---

### 1. Datenbank: Quiz-Fragen einfuegen

Eine Migration fuegt ca. 25-30 anspruchsvolle Fragen in `thermocheck.contractor_akademie_quiz` ein. Jede Frage hat 4 Antwortmoeglichkeiten als JSONB-Array (`{text, korrekt}`). Die Fragen werden einem speziellen "Abschlusspruefung"-Modul oder direkt den bestehenden Modulen zugeordnet.

**Fragenpool (aus den echten Inhalten abgeleitet):**

**Modul 1 -- Grundlagen: Thermocheck verstehen**

1. "Was passiert, wenn ein U-Wert bei der Datenaufnahme falsch geschaetzt wird?"
   - A) Das Angebot wird guenstiger fuer den Kunden
   - B) Die Waermepumpe wird falsch dimensioniert und verschleisst vorzeitig (KORREKT)
   - C) Der Innendienst korrigiert das automatisch
   - D) Es hat keinen Einfluss, da die Software U-Werte selbst berechnet

2. "Wie lange investiert das Ingenieurteam in die Berechnung pro Projekt?"
   - A) 2 Stunden
   - B) 6 Stunden
   - C) 12 Stunden (KORREKT)
   - D) 24 Stunden

3. "Was bedeutet das 'Cinderella-Prinzip' im Kontext des Thermochecks?"
   - A) Jedes Haus bekommt die gleiche Standard-Waermepumpe
   - B) Jedes Haus ist ein Unikat und braucht eine perfekt passende Loesung (KORREKT)
   - C) Die Datenaufnahme muss vor Mitternacht abgeschlossen sein
   - D) Es gibt nur eine richtige Waermepumpe pro Hersteller

**Modul 2 -- Service-Professionalitaet**

4. "Ein Kunde fragt: 'Was wird das ungefaehr kosten?' -- Welche Antwort ist korrekt?"
   - A) "Rechnen Sie mit ca. 25.000 bis 35.000 Euro"
   - B) "Das ist ein normales Projekt, circa 30.000 Euro"
   - C) "Jedes Haus ist ein Unikat. Sie erhalten zeitnah ein massgeschneidertes Angebot." (KORREKT)
   - D) "Das kann ich Ihnen erst nach der Berechnung sagen, aber grob 20.000 Euro"

5. "Wann muessen die Firmen-Hausschlappen gewechselt werden?"
   - A) Nur beim Betreten des Hauses
   - B) Beim Wechsel zwischen Innen- und Aussenbereich (KORREKT)
   - C) Nur wenn der Kunde es verlangt
   - D) Hausschlappen sind optional bei kurzen Terminen

6. "Was ist die korrekte Vorstellung an der Haustuer?"
   - A) "Hallo, ich bin von der Heizungsfirma"
   - B) "Guten Tag, mein Name ist [Name]. Ich bin der Techniker von Galvanek fuer Ihren heutigen Termin." (KORREKT)
   - C) "Hi, ich mach den Thermocheck"
   - D) "Guten Tag, ich bin fuer die Waermepumpe da"

**Modul 3 -- Sicherheit, Regeln und Compliance**

7. "Ihr entdeckt im Heizungsraum starken Schimmelbefall. Was tut ihr?"
   - A) Fenster oeffnen und weiterarbeiten
   - B) Raum sofort verlassen, zum Auto gehen, Projektleitung anrufen (KORREKT)
   - C) Den Kunden bitten, den Schimmel zu entfernen
   - D) Den Bereich mit Mundschutz betreten und schnell fotografieren

8. "Wie frueh muesst ihr einen Termin absagen, wenn ihr krank seid?"
   - A) Am gleichen Morgen reicht aus
   - B) 12 Stunden vorher
   - C) Mindestens 24 Stunden vorher (KORREKT)
   - D) 48 Stunden vorher

9. "Bevor ihr den Kunden fotografiert oder scannt -- was ist Pflicht?"
   - A) Nichts, das ist im Vertrag geregelt
   - B) Die muendliche Einwilligung des Kunden aktiv einholen (KORREKT)
   - C) Eine schriftliche Genehmigung unterschreiben lassen
   - D) Den Datenschutzbeauftragten informieren

**Modul 4 -- Terminvorbereitung**

10. "Warum duerft ihr die Fahrzeit NICHT am Vorabend mit Google Maps planen?"
    - A) Google Maps funktioniert abends nicht richtig
    - B) Die Verkehrsdaten basieren auf der aktuellen (leeren) Verkehrslage, nicht auf der Rush Hour am naechsten Tag (KORREKT)
    - C) Es ist Firmenvorschrift, nur morgens zu planen
    - D) Die Route aendert sich ueber Nacht durch Baustellen

11. "Wie berechnet ihr die korrekte Abfahrtszeit mit der Puffer-Regel?"
    - A) Kuerzeste Google-Zeit minus 15 Minuten
    - B) Laengste Google-Zeit plus 1 Stunde
    - C) Mittelwert der Google-Zeitspanne plus 30 Minuten Puffer (KORREKT)
    - D) Google-Zeit verdoppeln

**Modul 5 -- Ablauf vor Ort: Zeitmanagement**

12. "Welche der folgenden Daten sind 'Minimum Viable Data' -- ohne sie kann kein Angebot erstellt werden?" (Multiple Choice)
    - A) Vollstaendige Gebaeudedaten und U-Werte (KORREKT)
    - B) Farbfotos der Gartengestaltung
    - C) Jeder einzelne Heizkoerper mit Typ, Massen und Foto (KORREKT)
    - D) Zaelerschrank-Fotos offen und geschlossen (KORREKT)

**Modul 6 -- Datenerhebung**

13. "Was ist die 'Master-Foto-Regel' fuer den Zaehlerschrank?"
    - A) Ein Foto des Typenschilds genuegt
    - B) Komplettes, frontales Foto des gesamten Zaehlerschranks bei geoeffneter Tuer (KORREKT)
    - C) Drei Fotos aus verschiedenen Winkeln
    - D) Nur die Sicherungen muessen einzeln fotografiert werden

14. "Vor dem Absenden des Datensatzes -- welche vier Fragen muesst ihr pruefen?"
    - A) Heizkoerper-Masse plausibel, Fotos scharf, Zaehlerschrank vollstaendig, Einbringmasse dokumentiert (KORREKT)
    - B) Kunden-Unterschrift, Termin-Dauer, Fahrtkosten, Materialliste
    - C) U-Werte, Heizlast, Waermepumpentyp, Preis
    - D) Scan-Qualitaet, Wetterdaten, Nachbargebaeude, Grundstueckgroesse

15. "Ein 20 cm breiter Heizkoerper in einem 30 qm Wohnzimmer -- was bedeutet das?"
    - A) Das ist ein moderner Kompaktheizkoerper
    - B) Das kann nicht stimmen -- Masse sind falsch oder ein Heizkoerper wurde uebersehen (KORREKT)
    - C) Der Raum hat zusaetzlich Fussbodenheizung
    - D) Ist normal bei gut gedaemmten Haeusern

16. "U-Werte von 0,4 bis 0,6 bedeuten..."
    - A) Sehr schlechte Daemmung
    - B) Durchschnittliche Daemmung
    - C) Relativ gute Daemmung (KORREKT)
    - D) Keine Daemmung vorhanden

17. "Nachtraegliche Daemmung wird in der Software eingetragen..."
    - A) Global fuer das gesamte Gebaeude
    - B) Pro Etage
    - C) Pro Raum (KORREKT)
    - D) Pro Bauteil-Typ

18. "Warum muessen Heizkreise (Heizkoerper vs. Fussbodenheizung) manuell getrennt werden?"
    - A) Aus optischen Gruenden im Report
    - B) Wegen unterschiedlicher Vorlauftemperaturen und korrekter Darstellung im 4DZ-Formular (KORREKT)
    - C) Die Software erlaubt nur einen Heizkoerpertyp pro Heizkreis
    - D) Das ist nur bei Gebaeuden vor 1990 noetig

19. "Im 3D-Scan-Modell: Welche Farbe hat eine Aussenwand?"
    - A) Grau
    - B) Blau (KORREKT)
    - C) Gelb
    - D) Rot

20. "Eine Balkontuer wird im 3D-Modell als Tuer erkannt. Was muesst ihr tun?"
    - A) Nichts, das ist korrekt
    - B) Sie als Fenster behandeln und den Aussenwand-Wert verwenden (KORREKT)
    - C) Den U-Wert auf 2,9 setzen (Aussentuer-Wert)
    - D) Die Tuer aus dem Modell loeschen

**Modul 7 -- Tool- und Dokumentationsworkflow**

21. "Innerhalb welcher Frist muss das Zoho-Formular nach dem ThermoCheck abgeschickt werden?"
    - A) 12 Stunden
    - B) 24 Stunden
    - C) 36 Stunden (KORREKT)
    - D) 72 Stunden

22. "Wie viele Unterschriften muesst ihr vom Kunden vor Ort holen?"
    - A) Eine (Anwesenheit)
    - B) Zwei: Aufstellort und Anwesenheit (KORREKT)
    - C) Drei: Datenschutz, Aufstellort und Anwesenheit
    - D) Keine, das laeuft digital

23. "Der Kunde hat KEINE PV-Anlage und will auch keine. Wie geht ihr im Zoho-Formular vor?"
    - A) 'Nein' anklicken und das PV-Formular ueberspringen
    - B) 'Ja' anklicken und ein Bild mit dem Vermerk 'Kundin will keine PV' einfuegen (KORREKT)
    - C) Das Feld leer lassen
    - D) Die Projektleitung informieren

24. "Wie fotografiert ihr den Heizungsraum richtig?"
    - A) An einem Punkt stehen und im Kreis fotografieren
    - B) Von einer Ecke zur gegenueberliegenden Ecke fotografieren (KORREKT)
    - C) Nur die Heizung selbst fotografieren
    - D) Ein Panoramafoto genuegt

**Modul 8 -- Abschluss beim Kunden**

25. "Ein Kunde fragt, welcher Waermepumpentyp fuer sein Haus am besten ist. Was antwortet ihr?"
    - A) "Eine Luft-Wasser-Waermepumpe ist immer die beste Wahl"
    - B) "Ich nehme die Daten auf, unsere Ingenieure legen die optimale Loesung aus" (KORREKT)
    - C) "Das kann ich Ihnen anhand der Gebaeudedaten direkt sagen"
    - D) "Typ X ist fuer Ihr Haus perfekt"

26. "Welche vier Schritte nach dem Termin erklaert ihr dem Kunden?"
    - A) Rechnung, Bauantrag, Foerderung, Installation
    - B) Datenuebermittlung, Angebotserstellung, Angebotspraesentation, Foerderservice (KORREKT)
    - C) Scan-Upload, U-Wert-Berechnung, Heizlast-Check, Bestellung
    - D) Qualitaetspruefung, Zweitmeinung, Angebot, Baustart-Termin

**Modul 9 -- Sonderfaelle und Eskalationen**

27. "Der Kunde ist nicht zu Hause. Was macht ihr zuerst?"
    - A) Sofort nach Hause fahren
    - B) Kalender checken, ob ihr bald wieder in der Naehe seid (KORREKT)
    - C) Dem Kunden eine boese Nachricht schreiben
    - D) 30 Minuten warten und dann gehen

28. "Der Kunde behauptet, seine Wand sei gedaemmt. Euer Klopftest zeigt Hohlraum. Was tut ihr?"
    - A) Dem Kunden erklaeren, dass er falsch liegt
    - B) Beides dokumentieren: Kundenangabe UND eigene Beobachtung (KORREKT)
    - C) Nur die Kundenangabe verwenden
    - D) Den U-Wert auf 'gedaemmt' setzen, da der Kunde es besser weiss

29. "Ein Kunde wird beleidigend. In welcher Reihenfolge handelt ihr?"
    - A) Zurueckschimpfen, Termin abbrechen, Chef anrufen
    - B) Sachlich bleiben, Gespraech hoeflich abbrechen, zum Auto gehen, Projektleitung anrufen (KORREKT)
    - C) Weiterarbeiten und es ignorieren
    - D) Den Kunden bitten, sich zu entschuldigen

**Modul 10 -- Qualitaetssicherung**

30. "Was unterscheidet einen akzeptablen 'Fehler' von 'Schlampigkeit'?"
    - A) Fehler passieren nur Anfaengern, Schlampigkeit nur Profis
    - B) Fehler passieren trotz Sorgfalt, Schlampigkeit ist mangelnder Anspruch trotz Feedback (KORREKT)
    - C) Beides wird gleich behandelt
    - D) Fehler werden bestraft, Schlampigkeit nicht

---

### 2. Technische Umsetzung

**a) Migration:** INSERT-Statements fuer alle 30 Fragen in `thermocheck.contractor_akademie_quiz`. Jede Frage wird dem passenden Modul zugeordnet (`modul_id`). Das JSONB `antworten`-Format ist: `[{"text": "...", "korrekt": false}, {"text": "...", "korrekt": true}, ...]`

**b) Abschlusspruefungs-Modul:** Option 1: Fragen ueber alle Module verteilen (pro Modul 2-4 Fragen). Die Abschlusspruefung zieht dann alle aktiven Fragen. Das passt zur bestehenden Tabellen-Struktur.

**c) Quiz-Hook anpassen:** `useModulQuiz` muss ueber den thermocheck-Client die Fragen laden (analog zu `useAkademieFortschritt`), statt nur `[]` zurueckzugeben.

**d) QuizModal bleibt:** Die bestehende UI-Komponente funktioniert bereits -- sie muss nur echte Daten bekommen.

### 3. Betroffene Dateien

- **Neue Migration**: INSERT von ~30 Quiz-Fragen in `thermocheck.contractor_akademie_quiz`
- `src/hooks/useModulQuiz.ts`: thermocheck-Client verwenden statt leeres Array, Fragen und Ergebnisse ueber die REST-API laden/schreiben
- `src/components/akademie/QuizModal.tsx`: Ggf. Multiple-Choice-Support (Checkbox statt RadioGroup fuer Fragen mit mehreren korrekten Antworten)

