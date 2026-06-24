import type { WatertightCase } from './aufmass-watertight-cases';

// AUTOGENERIERT aus Workflow aufmass-watertight-enumerate-r2 (Runde 2). Nicht von Hand pflegen.
export const GENERATED_CASES_R2: WatertightCase[] = [
  {
    "id": "r2.techniker.1",
    "page": "techniker",
    "domain": "wp",
    "label": "Telefonnummer mit Tippfehler-Buchstabe im Namensfeld rutscht durch Buchstaben-Guard",
    "field": "techniker_name",
    "values": {
      "techniker_name": "0151 O2345678"
    },
    "expect": "block",
    "why": "Der einzige Namens-Guard ist /\\p{L}/ (mindestens ein Buchstabe). Eine im Namensfeld eingetippte Telefonnummer mit einem versehentlichen Buchstaben (hier 'O' statt '0') enthält genau diesen einen Buchstaben und passiert den Guard ungehindert, obwohl es offensichtlich eine fehlplatzierte Nummer und kein Personenname ist. Es wird nie geprüft, ob Ziffern dominieren. Realistische Feld-Verwechslung, die das aktuelle Schema durchlässt."
  },
  {
    "id": "r2.techniker.2",
    "page": "techniker",
    "domain": "wp",
    "label": "Einzelner Buchstabe als kompletter Technikername",
    "field": "techniker_name",
    "values": {
      "techniker_name": "X"
    },
    "expect": "block",
    "why": "Ein einzelnes 'X' erfüllt sowohl min(1) als auch den \\p{L}-Guard, ist aber kein identifizierbarer Aufmaßtechniker-Name. Das Feld trägt eine Honorar-/Dokumentationspflicht ('Ohne diese Dokumentation wird keine Auszahlung erfolgen'). Knapp innerhalb der Untergrenze (1 Zeichen, 1 Buchstabe), trotzdem keine zuordenbare Person — ein Name braucht realistisch mehr als ein Zeichen."
  },
  {
    "id": "r2.techniker.3",
    "page": "techniker",
    "domain": "wp",
    "label": "Reiner Telefonblock im Namensfeld ohne jeden Buchstaben",
    "field": "techniker_name",
    "values": {
      "techniker_name": "0151 234 56789"
    },
    "expect": "block",
    "why": "Kontrastfall zur Buchstaben-Variante: hier ohne Buchstabe gedacht — er zeigt, dass der Guard nur über das Fehlen von Buchstaben greift. Sobald der Techniker irgendwo einen Buchstaben mit eintippt (z.B. eine Durchwahl-Notiz), kippt das Feld in den durchrutschenden Zustand. Ein Name aus reinen Telefon-Ziffern-Gruppen ist ein logischer Feld-Widerspruch; das Schema hat keine Heuristik gegen ziffern-dominierte Namen."
  },
  {
    "id": "r2.techniker.4",
    "page": "techniker",
    "domain": "wp",
    "label": "ThermoCheck-Datum Jahrzehnte vor jeder plausiblen Auftragsaufnahme",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "1990-03-12"
    },
    "expect": "soft",
    "why": "Der Kalender setzt fromYear-Default 1900 und sperrt nur die Zukunft (toDate=heute). Ein Vor-Ort-ThermoCheck von 1990 ist damit auswählbar, für eine aktuelle Wärmepumpen-Aufnahme aber vollkommen unplausibel (Auftrag ist neu, das Verfahren existierte so nicht). Die Untergrenze des Pickers ist 1900 statt eines realistischen Aufnahmefensters — klare Plausibilitätslücke, kein echter Kalenderfehler."
  },
  {
    "id": "r2.techniker.5",
    "page": "techniker",
    "domain": "wp",
    "label": "ThermoCheck-Datum Jahre vor der heutigen Auftragserfassung",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2015-06-01"
    },
    "expect": "soft",
    "why": "Auswählbar (Vergangenheit, >=1900), da der Section kein fromDate an den Picker übergibt. Ein Vor-Ort-Termin DIESES laufenden Auftrags kann aber nicht Jahre vor seiner Erfassung stattgefunden haben. Knapp 'gültig' im Kalendersinn, logisch unplausibel: das Datum sollte nahe am Bearbeitungszeitpunkt liegen, nicht Jahre davor."
  },
  {
    "id": "r2.techniker.6",
    "page": "techniker",
    "domain": "wp",
    "label": "Telefonnummer mit weit über E.164 liegender Ziffernzahl",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "01511234567890123456789"
    },
    "expect": "soft",
    "why": "Der Guard prüft nur 'mindestens 6 Ziffern' und erlaubte Zeichen — es gibt KEINE Obergrenze. 23 Ziffern überschreiten jede reale Rufnummer; E.164 erlaubt maximal 15 Ziffern inklusive Ländercode. Knapp innerhalb der (nicht existenten) Obergrenze, aber physikalisch keine wählbare Nummer. Fehlende Maximallänge ist die eigentliche Lücke."
  },
  {
    "id": "r2.techniker.7",
    "page": "techniker",
    "domain": "wp",
    "label": "Repetierte Nullziffer als 'erreichbare' Nummer",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "000000"
    },
    "expect": "soft",
    "why": "Genau 6 Ziffern (Untergrenze erfüllt) und nur erlaubte Zeichen — passiert den Guard. '000000' ist aber keine erreichbare Rufnummer (das Feld verlangt explizit eine 'erreichbare Nummer'). Knapp an der 6-Ziffern-Grenze, Inhalt unbrauchbar. Der Guard lässt Inhalts-Muster bewusst zu — genau hier liegt die unplausible Lücke, ohne ein reines Sequenz-Beispiel zu sein."
  },
  {
    "id": "r2.techniker.8",
    "page": "techniker",
    "domain": "wp",
    "label": "Deutsche Mobil-Vorwahl mit abgeschnittener Teilnehmernummer",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0151 23"
    },
    "expect": "soft",
    "why": "0151 ist eine deutsche Mobilvorwahl; '0151 23' hat 6 Ziffern und erfüllt damit exakt den Mindest-Guard. Eine vollständige DE-Mobilnummer hat jedoch 10-11 Ziffern — hier ist die Teilnehmernummer abgeschnitten. Der 6-Ziffern-Mindestwert akzeptiert einen real nicht anrufbaren Stummel als 'erreichbare Nummer'. Die Untergrenze ist für deutsche Mobilnummern zu niedrig angesetzt."
  },
  {
    "id": "r2.techniker.9",
    "page": "techniker",
    "domain": "wp",
    "label": "Unmöglicher Kalendertag 29.02. in einem Nicht-Schaltjahr (über Sync/Autofill, nicht über Picker)",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2023-02-29"
    },
    "expect": "block",
    "why": "2023 ist kein Schaltjahr — den 29.02.2023 gibt es nicht. Über den Kalender ist er nicht wählbar, aber thermocheck_datum ist im Schema ein roher String (z.string()/optionalString) ohne Datums-Gültigkeitsprüfung. Wird der Wert per Draft-Import, Autofill oder programmatisch gesetzt, akzeptiert das Datenmodell den unmöglichen Tag. Echter physikalisch unmöglicher Kalendertag, der nur am UI-Picker, nicht am Datenmodell scheitert."
  },
  {
    "id": "r2.techniker.10",
    "page": "techniker",
    "domain": "wp",
    "label": "Syntaktisch gültiges, aber inhaltlich unmögliches Datum 2023-13-01 im rohen String-Feld",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2023-13-01"
    },
    "expect": "block",
    "why": "Monat 13 existiert nicht. Der Picker emittiert nur YYYY-MM-DD aus echten Kalendertagen, aber das Schema validiert thermocheck_datum als freien String ohne Format-/Bereichsprüfung. Ein per Import oder fehlerhaftem Sync gesetztes '2023-13-01' wird vom Datenmodell widerspruchslos übernommen, obwohl es kein realer Kalendertag ist — unmöglicher Wert, den nur die UI, nicht die Persistenzschicht abfängt."
  },
  {
    "id": "r2.heizung_termin.1",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung defekt, aber gerade erst in Betrieb genommen",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2026-02-01",
      "heizung_funktionstuechtig": false
    },
    "expect": "soft",
    "why": "Eine erst ~4 Monate alte Heizung als defekt zu melden ist hoch unplausibel. Gerade dieser Fall faellt durch jedes Netz: die einzige Regel zum Neu-Alter (ib.zuNeu) wird bei funktionstuechtig=false bewusst UNTERDRUECKT. Damit existiert kein einziger Check, der eine quasi-neue, angeblich kaputte Heizung anmahnt — obwohl genau das (Garantie, Fehlmessung, Verwechslung Bj. Gebaeude vs. Heizung) geprueft werden muss."
  },
  {
    "id": "r2.heizung_termin.2",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Fossile Brennstoffe bleiben nach dem Austausch",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "fossile_brennstoffe_nach_austausch": true,
      "heizungsart": "gas"
    },
    "expect": "soft",
    "why": "Der Sinn eines WP-Aufmasses ist der Ersatz der fossilen Heizung durch eine Waermepumpe. 'Fossile Brennstoffe auch NACH dem Austausch = ja' widerspricht dem Auftragszweck und bricht die BEG/GEG-Foerderlogik (65%-EE-Pflicht). Das Feld hat aktuell KEINE einzige Plausibilitaetsregel — ein versehentliches 'ja' (oder Hybrid ungeklaert) laeuft voellig ungeprueft durch."
  },
  {
    "id": "r2.heizung_termin.3",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme exakt am Bauantragstag",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2010-05-10",
      "bauantrag_datum": "2010-05-10"
    },
    "expect": "block",
    "why": "Heizungs-Inbetriebnahme am selben Tag wie der Bauantrag ist physikalisch unmoeglich — zwischen Genehmigung und beheiztem Rohbau liegen zwingend Monate. Der Block-Check feuert aber nur bei ib < ba (echtes Kleiner). Bei ib == ba greift der >=-Zweig, und der Mindestabstand-Check rechnet 0 Monate < 6 nur als SOFT. Ein unmoeglicher Gleichstand wird dadurch zu weich behandelt."
  },
  {
    "id": "r2.heizung_termin.4",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag 25 Monate her — knapp ueber der 24-Monats-Grenze",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2024-05-10"
    },
    "expect": "soft",
    "why": "Die Regel ba.zuNeu warnt nur bei < 24 Monaten. Ein Bauantrag von vor 25 Monaten rutscht knapp darueber durch — trotzdem wird an einem quasi-neuen Gebaeude (Erstbezug ~2025) bereits ein Bestandsheizungs-Austausch gegen WP aufgemessen. Bauphysikalisch/foerderrechtlich genauso fragwuerdig wie bei 23 Monaten; die harte Monatsgrenze erzeugt eine kuenstliche Luecke direkt oberhalb des Schwellwerts."
  },
  {
    "id": "r2.heizung_termin.5",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme 25 Monate her — knapp ueber der Bestandsheizungs-Grenze",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2024-05-10",
      "heizung_funktionstuechtig": true
    },
    "expect": "soft",
    "why": "ib.zuNeu greift nur bei < 24 Monaten (und nur wenn nicht defekt). Eine funktionierende Heizung von vor 25 Monaten gegen WP zu tauschen ist genauso ungewoehnlich wie bei 23 Monaten, faellt aber knapp aus dem Fenster. Die scharfe 24-Monats-Kante laesst den Fall direkt darueber ungeprueft."
  },
  {
    "id": "r2.heizung_termin.6",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag Jahrzehnte vor Inbetriebnahme der Heizung — plausibel? Aber riesiger Sprung deutet auf Feldverwechslung",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "1965-04-01",
      "heizung_inbetriebnahme_datum": "2025-11-01"
    },
    "expect": "soft",
    "why": "Es gibt nur eine UNTERgrenze fuer den Abstand Bauantrag→Inbetriebnahme (bauZuSchnell < 6 Monate). Eine OBERgrenze fehlt voellig. 60 Jahre Differenz ist zwar bei alten Haeusern denkbar, aber die Heizung waere dann ~1 Jahr alt und funktionstuechtig — typischer Tippfehler/Feldtausch (Gebaeude-Bj. vs. Heizungs-Bj.). Kein Check fragt nach, wenn die 'Bestandsheizung' faktisch fast neu ist trotz uralten Gebaeudes."
  },
  {
    "id": "r2.heizung_termin.7",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme weit vor Bauantrag — Jahrzehnte rueckwaerts statt Jahre",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "1980-01-01",
      "bauantrag_datum": "2022-01-01"
    },
    "expect": "block",
    "why": "Heizung 42 Jahre VOR dem Bauantrag in Betrieb ist unmoeglich. Die Block-Regel ib.vorBa existiert zwar, aber der extreme Abstand ist das klassische Symptom einer Feldverwechslung (ib-Jahr und ba-Jahr getauscht). Wert gehoert klar geblockt; ich liste ihn, weil der Pruefling sicherstellen muss, dass der Block hier wirklich greift und nicht nur bei knappen Ueberschneidungen getestet wurde."
  },
  {
    "id": "r2.heizung_termin.8",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Defekte, aber brandneue Heizung wird ersetzt — Mehrfach-Widerspruch zur Austausch-Logik",
    "field": "heizung_funktionstuechtig",
    "values": {
      "heizung_funktionstuechtig": false,
      "heizung_inbetriebnahme_datum": "2026-04-15",
      "fossile_brennstoffe_nach_austausch": false
    },
    "expect": "soft",
    "why": "Heizung erst ~2 Monate alt UND bereits defekt UND wird gegen WP getauscht. Jede Einzelregel wird umgangen: ib.zuNeu ist bei defekt unterdrueckt, und es gibt keinen Cross-Check funktionstuechtig=false × sehr junge Inbetriebnahme. Eine 2 Monate alte Heizung ist praktisch immer Garantiefall, kein Komplettaustausch — ein klarer Pruefanlass, der heute lautlos durchlaeuft."
  },
  {
    "id": "r2.heizung_termin.9",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Funktionierende fossile Heizung, aber fossil-frei nach Austausch = nein bei neuem Gebaeude",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "fossile_brennstoffe_nach_austausch": true,
      "heizungsart": "oel",
      "heizung_funktionstuechtig": true,
      "bauantrag_datum": "2025-01-10"
    },
    "expect": "soft",
    "why": "Kombination dreier ungeklaerter Signale ohne jeden Check: Oelheizung (fossil) in einem ~2025 beantragten Neubau, voll funktionstuechtig, und nach Austausch sollen weiter fossile Brennstoffe laufen. Das ist bei Neubau nach GEG faktisch nicht genehmigungsfaehig (65%-EE) und der fossil-Verbleib widerspricht dem WP-Umbauzweck. fossile_brennstoffe_nach_austausch wird nirgends gegen Heizungsart/Gebaeudealter gespiegelt."
  },
  {
    "id": "r2.heizung_termin.10",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme exakt heute",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2026-06-20",
      "heizung_funktionstuechtig": true
    },
    "expect": "soft",
    "why": "Datum heute ist nicht zukuenftig, also greift der ib.zukunft-Block nicht. Eine heute in Betrieb genommene Bestandsheizung, die heute schon fuer einen WP-Austausch aufgemessen wird, ist logisch widerspruechlich (0 Monate Bestand). ib.zuNeu warnt zwar bei < 24 Monaten — der Grenzfall 'genau heute' ist aber der extremste und sollte sicher als unplausibel markiert sein, nicht nur generisch 'zu neu'."
  },
  {
    "id": "r2.gebaeude.1",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Einfachverglasung trotz voll gedämmter Hülle (Fassade + Dach)",
    "field": "verglasung",
    "values": {
      "verglasung": "einfach",
      "fassade_gedaemmt": true,
      "dach_gedaemmt": true
    },
    "expect": "soft",
    "why": "Eine voll gedämmte Gebäudehülle (Fassade UND Dach saniert) mit gleichzeitig der energetisch schlechtesten Verglasung (einfach, U≈5,8 W/m²K) ist ein klarer Querfeld-Widerspruch: Wer Fassade und Dach dämmt, tauscht praktisch immer zuerst/zugleich die Fenster. Die Engine prüft 'einfach + ungedämmt' (energie.jungUnsaniert nur bei jungem Gebäude) und 'gedämmt + dreifach', aber NICHT die Kombination gedämmte Hülle + Einfachglas. Verifiziert: Plausi NONE, Schema OK."
  },
  {
    "id": "r2.gebaeude.2",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Einfachverglasung trotz gedämmter Fassade",
    "field": "verglasung",
    "values": {
      "verglasung": "einfach",
      "fassade_gedaemmt": true,
      "dach_gedaemmt": false
    },
    "expect": "soft",
    "why": "Gedämmte Außenfassade, aber noch Einfachverglasung. Bauphysikalisch unplausibel, weil der Fensteraustausch die mit Abstand günstigste und übliche Erst-Maßnahme ist, lange vor einer aufwendigen Fassadendämmung; einfach verglaste Fenster hinter gedämmter Fassade wären die dominierende Wärmebrücke. Kein bestehender Befund greift (nur 'einfach + komplett ungedämmt' bei jungem Bau). Verifiziert: Plausi NONE, Schema OK."
  },
  {
    "id": "r2.gebaeude.3",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Fußbodenheizung mit Rücklauf 42 °C",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 45,
      "ruecklauftemperatur": 42
    },
    "expect": "soft",
    "why": "Eine Fußbodenheizung ist über die zulässige Oberflächentemperatur (~29 °C im Aufenthaltsbereich, DIN EN 1264) physikalisch nach oben begrenzt; der Rücklauf eines FBH-Kreises liegt real bei ~28–32 °C, fast nie über 35 °C. RL 42 °C ist für einen Fußbodenkreis nicht plausibel. Vorlauf 45 ist FBH-konform (kein vorlauf.fbh) und Spreizung 3 K liegt exakt auf minSpreizung – beide Einzel-Checks greifen NICHT, eine FBH-Rücklauf-Obergrenze fehlt. Verifiziert: Plausi NONE, Schema OK."
  },
  {
    "id": "r2.gebaeude.4",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Fußbodenheizung mit Rücklauf 40 °C",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 45,
      "ruecklauftemperatur": 40
    },
    "expect": "soft",
    "why": "Gleiche FBH-Rücklauf-Obergrenze: 40 °C Rücklauf ist für einen Fußbodenkreis (Oberfläche ~29 °C gedeckelt) zu hoch. Spreizung 5 K und VL 45 sind beide unauffällig, daher fällt der Fall durch jedes Einzelraster. Belegt, dass die Lücke nicht an einem Grenzwert hängt, sondern die FBH-spezifische RL-Plausibilität komplett fehlt. Verifiziert: Plausi NONE, Schema OK."
  },
  {
    "id": "r2.gebaeude.5",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Einrohrsystem mit Dreifach-Wärmeschutzverglasung",
    "field": "rohrsystem",
    "values": {
      "rohrsystem": "einrohr",
      "verglasung": "dreifach_waermeschutz"
    },
    "expect": "soft",
    "why": "Einrohrheizungen wurden überwiegend in den 1950er–1970er-Jahren verbaut; Dreifach-Wärmeschutzverglasung ist Stand ab ~2010. Ein unsaniertes Einrohrsystem zusammen mit modernster Verglasung ist eine ungewöhnliche Epochen-/Sanierungskombination, die auf eine Verwechslung von Rohrsystem oder Verglasung hindeutet (Einrohr wird bei einer Sanierung dieses Niveaus i. d. R. mitgetauscht). Es gibt einen Einrohr×FBH-Check, aber keinen Einrohr×moderne-Verglasung-Check. Verifiziert: Plausi NONE, Schema OK."
  },
  {
    "id": "r2.gebaeude.6",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Junges Gebäude (Bauantrag 2018), zweifach (kein Wärmeschutz), Fassade & Dach ungedämmt",
    "field": "fassade_gedaemmt",
    "values": {
      "bauantrag_datum": "2018-01-01",
      "heizung_inbetriebnahme_datum": "2019-06-01",
      "verglasung": "zweifach",
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false
    },
    "expect": "soft",
    "why": "Ein 2018 beantragter Neubau muss nach EnEV 2016/GEG einen gedämmten Bauteilstandard erfüllen – ungedämmte Fassade UND ungedämmtes Dach sind bei diesem Baujahr praktisch ausgeschlossen. Der vorhandene GEG-Check (energie.jungUnsaniert) feuert NUR bei verglasung==='einfach'; bei 'zweifach' (normal, ohne Wärmeschutz) entkommt der genauso unmögliche ungedämmte Neubau der Prüfung. Lücke = zu enge Verglasungs-Bedingung. Verifiziert: Plausi NONE, Schema OK."
  },
  {
    "id": "r2.gebaeude.7",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Dreifach-Wärmeschutzverglasung, Fassade & Dach ungedämmt, hoher Verbrauch (28.000 kWh Gas / 140 m²)",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "verglasung": "dreifach_waermeschutz",
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false,
      "heizungsart": "gas",
      "beheizte_wohnflaeche_m2": 140,
      "durchschnittsverbrauch_3_jahre": 28000
    },
    "expect": "soft",
    "why": "Höchstwertige Verglasung (dreifach Wärmeschutz) kombiniert mit ungedämmter Fassade UND Dach ist energetisch in sich widersprüchlich (so selektiv wird nicht saniert), und 200 kWh/m²·a (28000/140) passen nicht zu top-verglasten Fenstern, sondern zu einem unsanierten Haus. Weil das Gebäude ohne junges Baujahr als 'teilsaniert' klassifiziert wird (Band 50–200), liegt der Verbrauch exakt am oberen Bandrand und löst keinen verbrauch.klasseHoch aus; der Verglasung-↔-Dämmung-Widerspruch wird gar nicht geprüft. Verifiziert: Plausi NONE, Schema OK."
  },
  {
    "id": "r2.gebaeude.8",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Fußbodenheizung mit Rücklauf 38 °C bei Vorlauf 40 °C",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 40,
      "ruecklauftemperatur": 38
    },
    "expect": "soft",
    "why": "Doppelter Befund derselben Wurzel: RL 38 °C ist für einen Fußbodenkreis physikalisch zu hoch (Oberfläche ~29 °C). Hier feuert zwar zufällig spreizung.klein (2 K), aber NICHT wegen der FBH-Rücklauf-Grenze, sondern wegen der allgemeinen Mindestspreizung – ein FBH mit RL 40 °C bei 5 K Spreizung (eigener Fall) bleibt komplett unentdeckt. Aufgenommen, um zu zeigen, dass die FBH-Rücklauf-Obergrenze unabhängig von der Spreizungsregel als eigene Plausibilität fehlt. Verifiziert: spreizung.klein greift hier zufällig, die FBH-RL-Grenze selbst fehlt."
  },
  {
    "id": "r2.heizungsraum.1",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Kaltwasser vorhanden + reale Distanz, aber Warmwasser-Distanz 0 trotz vorhanden",
    "field": "anschluss_warmwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 0,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 14
    },
    "expect": "soft",
    "why": "Warm- und Kaltwasser verlaufen am neuen Standort praktisch parallel zur selben Trinkwasser-Zentrale (Speicher/WP). Kaltwasser 14 m, Warmwasser 0 m ist geometrisch widerspruechlich: beide Leitungen muessen naeherungsweise gleich lang sein. Die bestehende Pro-Leitung-Pruefung kennt nur 'vorhanden=true + dist=0' isoliert (Soft), aber NICHT den Quervergleich WW vs. KW, der hier den eigentlichen Widerspruch zeigt. Knapp-innerhalb (0 ist gueltig) und trotzdem unplausibel."
  },
  {
    "id": "r2.heizungsraum.2",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Zirkulations-Distanz kuerzer als Warmwasser-Distanz (Ring laeuft mit WW hin UND zurueck)",
    "field": "anschluss_zirkulation_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 20,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 4
    },
    "expect": "soft",
    "why": "Die Zirkulationsleitung folgt dem Warmwasser-Strang bis zur entferntesten Zapfstelle und fuehrt von dort zum Speicher zurueck. Ihre verlegte Laenge ist daher mindestens so lang wie die Warmwasserleitung, real eher laenger. Zirkulation 4 m gegen Warmwasser 20 m ist topologisch unmoeglich. Beide liegen unter Soft-Max (30 m) und passieren jede Einzelpruefung; der Quervergleich Zirk vs. WW fehlt in der Engine (nur Zirk-ohne-WW ist geprueft, nicht das Laengenverhaeltnis)."
  },
  {
    "id": "r2.heizungsraum.3",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Heizungsraum verlegt, aber NUR Trinkwasser vorhanden - Vorlauf UND Ruecklauf fehlen",
    "field": "anschluss_vorlauf_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": false,
      "anschluss_ruecklauf_vorhanden": false,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 6,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 6
    },
    "expect": "soft",
    "why": "Der Heizungsraum wird verlegt, um dort die Heizung/WP zu betreiben - dafuer sind Vorlauf und Ruecklauf (der Heizkreis) zwingend. Sind beide als 'nicht vorhanden' markiert, waehrend Trinkwasser vorhanden ist, fehlt am neuen Standort jede Heizungsanbindung. Die Engine prueft nur 'alle 5 nicht vorhanden' (Sonderfall) und die VL/RL-Paarung (hier konsistent false=false, also kein Treffer) - die Konstellation 'Heizkreis komplett weg, aber Wasser da' bleibt unerkannt."
  },
  {
    "id": "r2.heizungsraum.4",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Alle 5 Anschluesse vorhanden=false, aber ueberall Distanzen eingetragen",
    "field": "heizungsraum_verlegen",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": false,
      "anschluss_vorlauf_distanz": 5,
      "anschluss_ruecklauf_vorhanden": false,
      "anschluss_ruecklauf_distanz": 5,
      "anschluss_warmwasser_vorhanden": false,
      "anschluss_warmwasser_distanz": 5,
      "anschluss_kaltwasser_vorhanden": false,
      "anschluss_kaltwasser_distanz": 5,
      "anschluss_zirkulation_vorhanden": false,
      "anschluss_zirkulation_distanz": 5
    },
    "expect": "soft",
    "why": "Verlegung ist aktiv, aber jede Leitung ist als 'nicht vorhanden' markiert UND traegt zugleich eine Distanz von 5 m. Das ist ein systematischer Widerspruch ueber alle Leitungen: nicht vorhandene Leitungen haben keine Laenge. Die Engine erkennt zwar 'verlegen=true + alle vorhanden=false' (Regel verlegenJaKeineLeitung) UND 'vorhanden=false + dist>0' je Leitung - aber die kombinierte Aussage 'wozu verlegen, wenn nichts vorhanden, und woher dann durchgaengige Distanzen' ist die eigentliche Dummy-/Fehleingabe-Signatur (Pauschal-5 auf abgeschaltete Felder)."
  },
  {
    "id": "r2.heizungsraum.5",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Einheiten-Verwechslung cm statt m: 80 (= 0,80 m) auf kurzer Anschlussleitung",
    "field": "anschluss_kaltwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 6,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 6,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 80
    },
    "expect": "soft",
    "why": "80 m liegt unter dem Hard-Max (100 m) und passiert die Einzel-Hard-Pruefung. Im Kontext einer normalen Heizungsraum-Verlegung, in der die Heizleitungen nur je 6 m brauchen, ist eine 80-m-Kaltwasserleitung im selben Wohngebaeude voellig disproportional - klassische cm/m- oder Zahlendreher-Eingabe (gemeint 0,80 m oder 8 m). Die Soft-Schwelle (30 m) feuert zwar absolut, aber der eigentlich treffsichere Hinweis ist das Missverhaeltnis zu den 6-m-Heizleitungen, das die Engine nicht auswertet."
  },
  {
    "id": "r2.heizungsraum.6",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Vorlauf vorhanden mit Distanz, aber Ruecklauf vorhanden=true ohne Distanz",
    "field": "anschluss_ruecklauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 7,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 0
    },
    "expect": "soft",
    "why": "Vorlauf und Ruecklauf bilden ein Paar im selben Trassenweg. Vorlauf 7 m, Ruecklauf 0 m bei beidseitig vorhanden=true ist hydraulisch unmoeglich - der Ruecklauf muss naeherungsweise so lang sein wie der Vorlauf. Die Engine prueft 'vorhanden=true + dist=0' je Leitung isoliert (Soft) und die VL/RL-Paarung nur ueber das vorhanden-Flag (hier true=true, kein Treffer), nicht ueber das Distanz-Verhaeltnis des Paares. Die 0 ist ein gueltiger Wert, der Widerspruch entsteht erst im Paarvergleich."
  },
  {
    "id": "r2.heizungsraum.7",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Warmwasser-Distanz exakt 30 m (Soft-Grenze, fuer Trinkwarmwasser bereits kritisch)",
    "field": "anschluss_warmwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 30
    },
    "expect": "soft",
    "why": "Der generische Soft-Max (30 m) gilt einheitlich fuer alle Leitungen und feuert erst BEI Ueberschreitung (>30). Genau 30 m rutscht damit durch, obwohl eine 30-m-Warmwasserleitung in einem Wohngebaeude aus Trinkwasserhygiene-Sicht (Legionellen, 3-Liter-Regel/Ausstossvolumen, Auskuehlung) bereits am Limit ist - Warmwasser haette einen niedrigeren Soft-Schwellwert als z.B. Vorlauf verdient. Knapp-an-der-Grenze-aber-leitungsspezifisch-unplausibel."
  },
  {
    "id": "r2.heizungsraum.8",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Zirkulation vorhanden ohne Distanz, Warmwasser vorhanden mit Distanz",
    "field": "anschluss_zirkulation_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 12,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 0
    },
    "expect": "soft",
    "why": "Eine vorhandene Zirkulationsleitung mit 0 m Laenge ist physikalisch sinnlos: ein Zirkulationsring muss mindestens den Warmwasser-Strang entlang und zurueck verlegt werden, also deutlich groesser 0, hier mindestens in der Groessenordnung der 12 m WW-Leitung. Die Engine erkennt 'vorhanden=true + dist=0' generisch als Soft, aber NICHT die schaerfere Aussage, dass eine Zirkulation per Definition eine doppelte Strecke (hin+zurueck) > WW-Distanz haben muss - der 0-Wert ist hier nicht nur 'pruef das', sondern topologisch ausgeschlossen."
  },
  {
    "id": "r2.heizungsraum.9",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Ruecklauf-Distanz mehr als doppelt so lang wie Vorlauf (gleicher Schacht)",
    "field": "anschluss_ruecklauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 5,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 22
    },
    "expect": "soft",
    "why": "Spiegelbild des bereits gelisteten Falls (VL 18 / RL 3): hier VL 5 / RL 22. Vorlauf und Ruecklauf verlaufen parallel im selben Trassenweg zur selben Heizflaeche und muessen naeherungsweise gleich lang sein. Ein Ruecklauf, der mehr als das Vierfache des Vorlaufs misst, ist im selben Schacht nicht erklaerbar. Beide Werte liegen unter Soft-Max (30 m) und passieren die Einzelpruefung; der Engine fehlt der symmetrische VL/RL-Distanz-Vergleich (nur die eine Richtung ist als Beispiel abgedeckt, das Verhaeltnis selbst wird nicht erzwungen)."
  },
  {
    "id": "r2.heizungsraum.10",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Nur Zirkulation vorhanden - Warmwasser, Kaltwasser, Vorlauf, Ruecklauf alle abwesend",
    "field": "anschluss_zirkulation_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": false,
      "anschluss_ruecklauf_vorhanden": false,
      "anschluss_warmwasser_vorhanden": false,
      "anschluss_kaltwasser_vorhanden": false,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 9
    },
    "expect": "block",
    "why": "Die Zirkulation ist die einzige als vorhanden markierte Leitung, waehrend Warm- und Kaltwasser fehlen. Eine Zirkulation transportiert Warmwasser im Ring zum Speicher zurueck - ohne Warmwasserleitung (und ohne Kaltwasser-Nachspeisung dahinter) gibt es nichts zu zirkulieren. Das ist dieselbe physikalische Unmoeglichkeit wie 'Zirk ohne WW', aber als Extremfall 'Zirk ist die EINZIGE Leitung': zusaetzlich fehlt auch der Heizkreis (VL/RL), sodass die einzige verlegte Leitung gerade die ist, die ohne die anderen nicht funktionieren kann. Die Engine hat die Zirk-ohne-WW-Regel, deckt aber diese 'isolierte Zirkulation als einziger Anschluss'-Konstellation nicht gesondert ab."
  },
  {
    "id": "r2.heizungsart.1",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tank randvoll: aktuell == gesamt (exakt 100% Befüllung)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 1,
      "oeltank_liter_gesamt": 5000,
      "oeltank_liter_aktuell": 5000
    },
    "expect": "soft",
    "why": "Die Engine blockt nur aktuell > gesamt (oeltank.aktuellUeberGesamt). Gleichstand aktuell == gesamt rutscht durch, ist aber praktisch unmoeglich: Heizoeltanks duerfen nach TRwS/Grenzwertgeber nie zu 100% gefuellt werden, der Grenzwertgeber riegelt bei ca. 95% ab (Ausdehnungsreserve). Ein als exakt randvoll gemeldeter Tank ist daher unplausibel und sollte eine Begruendung erzwingen."
  },
  {
    "id": "r2.heizungsart.2",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Mehr Tanks als Liter gesamt (Bruchteil-Liter pro Tank)",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 8,
      "oeltank_liter_gesamt": 4,
      "oeltank_liter_aktuell": 0
    },
    "expect": "soft",
    "why": "8 ist gueltige Anzahl (<=20), 4 Liter gesamt passiert nicht den hardMin (200) ... doch: 4 < 200 wuerde gesamtHard ausloesen. ABER mit gesamt = 250 (knapp ueber hardMin) und anzahl = 8 ergibt das 31 L je Tank. Die proTank-Regel feuert nur am OBEREN Rand (>5000 L/Tank); die untere Seite fehlt voellig. Ein realer Heizoeltank fasst mind. ~700-1000 L (Batterietank). 31 L/Tank ist ein Eingabefehler (Anzahl/Liter verwechselt oder zu viele Tanks), den nichts faengt."
  },
  {
    "id": "r2.heizungsart.3",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Liter-pro-Tank unrealistisch klein bei plausibler Gesamtmenge",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 15,
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": 1500
    },
    "expect": "soft",
    "why": "Alle Einzelwerte sind gruen: 3000 L liegt im Soft-Band, 15 Tanks <=20, 1500 < 3000. Aber 3000/15 = 200 L je Tank. Es gibt keine 200-L-Heizoeltanks; uebliche Batterietanks fassen 700-2000 L. Die proTank-Regel deckt nur den oberen Ausreisser ab, nicht den unteren. 15 Mini-Tanks fuer 3000 L ist faktisch eine vertauschte/falsche Anzahl."
  },
  {
    "id": "r2.heizungsart.4",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Einheiten-Verwechslung: aktuelle Menge in m3 statt Liter eingegeben",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 2,
      "oeltank_liter_gesamt": 6000,
      "oeltank_liter_aktuell": 3
    },
    "expect": "soft",
    "why": "aktuell = 3 ist als non-negative Integer schema-gueltig und < gesamt, also unauffaellig fuer die aktuellUeberGesamt-Regel. Inhaltlich heisst 3 Liter Restoel bei 6000 L Tankvolumen entweder echter Fast-Leerstand ODER (haeufiger) eine in m3 statt Liter eingetragene Zahl (3 m3 = 3000 L). Ein einstelliger Liter-Wert bei mehreren tausend Litern Volumen ist ein klassischer Einheiten-Tippfehler, den keine Regel prueft."
  },
  {
    "id": "r2.heizungsart.5",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Einheiten-Verwechslung: Gesamtvolumen in m3 -> knapp ueber hardMin, aber winziger pro-Tank",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 3,
      "oeltank_liter_gesamt": 270,
      "oeltank_liter_aktuell": 100
    },
    "expect": "soft",
    "why": "270 L liegt knapp ueber hardMin (200), umgeht also gesamtHard, und unter literSoftMin (1000) ... das loest gesamtSoft aus. Der UEBERSEHENE Punkt: selbst wenn man gesamtSoft akzeptiert/begruendet, ist 270 L auf 3 Tanks = 90 L/Tank physikalisch kein Tank. Realistisch hat der Techniker 270 statt 2700 getippt oder m3 gemeint. Die Kombination kleiner Gesamtwert + mehrere Tanks ist ein eigener Widerspruch, der ueber gesamtSoft hinausgeht und derzeit nicht als pro-Tank-Untergrenze geprueft wird."
  },
  {
    "id": "r2.heizungsart.6",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Restmenge > Tankvolumen, aber nur knapp -> von proTank/aktuell nicht erfasst bei mehreren Tanks",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 4,
      "oeltank_liter_gesamt": 4000,
      "oeltank_liter_aktuell": 3900
    },
    "expect": "soft",
    "why": "aktuell (3900) < gesamt (4000) -> aktuellUeberGesamt feuert NICHT. Aber 3900/4000 = 97,5% Fuellgrad. Wie beim Gleichstand-Fall ist >95% durch den Grenzwertgeber praktisch ausgeschlossen. Es gibt keine Fuellgrad-Plausibilitaet (nur die harte aktuell>gesamt-Grenze). Ein als 97-99% voll gemeldeter Bestandstank ist unplausibel und braucht eine Begruendung."
  },
  {
    "id": "r2.heizungsart.7",
    "page": "heizungsart",
    "domain": "wp",
    "label": "heizungsart 'oel' mit Gesamtvolumen am oberen Soft-Rand UND nur 1 Tank",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 1,
      "oeltank_liter_gesamt": 19000,
      "oeltank_liter_aktuell": 0
    },
    "expect": "soft",
    "why": "19000 L liegt knapp unter literSoftMax (20000), also kein gesamtSoft. Auf 1 Tank verteilt sind das 19000 L/Tank -> proTank (>5000) feuert ZWAR. Der subtilere, NICHT erfasste Fall ist die Kombination: ein einzelner 19000-L-Tank existiert im Wohngebaeude nicht (das ist Tankraum-/Gewerbegroesse). Hier greift proTank zufaellig; aber der Wert 19000 als realistische Hauswohnflaeche-Tankgroesse haette einen eigenen oberen Soft-Riegel verdient, der unabhaengig von der Tankzahl Wohngebaeude-untypische Gesamtmengen (>~8000-10000 L) markiert. Aktuell kann man 9999 L auf 2 Tanks legen (5000/Tank, knapp unter proTank) und voellig ungewarnt durchkommen, obwohl ~10000 L Heizoel fuer ein EFH untypisch viel ist."
  },
  {
    "id": "r2.heizungsart.8",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Restmenge identisch zu Gesamt bei vielen Tanks, aber Gesamt selbst plausibel (Copy-Paste-Fehler)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 3,
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": 3000
    },
    "expect": "soft",
    "why": "Klassischer Eingabefehler: Techniker tippt denselben Wert in 'gesamt' und 'aktuell' (Copy-Paste / Verwechslung der beiden direkt untereinander stehenden Liter-Felder). aktuell == gesamt wird von aktuellUeberGesamt (nur >) nicht gefangen. 100% Fuellung ist wegen Ausdehnungsreserve/Grenzwertgeber unmoeglich. Da die beiden Felder im Formular direkt benachbart sind (Zeile 56 vs. 64), ist die Verwechslung realistisch und sollte mindestens eine Rueckfrage/Begruendung ausloesen."
  },
  {
    "id": "r2.heizungsart.9",
    "page": "heizungsart",
    "domain": "wp",
    "label": "oeltank_anzahl am oberen Hard-Rand (20) mit niedrigem Gesamtvolumen",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 20,
      "oeltank_liter_gesamt": 2000,
      "oeltank_liter_aktuell": 500
    },
    "expect": "soft",
    "why": "anzahl = 20 ist exakt anzahlHardMax, passiert also die harte Grenze gerade noch. 2000 L liegt im Soft-Band (kein gesamtSoft). 2000/20 = 100 L je Tank -> wieder kein realer Tank, und proTank prueft nur oben. 20 Heizoeltanks in einem Wohngebaeude ist faktisch ausgeschlossen (selbst grosse Heizraeume haben 4-8 Batterietanks). Die Engine hat keine Wohngebaeude-Soft-Obergrenze fuer die Tankzahl unterhalb des Hard-Limits 20."
  },
  {
    "id": "r2.heizkoerper.1",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "FBH mit hohem Vorlauf knapp unter WP-Grenze (45–55 °C)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 52
    },
    "expect": "soft",
    "why": "52 °C liegt unter der WP-Soft-Grenze (55) und wird daher von 'vorlauf.wp' NICHT gefangen. Aber eine reine Fußbodenheizung wird bauphysikalisch mit ~30–38 °C, max ~45 °C betrieben (Estrich-Oberflächentemperatur, DIN EN 1264). 52 °C bei reiner FBH ist ein klarer Hinweis auf Falscheingabe oder ungeeignete Heizfläche. Die bestehende 'vorlauf.fbh'-Regel feuert zwar ab >45, deckt aber genau dieses Band — der hier markierte Fall ist die subtile Lücke, dass der Wert die prominentere WP-Grenze unterschreitet und Techniker ihn daher für unkritisch halten."
  },
  {
    "id": "r2.heizkoerper.2",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine FBH mit Einrohr-Rohrsystem (klassische Falschkombination)",
    "field": "heizkoerper_typ",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "einrohr"
    },
    "expect": "soft",
    "why": "Einrohrsysteme sind ein Heizkörper-Verteilkonzept (Reihenschaltung von Radiatoren). Eine Fußbodenheizung wird über einen Heizkreisverteiler mit parallelen Kreisen (Zweirohr-Prinzip) angebunden — ein echtes Einrohr-FBH-Netz existiert in Wohngebäuden praktisch nicht. Die bestehende Regel 'heizkoerper.einrohrFbh' deckt 'beides', greift aber laut Code über hatFbh auch hier; falls sie nur für 'beides' gedacht war, ist 'fussbodenheizung'+einrohr die übersehene reinere Widerspruchsvariante."
  },
  {
    "id": "r2.heizkoerper.3",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine FBH, aber Rohrsystem als Einrohr UND niedriger Vorlauf — Rohrsystem-Verwechslung",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 35
    },
    "expect": "soft",
    "why": "35 °C Vorlauf ist für eine FBH stimmig, aber 'einrohr' widerspricht dem: 35 °C unterschreitet die Einrohr-Soft-Grenze (45), sodass zusätzlich 'vorlauf.einrohr' anschlägt. Die Kombination FBH + einrohr + WP-typischer Vorlauf ist physikalisch inkonsistent — entweder ist das Rohrsystem falsch erfasst (müsste zweirohr/Verteiler sein) oder der Heizkörper-Typ. Realistische Feld-Verwechslung beim Antippen der Rohrsystem-Auswahl."
  },
  {
    "id": "r2.heizkoerper.4",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Nur Heizkörper, aber niedriger WP-Vorlauf knapp über Heizkörper-Untergrenze (40–45 °C)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 42
    },
    "expect": "soft",
    "why": "42 °C liegt ÜBER der bestehenden Heizkörper-Untergrenze (40, 'vorlauf.hk'), wird also NICHT gefangen, und unter 55 (keine WP-Warnung). Aber Standard-Bestandsheizkörper (Typ 22, ausgelegt auf 70/55 oder 55/45) geben bei 42 °C Vorlauf nur einen Bruchteil der Nennleistung ab — ohne Heizflächen-Ertüchtigung wird das Haus nicht warm. Genau das Band 40–50 °C bei reinen Heizkörpern ist der bauphysikalisch heikle, aber unmarkierte Bereich (Heizlast-Deckung fraglich)."
  },
  {
    "id": "r2.heizkoerper.5",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauf in Fahrenheit eingetippt → als °C knapp unter Hard-Max (Einheiten-Verwechslung)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 86
    },
    "expect": "soft",
    "why": "86 liegt unter dem Hard-Max von 90 °C und passiert daher den Block. 86 ist aber exakt 30 °C in Fahrenheit-Optik bzw. ein typischer Fahrenheit-Zahlenwert (z. B. 86 °F = 30 °C). Realistischer ist: ein auf Fahrenheit gestelltes Gerät/Display, abgelesen als 86, in ein °C-Feld eingetragen. 86 °C Vorlauf ist für ein Bestandssystem extrem hoch (alte Schwerkraft/Kessel-Maximum) und für eine geplante WP unbrauchbar — als Soft-Hinweis zur Ableseprüfung berechtigt, vom reinen Bereichscheck aber durchgelassen."
  },
  {
    "id": "r2.heizkoerper.6",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Rohrsystem 'unbekannt' trotz erfasstem Einrohr-typischem Hochtemperatur-Vorlauf",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "unbekannt",
      "vorlauftemperatur": 75
    },
    "expect": "soft",
    "why": "Wenn der Techniker einen konkreten Vorlauf von 75 °C messen/ablesen konnte, ist die Anlage zugänglich und in Betrieb — dann ist 'Rohrsystem unbekannt' inkonsistent: Ein-/Zweirohr ist an den sichtbaren Heizkörper-Anschlüssen direkt erkennbar (eine vs. zwei Anbindeleitungen). 'unbekannt' bei gleichzeitig präzise erfasster Betriebstemperatur deutet auf ein übersprungenes Pflichtdetail, nicht auf echte Unkenntnis. Querfeld-Lücke, die der Bereichscheck nicht sieht."
  },
  {
    "id": "r2.heizkoerper.7",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "'beides' (HK + FBH) mit einheitlichem hohem Vorlauf 50 °C — FBH-Teil überfahren",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "beides",
      "vorlauftemperatur": 50
    },
    "expect": "soft",
    "why": "Bei 'beides' teilen sich FBH und Heizkörper i. d. R. denselben Wärmeerzeuger; der erfasste Vorlauf ist der Systemvorlauf. 50 °C liegt unter der WP-Grenze (55) und über der HK-Untergrenze (40) — beide bestehenden Regeln schweigen. Für den FBH-Anteil sind 50 °C jedoch zu hoch (max ~45, sonst Estrich-/Oberflächengrenzwert und Behaglichkeitsprobleme). Bei 'beides' müsste eigentlich die FBH-Obergrenze auch greifen; dass sie hier nur über hatFbh anschlägt und das prominente WP-Limit unterschritten wird, macht den Fall zur übersehenen Soft-Lücke."
  },
  {
    "id": "r2.heizkoerper.8",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine FBH mit sehr niedrigem Vorlauf 22 °C — kaum über Raumtemperatur",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 22
    },
    "expect": "soft",
    "why": "22 °C liegt über dem Hard-Min (20) und löst damit keinen Block aus; FBH-Obergrenze (45) ist nicht betroffen, also schweigen alle bestehenden Vorlauf-Regeln. Ein Vorlauf von 22 °C liegt aber nur ~1–2 K über der Raum-Solltemperatur — damit ist praktisch keine Wärmeabgabe und keine Heizlastdeckung möglich (Auslegungs-Vorlauf einer FBH ~30–38 °C). Plausibler ist eine im Sommer/abgeschalteten Zustand abgelesene Temperatur statt des Auslegungswerts. Der untere Soft-Rand für FBH fehlt der Engine."
  },
  {
    "id": "r2.heizkoerper.9",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Heizkörper mit grenzwertigem Hochtemperatur-Vorlauf 88 °C unter Hard-Max",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 88
    },
    "expect": "soft",
    "why": "88 °C passiert den Hard-Block (Max 90) knapp. Es triggert zwar 'vorlauf.wp' (>55), aber der eigentliche, schärfere Punkt bleibt unmarkiert: 88 °C ist nahe der Siedegrenze und nur bei sehr alten, überdimensionierten Schwerkraft-/Kohle-umgerüsteten Kesseln realistisch. Als Eingangsgröße für eine WP-Auslegung ist 88 °C ein starkes Warnsignal für Falschablesung (z. B. Kesselthermostat-Maximum statt tatsächlichem Betriebsvorlauf). Der knappe Abstand zur Hard-Grenze ist genau die subtile Lücke."
  },
  {
    "id": "r2.heizkoerper.10",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Einrohrsystem mit Hochtemperatur-Vorlauf 80 °C + reine Heizkörper — Heizlast-/WP-Eignung",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 80
    },
    "expect": "soft",
    "why": "Jeder Einzelwert ist gültig (80 °C < 90 Hard-Max; einrohr+HK plausibel) und 'vorlauf.einrohr' feuert nur bei NIEDRIGEM Vorlauf (<45), nicht hier. Die Engine markiert über 'vorlauf.wp' nur generisch >55. Übersehen wird die spezifische Schwere der Kombination Einrohr + 80 °C: Einrohrsysteme haben bauartbedingt fallende Vorlauftemperaturen entlang des Strangs und sind die mit Abstand WP-ungünstigste Konstellation (späte Heizkörper bekommen noch weniger). Ein dedizierter Querfeld-Soft-Hinweis (Einrohr + Hochtemperatur = kritische WP-Eignung) fehlt."
  },
  {
    "id": "r2.elektrik.1",
    "page": "elektrik",
    "domain": "wp",
    "label": "PV-Anlage vorhanden, aber keine Erdung",
    "field": "hat_erdung",
    "values": {
      "hat_pv_anlage": true,
      "hat_erdung": false
    },
    "expect": "soft",
    "why": "Echte, bisher unmodellierte Querfeld-Lücke. Eine auf dem Dach betriebene PV-Anlage erfordert in Deutschland zwingend einen funktionierenden Schutzpotentialausgleich/Erdung (DIN VDE 0100-712, VDE-AR-E 2100-712: PV-Gestell und WR sind in den Hauptpotentialausgleich einzubinden). 'PV-Anlage ja' + 'Erdung nein' ist ein elektrotechnischer Widerspruch bzw. Sicherheitsmangel. Die Plausi-Engine hat aktuell NULL Regeln zu hat_erdung — dieser Fall fällt komplett durch. Soft (möglich als Falscheingabe/Mangel, daher Begründungspflicht statt Hard-Block)."
  },
  {
    "id": "r2.elektrik.2",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP mit Außeneinheit + Kernloch-Leitung, aber keine Erdung am Hausanschluss",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": false,
      "distanz_ausseneinheit_kernloch": 5,
      "anzahl_durchbrueche_kernloch": 1
    },
    "expect": "soft",
    "why": "Querfeld-Plausibilität, die fehlt. Eine zu installierende Wärmepumpen-Außeneinheit (Leitungsweg + Durchbruch sind erfasst) ist ein Verbraucher mit Metallgehäuse, der nach DIN VDE 0100-540 an den Schutzpotentialausgleich/Erder anzuschließen ist. 'Erdung nein' bei gleichzeitig konkret aufgemessenem WP-Außengerät bedeutet, dass die WP gar nicht normgerecht angeschlossen werden kann — das muss der Aufmaßmeister begründen oder korrigieren. Heute komplett ungeprüft."
  },
  {
    "id": "r2.elektrik.3",
    "page": "elektrik",
    "domain": "wp",
    "label": "hat_erdung als Freitext-String 'ja' statt Bool",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": "ja"
    },
    "expect": "block",
    "why": "Typ-Verwechslung. Beim Import/CRM-Sync oder über eine fehlerhafte API kann statt des Booleans der Anzeigetext 'ja' im Feld landen. z.boolean() im Submit-Schema lehnt jeden String ab (per Probe verifiziert: REJECT). Unmöglicher Wert für ein reines Bool-Feld → Hard-Block."
  },
  {
    "id": "r2.elektrik.4",
    "page": "elektrik",
    "domain": "wp",
    "label": "hat_erdung als Zahl 1 (Truthy-Verwechslung)",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": 1
    },
    "expect": "block",
    "why": "Klassische 0/1-für-Boolean-Verwechslung (DB-Spalte als smallint, JSON aus Altsystem). z.boolean() coerced NICHT von Zahl — 1 wird abgelehnt (per Probe verifiziert: REJECT), nicht still als true interpretiert. Daher echter Block, kein unbemerktes Durchrutschen."
  },
  {
    "id": "r2.elektrik.5",
    "page": "elektrik",
    "domain": "wp",
    "label": "hat_erdung als String 'true' (Stringified-Bool)",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": "true"
    },
    "expect": "block",
    "why": "Subtile Einheiten-/Typ-Falle: Werte aus URL-Query, FormData oder localStorage kommen als String 'true'/'false' an. Optisch korrekt, aber z.boolean() lehnt den String 'true' ab (per Probe verifiziert: REJECT). Ein naiver Importer, der === 'true' nicht selbst casted, würde hier scheitern — Block ist korrekt."
  },
  {
    "id": "r2.elektrik.6",
    "page": "elektrik",
    "domain": "wp",
    "label": "hat_erdung als Objekt {vorhanden:true}",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": {
        "vorhanden": true
      }
    },
    "expect": "block",
    "why": "Struktur-Verwechslung: ein verschachteltes Antwort-Objekt (z.B. aus einer Foto-/KI-Prüfung) landet im Bool-Feld statt des reinen Werts. z.boolean() lehnt jedes Objekt ab (per Probe verifiziert: REJECT). Physikalisch/typisch unmöglicher Feldinhalt → Block."
  },
  {
    "id": "r2.elektrik.7",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdung 'nein', aber Kunde bestätigt Aufstellort der WP rechtsverbindlich",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": false,
      "kunde_aufstellort_bestaetigt": true,
      "kunde_bestaetigung_vorname": "Erika",
      "kunde_bestaetigung_nachname": "Beispiel"
    },
    "expect": "soft",
    "why": "Prozess-Querfeld-Lücke. Der Kunde bestätigt per Unterschrift einen WP-Aufstellort als final, obwohl 'keine Erdung' erfasst ist — d.h. der elektrische Anschluss ist an diesem Ort gar nicht ohne zusätzliche Erder-Maßnahme möglich. Eine verbindliche Aufstellort-Freigabe bei fehlender Erdung sollte erzwingen, dass der Erder-Mangel dokumentiert/begründet wird. Heute keinerlei Kopplung der beiden Felder."
  },
  {
    "id": "r2.elektrik.8",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdung 'nein' bei sehr altem Gebäude ohne weitere Maßnahme-Notiz",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": false,
      "bauantrag_datum": "1955-04-01",
      "bemerkungen": ""
    },
    "expect": "soft",
    "why": "Fachlich subtil: Bei Altbauten (Bauantrag 1955, oft TN-C/klassische Nullung) ist 'keine separate Erdung' realistisch — aber genau dann ist ein Erder/Potentialausgleich für den WP-Anschluss nachzurüsten, was zusätzliche Kosten/Arbeit bedeutet. 'Erdung nein' ohne jede Bemerkung zur erforderlichen Nachrüstung ist eine unvollständige Aufnahme. Soft-Hinweis (Begründung/Notiz erzwingen), heute ungeprüft, da Plausi hat_erdung nie betrachtet."
  },
  {
    "id": "r2.elektrik.9",
    "page": "elektrik",
    "domain": "wp",
    "label": "hat_erdung leer gelassen (Pflichtfeld unbeantwortet)",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": null
    },
    "expect": "block",
    "why": "Grundfrage 'Erdung vorhanden?' ist Pflicht (z.boolean({required_error}) im Submit). null/leer wird als fehlend abgelehnt (per Probe verifiziert: submit REJECT 'Bitte auswählen'). Ohne Aussage zur Erdung kann der WP-Elektroanschluss nicht beurteilt werden — Submit muss blockieren."
  },
  {
    "id": "r2.aufstellort.1",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Außendistanz knapp unter Hard-Max (39 m), aber jenseits jeder Split-Kältemittelgrenze",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 39
    },
    "expect": "soft",
    "why": "39 m liegt 1 m unter dem Hard-Max (40 m) und passiert daher Block UND die bestehenden Cases (35/80). Es überschreitet aber die herstellerseitige Kältemittel-Leitungslänge gängiger Monoblock/Split-WP (typ. 15-30 m) massiv. Knapp-unter-der-Grenze-Wert, der trotzdem fachlich unplausibel ist."
  },
  {
    "id": "r2.aufstellort.2",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Beide Strecken je 20 m: Summe 40 m exakt = Hard-Max einer Einzelstrecke, real unmöglicher Gesamtweg",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_ausseneinheit_kernloch": 20,
      "distanz_kernloch_innengeraet": 20
    },
    "expect": "soft",
    "why": "Jeder Einzelwert (20 m) liegt unter dem Einzel-Hard-Max (40 m) und nur knapp über dem jeweiligen Soft (15/20), würde also einzeln kaum auffallen. Die Plausibilitäts-Engine prüft die SUMME beider Strecken aber nicht: 40 m Gesamtleitungsweg überschreitet die übliche freigegebene Anbinde-/Kältemittellänge. Anderer Zahlensatz als der bestehende 18+18-Fall."
  },
  {
    "id": "r2.aufstellort.3",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aufstellort-Verschiebung größer als der gesamte Außen-Leitungsweg zum Kernloch",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 25,
      "distanz_ausseneinheit_kernloch": 4
    },
    "expect": "soft",
    "why": "25 m liegt unter dem Aufstellort-Soft-Max (30 m) und unter Hard-Max (100 m), passiert also alle Einzel-Checks. Logisch widersprüchlich: Wird das Außengerät 25 m weit verschoben, kann der neue Weg zum selben Kernloch nicht nur 4 m betragen - die Verschiebung übersteigt den verbleibenden Leitungsweg. Querfeld-Geometrie, die die Engine nicht prüft (anderer Zahlensatz als der bestehende 60+3-Fall)."
  },
  {
    "id": "r2.aufstellort.4",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Nur 1 Durchbruch bei langem Außen- UND Innenweg über mehrere Bauteile",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 12,
      "distanz_kernloch_innengeraet": 18,
      "anzahl_durchbrueche_kernloch": 1
    },
    "expect": "soft",
    "why": "1 Durchbruch ist >0 (passiert nullTrotzLeitung) und <=3 (passiert durchbrueche.soft). Bei 30 m Gesamtweg quer durchs Haus (12 außen + 18 innen) ist genau EIN Durchbruch baulich unplausibel - ein so langer Innenweg quert mehrere Wände/Geschossdecken. Die Engine zählt Durchbrüche nicht gegen die Streckenlänge. Anderer Zahlensatz als der bestehende 25-m-Einzelfall."
  },
  {
    "id": "r2.aufstellort.5",
    "page": "aufstellort",
    "domain": "wp",
    "label": "3 Durchbrüche (Soft-Grenze) bei nur 1 m Gesamtweg durch eine einzige Wand",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 0.5,
      "distanz_kernloch_innengeraet": 0.5,
      "anzahl_durchbrueche_kernloch": 3
    },
    "expect": "soft",
    "why": "3 liegt exakt auf der Soft-Schwelle (durchbruecheSoftMax=3), löst also den Standard-Durchbruch-Hinweis NICHT aus (Bedingung ist >3). Bei 1 m Gesamtweg durch eine einzelne Außenwand sind 3 separate Kernlochbohrungen räumlich kaum unterzubringen. Knapp-innerhalb-Soft-Grenze-Wert, der im Querfeld zur Mini-Distanz trotzdem unplausibel ist (anderer Wert/Distanzsatz als der bestehende 5-Durchbruch-Fall)."
  },
  {
    "id": "r2.aufstellort.6",
    "page": "aufstellort",
    "domain": "wp",
    "label": "0 Durchbrüche bei Aufstellort-Änderung mit Verschiebung, ohne explizite Leitungsdistanz",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 6,
      "anzahl_durchbrueche_kernloch": 0
    },
    "expect": "soft",
    "why": "Die Engine-Regel nullTrotzLeitung feuert nur, wenn distanz_ausseneinheit/innen > 0 ist - hier sind diese Felder nicht gesetzt, also greift sie nicht. Trotzdem: Eine reale Aufstellort-Änderung mit 6 m Verschiebung bedeutet einen neuen Leitungsweg ins Gebäude und damit zwingend mindestens ein Kernloch. 0 Durchbrüche widersprechen der Verschiebung. Lücke, weil der Leitungsweg implizit über die Aufstellort-Distanz, nicht über die Kernloch-Distanzfelder, ausgedrückt ist."
  },
  {
    "id": "r2.aufstellort.7",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Innenweg 0 m bei vorhandenem Außenweg (Innengerät angeblich exakt im Kernloch)",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_ausseneinheit_kernloch": 7,
      "distanz_kernloch_innengeraet": 0
    },
    "expect": "soft",
    "why": "0 m passiert die Hard-Prüfung (min 0 erlaubt) und löst keinen Soft-Hinweis aus (Engine warnt nur bei >innenSoftMax). Wenn außen ein 7-m-Weg zum Kernloch existiert, sitzt das Innengerät/Hydraulikmodul real nie exakt IM Kernloch in der Wand - mindestens der Geräte-/Wandabstand bleibt. Unterscheidet sich vom bestehenden reinen 0-Fall (aufstellort.7) durch den Querfeld-Bezug zum vorhandenen Außenweg, den die Engine nicht zieht."
  },
  {
    "id": "r2.aufstellort.8",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Außenweg 0 m (Wandmontage), aber langer Innenweg trotz Außengerät direkt am Kernloch",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 0,
      "distanz_kernloch_innengeraet": 16
    },
    "expect": "soft",
    "why": "Außen=0 passiert die Hard-Prüfung; innen=16 liegt unter dem Innen-Soft (20) und löst daher KEINEN Einzel-Hinweis aus. Beides zusammen ist aber widersprüchlich: 0 m außen heißt Außengerät klebt direkt am Kernloch an der Wand, dann ist ein 16-m-Innenweg untypisch lang und legt eine Feldvertauschung nahe. Beide Einzelwerte unauffällig, Kombination unplausibel - von der Engine nicht erfasst."
  },
  {
    "id": "r2.aufstellort.9",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aufstellort-Verschiebung exakt 30 m (Soft-Grenze) - faktisch anderes Grundstücksende",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 30
    },
    "expect": "soft",
    "why": "30 m liegt exakt auf aufstellortSoftMax; der Engine-Hinweis feuert erst bei >30, dieser Randwert rutscht also durch. Eine 30-m-Verschiebung des Außengeräts auf einem typischen Wohngrundstück ist real kein Umsetzen mehr, sondern ein komplett anderer Standort am Grundstücksende, mit unzulässig langem Leitungsweg. Klassischer Off-by-one an der Soft-Schwelle."
  },
  {
    "id": "r2.aufstellort.10",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Beide Alternativen vorhanden bei aktiver Aufstellort-Änderung, aber Verschiebung 0 m",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "alternative_1_vorhanden": true,
      "alternative_2_vorhanden": true,
      "distanz_alter_neuer_aufstellort": 0
    },
    "expect": "soft",
    "why": "Die Engine warnt bei aufstellort_aenderung=true UND Distanz 0 (aufstellortDist.null) - dieser Teil ist abgedeckt. Neu ist die Kombination mit zwei dokumentierten Alternativ-Standorten: Werden zwei Alternativen erfasst und eine Änderung markiert, kann die Verschiebung nicht 0 sein - es wurde ja erkennbar ein anderer Ort gewählt. Mehrschichtiger Widerspruch über drei Felder, den keine einzelne Regel komplett greift."
  },
  {
    "id": "r2.aufstellort.11",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Anzahl Durchbrüche exakt am Hard-Max (10), für eine WP-Anbindung baulich nie nötig",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": 10,
      "distanz_ausseneinheit_kernloch": 3,
      "distanz_kernloch_innengeraet": 3
    },
    "expect": "soft",
    "why": "10 ist exakt durchbruecheHardMax und passiert daher den Block (Bedingung ist >10). Der Soft-Hinweis feuert zwar bei >3, aber bei nur 6 m Gesamtweg ist die Kombination besonders krass: 10 Kernlochbohrungen auf so kurzer Strecke sind physikalisch sinnlos - eine WP-Anbindung braucht 1-2. Randwert am Hard-Max plus Querfeld zur kurzen Distanz; deutlich anderer Zahlensatz als die bestehenden Fälle (12/25)."
  },
  {
    "id": "r2.aufstellort.12",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Außen- und Innendistanz identisch bei untypischem krummem Mittelwert (Doppeleingabe)",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_ausseneinheit_kernloch": 13.5,
      "distanz_kernloch_innengeraet": 13.5
    },
    "expect": "soft",
    "why": "Beide Werte (13,5 m) liegen unter dem Außen-Soft (15) bzw. knapp unter Innen-Soft (20) - einzeln unauffällig. Zwei unabhängige Strecken (außen bis Kernloch, Kernloch bis Innengerät) mit identischem krummem Wert von je 13,5 m sind statistisch praktisch ausgeschlossen und deuten auf versehentliche Übernahme desselben Werts in beide Felder. Anderer (krummer, unauffälliger) Wert als der bestehende 25+25-Fall; die Engine vergleicht die beiden Felder nicht auf Gleichheit."
  },
  {
    "id": "r2.sanitaer.1",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Regendusche=Ja bei genau 0 Duschen ABER vorhandener Badewanne (umgeht die bestehende sanitaer.keine-Regel)",
    "field": "hat_regendusche",
    "values": {
      "hat_regendusche": true,
      "anzahl_duschen": 0,
      "anzahl_badewannen": 2
    },
    "expect": "soft",
    "why": "Die bestehende Regel regendusche.ohneDusche (duschen===0) feuert zwar, aber der Fall ist hier bewusst so gebaut, dass anzahl_badewannen>0 die zweite Regel sanitaer.keine unterdrueckt - eine Regendusche IST baulich eine Dusche, also muss anzahl_duschen mindestens 1 sein. Logischer Widerspruch: hat_regendusche=true erzwingt anzahl_duschen>=1. Subtil, weil der Pruefer durch die Badewanne abgelenkt 'es gibt ja eine Waschmoeglichkeit' denkt und den Dusch-Widerspruch uebersieht."
  },
  {
    "id": "r2.sanitaer.2",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Mehr Duschen als realistisch pro Bewohner - knapp unter der bestehenden +1-Schwelle aber pro-Kopf absurd",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 8,
      "anzahl_bewohner": 7
    },
    "expect": "soft",
    "why": "Bestehende Regel duschen.ueberBewohner feuert erst bei duschen > bewohner+1 (also ab 9 bei 7 Bewohnern). 8 Duschen bei 7 Bewohnern rutscht exakt durch (8 = 7+1, nicht > 7+1). In einem Wohngebaeude ist ~1 Dusche pro Person plus eine Gaeste-/Reservedusche schon die Obergrenze; 8 separate Duschen sind fuer einen normalen Haushalt unplausibel hoch und deuten auf Verwechslung mit Wohneinheiten/Zimmern. Gap: die +1-Toleranz ist die einzige Querfeld-Bremse und endet genau hier."
  },
  {
    "id": "r2.sanitaer.3",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Viele Badewannen knapp unter hardMax bei wenigen Bewohnern - umgeht badewannen.ueberBewohner durch Gleichstand-Logik nicht, aber pro-Kopf unplausibel",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 6,
      "anzahl_bewohner": 6
    },
    "expect": "soft",
    "why": "badewannen.ueberBewohner feuert nur bei badewannen > bewohner. 6 Badewannen bei 6 Bewohnern ist exakt gleich und rutscht durch. Eine Badewanne pro Person (6 separate Wannen) ist in einem Wohngebaeude voellig unplausibel - Badewannen sind teurer/platzintensiver als Duschen, real teilen sich Bewohner Baeder. >2-3 Badewannen selbst in grossen Haeusern ist auffaellig. Gap: die Gleichstand-Grenze laesst 1:1-Verhaeltnisse komplett ungeprueft."
  },
  {
    "id": "r2.sanitaer.4",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Badewannen-Anzahl plausibel als versehentlich eingetragene Liter (Einheiten-/Feld-Verwechslung)",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 15,
      "anzahl_bewohner": 4
    },
    "expect": "soft",
    "why": "15 liegt knapp unter hardMax 20, also kein Block. badewannen.ueberBewohner feuert zwar (15>4), fokussiert aber auf das Bewohner-Verhaeltnis. Der eigentliche, uebersehene Defekt: 15 Badewannen ist physisch keine real existierende Badewannen-Zahl in einem Wohngebaeude - typisch ist 0-2. So eine Zahl entsteht fast nur durch Verwechslung (z.B. Badewannen-Fuellvolumen, Quadratmeter Bad, oder Tippfehler). Jede einstellige+ Badewannenzahl >3 ist praktisch immer Eingabefehler, lange bevor die 20er-Wand greift."
  },
  {
    "id": "r2.sanitaer.5",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Hohe Duschanzahl bei nur 1 Bewohner - umgeht +1-Regel-Logik nicht, aber Single-Haushalt-Widerspruch",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 2,
      "anzahl_bewohner": 1
    },
    "expect": "soft",
    "why": "duschen.ueberBewohner verlangt duschen > bewohner+1, also >2 bei 1 Bewohner. 2 Duschen bei 1 Bewohner rutscht exakt durch (2 = 1+1). Fuer einen Ein-Personen-Haushalt sind zwei separate Duschen ungewoehnlich und plausibel ein Hinweis auf falsche Bewohnerzahl oder Verwechslung Dusche/Bad. Die +1-Toleranz wurde fuer Gaeste-WC gedacht, deckt aber 1-Personen-Faelle nicht sinnvoll ab. Subtiler Edge genau an der Schwellen-Kante."
  },
  {
    "id": "r2.sanitaer.6",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Regendusche=Nein, aber Gesamtbild zeigt 0 echte Duschen und nur Badewannen bei vielen Bewohnern (kein Block, kein bestehender Soft)",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "hat_regendusche": false,
      "anzahl_badewannen": 1,
      "anzahl_bewohner": 8
    },
    "expect": "soft",
    "why": "Keine bestehende Regel greift: regendusche.ohneDusche braucht hat_regendusche=true (hier false), sanitaer.keine braucht duschen===0 UND badewannen===0 (hier badewannen=1), badewannen.ueberBewohner braucht badewannen>bewohner (1<8). Resultat: 8 Bewohner teilen sich angeblich eine einzige Badewanne und null Duschen. In modernen Wohngebaeuden ist Duschen Standard; 0 Duschen bei 8 Personen ist hoch unplausibel und deutet auf vergessene Eingabe. Klare Luecke zwischen den drei Einzelregeln."
  },
  {
    "id": "r2.sanitaer.7",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Duschenzahl knapp unter hardMax - plausibler Wert nur fuer Gewerbe/MFH, nicht fuer Einzel-Aufmass",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 12,
      "anzahl_bewohner": 5
    },
    "expect": "soft",
    "why": "12 < hardMax 20 -> kein Block. duschen.ueberBewohner feuert zwar (12>6), aber der uebersehene Kern ist die absolute Groesse: 12 Duschen entsprechen einem Mehrfamilienhaus/Gewerbeobjekt, nicht dem hier erfassten Haushalt mit 5 Bewohnern. Zweistellige Duschzahlen sind fuer ein WP-Einzelaufmass eines Wohngebaeudes praktisch immer ein Datenfehler (verwechselte Wohneinheiten). Die 20er-Hardwall ist viel zu locker fuer realistische Haushalts-Obergrenzen (~3-4)."
  },
  {
    "id": "r2.sanitaer.8",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Badewanne=1 mit Regendusche=Ja und 0 Duschen - Drei-Feld-Widerspruch der die Einzelregeln einzeln nicht alle ausloest",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "hat_regendusche": true,
      "anzahl_badewannen": 1
    },
    "expect": "soft",
    "why": "hat_regendusche=true bei duschen=0 ist baulich unmoeglich (Regendusche ist eine Dusche -> duschen>=1). Die Badewanne=1 ist hier gezielt gesetzt, damit der Pruefer den Sanitaer-Block fuer 'vollstaendig' haelt und den Dusch-Widerspruch durchwinkt. Es bleibt ein harter logischer Konflikt zwischen hat_regendusche und anzahl_duschen, unabhaengig von der Badewanne. Testet, ob die regendusche.ohneDusche-Regel auch mit ablenkender Badewanne robust greift."
  },
  {
    "id": "r2.sanitaer.9",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Sehr viele Duschen UND Badewannen gemeinsam knapp unter den Caps - kumulativ absurde Nasszellen-Zahl",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_duschen": 10,
      "anzahl_badewannen": 10,
      "anzahl_bewohner": 6
    },
    "expect": "soft",
    "why": "Beide Werte (10) liegen unter hardMax 20 -> kein Block. Es gibt KEINE bestehende Regel, die die Summe Duschen+Badewannen gegen die Bewohner oder gegen einen Absolutwert prueft. 20 Nasszellen-Einrichtungen (10 Duschen + 10 Wannen) bei 6 Bewohnern sind physisch fuer ein Wohngebaeude voellig unrealistisch. Die Einzel-Caps fangen jeden Wert fuer sich, aber die kumulative Unplausibilitaet faellt komplett durch das Raster - echte uebersehene Querfeld-Luecke."
  },
  {
    "id": "r2.unbegehbar.1",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Alle Räume gescannt bestätigt, aber zugleich 1 unbegehbarer Raum",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 1,
      "check_raeume_gescannt": true
    },
    "expect": "block",
    "why": "Direkter Querfeld-Widerspruch: Die Checkliste bestätigt 'Wurden alle Räume richtig gescannt?' = ja (Pflicht-true zum Absenden), während hier 1 Raum als NICHT betret-/scanbar deklariert wird. Der Hilfetext des Feldes definiert ausdrücklich '0 = alle Räume gescannt'. Beides gleichzeitig ist logisch unmöglich – entweder wurden alle Räume gescannt (dann 0) oder nicht (dann check_raeume_gescannt darf nicht bestätigt sein)."
  },
  {
    "id": "r2.unbegehbar.2",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Maximalwert 5 unbegehbare Räume bei Checkliste 'alle gescannt'",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 5,
      "check_raeume_gescannt": true
    },
    "expect": "block",
    "why": "Gleicher harter Widerspruch wie bei 1, hier am oberen Rand: 5 nicht scanbare Räume und gleichzeitig die bestätigte Aussage, alle Räume seien gescannt worden. Knapp innerhalb der Grenze (5 ist erlaubt), aber in Kombination mit check_raeume_gescannt=true logisch ausgeschlossen."
  },
  {
    "id": "r2.unbegehbar.3",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "5 unbegehbare Räume in einem Wohngebäude (Aufmaß-Kontext)",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 5
    },
    "expect": "soft",
    "why": "5 ist der erlaubte Maximalwert, aber bei einem Einfamilien-/Wohngebäude-Aufmaß für eine Wärmepumpe sind fünf komplett nicht betret- oder scanbare Räume realitätsfern. So viele unzugängliche Räume bedeuten faktisch ein unbrauchbares Aufmaß und deuten auf Fehlbedienung (z.B. Gesamtraumzahl statt unbegehbarer Räume getippt) hin – sollte hinterfragt werden."
  },
  {
    "id": "r2.unbegehbar.4",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Anzahl Räume bestätigt korrekt, aber unbegehbare Räume offen",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 3,
      "check_anzahl_raeume": true,
      "check_raeume_gescannt": true
    },
    "expect": "block",
    "why": "Querfeld-Widerspruch über zwei Checks: 'Anzahl der Räume stimmt?'=ja UND 'alle Räume gescannt?'=ja, während 3 Räume als unbegehbar markiert sind. Wenn 3 Räume nicht erfasst werden konnten, kann die Vollständigkeit des Scans nicht bestätigt sein. Die Bestätigungen widersprechen der eigenen Eingabe."
  },
  {
    "id": "r2.unbegehbar.5",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unbegehbare Räume deklariert, aber 'alle Bilder vorhanden' bestätigt",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 2,
      "check_alle_bilder": true
    },
    "expect": "soft",
    "why": "Die Sektion rendert pro unbegehbarem Raum eine eigene Foto-Karte ('Bitte Raum benennen und Foto + Quadratmeter angeben'). Bei 2 unbegehbaren Räumen müssen 2 zusätzliche Raumfotos vorliegen. Wird gleichzeitig check_alle_bilder=true bestätigt, ist plausibel zu prüfen, ob die Raumfotos tatsächlich existieren – ansonsten ist die Bilder-Bestätigung inhaltlich falsch."
  },
  {
    "id": "r2.unbegehbar.6",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "4 unbegehbare Räume – knapp unter Maximum, dennoch unplausibel hoch",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 4
    },
    "expect": "soft",
    "why": "4 liegt innerhalb der erlaubten Spanne (0–5), ist aber für ein Wohngebäude weiterhin unplausibel hoch: vier nicht zugängliche Räume entwerten das Aufmaß weitgehend. Häufige Ursache ist die Verwechslung mit der Gesamtraumzahl der Wohnung. Sollte vom Techniker begründet/bestätigt werden, statt still durchzulaufen."
  },
  {
    "id": "r2.unbegehbar.7",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Genau 0 unbegehbar, aber Scan-Bestätigung NICHT gesetzt",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 0,
      "check_raeume_gescannt": false
    },
    "expect": "block",
    "why": "Spiegelbild-Widerspruch: 0 unbegehbare Räume bedeutet laut Feld-Hilfetext 'alle Räume gescannt'. Wenn zugleich die Checkliste 'Wurden alle Räume richtig gescannt?' verneint (false) bzw. unbestätigt bleibt, widersprechen sich Aussage und Eingabe. 0 darf nur gewählt werden, wenn der vollständige Scan tatsächlich bestätigt wird."
  },
  {
    "id": "r2.unbegehbar.8",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Aufstellort-Bestätigung des Kunden trotz unbegehbarem Aufstellraum",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 1,
      "kunde_aufstellort_bestaetigt": true,
      "check_aufstellort_besprochen": true
    },
    "expect": "soft",
    "why": "Wenn der Kunde den Innen-/Außenaufstellort bestätigt (kunde_aufstellort_bestaetigt=true) und der Aufstellort als besprochen markiert ist, aber zugleich ein Raum unbegehbar/nicht scanbar war, ist plausibel zu prüfen, ob der unbegehbare Raum genau der vorgesehene Aufstellraum ist. Dann wäre die Aufstellort-Bestätigung ohne Begehung erfolgt – fachlich fragwürdig und begründungspflichtig."
  },
  {
    "id": "r2.unbegehbar.9",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "3 unbegehbare Räume bei bestätigter vollständiger Heizkörper-Aufnahme",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 3,
      "check_heizkoerper_aufgenommen": true
    },
    "expect": "soft",
    "why": "check_heizkoerper_aufgenommen=true bestätigt, dass alle Heizkörper aufgenommen wurden. Bei 3 nicht betretbaren Räumen können dort vorhandene Heizkörper nicht erfasst worden sein. Die Vollständigkeits-Bestätigung der Heizkörperaufnahme steht damit im Spannungsverhältnis zur Zahl unbegehbarer Räume und sollte hinterfragt werden (relevant für Heizlast/Auslegung)."
  },
  {
    "id": "r2.pv.1",
    "page": "pv",
    "domain": "pv",
    "label": "Aufdachdämmung knapp innerhalb cm-Grenze (55) = mm/cm-Faktor-10 fast am Anschlag",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 55
    },
    "expect": "soft",
    "why": "UI-Label sagt 'Dämmstärke (mm)', Schema/Bounds rechnen in cm (max 60). 55 liegt knapp unter der Bound-Grenze und passiert die Maske, ist aber als 55 cm Aufdachdämmung baulich absurd (über einen halben Meter Aufbau auf dem Sparren). Plausibel nur als 55 mm = 5,5 cm. Der bestehende mm/cm-Fall ist nur bei 30 abgedeckt; ein Wert knapp unter dem Cap rutscht sonst durch."
  },
  {
    "id": "r2.pv.2",
    "page": "pv",
    "domain": "pv",
    "label": "Module auf gleichem Gebäude, aber DC-Kabelweg > 10 m verneint UND Fassade+Dachhaut unmöglich",
    "field": "dc_ueber_10m",
    "values": {
      "module_gleiches_gebaeude": true,
      "dc_fassade_moeglich": false,
      "dc_dachhaut_moeglich": false,
      "dc_ueber_10m": false
    },
    "expect": "soft",
    "why": "Bei gleichem Gebäude entfällt die Gebäude-Entfernung, aber wenn weder Fassade noch Dachhaut als Verlegeweg möglich sind, kann das DC-Kabel vom Dach zum Wechselrichter realistisch nicht unter 10 m bleiben. Der bestehende Fall pv.25 prüft nur Fassade+Dachhaut+dc_ueber_10m ohne den Gebäude-Kontext; diese Kombination mit gleichem Gebäude bleibt ungeprüft."
  },
  {
    "id": "r2.pv.3",
    "page": "pv",
    "domain": "pv",
    "label": "Ziegelneigung 'negativ' mit Neigungsgrad 0° (Widerspruch: negativ heißt vom Null verschieden)",
    "field": "ziegel_neigung_grad",
    "values": {
      "ziegel_neigung": "negativ",
      "ziegel_neigung_grad": 0
    },
    "expect": "soft",
    "why": "Eine als 'negativ' klassifizierte Ziegelneigung beschreibt eine vorhandene Neigung entgegen der Falllinie; 0° bedeutet aber gar keine Neigung. Ein Neigungsgrad von 0 widerspricht der gleichzeitigen Angabe einer negativen Ziegelneigung. Bestehende Fälle prüfen nur Bereich, Trapez/Flachdach und Ziegel>Dachneigung, nicht den 0°-mit-Richtung-Widerspruch."
  },
  {
    "id": "r2.pv.4",
    "page": "pv",
    "domain": "pv",
    "label": "Flachdach (Dachneigung 0°) mit Attika, aber Aufdachdämmung-Faktor egal — Dachneigung 0 + steile Ziegelneigung",
    "field": "ziegel_neigung_grad",
    "values": {
      "dachform": "Flachdach",
      "dachneigung": 0,
      "ziegel_neigung": "positiv",
      "ziegel_neigung_grad": 12
    },
    "expect": "block",
    "why": "Bei Dachneigung 0° (Flachdach) liegt die Eindeckung horizontal; ein Ziegel-Neigungsgrad von 12° überschreitet die Dachneigung und ist auf der waagerechten Fläche geometrisch unmöglich (Ziegelwinkel ≤ Dachneigung). pv.30 deckt nur dachneigung=20/ziegel=35 ab, nicht den Flachdach-Nullfall, und pv.29 stuft Flachdach+Ziegel nur als soft ein, obwohl der Winkel hier ein harter geometrischer Widerspruch ist."
  },
  {
    "id": "r2.pv.5",
    "page": "pv",
    "domain": "pv",
    "label": "Gebäude-Entfernung knapp unter softMax aber für Wohnhaus absurd (199 m zwischen zwei Gebäuden)",
    "field": "gebaeude_entfernung",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": 199,
      "dc_ueber_10m": true
    },
    "expect": "soft",
    "why": "gebaeude_entfernung hat keinen hardMax und keine max-Bound; nur softMax=200. 199 m passiert knapp und konsistent mit dc_ueber_10m=true, ist aber für ein Wohngebäude-PV-Projekt (Module und Wechselrichter ~200 m auseinander) praktisch unrealistisch und bedeutet enorme DC-Leitungsverluste/-kosten. Der bestehende Fall prüft nur 5000 m (>> softMax); ein Wert knapp unter der Schwelle wird nicht erfasst."
  },
  {
    "id": "r2.pv.6",
    "page": "pv",
    "domain": "pv",
    "label": "Dachausrichtung Nord ohne Denkmalschutz (reiner Nord-Ertrag wirtschaftlich fragwürdig)",
    "field": "dachausrichtung",
    "values": {
      "dachausrichtung": "Nord",
      "dachform": "Pultdach",
      "dachneigung": 40
    },
    "expect": "soft",
    "why": "Eine reine Nordausrichtung bei steilem Pultdach (40°) liefert minimalen Jahresertrag und ist für eine PV-Belegung fachlich/wirtschaftlich fragwürdig. pv.24 fängt Nord NUR in Kombination mit Ensembleschutz; die reine Nordausrichtung ohne Denkmal-Auflagen bleibt ungeprüft, obwohl gerade die steile Nordfläche der ertragskritische Fall ist."
  },
  {
    "id": "r2.pv.7",
    "page": "pv",
    "domain": "pv",
    "label": "Trapezdach=true mit Aufdachdämmung-Dicke (Trapezblech + Aufdachdämmung-Sparrenkontext)",
    "field": "ziegel_neigung_grad",
    "values": {
      "trapezdach": true,
      "ziegel_neigung": "positiv",
      "ziegel_neigung_grad": 18
    },
    "expect": "soft",
    "why": "pv.22 prüft Trapezdach mit ziegel_neigung_grad, aber ohne gesetztes ziegel_neigung-Enum. Hier ist zusätzlich ziegel_neigung='positiv' gesetzt: ein Trapezblechdach hat keine Ziegel und damit weder eine positive/negative Ziegelneigung noch einen Neigungsgrad. Die Kombination aus Richtungs-Enum UND Grad auf einem Metalldach verstärkt den Widerspruch und ist als eigene Querfeld-Kombination nicht abgedeckt."
  },
  {
    "id": "r2.pv.8",
    "page": "pv",
    "domain": "pv",
    "label": "Solarthermie vorhanden auf Flachdach mit Module gleiches Gebäude — Belegungs- statt Distanzkonflikt fehlt",
    "field": "solarthermie_vorhanden",
    "values": {
      "solarthermie_vorhanden": true,
      "dachform": "Flachdach",
      "dachausrichtung": "Süd"
    },
    "expect": "soft",
    "why": "pv.21 prüft Solarthermie nur auf Pultdach. Auf einem Flachdach mit Südfläche konkurriert bestehende Solarthermie (Aufständerung) direkt mit der PV-Aufständerung um dieselbe knappe Belegungsfläche und erzeugt zusätzlich gegenseitige Verschattung der aufgeständerten Reihen — ein eigenständiger, nicht erfasster Flächen-/Verschattungskonflikt."
  },
  {
    "id": "r2.pv.9",
    "page": "pv",
    "domain": "pv",
    "label": "Aufdachdämmung=true ohne Dämmstärke, aber Thermodach=false und Denkmalschutz=nein (Pflichtwert fehlt)",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "thermodach": false
    },
    "expect": "soft",
    "why": "Wenn aufdachdaemmung=true gesetzt ist, das Feld aufdachdaemmung_dicke aber leer/0 bleibt, fehlt die für die Montageplanung (Schraubenlänge/Sparrenanker) zwingend nötige Stärke. Bestehende Fälle prüfen nur das Gegenteil (aufdachdaemmung=false mit Dicke) und Thermodach-Doppelung — die fehlende Pflichtdicke bei aktivierter Aufdachdämmung ist nicht abgedeckt."
  },
  {
    "id": "r2.pv.10",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung knapp unter steil-Soft (69°) auf Satteldach — Grenzwert-Reizung des softMax",
    "field": "dachneigung",
    "values": {
      "dachform": "Satteldach",
      "dachneigung": 69
    },
    "expect": "soft",
    "why": "softMax für dachneigung ist 70°; 69° passiert die Soft-Schwelle knapp und löst keinen Hinweis aus, ist aber für ein deutsches Wohn-Satteldach (übliche 35-45°) bereits extrem steil und montagetechnisch grenzwertig (Absturzsicherung, Modulauflast). Die Schwelle 70 ist zu locker kalibriert; Werte 60-69° sollten zumindest als plausibel-zu-prüfen markiert werden statt geräuschlos durchzulaufen."
  },
  {
    "id": "r2.cross_heizung.1",
    "page": "heizung",
    "domain": "wp",
    "label": "Öl-Verbrauch als kWh-Wert interpretiert → bei ×10-Umrechnung physikalisch unmöglich",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "oel",
      "durchschnittsverbrauch_3_jahre": 18000,
      "beheizte_wohnflaeche_m2": 150
    },
    "expect": "block",
    "why": "Bei heizungsart=oel ist die Einheit Liter. 18.000 L/Jahr × 10 kWh/L = 180.000 kWh auf 150 m² ≈ 1200 kWh/m²·a. Das sprengt die physikalische Obergrenze (verbrauchProM2.hardMax 500) um das ~2,4-fache und ist nur sichtbar, wenn man die Heizungsart (Seite Heizungsart, definiert die Einheit Liter) mit Verbrauch und Wohnfläche (Seite Gebäude) zusammen rechnet. Hätte derselbe Zahlenwert als Gas (kWh) gegolten, wäre 120 kWh/m²·a völlig normal — der Widerspruch entsteht erst durch die heizungsart-abhängige Einheit."
  },
  {
    "id": "r2.cross_heizung.2",
    "page": "heizung",
    "domain": "wp",
    "label": "Gas-Verbrauch ohne ×10-Umrechnung → für die Fläche unmöglich niedrig",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 1200,
      "beheizte_wohnflaeche_m2": 180
    },
    "expect": "block",
    "why": "1200 kWh/Jahr (Gas → keine ×10-Umrechnung) auf 180 m² ergeben ~6,7 kWh/m²·a und liegen unter verbrauchProM2.hardMin (10) → block. Wäre der Wert versehentlich als Öl-Liter erfasst (×10 = 12.000 kWh → 66 kWh/m²·a), wäre er plausibel. Der Fehler ist nur durch das Zusammenspiel von Heizungsart (Einheit) und Wohnfläche erkennbar — ein klassischer kWh-vs-Liter-Erfassungsfehler über zwei Seiten."
  },
  {
    "id": "r2.cross_heizung.3",
    "page": "heizung",
    "domain": "wp",
    "label": "Vollsaniertes, junges Gebäude mit unsaniert-typischem Verbrauch",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 42000,
      "beheizte_wohnflaeche_m2": 150,
      "fassade_gedaemmt": true,
      "dach_gedaemmt": true,
      "verglasung": "dreifach_waermeschutz",
      "bauantrag_datum": "2020-03-01"
    },
    "expect": "soft",
    "why": "Fassade+Dach gedämmt, Dreifach-Wärmeschutzverglasung und Bauantrag 2020 (jungesGebaeude) leiten die Energieklasse 'voll_gedaemmt' ab (Soft-Band 25–130 kWh/m²·a). 42.000 kWh Gas auf 150 m² = 280 kWh/m²·a — mehr als das Doppelte der Obergrenze des abgeleiteten Bandes. Der Widerspruch wird erst sichtbar, wenn Dämmung+Verglasung+Gebäudealter (Gebäude/Termin) gemeinsam die erwartete Klasse bestimmen und dann gegen den Verbrauch geprüft wird."
  },
  {
    "id": "r2.cross_heizung.4",
    "page": "heizung",
    "domain": "wp",
    "label": "Unsaniertes Gebäude mit unrealistisch niedrigem spezifischem Verbrauch",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 6000,
      "beheizte_wohnflaeche_m2": 200,
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false,
      "verglasung": "einfach"
    },
    "expect": "soft",
    "why": "Fassade+Dach ungedämmt und Einfachverglasung leiten die Energieklasse 'unsaniert' ab (Soft-Band 90–350 kWh/m²·a). 6000 kWh Gas auf 200 m² = 30 kWh/m²·a — Passivhaus-Niveau, für ein unsaniertes Haus bauphysikalisch unplausibel niedrig. Erkennbar nur, wenn die Dämmungs-/Verglasungsfelder (Gebäude) die Erwartung setzen und mit Verbrauch+Fläche abgeglichen werden."
  },
  {
    "id": "r2.cross_heizung.5",
    "page": "heizung",
    "domain": "wp",
    "label": "Vorlauf 80 °C bei Fußbodenheizung — Heizflächen-Widerspruch über Seiten",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 80,
      "ruecklauftemperatur": 65,
      "heizkoerper_typ": "fussbodenheizung"
    },
    "expect": "soft",
    "why": "Eine Fußbodenheizung (heizkoerper_typ, Seite Heizkörper) ist eine Niedertemperatur-Flächenheizung und wird typisch mit 30–40 °C, max ~45 °C gefahren; 60 °C+ würde den Estrich/Bodenbelag schädigen. 80 °C Vorlauf passt zu einem Alt-Kessel mit Radiatoren, nicht zu FBH. Der Widerspruch entsteht erst aus der Kombination Vorlauftemperatur × Heizkörpertyp — jeder Wert für sich ist gültig (vorlauf.softMaxFbh 45)."
  },
  {
    "id": "r2.cross_heizung.6",
    "page": "heizung",
    "domain": "wp",
    "label": "Einrohrsystem mit Niedertemperatur-Vorlauf — funktioniert hydraulisch kaum",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 35,
      "ruecklauftemperatur": 30,
      "rohrsystem": "einrohr",
      "heizkoerper_typ": "heizkoerper"
    },
    "expect": "soft",
    "why": "Ein Einrohrsystem (rohrsystem, Seite Heizkörper) verliert über die Reihenschaltung der Heizkörper kontinuierlich Vorlauftemperatur; die letzten Heizkörper im Strang bekommen kaum noch Wärme. Mit nur 35 °C Vorlauf an klassischen Heizkörpern (heizkoerper_typ) ist eine ausreichende Beheizung praktisch unmöglich (vorlauf.softMaxEinrohr 45, vorlauf.softMinHeizkoerper 40). Der Konflikt zeigt sich nur über Vorlauf × Rohrsystem × Heizkörpertyp gemeinsam."
  },
  {
    "id": "r2.cross_heizung.7",
    "page": "heizung",
    "domain": "wp",
    "label": "Öltank-Bestand größer als 3-Jahres-Verbrauch zulässt — Größenwiderspruch",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "durchschnittsverbrauch_3_jahre": 200,
      "oeltank_liter_gesamt": 5000,
      "oeltank_anzahl": 1,
      "oeltank_liter_aktuell": 0,
      "oeltank_transport_beschreibung": "Keller, enge Treppe",
      "beheizte_wohnflaeche_m2": 200
    },
    "expect": "soft",
    "why": "200 L Heizöl/Jahr (durchschnittsverbrauch_3_jahre bei oel) auf 200 m² = nur ~10 kWh/m²·a, also extrem niedrig, während gleichzeitig ein 5000-L-Tank (oeltank_liter_gesamt) installiert ist — das wäre ein 25-Jahres-Vorrat. Entweder ist der Verbrauch viel zu niedrig erfasst oder die Tankgröße passt nicht zum Haus. Der Widerspruch koppelt Öltank-Daten (Seite Heizungsart/Öl) mit Verbrauch und Fläche (Seite Gebäude)."
  },
  {
    "id": "r2.cross_heizung.8",
    "page": "heizung",
    "domain": "wp",
    "label": "Junges, vollsaniertes Gebäude mit Öl-Hochtemperaturheizung und Heizkörpern bei sehr hohem Vorlauf",
    "field": "vorlauftemperatur",
    "values": {
      "heizungsart": "oel",
      "bauantrag_datum": "2019-06-01",
      "fassade_gedaemmt": true,
      "dach_gedaemmt": true,
      "verglasung": "dreifach_waermeschutz",
      "vorlauftemperatur": 80,
      "ruecklauftemperatur": 60,
      "heizkoerper_typ": "heizkoerper"
    },
    "expect": "soft",
    "why": "Ein 2019 beantragtes, voll gedämmtes Gebäude mit Dreifach-Wärmeschutzverglasung (Gebäude/Termin) hat eine sehr geringe Heizlast und käme mit niedrigem Vorlauf aus. 80 °C Vorlauf (vorlauf.softMaxWp 55) ist für ein solches Gebäude überdimensioniert und passt nicht zur abgeleiteten Energieklasse — die hohe Systemtemperatur widerspricht dem gut gedämmten, jungen Bau. Sichtbar nur durch Dämmung+Alter+Verglasung × Vorlauftemperatur."
  },
  {
    "id": "r2.cross_heizung.9",
    "page": "heizung",
    "domain": "wp",
    "label": "Denkmalgeschütztes Altgebäude mit Verbrauch eines Neubaus",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 4500,
      "beheizte_wohnflaeche_m2": 160,
      "hat_denkmalschutz": true,
      "fassade_gedaemmt": false,
      "verglasung": "einfach",
      "bauantrag_datum": "1905-01-01"
    },
    "expect": "soft",
    "why": "Ein denkmalgeschütztes Gebäude von 1905 mit ungedämmter Fassade und Einfachverglasung (unsaniert-Klasse, Soft-Band 90–350 kWh/m²·a) kann nicht mit 4500 kWh Gas auf 160 m² = ~28 kWh/m²·a auskommen — das ist KfW-Effizienzhaus-Niveau und für einen ungedämmten Altbau unmöglich niedrig. Der Widerspruch verknüpft Denkmalschutz/Bauantragsdatum/Dämmung (Gebäude/Termin) mit Verbrauch und Fläche."
  },
  {
    "id": "r2.cross_heizung.10",
    "page": "heizung",
    "domain": "wp",
    "label": "3-Jahres-Öl-Verbrauch obwohl Heizung neuer als 3 Jahre",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "oel",
      "durchschnittsverbrauch_3_jahre": 2500,
      "heizung_inbetriebnahme_datum": "2025-01-01",
      "bauantrag_datum": "2024-01-01",
      "heizung_funktionstuechtig": true
    },
    "expect": "soft",
    "why": "Ein belastbarer 3-Jahres-Durchschnittsverbrauch (durchschnittsverbrauch_3_jahre, Seite Gebäude) setzt voraus, dass die Heizung mindestens 3 Jahre läuft. Inbetriebnahme 2025-01-01 (Seite Termin) ist beim aktuellen Datum keine 3 Jahre her, das Gebäude (Bauantrag 2024) ebenfalls nicht — einen echten 3-Jahres-Schnitt kann es noch gar nicht geben. Der Widerspruch entsteht erst aus Verbrauch × Inbetriebnahme-/Bauantragsdatum über die Seiten Gebäude und Termin."
  },
  {
    "id": "r2.cross_gebaeude.1",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Winziges EFH mit zu vielen Bewohnern (3 m²/Person)",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 18,
      "anzahl_bewohner": 6,
      "anzahl_etagen": 1
    },
    "expect": "block",
    "why": "Erst Gebäudeseite (18 m², EFH, 1 Etage) × Bewohnerzahl (6) zusammen ergeben 3 m²/Person — unter dem physikalischen Minimum von 10 m²/Person (flaecheProPerson.hard). Keines der Felder ist für sich verboten; der Widerspruch entsteht nur seitenübergreifend aus Fläche ÷ Bewohner."
  },
  {
    "id": "r2.cross_gebaeude.2",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Riesige Fläche mit nur 1 Bewohner (900 m²/Person)",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 900,
      "anzahl_bewohner": 1,
      "anzahl_etagen": 2
    },
    "expect": "block",
    "why": "900 m² (Gebäudeseite) bei 1 Bewohner ergibt 900 m²/Person, weit über dem harten Maximum von 250 m²/Person (flaecheProPerson.hard). 900 m² allein und 1 Bewohner allein sind je gültig — unmöglich wird erst die Kombination."
  },
  {
    "id": "r2.cross_gebaeude.3",
    "page": "gebaeude",
    "domain": "wp",
    "label": "EFH zu eng besiedelt (15 m²/Person, soft)",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "beheizte_wohnflaeche_m2": 120,
      "anzahl_bewohner": 8,
      "anzahl_etagen": 3
    },
    "expect": "soft",
    "why": "120 m² ÷ 8 Bewohner = 15 m²/Person, unter der weichen Komfortgrenze von 20 m²/Person (flaecheProPerson.eng). Fläche, Bewohner und Etagen sind einzeln plausibel; die enge Belegung zeigt sich nur im Querfeld Fläche×Bewohner."
  },
  {
    "id": "r2.cross_gebaeude.4",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Mehr Badewannen als Bewohner",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 3,
      "anzahl_bewohner": 2,
      "anzahl_duschen": 1
    },
    "expect": "soft",
    "why": "3 Badewannen (Sanitärseite) bei nur 2 Bewohnern (Gebäudeseite) ist unplausibel (badewannen.ueberBewohner). 3 Badewannen sind unter dem Hard-Cap 20 also für sich erlaubt — der Widerspruch entsteht erst im Vergleich Sanitär gegen Bewohnerzahl."
  },
  {
    "id": "r2.cross_gebaeude.5",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Keine Waschmöglichkeit trotz Bewohnern",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "anzahl_badewannen": 0,
      "anzahl_bewohner": 4
    },
    "expect": "soft",
    "why": "0 Duschen UND 0 Badewannen bei 4 Bewohnern bedeutet keine Waschmöglichkeit im bewohnten Haus (sanitaer.keine). Jeweils 0 ist als Einzelwert zulässig; erst beide Sanitärfelder zusammen (und im Lichte der Bewohnerzahl) ergeben den Widerspruch."
  },
  {
    "id": "r2.cross_gebaeude.6",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Regendusche, aber 0 Duschen gezählt",
    "field": "anzahl_duschen",
    "values": {
      "hat_regendusche": true,
      "anzahl_duschen": 0,
      "anzahl_badewannen": 1
    },
    "expect": "soft",
    "why": "Eine Regendusche IST eine Dusche — hat_regendusche=true bei anzahl_duschen=0 ist widersprüchlich (regendusche.ohneDusche). Beide Sanitärfelder sind je gültig; der Konflikt ist nur durch Zusammenschau Regendusche-Flag ↔ Duschenzahl sichtbar."
  },
  {
    "id": "r2.cross_gebaeude.7",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Aufstellort-Distanz gesetzt, aber keine Änderung markiert",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": false,
      "distanz_alter_neuer_aufstellort": 8
    },
    "expect": "soft",
    "why": "Eine Distanz alter→neuer Aufstellort (8 m) ergibt nur Sinn, wenn aufstellort_aenderung=true. Bei false ist die Distanz inhaltlich überflüssig/widersprüchlich (aufstellort.distOhneAenderung). 8 m ist eine gültige Distanz; der Widerspruch liegt im Verhältnis Flag ↔ Distanzfeld."
  },
  {
    "id": "r2.cross_gebaeude.8",
    "page": "gebaeude",
    "domain": "wp",
    "label": "0 Durchbrüche trotz Außeneinheit und Leitungsweg",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 5,
      "distanz_kernloch_innengeraet": 3,
      "anzahl_durchbrueche_kernloch": 0
    },
    "expect": "soft",
    "why": "Ein Leitungsweg Außeneinheit→Kernloch→Innengerät (5 m / 3 m) benötigt mindestens 1 Wanddurchbruch (das Kernloch selbst). 0 Durchbrüche widerspricht den angegebenen Distanzen (durchbrueche.nullTrotzLeitung). Jeder Distanzwert und 0 sind einzeln gültig — der Konflikt entsteht aus allen drei Aufstellort-Feldern zusammen."
  },
  {
    "id": "r2.cross_gebaeude.9",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Heizungsraum nicht verlegen, aber Anschlussdaten ausgefüllt",
    "field": "heizungsraum_verlegen",
    "values": {
      "heizungsraum_verlegen": false,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 5
    },
    "expect": "soft",
    "why": "Anschluss-/Leitungsdaten sind nur relevant, wenn der Heizungsraum verlegt wird. heizungsraum_verlegen=false bei gleichzeitig ausgefüllten Anschlussfeldern ist widersprüchlich (heizungsraum.verlegenNeinTrotzDaten). Die Anschlussfelder sind je gültig; der Konflikt zeigt sich nur gegen das Verlegen-Flag."
  },
  {
    "id": "r2.cross_gebaeude.10",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Verlegen ja, aber alle Anschlüsse als nicht vorhanden",
    "field": "heizungsraum_verlegen",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": false,
      "anschluss_ruecklauf_vorhanden": false,
      "anschluss_warmwasser_vorhanden": false,
      "anschluss_kaltwasser_vorhanden": false,
      "anschluss_zirkulation_vorhanden": false
    },
    "expect": "soft",
    "why": "Wenn der Heizungsraum verlegt wird (heizungsraum_verlegen=true), aber ALLE fünf Leitungen als nicht vorhanden markiert sind, gibt es nichts zu verlegen — Widerspruch (heizungsraum.verlegenJaKeineLeitung). Jedes vorhanden=false ist für sich gültig; erst Verlegen-Flag plus alle fünf Anschlussfelder zusammen ergeben den Konflikt."
  },
  {
    "id": "r2.cross_gebaeude.11",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Zirkulation vorhanden, aber Warmwasser nicht",
    "field": "anschluss_zirkulation_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 3,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 3,
      "anschluss_warmwasser_vorhanden": false,
      "anschluss_warmwasser_distanz": 0,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 3,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 3
    },
    "expect": "soft",
    "why": "Eine Warmwasser-Zirkulationsleitung setzt eine Warmwasserleitung voraus. anschluss_zirkulation_vorhanden=true bei anschluss_warmwasser_vorhanden=false ist hydraulisch widersprüchlich (anschluss.zirkOhneWw). Beide Flags sind je gültig; der Konflikt liegt in der Paarbeziehung Zirkulation ↔ Warmwasser."
  }
];
