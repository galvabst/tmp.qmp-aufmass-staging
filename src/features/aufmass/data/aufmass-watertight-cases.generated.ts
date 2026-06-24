import type { WatertightCase } from './aufmass-watertight-cases';

// AUTOGENERIERT aus Workflow aufmass-watertight-enumerate (Runde 1). Nicht von Hand pflegen.
export const GENERATED_CASES: WatertightCase[] = [
  {
    "id": "techniker.1",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum weit in der Zukunft",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2027-09-15"
    },
    "expect": "block",
    "why": "Ein Vor-Ort-Aufmaßtermin kann nicht mehr als ~1 Jahr in der Zukunft liegen. Bei heute=2026-06-15 ist 2027 unrealistisch fuer einen bereits durchgefuehrten/terminierten Vor-Ort-Termin."
  },
  {
    "id": "techniker.2",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum in ferner Vergangenheit",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2019-03-01"
    },
    "expect": "block",
    "why": "Aufmass-Termin Jahre vor heute (2026) ist kein gueltiges aktuelles Vor-Ort-Aufmass. Datensatz waere offensichtlich falsch erfasst."
  },
  {
    "id": "techniker.3",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum heute leicht in Zukunft (morgen)",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-06-16"
    },
    "expect": "soft",
    "why": "Termin morgen ist theoretisch moeglich (vorab erfasst), aber bei einem Vor-Ort-Aufmass das am Termintag getippt wird unplausibel -> Hinweis statt Hard-Block."
  },
  {
    "id": "techniker.4",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum am Wochenende (Sonntag)",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-06-14"
    },
    "expect": "soft",
    "why": "Sonntag (14.06.2026) ist als Vor-Ort-Termin moeglich aber untypisch im B2B-Aussendienst -> Plausibilitaets-Hinweis."
  },
  {
    "id": "techniker.5",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum gesetzlicher Feiertag",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-12-25"
    },
    "expect": "soft",
    "why": "1. Weihnachtstag ist bundesweiter Feiertag; ein Vor-Ort-Termin ist unwahrscheinlich, aber nicht physikalisch unmoeglich -> soft warnen."
  },
  {
    "id": "techniker.6",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum unmoegliches Kalenderdatum",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-02-30"
    },
    "expect": "block",
    "why": "Der 30. Februar existiert nicht. Ungueltiges Kalenderdatum muss hart abgelehnt werden."
  },
  {
    "id": "techniker.7",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum Monat 13",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-13-05"
    },
    "expect": "block",
    "why": "Monat 13 existiert nicht. Syntaktisch/semantisch ungueltiges Datum."
  },
  {
    "id": "techniker.8",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum leer",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": ""
    },
    "expect": "block",
    "why": "Das Termindatum ist Pflichtfeld fuer das Aufmass-Protokoll und darf nicht leer sein."
  },
  {
    "id": "techniker.9",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum falsches Format (DD.MM.YYYY)",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "15.06.2026"
    },
    "expect": "block",
    "why": "Erwartet wird ISO YYYY-MM-DD. Deutsches Format DD.MM.YYYY ist ein Formatfehler und nicht parsebar als ISO-Datum."
  },
  {
    "id": "techniker.10",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum mit Uhrzeit statt reinem Datum",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-06-15T14:30:00"
    },
    "expect": "block",
    "why": "Feld ist ein reines Datum (YYYY-MM-DD). Ein Zeitstempel-Anteil ist ein Formatfehler."
  },
  {
    "id": "techniker.11",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum unplausibles Jahr (Tippfehler)",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "0226-06-15"
    },
    "expect": "block",
    "why": "Jahr 0226 ist offensichtlich ein Tippfehler (fehlende/vertauschte Ziffer). Jahr ausserhalb plausibler Spanne (z.B. 2000-2030)."
  },
  {
    "id": "techniker.12",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name leer",
    "field": "techniker_name",
    "values": {
      "techniker_name": ""
    },
    "expect": "block",
    "why": "Der Name des durchfuehrenden Technikers ist Pflichtangabe fuer Nachvollziehbarkeit/Haftung des Aufmasses."
  },
  {
    "id": "techniker.13",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name nur Leerzeichen",
    "field": "techniker_name",
    "values": {
      "techniker_name": "   "
    },
    "expect": "block",
    "why": "Reine Whitespace-Eingabe ist faktisch leer und umgeht eine simple Nicht-Leer-Pruefung -> wie leeres Pflichtfeld behandeln."
  },
  {
    "id": "techniker.14",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name nur ein Zeichen",
    "field": "techniker_name",
    "values": {
      "techniker_name": "A"
    },
    "expect": "soft",
    "why": "Ein einzelner Buchstabe ist kein vollstaendiger Name (Vor- + Nachname erwartet). Theoretisch ein Kuerzel, daher soft."
  },
  {
    "id": "techniker.15",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name enthaelt Ziffern",
    "field": "techniker_name",
    "values": {
      "techniker_name": "Max123 Mustermann"
    },
    "expect": "soft",
    "why": "Ziffern in einem Personennamen sind untypisch und deuten auf Fehleingabe (z.B. Auftragsnummer ins Namensfeld) -> Hinweis."
  },
  {
    "id": "techniker.16",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name ist eine Telefonnummer",
    "field": "techniker_name",
    "values": {
      "techniker_name": "0151 23456789"
    },
    "expect": "block",
    "why": "Eine Telefonnummer im Namensfeld ist eine klare Feldverwechslung; ein Name besteht nicht ausschliesslich aus Ziffern/Telefonzeichen."
  },
  {
    "id": "techniker.17",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name unrealistisch lang",
    "field": "techniker_name",
    "values": {
      "techniker_name": "Maximilianxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    },
    "expect": "soft",
    "why": "Ein Name mit ~100 Zeichen ist praktisch nie real (Pasted Junk/Tastatur-Wiederholung) -> Plausibilitaets-Hinweis."
  },
  {
    "id": "techniker.18",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon leer",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": ""
    },
    "expect": "soft",
    "why": "Erreichbarkeit des Technikers ist wichtig fuer Rueckfragen; leeres Telefon ist unguenstig, aber nicht zwingend technisch unmoeglich -> soft."
  },
  {
    "id": "techniker.19",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon zu kurz",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "12345"
    },
    "expect": "block",
    "why": "5 Ziffern ergeben keine gueltige deutsche Mobil-/Festnetznummer (nationale Rufnummern sind deutlich laenger)."
  },
  {
    "id": "techniker.20",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon unrealistisch lang",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0151234567890123456789"
    },
    "expect": "block",
    "why": "Mehr Ziffern als E.164 erlaubt (max. 15 Stellen inkl. Landesvorwahl). Solche Laenge ist keine gueltige Rufnummer."
  },
  {
    "id": "techniker.21",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon enthaelt Buchstaben",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0151-ABCDEFG"
    },
    "expect": "block",
    "why": "Buchstaben sind in einer deutschen Telefonnummer nicht zulaessig; nur Ziffern, +, Leerzeichen, /, ( ) und - sind erlaubt."
  },
  {
    "id": "techniker.22",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon alles Nullen",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0000000000"
    },
    "expect": "block",
    "why": "Eine reine Null-Folge ist eine Dummy/Pflichtfeld-Umgehung und keine zustellbare Rufnummer."
  },
  {
    "id": "techniker.23",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon nur Vorwahl/Plus ohne Nummer",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "+49"
    },
    "expect": "block",
    "why": "Nur die Laendervorwahl ohne Teilnehmernummer ist keine vollstaendige, anrufbare Nummer."
  },
  {
    "id": "techniker.24",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon mit ungueltiger Laendervorwahl-Doppelung",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "+49 0151 23456789"
    },
    "expect": "soft",
    "why": "Kombination aus +49 UND fuehrender nationaler 0 ist widerspruechlich (die 0 entfaellt bei internationalem Format) -> typischer Eingabefehler, soft."
  },
  {
    "id": "techniker.25",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon ist offensichtlich Datum/Zahl",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "2026-06-15"
    },
    "expect": "block",
    "why": "Ein ISO-Datum im Telefonfeld ist eine Feldverwechslung und keine gueltige Rufnummer."
  },
  {
    "id": "techniker.26",
    "page": "techniker",
    "domain": "wp",
    "label": "Name und Telefon identisch (Copy-Paste-Fehler)",
    "field": "techniker_name",
    "values": {
      "techniker_name": "0151 23456789",
      "techniker_telefon": "0151 23456789"
    },
    "expect": "block",
    "why": "Identischer Telefonnummern-String in beiden Feldern deutet auf versehentliches Kopieren; das Namensfeld enthaelt dann keinen echten Namen."
  },
  {
    "id": "techniker.27",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum vor Firmengruendung / unplausibel alt aber gueltiges Format",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "1999-03-12"
    },
    "expect": "block",
    "why": "Vor-Ort-Termine fuer Waermepumpen-Aufmass koennen nicht vor Existenz der Firma/des digitalen Prozesses liegen. Ein gueltig formatiertes, aber dekadenlang zurueckliegendes Datum ist ein Tippfehler oder Fake."
  },
  {
    "id": "techniker.28",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum Schaltjahr-Scheindatum 29.02. in Nicht-Schaltjahr",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2025-02-29"
    },
    "expect": "block",
    "why": "2025 ist kein Schaltjahr; der 29.02. existiert nicht. Naive String-Pruefung (Monat 1-12, Tag 1-31) laesst das durch, ist aber ein nicht existierendes Kalenderdatum."
  },
  {
    "id": "techniker.29",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum Tag 31 in 30-Tage-Monat",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-04-31"
    },
    "expect": "block",
    "why": "April hat nur 30 Tage. Der 31.04. existiert nicht, wird aber von einfachen Bereichspruefungen (Tag <= 31) faelschlich akzeptiert."
  },
  {
    "id": "techniker.30",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum Tag 00 oder Monat 00",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-06-00"
    },
    "expect": "block",
    "why": "Tag 0 (analog Monat 0) existiert nicht. Format passt oberflaechlich (YYYY-MM-DD), ist aber kein reales Datum."
  },
  {
    "id": "techniker.31",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum mit fuehrenden/zusaetzlichen Ziffern im Jahr (5-stellig)",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "20226-06-10"
    },
    "expect": "block",
    "why": "5-stelliges Jahr durch Vertipper. Liegt ausserhalb jeder realen Jahresangabe und ist kein gueltiges ISO-Datum."
  },
  {
    "id": "techniker.32",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum Jahr 0000 / Null-Datum",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "0000-01-01"
    },
    "expect": "block",
    "why": "Jahr 0000 ist ein typischer Default-/Leer-Platzhalter (z. B. aus DB), kein realer Termin. Muss als unplausibel geblockt werden."
  },
  {
    "id": "techniker.33",
    "page": "techniker",
    "domain": "wp",
    "label": "Thermocheck-Datum Unix-Epoch-Default 1970-01-01",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "1970-01-01"
    },
    "expect": "soft",
    "why": "1970-01-01 ist der klassische Unix-Epoch-Default, der bei nicht gesetzten Datumsfeldern entsteht. Technisch ein gueltiges Datum, aber praktisch nie ein echter Vor-Ort-Termin."
  },
  {
    "id": "techniker.34",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name mit fuehrendem/trailendem Whitespace um echten Namen",
    "field": "techniker_name",
    "values": {
      "techniker_name": "   Max Mustermann   "
    },
    "expect": "soft",
    "why": "Nicht getrimmte Eingabe fuehrt zu inkonsistenten Datensaetzen und doppelten Technikernamen ('Max' vs ' Max'). Sollte getrimmt/normalisiert werden, sonst Datenqualitaetsproblem."
  },
  {
    "id": "techniker.35",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name ist Platzhalter/Testwert",
    "field": "techniker_name",
    "values": {
      "techniker_name": "Test Test"
    },
    "expect": "soft",
    "why": "Offensichtliche Platzhalter wie 'Test', 'asdf', 'xxx', 'Mustermann' deuten auf eine nicht ernst gemeinte Eingabe hin und verfaelschen die Zuordnung des Aufmasses zum verantwortlichen Techniker."
  },
  {
    "id": "techniker.36",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name nur Nachname ohne Vorname",
    "field": "techniker_name",
    "values": {
      "techniker_name": "Mueller"
    },
    "expect": "soft",
    "why": "Ein einzelnes Wort ist als Technikeridentifikation oft mehrdeutig (mehrere 'Mueller' im Team). Fuer eindeutige Provisions-/Auftragszuordnung sollte Vor- und Nachname vorhanden sein."
  },
  {
    "id": "techniker.37",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name mit Sonderzeichen/Emoji",
    "field": "techniker_name",
    "values": {
      "techniker_name": "Max 🔥 Mustermann!!!"
    },
    "expect": "soft",
    "why": "Emojis und haeufende Satzzeichen sind in echten Personennamen ausgeschlossen und deuten auf Spam/Fehleingabe; erschweren Suche und CRM-Sync."
  },
  {
    "id": "techniker.38",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name in Vollversalien (Schreierei/CSV-Import-Artefakt)",
    "field": "techniker_name",
    "values": {
      "techniker_name": "MAX MUSTERMANN"
    },
    "expect": "soft",
    "why": "Durchgehende Grossschreibung ist meist Import-/CapsLock-Artefakt, fuehrt zu Dubletten gegenueber 'Max Mustermann' und sollte normalisiert oder hinterfragt werden."
  },
  {
    "id": "techniker.39",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name ist E-Mail-Adresse statt Name",
    "field": "techniker_name",
    "values": {
      "techniker_name": "max.mustermann@galvanek-bau.de"
    },
    "expect": "block",
    "why": "Eine E-Mail-Adresse (enthaelt @ und Domain) ist kein Personenname. Klassischer Verwechslungs-/Copy-Paste-Fehler aus dem falschen Feld."
  },
  {
    "id": "techniker.40",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon mit Durchwahl-Buchstaben (Vanity-Nummer)",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0800-WAERMEPUMPE"
    },
    "expect": "block",
    "why": "Vanity-/Buchstaben-Rufnummern sind keine waehlbaren technischen Nummern fuer einen Aussendienstler; nicht maschinell waehlbar/zustellbar."
  },
  {
    "id": "techniker.41",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon deutsche Vorwahl aber falsche Stellenzahl (zu wenige Teilnehmerziffern)",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "+49 30 12"
    },
    "expect": "block",
    "why": "Deutsche Rufnummern haben i. d. R. >= 6 Stellen nach der Ortsvorwahl. '+49 30 12' ist syntaktisch eine Vorwahl plus zwei Ziffern und damit keine erreichbare Nummer."
  },
  {
    "id": "techniker.42",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon ist Notruf-/Sondernummer",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "110"
    },
    "expect": "block",
    "why": "Notruf-/Kurzwahlnummern (110, 112, 116117) sind keine persoenlichen Erreichbarkeiten eines Technikers; offensichtliche Fehl-/Scherzeingabe."
  },
  {
    "id": "techniker.43",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon mit Zaehl-/Sequenzmuster (123456789)",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0123456789"
    },
    "expect": "soft",
    "why": "Aufsteigende Ziffernfolge ist ein typischer Dummy-/Fake-Wert; ausserdem ist '0123...' als deutsche Rufnummer (Vorwahl-Logik) unplausibel."
  },
  {
    "id": "techniker.44",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon alle Ziffern identisch (Wiederholungsmuster)",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0171 1111111"
    },
    "expect": "soft",
    "why": "Komplett gleiche Ziffern nach der Vorwahl sind faktisch nie eine echte vergebene Rufnummer und ein klares Platzhalter-/Fake-Signal."
  },
  {
    "id": "techniker.45",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon mit gemischtem Format (Klammern + Slash + Bindestrich uneinheitlich)",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "(0171)/123-45/67 ext.99"
    },
    "expect": "soft",
    "why": "Wild gemischte Trennzeichen plus 'ext.' sind keine normalisierbare E.164-Nummer; deutet auf Copy-Paste aus Freitext und bricht CRM-/Anwahl-Integrationen."
  },
  {
    "id": "techniker.46",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon ist deutsche Festnetznummer aber mit Mobil-Praefix-Widerspruch",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "0151 30 123456"
    },
    "expect": "soft",
    "why": "'0151' ist ein Mobilfunk-Praefix, danach folgt aber eine Ortsvorwahl-artige '30'-Struktur (Berlin-Festnetz). Die Kombination ist in sich widerspruechlich und keine real vergebene Nummer."
  },
  {
    "id": "techniker.47",
    "page": "techniker",
    "domain": "wp",
    "label": "Querfeld: Thermocheck-Datum am 31.12. mit Jahreswechsel-Tippfehler im Jahr gegenueber 'heute'",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2026-12-31"
    },
    "expect": "soft",
    "why": "Bei Erfassung am 2026-06-15 ist ein Termin Ende Dezember zwar formal in der Zukunft (separat erfasst), in Kombination mit einem Aufmass, das laut Prozess 'heute' stattfindet, ist ein halbes Jahr Vorlauf unplausibel und meist ein Jahres-/Monatsvertipper."
  },
  {
    "id": "techniker.48",
    "page": "techniker",
    "domain": "wp",
    "label": "Querfeld: Telefon-Laendervorwahl widerspricht deutschem Wohngebaeude-Einsatz",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "+1 202 555 0143"
    },
    "expect": "soft",
    "why": "Ein Aussendienst-Techniker fuer Vor-Ort-Aufmass in Deutschland mit US-Rufnummer (+1) ist betrieblich unplausibel; deutet auf Fehl-/Testeingabe statt echter Erreichbarkeit im Feld."
  },
  {
    "id": "techniker.49",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Name enthaelt nur Bindestriche/Apostrophe ohne Buchstaben",
    "field": "techniker_name",
    "values": {
      "techniker_name": "-'--"
    },
    "expect": "block",
    "why": "Namens-Sonderzeichen (Bindestrich, Apostroph) sind nur valide zusammen mit Buchstaben. Ohne jeden Buchstaben ist es kein Name, wuerde aber eine reine 'mind. 2 Zeichen'-Pruefung passieren."
  },
  {
    "id": "techniker.50",
    "page": "techniker",
    "domain": "wp",
    "label": "Techniker-Telefon mit Nachkommastelle / als Dezimalzahl interpretiert",
    "field": "techniker_telefon",
    "values": {
      "techniker_telefon": "1.71123456e8"
    },
    "expect": "block",
    "why": "Wenn die Nummer faelschlich als Number geparst und in Exponentialschreibweise gespeichert/eingegeben wird, gehen fuehrende Nullen verloren und es entsteht keine waehlbare Rufnummer. Einheiten-/Typ-Falle (Telefon ist Text, keine Zahl)."
  },
  {
    "id": "heizung_termin.1",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme in der Zukunft",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2027-03-01"
    },
    "expect": "block",
    "why": "Eine Heizung kann nicht zu einem Datum in der Zukunft in Betrieb gegangen sein. Logisch unmoeglich."
  },
  {
    "id": "heizung_termin.2",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag in der Zukunft",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2028-01-01"
    },
    "expect": "block",
    "why": "Ein bereits bestehendes, bewohntes Gebaeude kann keinen in der Zukunft liegenden Bauantrag/Baujahr haben."
  },
  {
    "id": "heizung_termin.3",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung in Betrieb VOR Bauantrag des Gebaeudes",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "1995-06-01",
      "bauantrag_datum": "2005-04-01"
    },
    "expect": "block",
    "why": "Die Heizung kann nicht eingebaut/in Betrieb genommen sein, bevor das Gebaeude ueberhaupt beantragt/gebaut wurde. Physikalisch unmoeglich."
  },
  {
    "id": "heizung_termin.4",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung-Inbetriebnahme identisch mit Bauantrag (selber Tag)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2010-05-10",
      "bauantrag_datum": "2010-05-10"
    },
    "expect": "soft",
    "why": "Bauantrag und Heizungs-Inbetriebnahme am exakt selben Tag ist unrealistisch - zwischen Genehmigung und fertiger, beheizter Wohnung liegen Monate bis Jahre."
  },
  {
    "id": "heizung_termin.5",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme nur wenige Monate nach Bauantrag",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "2018-01-01",
      "heizung_inbetriebnahme_datum": "2018-03-01"
    },
    "expect": "soft",
    "why": "Zwischen Bauantrag und Inbetriebnahme der Heizung liegen unter ~6 Monaten. Bau (Genehmigung, Rohbau, Ausbau) dauert in der Regel laenger."
  },
  {
    "id": "heizung_termin.6",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme-Jahr unrealistisch frueh",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "1890-01-01"
    },
    "expect": "soft",
    "why": "Eine Zentralheizung mit Inbetriebnahme vor 1950 ist extrem ungewoehnlich; vermutlich Tippfehler im Jahr."
  },
  {
    "id": "heizung_termin.7",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag-Jahr historisch unmoeglich frueh",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "1700-01-01"
    },
    "expect": "soft",
    "why": "Bauantrag/Baujahr vor ~1850 ist fuer ein heute bewohntes Wohngebaeude im Bestand unrealistisch - mit Sicherheit Eingabefehler."
  },
  {
    "id": "heizung_termin.8",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Neugeraet wird ausgetauscht, obwohl funktionstuechtig",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2025-06-01",
      "heizung_funktionstuechtig": true
    },
    "expect": "soft",
    "why": "Eine erst vor wenigen Monaten/unter 2 Jahren in Betrieb genommene, voll funktionstuechtige Heizung gegen eine WP zu tauschen ist hoechst ungewoehnlich (wirtschaftlich/foerderrechtlich). Bei defektem Neugeraet (funktionstuechtig=false) waere es legitim."
  },
  {
    "id": "heizung_termin.9",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Sehr neues Gebaeude soll Bestandsheizung tauschen",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2025-09-01"
    },
    "expect": "soft",
    "why": "Ein erst vor unter 2 Jahren beantragtes Gebaeude hat ueblicherweise eine fabrikneue Anlage; ein Bestandsheizungs-Austausch an einem Neubau ist untypisch und deutet auf falsches Datum."
  },
  {
    "id": "heizung_termin.10",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Fossile Brennstoffe bleiben nach WP-Austausch",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "fossile_brennstoffe_nach_austausch": true
    },
    "expect": "soft",
    "why": "Ziel des Aufmasses ist der Umstieg auf eine Waermepumpe. Verbleibende fossile Brennstoffe nach Austausch widersprechen dem Projektzweck und der GEG-65%-EE-Pflicht; nur als bewusst begruendete Hybrid-Loesung plausibel."
  },
  {
    "id": "heizung_termin.11",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Defekte Heizung, aber fossile Brennstoffe bleiben weiter",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "heizung_funktionstuechtig": false,
      "fossile_brennstoffe_nach_austausch": true
    },
    "expect": "soft",
    "why": "Die Bestandsheizung ist defekt (wird ersetzt), trotzdem sollen nach dem Austausch fossile Brennstoffe bleiben - widerspruechlich, wenn der defekte fossile Erzeuger genau die zu ersetzende Quelle ist."
  },
  {
    "id": "heizung_termin.12",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme-Datum leer / Pflichtfeld nicht ausgefuellt",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": ""
    },
    "expect": "block",
    "why": "Pflichtfeld im Submit-Schema (min(1)). Ohne Inbetriebnahme-Datum laesst sich Alter/Foerderfaehigkeit der Bestandsheizung nicht beurteilen."
  },
  {
    "id": "heizung_termin.13",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag-Datum leer / Pflichtfeld nicht ausgefuellt",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": ""
    },
    "expect": "block",
    "why": "Pflichtfeld im Submit-Schema (min(1)). Ohne Baujahr/Bauantrag fehlt die Basis fuer energetische Klasse und Querfeld-Datumspruefungen."
  },
  {
    "id": "heizung_termin.14",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Ungueltiges Datumsformat",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "31.13.2020"
    },
    "expect": "block",
    "why": "Kein valides ISO-Datum (Monat 13, falsches Format YYYY-MM-DD). Nicht parsebar - alle nachgelagerten Datumspruefungen brechen."
  },
  {
    "id": "heizung_termin.15",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Kalendarisch nicht existierendes Datum",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2010-02-30"
    },
    "expect": "block",
    "why": "Den 30. Februar gibt es nicht. Syntaktisch passt das Muster, semantisch ist es kein realer Tag."
  },
  {
    "id": "heizung_termin.16",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "heizung_funktionstuechtig fehlt (kein Boolean)",
    "field": "heizung_funktionstuechtig",
    "values": {
      "heizung_funktionstuechtig": null
    },
    "expect": "block",
    "why": "Pflicht-Boolean im Submit-Schema. Ohne Angabe ob die Bestandsheizung laeuft, fehlt eine Kerninformation (Dringlichkeit/Foerder-Begruendung)."
  },
  {
    "id": "heizung_termin.17",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "fossile_brennstoffe_nach_austausch fehlt (kein Boolean)",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "fossile_brennstoffe_nach_austausch": null
    },
    "expect": "block",
    "why": "Pflicht-Boolean im Submit-Schema. Die Angabe ist GEG-/foerderrelevant (reine WP vs. Hybrid) und muss gesetzt sein."
  },
  {
    "id": "heizung_termin.18",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme exakt heute (Aufmass-Tag)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2026-06-20",
      "heizung_funktionstuechtig": true
    },
    "expect": "soft",
    "why": "Bestandsheizung angeblich genau am Tag des Vor-Ort-Aufmasses in Betrieb genommen und soll sofort gegen WP getauscht werden - extrem unplausibel, vermutlich falsches Datum."
  },
  {
    "id": "heizung_termin.19",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag exakt heute",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2026-06-20"
    },
    "expect": "soft",
    "why": "Ein Gebaeude, dessen Bauantrag am heutigen Aufmass-Tag gestellt wurde, existiert noch nicht bewohnbar; ein Heizungstausch daran ist unmoeglich/Datum falsch."
  },
  {
    "id": "heizung_termin.20",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Denkmal-/Altbau-Heizung neuer als technisch moeglich relativ zum Bau (Jahr-Tippdreher)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "1965-01-01",
      "heizung_inbetriebnahme_datum": "1925-01-01"
    },
    "expect": "block",
    "why": "Inbetriebnahme 1925 liegt 40 Jahre vor dem Bauantrag 1965 - klassischer Jahr-Tippdreher; Heizung vor Gebaeude ist unmoeglich."
  },
  {
    "id": "heizung_termin.21",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Sehr alte Bestandsheizung an sehr jungem Gebaeude (Querfeld inkonsistent)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "2020-01-01",
      "heizung_inbetriebnahme_datum": "1980-01-01"
    },
    "expect": "block",
    "why": "Heizung (1980) aelter als das Gebaeude (Bauantrag 2020). Die Anlage kann nicht 40 Jahre vor dem Haus laufen - Datumsangaben widerspruechlich."
  },
  {
    "id": "heizung_termin.22",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Negatives / Null-Jahr im Datum",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "0000-01-01"
    },
    "expect": "block",
    "why": "Jahr 0000 ist kein gueltiges Baujahr; entweder Platzhalter/0-Eingabe oder Parserfehler - kein reales Gebaeudealter ableitbar."
  },
  {
    "id": "heizung_termin.23",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme weit vor Bauantrag, beide plausibel einzeln aber Reihenfolge falsch",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2000-01-01",
      "bauantrag_datum": "2015-01-01"
    },
    "expect": "block",
    "why": "Beide Daten fuer sich realistisch, aber Heizung (2000) vor Gebaeude-Bauantrag (2015) - die Querfeld-Reihenfolge ist physikalisch unmoeglich."
  },
  {
    "id": "heizung_termin.24",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bestandsheizung unrealistisch alt (Lebensdauer ueberschritten)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "1965-04-01"
    },
    "expect": "soft",
    "why": "Eine durchgehend betriebene Heizung von >55 Jahren ist technisch extrem unwahrscheinlich; reale Lebensdauer 15-30 Jahre, GEG erzwingt Austausch alter Konstanttemperaturkessel. Tippfehler im Jahr wahrscheinlich."
  },
  {
    "id": "heizung_termin.25",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung defekt UND brandneu (Lebensdauer-Widerspruch)",
    "field": "heizung_funktionstuechtig",
    "values": {
      "heizung_funktionstuechtig": false,
      "heizung_inbetriebnahme_datum": "2025-01-15"
    },
    "expect": "soft",
    "why": "Eine erst vor wenigen Monaten in Betrieb genommene Heizung ist defekt? Garantie/Lebensdauer macht das hoechst unplausibel - eher Tippfehler beim Inbetriebnahmedatum."
  },
  {
    "id": "heizung_termin.26",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme-Jahr = aktuelles Jahr, aber Monat/Tag in Zukunft",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2026-11-30"
    },
    "expect": "block",
    "why": "Datum liegt nach dem Aufmasstag (heute 2026-06-15) obwohl im selben Jahr - eine in der Zukunft in Betrieb genommene Bestandsheizung kann vor Ort nicht existieren."
  },
  {
    "id": "heizung_termin.27",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag historisch vor Konzept des Bauantrags",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "1700-06-01"
    },
    "expect": "soft",
    "why": "Ein formaler Bauantrag/Baugenehmigung im heutigen Sinne existiert in Deutschland erst ab ca. Ende 19. Jh.; ein Datum aus dem 18. Jh. ist fuer den Bauantrag eines bewohnten Wohngebaeudes mit Heizungstausch unplausibel."
  },
  {
    "id": "heizung_termin.28",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung-Inbetriebnahme nach unten verrutscht (Jahr 19xx statt 20xx als Tippdreher)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "2015-03-01",
      "heizung_inbetriebnahme_datum": "1015-03-01"
    },
    "expect": "block",
    "why": "Jahr 1015 ist mittelalterlich und liegt 1000 Jahre vor dem Bauantrag (2015) - klarer Vier-Stellen-Tippfehler, physikalisch unmoeglich."
  },
  {
    "id": "heizung_termin.29",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung deutlich aelter als das Gebaeude moeglich (Heizung vor Bauantrag, beide jung)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "2010-05-01",
      "heizung_inbetriebnahme_datum": "1995-05-01"
    },
    "expect": "block",
    "why": "Die Heizung kann nicht 15 Jahre vor dem Bauantrag des Gebaeudes in Betrieb gegangen sein - es gab das Gebaeude noch nicht (Reihenfolge-Widerspruch ueber Jahre)."
  },
  {
    "id": "heizung_termin.30",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Schaltjahr-Scheinfehler: 29. Februar in Nicht-Schaltjahr",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2019-02-29"
    },
    "expect": "block",
    "why": "2019 ist kein Schaltjahr, der 29.02. existiert nicht - kalendarisch unmoegliches Datum, das eine reine Jahr/Tag-Pruefung uebersieht."
  },
  {
    "id": "heizung_termin.31",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Tag 31 in 30-Tage-Monat",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2005-04-31"
    },
    "expect": "block",
    "why": "Der 31. April existiert nicht (April hat 30 Tage) - kalendarisch ungueltiges Datum."
  },
  {
    "id": "heizung_termin.32",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung funktionstuechtig UND fossil-frei UND Inbetriebnahme jung = kein Austauschgrund",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_funktionstuechtig": true,
      "heizung_inbetriebnahme_datum": "2024-09-01",
      "fossile_brennstoffe_nach_austausch": false
    },
    "expect": "soft",
    "why": "Eine funktionstuechtige, fast neue Heizung gegen eine WP zu tauschen ist wirtschaftlich/foerdertechnisch unplausibel (BEG-Foerderung zielt auf alte/defekte Anlagen) - Verdacht auf Falscheingabe."
  },
  {
    "id": "heizung_termin.33",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag jaehrt sich genau heute in Zukunftsmonat (Datumskomponente nach heute)",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2026-08-01"
    },
    "expect": "block",
    "why": "Bauantrag im selben Jahr aber August liegt nach dem Aufmasstag 15.06.2026 - das Gebaeude des Vor-Ort-Termins kann keinen in der Zukunft liegenden Bauantrag haben."
  },
  {
    "id": "heizung_termin.34",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung exakt am Bauantragstag minus 1 Tag (Heizung vor Fertigstellung)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "2018-06-10",
      "heizung_inbetriebnahme_datum": "2018-06-09"
    },
    "expect": "soft",
    "why": "Heizung einen Tag vor dem Bauantrag in Betrieb - ein Gebaeude wird nach Bauantrag erst gebaut, eine Heizung kann nicht vor/unmittelbar mit dem Antrag schon laufen (Bauzeit fehlt)."
  },
  {
    "id": "heizung_termin.35",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Zwei-/Vierstelliges Jahr abgeschnitten (Jahr 0026 / 0226)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "0026-06-15"
    },
    "expect": "block",
    "why": "Jahr 0026 ist antik und sicher ein abgeschnittenes/falsch getipptes Jahr (gemeint 2026) - liegt zudem weit vor jedem moeglichen Bauantrag."
  },
  {
    "id": "heizung_termin.36",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Fossile Brennstoffe bleiben, obwohl Heizung funktionstuechtig und neu (kein Tauschgrund + Widerspruch zum WP-Ziel)",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "fossile_brennstoffe_nach_austausch": true,
      "heizung_funktionstuechtig": true,
      "heizung_inbetriebnahme_datum": "2023-10-01"
    },
    "expect": "soft",
    "why": "Ziel des Aufmasses ist eine Waermepumpe; bleiben fossile Brennstoffe komplett erhalten und die alte Heizung ist neu und funktioniert, gibt es weder Tauschgrund noch WP-Logik - inkonsistente Gesamtangabe."
  },
  {
    "id": "heizung_termin.37",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme exakt heute + Heizung defekt (am Aufmasstag in Betrieb genommen und kaputt)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2026-06-15",
      "heizung_funktionstuechtig": false
    },
    "expect": "block",
    "why": "Eine am Aufmasstag selbst in Betrieb genommene Bestandsheizung, die zugleich defekt ist, ist widerspruechlich - eine Bestandsheizung wurde in der Vergangenheit installiert, nicht am Termintag."
  },
  {
    "id": "heizung_termin.38",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag und Inbetriebnahme im plausiblen Bereich, aber Heizung >40 Jahre nach Bauantrag bei sehr altem Bau ohne Zwischenheizung-Logik",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "1890-01-01",
      "heizung_inbetriebnahme_datum": "1890-06-01"
    },
    "expect": "soft",
    "why": "Eine 1890 in Betrieb genommene und heute noch zu tauschende Heizung waere >130 Jahre alt - physikalisch ausgeschlossen; entweder Jahr falsch oder es ist nicht die zu tauschende Anlage."
  },
  {
    "id": "heizung_termin.39",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Datum mit Uhrzeit/Zeitzone statt reinem Datum (Format-/Einheitenfalle)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2010-06-15T00:00:00Z"
    },
    "expect": "block",
    "why": "Feld erwartet ein reines Kalenderdatum (YYYY-MM-DD); ein ISO-Zeitstempel mit Uhrzeit/Zeitzone ist ein Formatfehler, der bei naiver Parserlogik zu Zeitzonen-Tagesverschiebung fuehrt."
  },
  {
    "id": "heizung_termin.40",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "US-/getauschtes Datumsformat (Monat/Tag vertauscht)",
    "field": "bauantrag_datum",
    "values": {
      "bauantrag_datum": "2015-13-07"
    },
    "expect": "block",
    "why": "Monat 13 existiert nicht - typischer Fehler durch vertauschtes Tag/Monat (gemeint 07. des 13. = ungueltig); kalendarisch unmoeglich."
  },
  {
    "id": "heizung_termin.41",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung-Inbetriebnahme weit nach heute aber als Plandatum eingetragen",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "2030-01-01"
    },
    "expect": "block",
    "why": "Inbetriebnahme der BESTEHENDEN Heizung 2030 - eine Bestandsanlage kann nicht erst in 4 Jahren in Betrieb gehen; klar zukuenftig und damit unmoeglich."
  },
  {
    "id": "heizung_termin.42",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "fossile_brennstoffe_nach_austausch als String/Zahl statt Boolean",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "fossile_brennstoffe_nach_austausch": "ja"
    },
    "expect": "block",
    "why": "Feld ist boolean; ein String 'ja' (oder 1/0) ist ein Typfehler, der je nach Auswertung als truthy/falsy fehlinterpretiert wird."
  },
  {
    "id": "heizung_termin.43",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "heizung_funktionstuechtig als Zahl statt Boolean",
    "field": "heizung_funktionstuechtig",
    "values": {
      "heizung_funktionstuechtig": 2
    },
    "expect": "block",
    "why": "Boolean-Feld mit Wert 2 ist undefiniert (weder true noch false) - Typ-/Wertebereichsfehler."
  },
  {
    "id": "heizung_termin.44",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Heizung neuer als heute relativ zu Bauantrag ok, aber Inbetriebnahme = Tag der Geburt eines Uralt-Datums (Jahr 1)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "heizung_inbetriebnahme_datum": "0001-01-01"
    },
    "expect": "block",
    "why": "Jahr 1 ist ein typischer Default-/Null-Datumsplatzhalter (z.B. aus leerem Picker) und physikalisch unmoeglich fuer eine Heizungsinbetriebnahme."
  },
  {
    "id": "heizung_termin.45",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag nach Inbetriebnahme nur um Tage, beide neu (Heizung vor Gebaeude bei Neubau)",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "2022-04-20",
      "heizung_inbetriebnahme_datum": "2022-04-25"
    },
    "expect": "soft",
    "why": "Nur 5 Tage zwischen Bauantrag und Heizungs-Inbetriebnahme - die Bauzeit eines Wohngebaeudes (Monate bis Jahre) fehlt, Heizung kann so schnell nach Antrag nicht laufen."
  },
  {
    "id": "gebaeude.1",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Wohnflaeche null oder negativ",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "beheizte_wohnflaeche_m2": 0
    },
    "expect": "block",
    "why": "Eine beheizte Wohnflaeche von 0 oder weniger ist physikalisch unmoeglich - ein zu beheizendes Gebaeude hat zwingend Flaeche > 0."
  },
  {
    "id": "gebaeude.2",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Wohnflaeche absurd klein (EFH)",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 8
    },
    "expect": "soft",
    "why": "8 m2 beheizte Wohnflaeche fuer ein Einfamilienhaus ist unrealistisch klein (real >40 m2); deutet auf Tipp-/Einheitenfehler (z. B. m statt m2)."
  },
  {
    "id": "gebaeude.3",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Wohnflaeche absurd gross (EFH)",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 5000
    },
    "expect": "soft",
    "why": "5000 m2 beheizte Flaeche fuer ein EFH ist baulich unrealistisch (typ. 80-300 m2); wahrscheinlich Einheiten-/Tippfehler oder falscher Gebaeudetyp."
  },
  {
    "id": "gebaeude.4",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Wohnflaeche jenseits jeder Baurealitaet",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "beheizte_wohnflaeche_m2": 100000
    },
    "expect": "block",
    "why": "100.000 m2 beheizte Wohnflaeche sind fuer ein einzelnes Wohngebaeude physikalisch/baulich unmoeglich - klarer Eingabefehler."
  },
  {
    "id": "gebaeude.5",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Bewohnerzahl null",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": 0
    },
    "expect": "soft",
    "why": "0 Bewohner bei einem zu beheizenden Wohngebaeude ist unplausibel (Leerstand untypisch fuer WP-Aufmass); deutet auf vergessene Eingabe."
  },
  {
    "id": "gebaeude.6",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Bewohnerzahl negativ",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": -2
    },
    "expect": "block",
    "why": "Negative Personenanzahl ist logisch unmoeglich."
  },
  {
    "id": "gebaeude.7",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Bewohnerzahl absurd hoch (EFH)",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "anzahl_bewohner": 80
    },
    "expect": "soft",
    "why": "80 Bewohner in einem Einfamilienhaus ist unrealistisch (typ. 1-6); deutet auf Tippfehler oder falschen Gebaeudetyp."
  },
  {
    "id": "gebaeude.8",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Bewohner keine Ganzzahl",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": 3.5
    },
    "expect": "block",
    "why": "Personen sind nur als ganze Zahl zaehlbar - 3,5 Bewohner sind logisch unmoeglich."
  },
  {
    "id": "gebaeude.9",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Etagenzahl null oder negativ",
    "field": "anzahl_etagen",
    "values": {
      "anzahl_etagen": 0
    },
    "expect": "block",
    "why": "Ein Gebaeude hat mindestens 1 Etage; 0 oder negative Etagenzahl ist baulich unmoeglich."
  },
  {
    "id": "gebaeude.10",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Etagenzahl absurd hoch fuer EFH",
    "field": "anzahl_etagen",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "anzahl_etagen": 60
    },
    "expect": "soft",
    "why": "60 Etagen sind kein Einfamilienhaus (typ. 1-3, max ~4); Widerspruch zwischen Geschosszahl und Gebaeudetyp."
  },
  {
    "id": "gebaeude.11",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Etagenzahl keine Ganzzahl",
    "field": "anzahl_etagen",
    "values": {
      "anzahl_etagen": 2.5
    },
    "expect": "block",
    "why": "Etagen werden als ganze Zahl gezaehlt; 2,5 Etagen ist als Feldwert nicht zulaessig (Staffel-/Halbgeschoss wird ganzzahlig gezaehlt)."
  },
  {
    "id": "gebaeude.12",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Ruecklauf hoeher als Vorlauf",
    "field": "ruecklauftemperatur",
    "values": {
      "vorlauftemperatur": 45,
      "ruecklauftemperatur": 55
    },
    "expect": "block",
    "why": "Die Ruecklauftemperatur muss im Heizbetrieb unter der Vorlauftemperatur liegen (Heizkreis gibt Waerme ab); Ruecklauf > Vorlauf ist thermodynamisch unmoeglich."
  },
  {
    "id": "gebaeude.13",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Ruecklauf gleich Vorlauf (keine Spreizung)",
    "field": "ruecklauftemperatur",
    "values": {
      "vorlauftemperatur": 50,
      "ruecklauftemperatur": 50
    },
    "expect": "soft",
    "why": "Spreizung von 0 K bedeutet keine Waermeabgabe im Heizkreis - im realen Betrieb unplausibel (typ. 5-10 K Spreizung)."
  },
  {
    "id": "gebaeude.14",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Spreizung unrealistisch gross",
    "field": "ruecklauftemperatur",
    "values": {
      "vorlauftemperatur": 70,
      "ruecklauftemperatur": 20
    },
    "expect": "soft",
    "why": "50 K Spreizung zwischen Vor- und Ruecklauf ist in Wohngebaeude-Heizkreisen unrealistisch (real 5-15 K); deutet auf Tipp-/Verwechslungsfehler."
  },
  {
    "id": "gebaeude.15",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Vorlauftemperatur physikalisch unmoeglich (>100 C Wasser)",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 130
    },
    "expect": "block",
    "why": "In offenen/druckarmen Wohngebaeude-Heizungen siedet Wasser bei ~100 C; 130 C Vorlauf ist fuer ein WP-Aufmass eines Wohnhauses physikalisch unmoeglich."
  },
  {
    "id": "gebaeude.16",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Vorlauftemperatur zu niedrig (unter Raumtemperatur)",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 12
    },
    "expect": "block",
    "why": "Ein Vorlauf von 12 C liegt unter Raumtemperatur und kann nicht heizen - als Heizungs-Vorlauf unmoeglich."
  },
  {
    "id": "gebaeude.17",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Vorlauf negativ",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": -5
    },
    "expect": "block",
    "why": "Negative Vorlauftemperatur ist als Heizkreis-Vorlauf unmoeglich."
  },
  {
    "id": "gebaeude.18",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Fussbodenheizung mit zu hoher Vorlauftemperatur",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 65
    },
    "expect": "soft",
    "why": "Fussbodenheizungen arbeiten mit niedriger Vorlauftemperatur (typ. 28-40 C, Estrich-Grenze ~55 C); 65 C ist fuer eine FBH unplausibel und WP-untauglich."
  },
  {
    "id": "gebaeude.19",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Ruecklauf physikalisch unmoeglich tief",
    "field": "ruecklauftemperatur",
    "values": {
      "ruecklauftemperatur": -10
    },
    "expect": "block",
    "why": "Negative Heizkreis-Ruecklauftemperatur ist im Heizbetrieb unmoeglich (Frostgrenze, Wasser)."
  },
  {
    "id": "gebaeude.20",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Gasverbrauch unplausibel relativ zur Wohnflaeche",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "beheizte_wohnflaeche_m2": 150,
      "durchschnittsverbrauch_3_jahre": 200
    },
    "expect": "soft",
    "why": "200 kWh/Jahr Gas fuer 150 m2 entspricht ~1,3 kWh/m2a - real liegt der Heizwaermebedarf bei 50-250 kWh/m2a; Wert viel zu klein (vermutlich Einheiten-/Tippfehler)."
  },
  {
    "id": "gebaeude.21",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Gasverbrauch absurd hoch (Liter-statt-kWh-Verwechslung)",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "beheizte_wohnflaeche_m2": 120,
      "durchschnittsverbrauch_3_jahre": 2000000
    },
    "expect": "soft",
    "why": "2.000.000 kWh/Jahr fuer 120 m2 (~16.700 kWh/m2a) ist physikalisch unmoeglich fuer ein Wohnhaus; klassischer Einheiten-/Nullen-Fehler."
  },
  {
    "id": "gebaeude.22",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Oelverbrauch in kWh-Groessenordnung eingetragen",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "oel",
      "beheizte_wohnflaeche_m2": 150,
      "durchschnittsverbrauch_3_jahre": 25000
    },
    "expect": "soft",
    "why": "Bei Oel wird das Feld in Liter/Jahr erwartet; 25.000 Liter/Jahr fuer 150 m2 (~10 l/m2a Heizoel waeren ~1500 l) sind unrealistisch hoch - deutet auf falsche Einheit (kWh statt Liter)."
  },
  {
    "id": "gebaeude.23",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Verbrauch null oder negativ",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "durchschnittsverbrauch_3_jahre": 0
    },
    "expect": "soft",
    "why": "Ein bewohntes, beheiztes Gebaeude hat ueber 3 Jahre einen Verbrauch > 0; 0 (oder negativ) deutet auf fehlende Eingabe oder Fehler."
  },
  {
    "id": "gebaeude.24",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Einfachverglasung gemeldet, aber Verglasung als dreifach Waermeschutz",
    "field": "verglasung",
    "values": {
      "verglasung": "dreifach_waermeschutz",
      "hat_denkmalschutz": true,
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false
    },
    "expect": "soft",
    "why": "Dreifach-Waermeschutzverglasung bei gleichzeitig ungedaemmter Fassade/Dach und Denkmalschutz ist eine seltene, widerspruechliche Kombination - plausibilitaetsverdaechtig."
  },
  {
    "id": "gebaeude.25",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Fussbodenheizung am Einrohrsystem",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "einrohr"
    },
    "expect": "soft",
    "why": "Flaechenheizungen werden praktisch nie als Einrohrsystem ausgefuehrt (Einrohr ist typisch fuer alte Heizkoerper-Strecken); Kombination unplausibel."
  },
  {
    "id": "gebaeude.26",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Solarthermie aktiv, aber Heizungsart sonstige ohne Kontext",
    "field": "hat_solarthermie",
    "values": {
      "hat_solarthermie": true,
      "hat_kamin": false,
      "heizungsart": "sonstige",
      "durchschnittsverbrauch_3_jahre": 0
    },
    "expect": "soft",
    "why": "Solarthermie ja, aber Verbrauch 0 und keine Zusatzwaermequelle - widerspruechliches Bild der Waermeerzeugung, pruefbedürftig."
  },
  {
    "id": "gebaeude.27",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Mehrfamilienhaus mit nur 1 Etage und winziger Flaeche",
    "field": "gebaeudetyp",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "anzahl_etagen": 1,
      "beheizte_wohnflaeche_m2": 60,
      "anzahl_bewohner": 1
    },
    "expect": "soft",
    "why": "Mehrfamilienhaus mit 1 Etage, 60 m2 und 1 Bewohner widerspricht dem Gebaeudetyp (MFH = mehrere Wohneinheiten, mehr Flaeche/Bewohner) - Enum passt nicht zu Kennzahlen."
  },
  {
    "id": "gebaeude.28",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Reihenendhaus-Logik: Bewohner viel hoeher als Flaeche zulaesst",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "reihenhaus",
      "beheizte_wohnflaeche_m2": 40,
      "anzahl_bewohner": 25
    },
    "expect": "soft",
    "why": "25 Bewohner auf 40 m2 (1,6 m2/Person) unterschreitet jede realistische Belegungsdichte deutlich - Querfeld-Widerspruch Flaeche/Bewohner."
  },
  {
    "id": "gebaeude.29",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Heizkoerper mit Niedertemperatur-Vorlauf unplausibel niedrig",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 22
    },
    "expect": "soft",
    "why": "Klassische Heizkoerper benoetigen i. d. R. >35 C Vorlauf um die noetige Leistung abzugeben; 22 C reicht ueber Heizkoerper nicht und ist unplausibel (eher FBH-Wert)."
  },
  {
    "id": "gebaeude.30",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Denkmalschutz mit voll gedaemmter Fassade und Dreifachverglasung",
    "field": "hat_denkmalschutz",
    "values": {
      "hat_denkmalschutz": true,
      "fassade_gedaemmt": true,
      "verglasung": "dreifach_waermeschutz"
    },
    "expect": "soft",
    "why": "Aussendaemmung der Fassade und moderne Dreifach-Waermeschutzverglasung sind bei Denkmalschutz baurechtlich meist unzulaessig/untypisch - Kombination pruefbedürftig."
  },
  {
    "id": "gebaeude.31",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Wohnflaeche keine Zahl (Texteingabe)",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "beheizte_wohnflaeche_m2": "ca. 150"
    },
    "expect": "block",
    "why": "Das Feld erwartet eine Zahl in m2; ein Text-/Freitextwert ist kein gueltiger numerischer Eingabewert."
  },
  {
    "id": "gebaeude.32",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Etagen mehr als Flaeche/Bewohner stuetzen (Hochhaus als EFH)",
    "field": "anzahl_etagen",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "anzahl_etagen": 10,
      "beheizte_wohnflaeche_m2": 90
    },
    "expect": "soft",
    "why": "10 Etagen bei 90 m2 Gesamtflaeche (9 m2/Etage) sind baulich unrealistisch und widersprechen dem Gebaeudetyp EFH."
  },
  {
    "id": "gebaeude.33",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Etagen widersprechen Gebaeudetyp (Reihenhaus 8 Etagen)",
    "field": "anzahl_etagen",
    "values": {
      "gebaeudetyp": "reihenhaus",
      "anzahl_etagen": 8
    },
    "expect": "soft",
    "why": "Reihenhaeuser/Doppelhaushaelften haben real 1-3 (max 4) Vollgeschosse; 8 Etagen ist fuer diesen Gebaeudetyp baulich unrealistisch."
  },
  {
    "id": "gebaeude.34",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Mehrfamilienhaus mit nur 1 Bewohner",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "anzahl_bewohner": 1,
      "beheizte_wohnflaeche_m2": 600
    },
    "expect": "soft",
    "why": "Ein MFH mit 600 m2 und nur 1 Bewohner ist faktisch unbewohnt/unplausibel; MFH impliziert mehrere Haushalte."
  },
  {
    "id": "gebaeude.35",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Wohnflaeche pro Etage absurd klein",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 30,
      "anzahl_etagen": 5
    },
    "expect": "block",
    "why": "30 m2 auf 5 Etagen = 6 m2 Grundflaeche pro Etage; kein bewohnbarer Grundriss, baulich unmoeglich."
  },
  {
    "id": "gebaeude.36",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Extreme Wohnflaeche pro Bewohner",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "beheizte_wohnflaeche_m2": 500,
      "anzahl_bewohner": 1,
      "gebaeudetyp": "einfamilienhaus"
    },
    "expect": "soft",
    "why": "500 m2 fuer 1 Person (>100 m2/Person, real ~40-60) ist sehr unplausibel und deutet auf Tippfehler bei Flaeche oder Bewohnern."
  },
  {
    "id": "gebaeude.37",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Spreizung minimal aber positiv (0,3 K)",
    "field": "ruecklauftemperatur",
    "values": {
      "vorlauftemperatur": 45,
      "ruecklauftemperatur": 44.7
    },
    "expect": "soft",
    "why": "Spreizung von 0,3 K ist hydraulisch unrealistisch; reale Heizkreis-Spreizung liegt bei 5-10 K (WP min. ~3-5 K)."
  },
  {
    "id": "gebaeude.38",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Fussbodenheizung mit zu hoher Spreizung",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 35,
      "ruecklauftemperatur": 20
    },
    "expect": "soft",
    "why": "FBH faehrt typ. 5-7 K Spreizung (VL 35 / RL 28-30); 15 K Spreizung bei FBH ist hydraulisch unrealistisch."
  },
  {
    "id": "gebaeude.39",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Verbrauch ohne heizungsart-Kontext nicht interpretierbar",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "sonstige",
      "durchschnittsverbrauch_3_jahre": 18000
    },
    "expect": "soft",
    "why": "Bei heizungsart=sonstige ist die Einheit (kWh/Liter) undefiniert, der Zahlenwert daher nicht plausibilisierbar -> Klaerung noetig."
  },
  {
    "id": "gebaeude.40",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Gasverbrauch absurd niedrig fuer beheizte Flaeche",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 200,
      "beheizte_wohnflaeche_m2": 150
    },
    "expect": "soft",
    "why": "200 kWh/Jahr fuer 150 m2 entspricht ~1,3 kWh/m2a; physikalisch kann ein beheiztes Haus so wenig nicht verbrauchen (real 60-200 kWh/m2a)."
  },
  {
    "id": "gebaeude.41",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Oelverbrauch unrealistisch hoch (Liter)",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "oel",
      "durchschnittsverbrauch_3_jahre": 50000,
      "beheizte_wohnflaeche_m2": 150
    },
    "expect": "soft",
    "why": "50.000 Liter Heizoel/Jahr fuer 150 m2 (~333 l/m2a, ~3300 kWh/m2a) sprengt jede Realitaet; Tank-/Verbrauchsgrenze ueberschritten."
  },
  {
    "id": "gebaeude.42",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Denkmalschutz mit Dreifach-Waermeschutzverglasung",
    "field": "verglasung",
    "values": {
      "hat_denkmalschutz": true,
      "verglasung": "dreifach_waermeschutz"
    },
    "expect": "soft",
    "why": "Denkmalschutz untersagt i.d.R. den Austausch historischer Fenster gegen moderne Dreifach-Waermeschutzverglasung; Kombination ist denkmalrechtlich unwahrscheinlich."
  },
  {
    "id": "gebaeude.43",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Mehrfamilienhaus mit nur 1 Etage",
    "field": "anzahl_etagen",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "anzahl_etagen": 1
    },
    "expect": "soft",
    "why": "Ein Mehrfamilienhaus mit nur einer Etage widerspricht der Definition (mehrere uebereinanderliegende Wohnungen); mind. 2 Geschosse erwartet."
  },
  {
    "id": "gebaeude.44",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Gewerbe mit 0 Bewohnern als unmoeglich gewertet",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "gewerbe",
      "anzahl_bewohner": 0
    },
    "expect": "soft",
    "why": "anzahl_bewohner 0 ist sonst unmoeglich; bei Gewerbe ggf. legitim (keine Bewohner) - Querfeld-Widerspruch der Pflichtlogik, muss aufgeloest werden."
  },
  {
    "id": "gebaeude.45",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Solarthermie aktiv aber Heizungsart sonstige bereits abgedeckt - hier Kamin-Widerspruch",
    "field": "hat_kamin",
    "values": {
      "hat_kamin": true,
      "heizungsart": "sonstige",
      "hat_solarthermie": false
    },
    "expect": "soft",
    "why": "Kamin als Festbrennstoff-Quelle bei heizungsart=sonstige ohne weitere Angabe laesst Energiebilanz/Verbrauch unbestimmt; Plausi-Pruefung der Hauptheizquelle noetig."
  },
  {
    "id": "gebaeude.46",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Vorlauf unter Ruecklauf nur knapp (negative Spreizung minimal)",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 39.9,
      "ruecklauftemperatur": 40
    },
    "expect": "block",
    "why": "Schon minimal niedrigerer Vorlauf als Ruecklauf ist thermodynamisch unmoeglich (Heizkreis gibt Waerme ab, VL muss > RL sein)."
  },
  {
    "id": "gebaeude.47",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Heizkoerper mit Vorlauf zu niedrig fuer Heizlast",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 28
    },
    "expect": "soft",
    "why": "Klassische Heizkoerper brauchen real ~45-70 C; 28 C VL kann die Heizlast ueber Radiatoren nicht decken -> Eingabe-/Geraetewahl-Widerspruch."
  },
  {
    "id": "gebaeude.48",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Beides (HK+FBH) aber Vorlauf nur fuer FBH",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "beides",
      "vorlauftemperatur": 30
    },
    "expect": "soft",
    "why": "Bei gemischtem System bestimmt der Heizkoerper-Kreis die hoehere VL-Temperatur; 30 C reicht fuer die Radiatoren nicht -> Wert zu niedrig fuer 'beides'."
  },
  {
    "id": "gebaeude.49",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Zweifach-Waermeschutzverglasung doppelt benannt vs einfach-Flag",
    "field": "verglasung",
    "values": {
      "verglasung": "zweifach_waermeschutz",
      "hat_denkmalschutz": true,
      "fassade_gedaemmt": true,
      "dach_gedaemmt": true
    },
    "expect": "soft",
    "why": "Voll energetisch saniertes Gebaeude (gedaemmt + Waermeschutzglas) unter Denkmalschutz ist denkmalrechtlich kaum genehmigungsfaehig; Kombination unplausibel."
  },
  {
    "id": "gebaeude.50",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Anzahl Etagen unrealistisch hoch fuer MFH-Hochhaus-Verwechslung",
    "field": "anzahl_etagen",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "anzahl_etagen": 60,
      "beheizte_wohnflaeche_m2": 400
    },
    "expect": "block",
    "why": "60 Etagen bei 400 m2 = ~6,7 m2 pro Etage; physikalisch unmoeglicher Grundriss (Hochhaus haette tausende m2)."
  },
  {
    "id": "gebaeude.51",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Bewohner pro Etage absurd hoch",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "anzahl_bewohner": 40,
      "anzahl_etagen": 2,
      "beheizte_wohnflaeche_m2": 120
    },
    "expect": "block",
    "why": "40 Bewohner auf 120 m2 (3 m2/Person) ueberschreitet jede Belegungsdichte fuer ein EFH; baulich/hygienisch unmoeglich."
  },
  {
    "id": "gebaeude.52",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Vorlauftemperatur unrealistisch hoch fuer Waermepumpen-Aufmass",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 85,
      "heizkoerper_typ": "heizkoerper"
    },
    "expect": "soft",
    "why": "85 C VL ist fuer eine geplante WP nicht erreichbar/unwirtschaftlich (WP-Grenze meist <=70-75 C); deutet auf veraltetes Kessel-System -> Aufmass-Warnung."
  },
  {
    "id": "gebaeude.53",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Rohrsystem Einrohr mit dreifach Waermeschutz und Niedertemperatur widerspruechlich",
    "field": "rohrsystem",
    "values": {
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 35,
      "heizkoerper_typ": "heizkoerper"
    },
    "expect": "soft",
    "why": "Einrohrsysteme brauchen hohe VL-Temperaturen (Reihenschaltung, Temperaturabfall); 35 C VL mit Heizkoerpern am Einrohr ist hydraulisch unplausibel."
  },
  {
    "id": "gebaeude.54",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Wohnflaeche nicht ganzzahlig-grob aber Nachkommastellen-Unsinn",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "beheizte_wohnflaeche_m2": 0.5
    },
    "expect": "block",
    "why": "0,5 m2 beheizte Wohnflaeche ist kein bewohnbarer Raum; unterschreitet jede reale Mindestraumgroesse."
  },
  {
    "id": "gebaeude.55",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Doppelhaushaelfte mit MFH-typischer Bewohnerzahl",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "doppelhaushaelfte",
      "anzahl_bewohner": 25,
      "beheizte_wohnflaeche_m2": 130
    },
    "expect": "soft",
    "why": "25 Bewohner in einer Doppelhaushaelfte (130 m2) entspricht MFH-Belegung; widerspricht dem Ein-Haushalt-Charakter der DHH."
  },
  {
    "id": "gebaeude.56",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Ruecklauf hoeher als physikalisch sinnvoll (>90 C)",
    "field": "ruecklauftemperatur",
    "values": {
      "ruecklauftemperatur": 95,
      "vorlauftemperatur": 98
    },
    "expect": "block",
    "why": "Ruecklauf 95 C im Wohngebaeude-Heizkreis ist praktisch unmoeglich (Verbruehungs-/Materialgrenze, Wasser nahe Siedepunkt); keine reale Hausheizung."
  },
  {
    "id": "gebaeude.57",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Fassade gedaemmt nein + dach nein + dreifach Waermeschutzglas (Inkonsistenz Saniergrad)",
    "field": "verglasung",
    "values": {
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false,
      "verglasung": "dreifach_waermeschutz",
      "durchschnittsverbrauch_3_jahre": 6000,
      "heizungsart": "gas",
      "beheizte_wohnflaeche_m2": 150
    },
    "expect": "soft",
    "why": "Dreifach-Waermeschutzglas aber komplett ungedaemmte Huelle mit nur 40 kWh/m2a Verbrauch ist energetisch widerspruechlich; Daemmstatus oder Verbrauch falsch."
  },
  {
    "id": "gebaeude.58",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Gewerbe als Gebaeudetyp mit haeuslicher Mini-Flaeche und FBH-Niedertemperatur Plausi",
    "field": "beheizte_wohnflaeche_m2",
    "values": {
      "gebaeudetyp": "gewerbe",
      "beheizte_wohnflaeche_m2": 15
    },
    "expect": "soft",
    "why": "15 m2 beheizte Flaeche fuer ein Gewerbeobjekt ist unrealistisch klein (kaum WP-relevant); deutet auf Eingabefehler der Flaeche."
  },
  {
    "id": "gebaeude.59",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Anzahl Etagen vs Wohnflaeche - Grundflaeche unter Mindestmass",
    "field": "anzahl_etagen",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "anzahl_etagen": 4,
      "beheizte_wohnflaeche_m2": 60
    },
    "expect": "soft",
    "why": "4 Etagen bei 60 m2 = 15 m2 Grundflaeche/Etage; fuer ein EFH ein unrealistischer Turmgrundriss, Etagen oder Flaeche fehlerhaft."
  },
  {
    "id": "gebaeude.60",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Bewohnerzahl absurd hoch trotz kleiner MFH-Flaeche",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "anzahl_bewohner": 500,
      "beheizte_wohnflaeche_m2": 300
    },
    "expect": "soft",
    "why": "500 Bewohner auf 300 m2 (0,6 m2/Person) ist hygienisch/baulich unmoeglich; selbst fuer MFH weit jenseits jeder Belegungsdichte."
  },
  {
    "id": "gebaeude.61",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Solarthermie aktiv aber heizungsart oel mit kWh-Liter-Mix verschleiert",
    "field": "hat_solarthermie",
    "values": {
      "hat_solarthermie": true,
      "hat_kamin": false,
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 0
    },
    "expect": "block",
    "why": "Verbrauch exakt 0 trotz aktiver Hauptheizung (Gas) und Solarthermie-Zusatz ist unmoeglich - Solarthermie deckt nie 100% des Heizbedarfs."
  },
  {
    "id": "gebaeude.62",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Vorlauf und Ruecklauf beide unter Raumtemperatur",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 18,
      "ruecklauftemperatur": 16
    },
    "expect": "block",
    "why": "Ein Heizkreis mit VL 18 C / RL 16 C kann keine Waerme an einen ~20 C warmen Raum abgeben (kuehlt sogar) - als Heizung unmoeglich."
  },
  {
    "id": "gebaeude.63",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Reihenendhaus mit zu vielen Etagen + winziger Flaeche",
    "field": "anzahl_etagen",
    "values": {
      "gebaeudetyp": "reihenendhaus",
      "anzahl_etagen": 6,
      "beheizte_wohnflaeche_m2": 90
    },
    "expect": "soft",
    "why": "6 Etagen bei 90 m2 (15 m2/Etage) widerspricht der typischen 2-3-geschossigen Reihenendhaus-Bauform."
  },
  {
    "id": "heizungsraum.1",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Negative Anschluss-Distanz",
    "field": "anschluss_vorlauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": -3
    },
    "expect": "block",
    "why": "Eine Leitungslänge kann physikalisch nicht negativ sein. Distanz ist als nicht-negative Zahl definiert; jeder Wert < 0 ist unmöglich."
  },
  {
    "id": "heizungsraum.2",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Anschluss-Distanz physikalisch unmöglich (>100 m)",
    "field": "anschluss_ruecklauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 250
    },
    "expect": "block",
    "why": "Innerhalb eines Wohngebäudes ist eine Heizungs-Anschlussleitung von 250 m baulich unmöglich (Hard-Max ~100 m). Über 100 m existiert kein realistisches Einfamilien-/Mehrfamilienhaus-Szenario."
  },
  {
    "id": "heizungsraum.3",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Anschluss-Distanz unplausibel hoch (30–100 m)",
    "field": "anschluss_warmwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 60
    },
    "expect": "soft",
    "why": "60 m Leitungsweg zum neuen Standort ist für ein Wohngebäude sehr unwahrscheinlich (Soft-Max ~30 m), aber bei großem Gebäude theoretisch denkbar. Begründung nötig."
  },
  {
    "id": "heizungsraum.4",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Anschluss vorhanden=true, aber Distanz 0",
    "field": "anschluss_vorlauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 0
    },
    "expect": "soft",
    "why": "Wenn der Anschluss vorhanden ist, aber die Verlege-Distanz 0 m beträgt, liegt der neue Standort exakt am Anschluss — beim Heizungsraum-Verlegen praktisch nie der Fall. Plausibel nur als Sonderfall, Begründung sinnvoll."
  },
  {
    "id": "heizungsraum.5",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Anschluss nicht vorhanden, aber Distanz angegeben",
    "field": "anschluss_kaltwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_kaltwasser_vorhanden": false,
      "anschluss_kaltwasser_distanz": 12
    },
    "expect": "block",
    "why": "Widerspruch: Ein nicht vorhandener Anschluss kann keine Verlege-Distanz haben. vorhanden=false und distanz>0 schließen sich gegenseitig aus."
  },
  {
    "id": "heizungsraum.6",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Heizungsraum NICHT verlegen, aber Anschlussdaten gesetzt",
    "field": "heizungsraum_verlegen",
    "values": {
      "heizungsraum_verlegen": false,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 8
    },
    "expect": "block",
    "why": "Bei heizungsraum_verlegen=false gibt es keinen neuen Standort und keine Anschluss-Verlegung. Gesetzte vorhanden/distanz-Werte sind widersprüchlich (UI löscht sie eigentlich)."
  },
  {
    "id": "heizungsraum.7",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Verlegen=true, Distanz fehlt obwohl vorhanden=true",
    "field": "anschluss_zirkulation_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": null
    },
    "expect": "block",
    "why": "Bei Heizungsraum-Verlegen ist die Distanz für jede Leitung Pflicht. Vorhandener Anschluss ohne Distanzangabe ist unvollständig/ungültig."
  },
  {
    "id": "heizungsraum.8",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Verlegen=true, vorhanden-Auswahl fehlt",
    "field": "anschluss_vorlauf_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": null,
      "anschluss_vorlauf_distanz": 5
    },
    "expect": "block",
    "why": "Bei Heizungsraum-Verlegen muss je Leitung Ja/Nein gewählt sein. Fehlende vorhanden-Auswahl trotz Distanz ist unvollständig."
  },
  {
    "id": "heizungsraum.9",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Distanz ist NaN / keine Zahl",
    "field": "anschluss_vorlauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": "abc"
    },
    "expect": "block",
    "why": "Distanz muss eine echte Zahl sein. Text/NaN (z. B. durch leeres Number()-Parsing) ist kein gültiger Messwert."
  },
  {
    "id": "heizungsraum.10",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Distanz = Infinity",
    "field": "anschluss_ruecklauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 999999999
    },
    "expect": "block",
    "why": "Unendlich große bzw. absurd hohe Distanz ist kein realer Messwert; liegt weit über jeder baulichen Grenze (>100 m)."
  },
  {
    "id": "heizungsraum.11",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Distanz mit unrealistischer Nachkomma-Präzision",
    "field": "anschluss_warmwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 7.4837219
    },
    "expect": "soft",
    "why": "Vor-Ort-Aufmaß wird in 0,5-m-Schritten erfasst (step 0.5). Eine Distanz mit Mikrometer-Präzision deutet auf Fehleingabe; auf sinnvolle Genauigkeit runden."
  },
  {
    "id": "heizungsraum.12",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Vorlauf/Rücklauf-Distanzen stark divergierend",
    "field": "anschluss_ruecklauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 3,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 95
    },
    "expect": "soft",
    "why": "Vorlauf und Rücklauf laufen als Paar zum/vom selben Wärmeerzeuger und werden gemeinsam verlegt. 3 m vs. 95 m ist physikalisch fast immer ein Tippfehler; geringe Differenz ist normal, große nicht."
  },
  {
    "id": "heizungsraum.13",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Zirkulation vorhanden, aber Warmwasser nicht vorhanden",
    "field": "anschluss_zirkulation_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": false,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 6
    },
    "expect": "soft",
    "why": "Eine Warmwasser-Zirkulationsleitung setzt eine Warmwasserleitung voraus — sie zirkuliert das Warmwasser. Zirkulation ohne Warmwasser ist hydraulisch widersprüchlich, in Restfällen aber denkbar."
  },
  {
    "id": "heizungsraum.14",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Kaltwasser-Distanz extrem hoch trotz Wohngebäude",
    "field": "anschluss_kaltwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 45
    },
    "expect": "soft",
    "why": "45 m Kaltwasser-Anschlussweg innerhalb der Verlegung liegt über dem plausiblen Soft-Bereich (~30 m). Bei sehr großem Objekt möglich, sonst Fehleingabe."
  },
  {
    "id": "heizungsraum.15",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Alle Anschlüsse nicht vorhanden trotz Verlegen=true",
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
    "why": "Wenn der Heizungsraum verlegt wird, aber am neuen Standort KEIN einziger Anschluss (auch nicht Vor-/Rücklauf) vorhanden ist, fehlt die heizungsseitige Anbindung komplett — technisch fast unmöglich, deutet auf falsche Erfassung."
  },
  {
    "id": "heizungsraum.16",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Vorlauf vorhanden=false aber Rücklauf vorhanden=true",
    "field": "anschluss_vorlauf_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": false,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 5
    },
    "expect": "soft",
    "why": "Vor- und Rücklauf bilden den geschlossenen Heizkreis und treten praktisch immer gemeinsam auf. Rücklauf vorhanden ohne Vorlauf (oder umgekehrt) ist hydraulisch widersprüchlich."
  },
  {
    "id": "heizungsraum.17",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Distanz exakt am Hard-Limit überschritten",
    "field": "anschluss_vorlauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 100.5
    },
    "expect": "block",
    "why": "Grenzwertfall direkt über dem baulichen Hard-Max (100 m). Jede Anschlussdistanz > 100 m ist im Wohngebäude unmöglich und muss blockiert werden."
  },
  {
    "id": "heizungsraum.18",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Vorlauf vorhanden, aber Ruecklauf nicht vorhanden",
    "field": "anschluss_ruecklauf_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 4,
      "anschluss_ruecklauf_vorhanden": false
    },
    "expect": "block",
    "why": "Ein Heizkreis ist physikalisch ein geschlossener Kreislauf. Vorlauf ohne zugehoerigen Ruecklauf ist hydraulisch unmoeglich - es kann keinen Vorlauf geben, dessen Medium nicht zurueckfliesst. Vorlauf und Ruecklauf treten immer als Paar auf."
  },
  {
    "id": "heizungsraum.19",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Zirkulation vorhanden, aber Warmwasser-Distanz 0 / Warmwasser nur scheinbar da",
    "field": "anschluss_zirkulation_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 3,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 25
    },
    "expect": "soft",
    "why": "Die Zirkulationsleitung laeuft parallel zur Warmwasserleitung zum selben Verbraucher und zurueck. Eine Zirkulations-Distanz, die ein Vielfaches der Warmwasser-Distanz betraegt (25 m vs 3 m), ist baulich unplausibel - beide fuehren zum gleichen Zapfpunkt und sollten in aehnlicher Groessenordnung liegen."
  },
  {
    "id": "heizungsraum.20",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Kaltwasser nicht vorhanden, aber Warmwasser vorhanden",
    "field": "anschluss_kaltwasser_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 5,
      "anschluss_kaltwasser_vorhanden": false
    },
    "expect": "soft",
    "why": "Warmwasser wird aus Kaltwasser erzeugt (Trinkwassererwaermung). Ein Warmwasseranschluss ohne Kaltwasserzulauf ist technisch sinnlos - ohne Kaltwasser-Nachspeisung kann kein Warmwasser bereitet werden. Kaltwasser ist Voraussetzung fuer Warmwasser."
  },
  {
    "id": "heizungsraum.21",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Anschluss-Distanz kleiner als Aufstellort-Verschiebung",
    "field": "anschluss_vorlauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 15,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 2
    },
    "expect": "soft",
    "why": "Wenn der Heizungsraum/Aufstellort um 15 m verlegt wird, muss die neue Vorlaufleitung mindestens diese Strecke ueberbruecken. Eine Anschlussdistanz (2 m) deutlich unter der Aufstellort-Verschiebung (15 m) ist geometrisch widerspruechlich - die Leitung kann nicht kuerzer sein als der zu ueberbrueckende Versatz."
  },
  {
    "id": "heizungsraum.22",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Alle Leitungen exakt identische Distanz ueber alle 5 Leitungen",
    "field": "anschluss_zirkulation_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 10,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 10,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 10,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 10,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 10
    },
    "expect": "soft",
    "why": "Vorlauf/Ruecklauf (Heizkreis), Warm/Kaltwasser (Trinkwasser) und Zirkulation laufen zu unterschiedlichen Verbrauchern bzw. Anschlusspunkten. Exakt identische Distanzen auf den Zentimeter ueber alle 5 voneinander unabhaengigen Leitungen sind real praktisch ausgeschlossen und deuten auf Pauschal-/Dummy-Eingabe hin."
  },
  {
    "id": "heizungsraum.23",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Zirkulation-Distanz, aber Zirkulation nicht vorhanden",
    "field": "anschluss_zirkulation_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_zirkulation_vorhanden": false,
      "anschluss_zirkulation_distanz": 12
    },
    "expect": "soft",
    "why": "Zirkulationsleitung als 'nicht vorhanden' markiert, aber eine Distanz von 12 m eingetragen - Widerspruch. Wenn die Leitung nicht existiert, kann es keine Leitungslaenge geben. (Eigene Pruefung je Leitung, hier konkret Zirkulation.)"
  },
  {
    "id": "heizungsraum.24",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Heizungsraum NICHT verlegen, aber Aufstellort-Aenderung mit Distanz",
    "field": "heizungsraum_verlegen",
    "values": {
      "heizungsraum_verlegen": false,
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 20
    },
    "expect": "soft",
    "why": "Wenn der Aufstellort der Heizung/WP um 20 m verschoben wird, wird faktisch der Heizungsraum verlegt. heizungsraum_verlegen=false bei gleichzeitiger Aufstellort-Aenderung mit erheblicher Distanz ist ein Querfeld-Widerspruch."
  },
  {
    "id": "heizungsraum.25",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Warmwasser-Distanz extrem hoch trotz Wohngebaeude",
    "field": "anschluss_warmwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 45
    },
    "expect": "soft",
    "why": "Eine Warmwasserleitung von 45 m im Wohngebaeude ist hygienisch hochproblematisch (Legionellen, Auskuehlung, Wartezeit) und in einem normalen Wohnhaus baulich kaum darstellbar. Unter dem Hard-Max (100 m), aber klar ueber dem Soft-Max und fuer Warmwasser besonders kritisch - separat zu pruefen, nicht nur Kaltwasser."
  },
  {
    "id": "heizungsraum.26",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Vorlauf vorhanden mit Distanz, aber kein Warm- UND kein Kaltwasser (nur Heizung verlegt?)",
    "field": "anschluss_warmwasser_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 6,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 6,
      "anschluss_warmwasser_vorhanden": false,
      "anschluss_kaltwasser_vorhanden": false
    },
    "expect": "soft",
    "why": "Wird der Heizungsraum verlegt und steht dort die WP, die ueblicherweise auch die Trinkwassererwaermung uebernimmt, fehlen Warm- UND Kaltwasseranschluss vollstaendig. Eine WP-Anlage ohne jeden Trinkwasseranschluss am neuen Standort ist ungewoehnlich - Warmwasserbereitung waere dann nicht moeglich."
  },
  {
    "id": "heizungsraum.27",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Ruecklauf-Distanz deutlich kuerzer als Vorlauf-Distanz (gleicher Trassenweg)",
    "field": "anschluss_ruecklauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 18,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 3
    },
    "expect": "soft",
    "why": "Vorlauf und Ruecklauf eines Heizkreises verlaufen praktisch immer parallel im selben Trassenweg zur selben Heizflaeche. Vorlauf 18 m gegen Ruecklauf 3 m ist hydraulisch unplausibel - beide muessen naeherungsweise gleich lang sein (Differenz nur durch Verlegung im selben Schacht)."
  },
  {
    "id": "heizungsraum.28",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Distanz mit Nachkommastelle feiner als step (z.B. 4.37 m)",
    "field": "anschluss_vorlauf_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 4.37
    },
    "expect": "soft",
    "why": "Das Feld hat step=0.5 (Schaetzwert in Metern bei Vor-Ort-Aufmass). Eine Eingabe wie 4.37 m suggeriert millimetergenaue Messung, die bei einer groben Leitungsweg-Schaetzung nicht moeglich ist - Hinweis auf Zahlendreher oder Fehleingabe."
  },
  {
    "id": "heizungsraum.29",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Zirkulation vorhanden, aber Warmwasser nicht vorhanden (umgekehrte Variante: WW false trotz Zirk true)",
    "field": "anschluss_warmwasser_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 8,
      "anschluss_warmwasser_vorhanden": false
    },
    "expect": "block",
    "why": "Eine Zirkulationsleitung zirkuliert das Warmwasser in einem Ringsystem zurueck zum Speicher. Ohne Warmwasserleitung gibt es nichts zu zirkulieren - eine Zirkulation ohne Warmwasser ist physikalisch unmoeglich. (Haerter als der bereits gelistete Soft-Fall - dies ist die definitive Unmoeglichkeit.)"
  },
  {
    "id": "heizungsraum.30",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Summe aller Leitungsdistanzen physikalisch unmoeglich im Wohngebaeude",
    "field": "anschluss_kaltwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 90,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 90,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 95,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 95,
      "anschluss_zirkulation_vorhanden": true,
      "anschluss_zirkulation_distanz": 95
    },
    "expect": "soft",
    "why": "Jede Einzeldistanz liegt knapp unter dem Hard-Max (100 m) und passiert die Einzelpruefung, aber funf Leitungen von je ~90 m ergeben ueber 450 m Rohrleitung im selben Wohngebaeude - real ausgeschlossen. Die Gleichzeitigkeit mehrerer Maximal-Distanzen ist als Kombination unplausibel."
  },
  {
    "id": "heizungsraum.31",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Aufstellort-Aenderung false, aber Heizungsraum verlegen true mit grossen Distanzen",
    "field": "aufstellort_aenderung",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 20,
      "aufstellort_aenderung": false
    },
    "expect": "soft",
    "why": "Heizungsraum wird verlegt (mit 20 m Leitungsweg), aber aufstellort_aenderung=false. Eine Heizungsraum-Verlegung impliziert eine Aenderung des Aufstellorts der Anlage - die beiden Flags widersprechen sich."
  },
  {
    "id": "heizungsraum.32",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Kaltwasser-Distanz 0 trotz vorhanden=true (eigener Leitungs-Fall)",
    "field": "anschluss_kaltwasser_distanz",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_kaltwasser_vorhanden": true,
      "anschluss_kaltwasser_distanz": 0
    },
    "expect": "soft",
    "why": "Kaltwasser als vorhanden markiert, aber Distanz 0 m. Bei einer Heizungsraum-Verlegung muss jede neu zu verlegende Leitung eine Strecke groesser 0 ueberbruecken, sonst waere keine Verlegung noetig. (Pro-Leitung-Widerspruch, hier Kaltwasser konkret.)"
  },
  {
    "id": "heizungsart.1",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Füllstand größer als Gesamtvolumen",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": 4500
    },
    "expect": "block",
    "why": "Ein Tank kann physikalisch nicht mehr Öl enthalten als sein Gesamtvolumen. Aktueller Füllstand > Gesamtvolumen ist unmöglich."
  },
  {
    "id": "heizungsart.2",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Heizungsart Gas, aber Öltank-Daten ausgefüllt",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "gas",
      "oeltank_liter_gesamt": 2000,
      "oeltank_anzahl": 1,
      "oeltank_liter_aktuell": 1000
    },
    "expect": "block",
    "why": "Öltank-Felder dürfen nur bei heizungsart=oel Werte tragen. Bei Gasheizung gibt es keinen Öltank — widersprüchliche Querfeld-Kombination."
  },
  {
    "id": "heizungsart.3",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Heizungsart sonstige, aber kein Freitext angegeben",
    "field": "heizungsart_sonstige",
    "values": {
      "heizungsart": "sonstige",
      "heizungsart_sonstige": ""
    },
    "expect": "block",
    "why": "Bei heizungsart=sonstige muss die Art präzisiert werden; leerer Text macht die Erfassung nutzlos."
  },
  {
    "id": "heizungsart.4",
    "page": "heizungsart",
    "domain": "wp",
    "label": "heizungsart_sonstige befüllt, obwohl Gas gewählt",
    "field": "heizungsart_sonstige",
    "values": {
      "heizungsart": "gas",
      "heizungsart_sonstige": "Pelletkessel"
    },
    "expect": "block",
    "why": "Das Freitextfeld ist nur bei heizungsart=sonstige zulässig. Bei gas/oel darf es nicht gefüllt sein — widersprüchlich."
  },
  {
    "id": "heizungsart.5",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tankvolumen negativ",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": -2000
    },
    "expect": "block",
    "why": "Ein negatives Tankvolumen existiert physikalisch nicht."
  },
  {
    "id": "heizungsart.6",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tankvolumen null bei Ölheizung",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 0,
      "oeltank_anzahl": 1
    },
    "expect": "block",
    "why": "Eine Ölheizung mit einem Tank kann nicht 0 Liter Gesamtvolumen haben — der Tank hätte kein Fassungsvermögen."
  },
  {
    "id": "heizungsart.7",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Füllstand negativ",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": -100
    },
    "expect": "block",
    "why": "Ein negativer Füllstand ist unmöglich; minimal sind 0 Liter."
  },
  {
    "id": "heizungsart.8",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Anzahl Tanks null oder negativ bei Ölheizung",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 0,
      "oeltank_liter_gesamt": 2000
    },
    "expect": "block",
    "why": "Bei einer Ölheizung muss mindestens 1 Tank vorhanden sein; 0 oder negativ widerspricht dem angegebenen Gesamtvolumen."
  },
  {
    "id": "heizungsart.9",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tankvolumen unrealistisch riesig (Industriemaßstab)",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 500000
    },
    "expect": "soft",
    "why": "500.000 l ist ein Industrie-/Tanklager-Volumen. Im Wohngebäude liegen Hausöltanks praktisch bei max. ~30.000 l — theoretisch denkbar, aber höchst unplausibel."
  },
  {
    "id": "heizungsart.10",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tankvolumen winzig (Kanister statt Tank)",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 20
    },
    "expect": "soft",
    "why": "20 l entspricht einem Kanister, keinem Heiztank. Hausöltanks beginnen praktisch bei ~500 l je Behälter — vermutlich Einheiten-/Tippfehler."
  },
  {
    "id": "heizungsart.11",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Gesamtvolumen passt nicht zur Tankanzahl (zu klein je Tank)",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 10,
      "oeltank_liter_gesamt": 500
    },
    "expect": "soft",
    "why": "10 Tanks mit zusammen nur 500 l ergibt 50 l je Tank — unter jeder realen Batterietankgröße. Querfeld-Inkonsistenz Anzahl/Volumen."
  },
  {
    "id": "heizungsart.12",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Sehr viele Tanks im Wohngebäude",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 50,
      "oeltank_liter_gesamt": 25000
    },
    "expect": "soft",
    "why": "50 Einzeltanks sind im Wohngebäude unrealistisch; typische Batterieanlagen haben 2–6 Behälter. Wahrscheinlich Fehleingabe."
  },
  {
    "id": "heizungsart.13",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Füllstand exakt gleich Gesamtvolumen (keine Expansionsreserve)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 2000,
      "oeltank_liter_aktuell": 2000
    },
    "expect": "soft",
    "why": "Öltanks werden aus Sicherheits-/Expansionsgründen nur zu ~95 % befüllt (Grenzwertgeber stoppt vorher). 100 % Füllung ist praktisch nicht erreichbar."
  },
  {
    "id": "heizungsart.14",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Öltank-Daten gefüllt bei heizungsart=sonstige",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "sonstige",
      "heizungsart_sonstige": "Wärmepumpe",
      "oeltank_liter_gesamt": 1500
    },
    "expect": "block",
    "why": "Öltankfelder gehören ausschließlich zu heizungsart=oel. Bei sonstige (hier sogar Wärmepumpe) ist ein Öltankvolumen widersprüchlich."
  },
  {
    "id": "heizungsart.15",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Nachkommastelle bei Ganzzahl-Literfeld",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 2000.5
    },
    "expect": "block",
    "why": "Tankvolumen ist als Ganzzahl (Liter) definiert; Dezimalwerte sind ein Typ-/Einheitenfehler."
  },
  {
    "id": "heizungsart.16",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Anzahl Tanks mit Dezimalstelle",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 2.5,
      "oeltank_liter_gesamt": 5000
    },
    "expect": "block",
    "why": "Eine Tankanzahl muss ganzzahlig sein; 2,5 Tanks gibt es nicht."
  },
  {
    "id": "heizungsart.17",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Füllstand viel größer als plausibel, aber Gesamt sehr klein – Einheitenverwechslung",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 1000,
      "oeltank_liter_aktuell": 100000
    },
    "expect": "block",
    "why": "Füllstand 100.000 l bei 1.000 l Gesamtvolumen ist unmöglich (>Gesamt) und deutet auf ml/l- oder Einheitenverwechslung."
  },
  {
    "id": "heizungsart.18",
    "page": "heizungsart",
    "domain": "wp",
    "label": "heizungsart leer/nicht gesetzt",
    "field": "heizungsart",
    "values": {
      "heizungsart": ""
    },
    "expect": "block",
    "why": "Die Heizungsart ist Pflicht und steuert die Folgefelder; ohne sie ist die Seite nicht auswertbar."
  },
  {
    "id": "heizungsart.19",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Ungültiger Enum-Wert für heizungsart",
    "field": "heizungsart",
    "values": {
      "heizungsart": "fernwaerme"
    },
    "expect": "block",
    "why": "heizungsart ist auf gas|oel|sonstige beschränkt. Werte außerhalb des Enums (hier 'fernwaerme' statt sonstige+Freitext) sind ungültig."
  },
  {
    "id": "heizungsart.20",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tankvolumen als Text statt Zahl",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": "zweitausend"
    },
    "expect": "block",
    "why": "Das Feld erwartet eine Ganzzahl; ein Textwert ist ein Typfehler und nicht berechenbar."
  },
  {
    "id": "heizungsart.21",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Transport-Beschreibung gefüllt obwohl kein Öl",
    "field": "oeltank_transport_beschreibung",
    "values": {
      "heizungsart": "gas",
      "oeltank_transport_beschreibung": "Tank über Kellertreppe heraustragen"
    },
    "expect": "soft",
    "why": "Eine Öltank-Transportbeschreibung ergibt nur bei heizungsart=oel Sinn. Bei Gas ist sie inhaltlich gegenstandslos."
  },
  {
    "id": "heizungsart.22",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Summe Einzeltankgröße über Anzahl ergibt unmöglich großen Einzeltank",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 1,
      "oeltank_liter_gesamt": 200000
    },
    "expect": "soft",
    "why": "Ein einzelner Hausöltank mit 200.000 l existiert nicht; selbst große Erdtanks liegen weit darunter. Anzahl/Volumen unplausibel."
  },
  {
    "id": "heizungsart.23",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Restmenge plausibel aber Gesamt fehlt",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_aktuell": 800
    },
    "expect": "block",
    "why": "Ein aktueller Füllstand ohne Gesamtvolumen ist nicht prüfbar (kein Bezug); bei Ölheizung muss das Gesamtvolumen vorhanden sein."
  },
  {
    "id": "heizungsart.24",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Mehr Liter aktuell verteilt als Einzeltank fasst (Querfeld)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 3,
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": 2800
    },
    "expect": "soft",
    "why": "Bei 3 Tanks a 1000 L kann ein einzelner Tank nie mehr als 1000 L halten; ein Fuellstand muss sich realistisch auf die Tanks verteilen lassen. 2800 L von 3000 L ist zwar < Gesamt, aber bei ungleicher realer Befuellung grenzwertig - vor allem Indikator pruefen, ob Fuellstand wirklich pro Tankbatterie plausibel ist."
  },
  {
    "id": "heizungsart.25",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Gesamtvolumen nicht durch typische Tankgroesse teilbar",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 2,
      "oeltank_liter_gesamt": 2750
    },
    "expect": "soft",
    "why": "Batterietanks kommen in Standardgroessen (750/1000/1500/2000 L je Tank). 2750 L bei 2 Tanks ergibt 1375 L/Tank - keine reale Tankgroesse. Krummer Wert deutet auf Tippfehler oder Schaetzung statt Ablesung."
  },
  {
    "id": "heizungsart.26",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Heizoel-Tank ueber 5000 L ohne Anzeige als gewerblich/genehmigungspflichtig",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 1,
      "oeltank_liter_gesamt": 9000
    },
    "expect": "soft",
    "why": "Einzelne Wohngebaeude-Oeltanks ueber ~5000 L loesen erhoehte Anforderungen aus (AwSV-Pruefpflicht, oft Tankraum statt Aufstellraum). 9000 L in einem Tank ist fuer ein Einfamilien-Wohngebaeude untypisch gross und plausibilitaetsverdaechtig."
  },
  {
    "id": "heizungsart.27",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Fuellstand impliziert ueber 95% Befuellung (kein Sicherheits-/Grenzwertgeber-Abstand)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": 2970
    },
    "expect": "soft",
    "why": "Oeltanks werden durch den Grenzwertgeber bei ~95% Nennvolumen abgeschaltet; nutzbares Volumen liegt darunter. Ein abgelesener Fuellstand von 99% (2970/3000) ist physikalisch praktisch nicht erreichbar und deutet auf Schaetzfehler."
  },
  {
    "id": "heizungsart.28",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Heizungsart Gas, aber Transport-Beschreibung gefuellt",
    "field": "oeltank_transport_beschreibung",
    "values": {
      "heizungsart": "gas",
      "oeltank_transport_beschreibung": "Tank ueber Kellertreppe rausschaffen"
    },
    "expect": "block",
    "why": "Die Transport-Beschreibung beschreibt die Demontage/den Abtransport des Oeltanks. Bei Gasheizung existiert kein Oeltank, also darf das Feld nicht befuellt sein - eindeutiger Querfeld-Widerspruch."
  },
  {
    "id": "heizungsart.29",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Heizungsart sonstige, aber Oeltank-Transportbeschreibung gefuellt",
    "field": "oeltank_transport_beschreibung",
    "values": {
      "heizungsart": "sonstige",
      "heizungsart_sonstige": "Pelletheizung",
      "oeltank_transport_beschreibung": "2 Tanks im Heizraum"
    },
    "expect": "block",
    "why": "Bei sonstige (hier Pellet) gibt es keinen Oeltank; eine Oeltank-Transportbeschreibung ist sachlich unmoeglich und widerspricht der gewaehlten Heizungsart."
  },
  {
    "id": "heizungsart.30",
    "page": "heizungsart",
    "domain": "wp",
    "label": "heizungsart_sonstige enthaelt 'Oel' / 'Gas' (gehoert in Enum)",
    "field": "heizungsart_sonstige",
    "values": {
      "heizungsart": "sonstige",
      "heizungsart_sonstige": "Oelheizung"
    },
    "expect": "soft",
    "why": "Wenn im Freitext 'Oel' oder 'Gas' steht, wurde der falsche Enum-Zweig gewaehlt - der Wert gehoert in heizungsart=oel bzw. gas. Logischer Widerspruch zwischen Enum und Freitext."
  },
  {
    "id": "heizungsart.31",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Oel gewaehlt, aber alle Oeltank-Mengenfelder leer",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 1,
      "oeltank_liter_gesamt": null,
      "oeltank_liter_aktuell": null
    },
    "expect": "block",
    "why": "Eine Oelheizung ohne jede Tankangabe (Gesamtvolumen UND Fuellstand leer) ist unvollstaendig - ohne Volumen kann weder Restmenge noch Demontageaufwand kalkuliert werden. Pflichtfelder fehlen."
  },
  {
    "id": "heizungsart.32",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tankanzahl angegeben, aber Gesamtvolumen fehlt (Querfeld-Luecke)",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 4,
      "oeltank_liter_gesamt": null
    },
    "expect": "block",
    "why": "Wenn die Tankanzahl erfasst wird, muss auch ein Gesamtvolumen vorliegen; 4 Tanks ohne jegliche Volumenangabe ist eine inkonsistente Teilbefuellung des Datensatzes."
  },
  {
    "id": "heizungsart.33",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Aktueller Fuellstand vorhanden, aber Tankanzahl fehlt/null",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": null,
      "oeltank_liter_gesamt": 2000,
      "oeltank_liter_aktuell": 800
    },
    "expect": "block",
    "why": "Volumen- und Fuellstandsdaten ohne Tankanzahl sind widerspruechlich - es muss mindestens 1 Tank geben, wenn Oelmengen erfasst wurden. Anzahl darf bei Oel nicht NULL/leer sein."
  },
  {
    "id": "heizungsart.34",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Fuellstand 0 L bei aktiver Oelheizung (laufende Heizung leer)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": 0
    },
    "expect": "soft",
    "why": "Ein exakt leerer Tank (0 L) bei einer noch betriebenen Oelheizung ist unplausibel - Restoel ist beim Aufmass praktisch immer vorhanden. Wert 0 deutet auf 'nicht abgelesen' statt echte Messung; relevant fuer Entsorgungskalkulation."
  },
  {
    "id": "heizungsart.35",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Heizungsart_sonstige gefuellt bei heizungsart=oel",
    "field": "heizungsart_sonstige",
    "values": {
      "heizungsart": "oel",
      "heizungsart_sonstige": "Brennwert"
    },
    "expect": "block",
    "why": "Das Freitextfeld ist ausschliesslich fuer den Enum-Wert sonstige bestimmt. Bei oel (analog zum bereits bekannten gas-Fall) darf es nicht befuellt sein - Querfeld-Widerspruch."
  },
  {
    "id": "heizungsart.36",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Mehr Tanks als Gesamtvolumen physisch erlaubt (Mindest-Tankgroesse unterschritten)",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 10,
      "oeltank_liter_gesamt": 1000
    },
    "expect": "soft",
    "why": "10 Tanks bei 1000 L Gesamt ergibt 100 L/Tank - das ist Kanistergroesse, keine realen Heizoel-Tanks (kleinste Batterietanks ~500-750 L). Anzahl und Gesamtvolumen passen physisch nicht zusammen."
  },
  {
    "id": "heizungsart.37",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Fuellstand groesser als nutzbares Volumen aller Tanks zusammen knapp ueberschritten",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 2000,
      "oeltank_liter_aktuell": 1950
    },
    "expect": "soft",
    "why": "Bei 95%-Grenzwertgeber liegt das maximal befuellbare Volumen bei ~1900 L (von 2000 L). 1950 L liegt zwar unter dem Gesamtnennvolumen, aber ueber dem physikalisch befuellbaren Maximum - praktisch unmoeglich."
  },
  {
    "id": "heizungsart.38",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Unrealistisch grosse Tankanzahl ohne entsprechend grosses Gesamtvolumen (Industrie-Indiz)",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 50,
      "oeltank_liter_gesamt": 50000
    },
    "expect": "soft",
    "why": "50 Tanks / 50.000 L ist Tanklager-/Industriemassstab, kein Wohngebaeude. Auch wenn rechnerisch konsistent (1000 L/Tank), sprengt die Anzahl den Kontext eines Wohngebaeude-Aufmasses."
  },
  {
    "id": "heizungsart.39",
    "page": "heizungsart",
    "domain": "wp",
    "label": "heizungsart_sonstige nur Sonderzeichen/Platzhalter",
    "field": "heizungsart_sonstige",
    "values": {
      "heizungsart": "sonstige",
      "heizungsart_sonstige": "-"
    },
    "expect": "soft",
    "why": "Ein Platzhalter wie '-', '?', 'x' oder '.' erfuellt formal die Pflichtfeld-Bedingung, liefert aber keine verwertbare Heizungsart. Inhaltlich leer trotz formal gefuellt."
  },
  {
    "id": "heizungsart.40",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Gesamtvolumen kleiner als aktueller Fuellstand nur durch Tausch der Felder (Einheiten/Vertausch-Falle)",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 800,
      "oeltank_liter_aktuell": 3000
    },
    "expect": "block",
    "why": "Typische Feldvertauschung: Techniker traegt Nennvolumen ins Fuellstandsfeld und umgekehrt. Fuellstand 3000 bei Gesamt 800 ist physikalisch unmoeglich (Variante des Fuellstand>Gesamt, aber als Vertausch-Muster eigenstaendig pruefbar)."
  },
  {
    "id": "heizungsart.41",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Oeltank-Liter mit Tausender-Trennzeichen als Dezimalpunkt fehlinterpretiert",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 3
    },
    "expect": "soft",
    "why": "Eingabe '3.000' (3000 L mit Punkt als Tausendertrenner) wird als 3 L geparst. Ein 3-Liter-Tank ist unmoeglich; Indiz fuer Locale-/Trennzeichen-Falle bei der Zahleneingabe."
  },
  {
    "id": "heizungsart.42",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Aktueller Fuellstand exakt = Gesamt bei mehreren Tanks (Reserve + Verteilung unmoeglich)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 3,
      "oeltank_liter_gesamt": 3000,
      "oeltank_liter_aktuell": 3000
    },
    "expect": "block",
    "why": "Drei Tanks waeren gleichzeitig zu 100% Nennvolumen gefuellt - durch Grenzwertgeber (Abschaltung ~95%) bei jedem einzelnen Tank physikalisch ausgeschlossen. Verschaerfung des Voll-Tank-Falls auf Mehrtank-Batterien."
  },
  {
    "id": "heizungsart.43",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Sehr alter Oeltank impliziert durch Beschreibung, aber Werte deuten Neuzustand - keine Pruefung, aber Restmenge-Logik",
    "field": "oeltank_transport_beschreibung",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 0,
      "oeltank_transport_beschreibung": "Erdtank im Garten, muss ausgebaggert werden"
    },
    "expect": "block",
    "why": "Transportbeschreibung beschreibt einen real existierenden Tank (Erdtank), aber Gesamtvolumen ist 0 - Widerspruch: ein zu transportierender Tank hat zwingend ein Volumen > 0."
  },
  {
    "id": "heizungsart.44",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Heizungsart leer, aber Oeltank-Felder gefuellt",
    "field": "heizungsart",
    "values": {
      "heizungsart": null,
      "oeltank_liter_gesamt": 2000,
      "oeltank_anzahl": 2
    },
    "expect": "block",
    "why": "Oeltank-Daten ohne gesetzte Heizungsart sind logisch unvollstaendig - die Tankdaten implizieren oel, aber das Pflicht-Enum ist leer. Datensatz nicht eindeutig zuordenbar."
  },
  {
    "id": "heizungsart.45",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Fuellstand negativ implizit ueber sehr kleines Gesamt und Restmengenangabe (Einheiten-Mix L/Prozent)",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 2000,
      "oeltank_liter_aktuell": 75
    },
    "expect": "soft",
    "why": "75 als Fuellstand bei 2000 L Gesamt koennte versehentlich '75%' (=1500 L) als Liter eingetragen worden sein. Einheiten-Mix Prozent/Liter erzeugt scheinbar gueltige, aber inhaltlich falsche Restmenge."
  },
  {
    "id": "heizungsart.46",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Oeltank_anzahl extrem hoch (>20) im Wohngebaeude trotz konsistentem Volumen",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 25,
      "oeltank_liter_gesamt": 25000
    },
    "expect": "soft",
    "why": "Ueber ~6-8 Batterietanks (typ. Maximalbatterie) im Wohngebaeude wird selten verbaut; 25 Tanks sind unplausibel und sprengen den Aufstellraum-Kontext eines Wohnhauses."
  },
  {
    "id": "heizkoerper.1",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Einrohr mit Fußbodenheizung physikalisch unmöglich",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "einrohr"
    },
    "expect": "block",
    "why": "Fußbodenheizungen werden grundsätzlich als Tichelmann-/Zweirohr-Verteilung über einen Heizkreisverteiler ausgeführt. Ein echtes Einrohrsystem gibt es bei FBH nicht - die Kombination ist eine Fehleingabe und verfälscht die hydraulische Auslegung der WP."
  },
  {
    "id": "heizkoerper.2",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine FBH mit Heizkörper-typischer Hochtemperatur (>40 Grad)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 55
    },
    "expect": "block",
    "why": "Fußbodenheizung läuft bauartbedingt im Niedertemperaturbereich (typ. 28-38 Grad VL, max ~40 Grad). 55 Grad würde den Estrich/Bodenbelag schädigen und ist für FBH physikalisch unzulässig - hier liegt eine Verwechslung mit Heizkörperauslegung vor."
  },
  {
    "id": "heizkoerper.3",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur über WP-Grenze",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 75
    },
    "expect": "block",
    "why": "Übliche Luft/Wasser- und Sole/Wasser-Wärmepumpen erreichen maximal ~60-65 Grad (Hochtemperatur-WP knapp 70 Grad). 75 Grad VL ist mit einer Wärmepumpe nicht erreichbar - der Wert ist außerhalb des physikalisch möglichen WP-Arbeitsbereichs."
  },
  {
    "id": "heizkoerper.4",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur unrealistisch hoch (Kessel-/Tippfehler)",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 90
    },
    "expect": "block",
    "why": "90 Grad VL gibt es nur bei alten Öl-/Gaskesseln, nie bei einer Wärmepumpe. Bei einer WP-Aufmaß-Erfassung ist dieser Wert ausgeschlossen - klassischer Eingabe-/Verwechslungsfehler."
  },
  {
    "id": "heizkoerper.5",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur unter Raumtemperatur / nahe 0",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 0
    },
    "expect": "block",
    "why": "Eine Heizung mit 0 Grad Vorlauf heizt nicht - der VL muss deutlich über der Raumtemperatur (>20 Grad) liegen, um Wärme abzugeben. 0 Grad ist physikalisch keine Heizungsvorlauftemperatur."
  },
  {
    "id": "heizkoerper.6",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Negative Vorlauftemperatur",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": -10
    },
    "expect": "block",
    "why": "Negative Vorlauftemperatur ist für einen Heizkreis ausgeschlossen (das wäre Kühlbetrieb/Frost). Bei Heizungs-Aufmaß ein unmöglicher Wert - reiner Eingabefehler oder falsches Vorzeichen."
  },
  {
    "id": "heizkoerper.7",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur unplausibel niedrig für Heizkörper",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 25
    },
    "expect": "soft",
    "why": "Klassische Heizkörper brauchen für ausreichende Heizlast meist >40 Grad VL (oft 50-70 Grad im Bestand). 25 Grad VL über Heizkörper deckt die Heizlast in einem unsanierten Gebäude in der Regel nicht - plausibilitätsverdächtig, theoretisch nur bei massiv überdimensionierten HK / Top-Dämmung möglich."
  },
  {
    "id": "heizkoerper.8",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur unrealistisch niedrig (unter sinnvoller Grenze)",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 10
    },
    "expect": "soft",
    "why": "10 Grad VL liegt unter jeder real betriebenen Heizungsauslegung (selbst Bauteilaktivierung läuft bei ~22-28 Grad). So niedrig heizt kein Wohngebäude - deutet auf Tipp-/Einheitenfehler hin."
  },
  {
    "id": "heizkoerper.9",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Heizkörper-Typ 'beides' aber Einrohrsystem für FBH-Anteil widersprüchlich",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "beides",
      "rohrsystem": "einrohr"
    },
    "expect": "soft",
    "why": "Bei 'beides' (HK + FBH gemischt) kann der FBH-Teil kein Einrohr sein; ein durchgängiges Einrohrsystem schließt eine korrekt angebundene Fußbodenheizung aus. Die Kombination ist hydraulisch widersprüchlich und vermutlich falsch erfasst."
  },
  {
    "id": "heizkoerper.10",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur als Nachkomma-/Einheitenfehler (z.B. 5.5 statt 55)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 5.5
    },
    "expect": "block",
    "why": "5,5 Grad ist keine Heizungsvorlauftemperatur (unter Raumtemperatur). Typischer Komma-/Skalierungsfehler beim Eintippen - der reale Wert wäre 55 Grad. Physikalisch unmöglich als VL."
  },
  {
    "id": "heizkoerper.11",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur in Fahrenheit eingegeben",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 130
    },
    "expect": "block",
    "why": "130 'Grad' entspricht keinem WP-Vorlauf in Celsius (>WP-Grenze und sogar >Siedepunkt-Nähe). Häufiger Fall: Fahrenheit statt Celsius eingegeben (130 F ≈ 54 C). In Celsius unmöglich für eine Wärmepumpe."
  },
  {
    "id": "heizkoerper.12",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "FBH mit Einrohr UND Hochtemperatur kombiniert (Mehrfachwiderspruch)",
    "field": "heizkoerper_typ",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 60
    },
    "expect": "block",
    "why": "Dreifacher Widerspruch: FBH wird nie als Einrohr ausgeführt und nie mit 60 Grad VL betrieben (Estrichschaden). Die Kombination ist physikalisch/baulich ausgeschlossen und kann nur Fehleingabe sein."
  },
  {
    "id": "heizkoerper.13",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Heizkörper mit FBH-typischer Niedrigsttemperatur und Einrohr",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 30
    },
    "expect": "soft",
    "why": "Einrohrsysteme haben durch Reihenschaltung ohnehin hohe Auslegungs-VL (oft 70/55). 30 Grad VL über ein Einrohrsystem mit klassischen Heizkörpern reicht hydraulisch/thermisch praktisch nie - sehr unplausibel, deutet auf Erfassungsfehler."
  },
  {
    "id": "heizkoerper.14",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur fehlt / Null bei Typangabe vorhanden",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 0
    },
    "expect": "block",
    "why": "Wenn ein Heizflächentyp erfasst ist, muss eine plausible Vorlauftemperatur >0 vorliegen. 0 Grad als Pflichtfeld-Platzhalter ist keine gültige Auslegungstemperatur und blockiert eine korrekte WP-Dimensionierung."
  },
  {
    "id": "heizkoerper.15",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur exakt = typische Raumtemperatur",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 20
    },
    "expect": "soft",
    "why": "Bei 20 Grad VL = Raumtemperatur findet kein nennenswerter Wärmeübergang statt (Spreizung gegen Raum ~0). Als reale Heizungsauslegung praktisch unbrauchbar - grenzwertig/unplausibel."
  },
  {
    "id": "heizkoerper.16",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauftemperatur absurd hoch (vier-/dreistellig über Siedepunkt)",
    "field": "vorlauftemperatur",
    "values": {
      "vorlauftemperatur": 120
    },
    "expect": "block",
    "why": "120 Grad würde das Heizungswasser im drucklosen/normalen Heizkreis verdampfen lassen und liegt weit über jeder WP- und Wohngebäude-Heizungsauslegung. Physikalisch ausgeschlossen."
  },
  {
    "id": "heizkoerper.17",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Einrohr bei 'beides' mit Niedertemperatur-FBH-Vorlauf",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "beides",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 32
    },
    "expect": "soft",
    "why": "Einrohr-Reihenschaltung benötigt für die hinteren Heizkörper hohe VL; 32 Grad reicht für die HK in einem Einrohrstrang nicht. Kombination 'beides' + Einrohr + 32 Grad ist hydraulisch inkonsistent und vermutlich falsch erfasst."
  },
  {
    "id": "heizkoerper.18",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "FBH zweirohr mit grenzwertig zu hoher VL (38-40C)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 40
    },
    "expect": "soft",
    "why": "Fussbodenheizung wird ueblicherweise mit max. 30-35 C Vorlauf gefahren; 38-40 C liegt am oberen Rand und deutet entweder auf Auslegungsfehler oder falschen Typ hin. Fuer WP-Effizienz unguenstig, daher Plausibilitaetshinweis."
  },
  {
    "id": "heizkoerper.19",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Heizkoerper-Anlage mit FBH-typischem Niedrigvorlauf (32C) zweirohr",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 32
    },
    "expect": "soft",
    "why": "Klassische Heizkoerper liefern bei 32 C kaum noch die noetige Heizlast (Heizflaeche zu klein); so niedriger Vorlauf passt eher zu FBH. Widerspruch Typ vs. Temperatur, evtl. Typ-Verwechslung."
  },
  {
    "id": "heizkoerper.20",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "VL nicht ganzzahlig / unsinnige Nachkommastellen (54.73C)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 54.73
    },
    "expect": "soft",
    "why": "Vorlauftemperatur wird im Feld auf ganze oder halbe Grad geschaetzt/abgelesen; mehrere Nachkommastellen sind unrealistisch praezise und deuten auf Fehleingabe oder Umrechnungsartefakt."
  },
  {
    "id": "heizkoerper.21",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "VL als Kelvin statt Celsius (z.B. 328)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 328
    },
    "expect": "block",
    "why": "328 entspricht 55 C in Kelvin - Einheitenfehler. Als Celsius gelesen weit ueber Siedepunkt und physikalisch unmoeglich fuer ein Heizsystem."
  },
  {
    "id": "heizkoerper.22",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "heizkoerper_typ=beides aber VL nur fuer eine Kreisart sinnvoll",
    "field": "heizkoerper_typ",
    "values": {
      "heizkoerper_typ": "beides",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 55
    },
    "expect": "soft",
    "why": "Bei 'beides' werden HK und FBH meist gemischt gefahren; ein einzelner Vorlauf von 55 C verbrennt eine FBH (max ~35 C) bzw. erfordert eine getrennte Mischerkreis-Regelung. Ein gemeinsamer Hochtemperatur-Vorlauf fuer beide Kreise ist ohne Mischer technisch widerspruechlich."
  },
  {
    "id": "heizkoerper.23",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "rohrsystem gesetzt aber heizkoerper_typ leer",
    "field": "heizkoerper_typ",
    "values": {
      "heizkoerper_typ": "",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 55
    },
    "expect": "block",
    "why": "Rohrsystem und Vorlauftemperatur sind erfasst, aber der grundlegende Heizkoerper-Typ fehlt. Ein vollstaendiges Aufmass braucht die Typangabe; Folgefelder ohne Typ sind inkonsistent."
  },
  {
    "id": "heizkoerper.24",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "rohrsystem leer obwohl HK-Typ Heizkoerper",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "",
      "vorlauftemperatur": 55
    },
    "expect": "soft",
    "why": "Bei vorhandenen Heizkoerpern ist die Unterscheidung Ein-/Zweirohr fuer die WP-Auslegung (hydraulischer Abgleich, erreichbare Spreizung) entscheidend und sollte nicht leer bleiben."
  },
  {
    "id": "heizkoerper.25",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Einrohr mit ungewoehnlich niedrigem Vorlauf (<45C)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 40
    },
    "expect": "soft",
    "why": "Einrohrsysteme haben hohe Reihen-Auskuehlung und brauchen typischerweise hohe Vorlauftemperaturen (55-70 C), damit die letzten Heizkoerper noch tragen. 40 C bei Einrohr ist hydraulisch unplausibel und WP-kritisch."
  },
  {
    "id": "heizkoerper.26",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "VL exakt 100 (Siedepunkt) im geschlossenen Heizsystem",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 100
    },
    "expect": "block",
    "why": "100 C ist der Siedepunkt bei Normaldruck; ein WP-/Heizungsvorlauf erreicht das nicht. Wert ist physikalisch unmoeglich bzw. klarer Tippfehler."
  },
  {
    "id": "heizkoerper.27",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "VL als Promille/Tausenderwert mit Trennzeichen-Verwechslung (550)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 550
    },
    "expect": "block",
    "why": "550 entsteht typisch durch fehlendes Dezimaltrennzeichen (gemeint 55,0). Als reale Vorlauftemperatur weit jenseits jedes Heizsystems - unmoeglich."
  },
  {
    "id": "heizkoerper.28",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "beides + einrohr, Vorlauf passt nur fuer HK-Anteil (60C) - FBH am Einrohr unmoeglich",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "beides",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 60
    },
    "expect": "block",
    "why": "Bei 'beides' muss auch ein FBH-Kreis existieren; FBH wird nie als Einrohr ausgefuehrt. Einrohr fuer den FBH-Anteil ist physikalisch unmoeglich, unabhaengig von der Temperatur."
  },
  {
    "id": "heizkoerper.29",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "VL ganzzahlig aber unter typischer FBH-Untergrenze trotz HK-Typ (18C)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 18
    },
    "expect": "block",
    "why": "18 C Vorlauf liegt unter jeder Heizfunktion fuer Heizkoerper (keine Waermeabgabe bei Raumtemperatur-naehe). Fuer den Typ Heizkoerper unmoeglich als Heizvorlauf."
  },
  {
    "id": "heizkoerper.30",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "FBH zweirohr mit Vorlauf knapp unter Raumtemperatur (19C)",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 19
    },
    "expect": "soft",
    "why": "Auch eine FBH braucht ueber Raumtemperatur liegenden Vorlauf (typisch 25-35 C); 19 C gibt praktisch keine Heizleistung ab. Im Heizbetrieb unplausibel."
  },
  {
    "id": "heizkoerper.31",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "VL als negativer Tippfehler mit fehlendem Vorzeichen-Check kombiniert mit Einrohr-FBH",
    "field": "heizkoerper_typ",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 30
    },
    "expect": "block",
    "why": "Fussbodenheizung an Einrohrsystem ist konstruktiv unmoeglich (FBH immer als verteilter Zweirohr-/Heizkreisverteiler). Selbst bei plausibler 30-C-Temperatur bleibt die Kombination ungueltig."
  },
  {
    "id": "heizkoerper.32",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "VL 35C bei Typ beides + einrohr - doppelter Widerspruch (Niedertemp + Einrohr-FBH)",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "beides",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 35
    },
    "expect": "block",
    "why": "Niedertemperatur 35 C reicht fuer klassische Heizkoerper an Einrohr nicht, und der FBH-Anteil von 'beides' kann nicht als Einrohr existieren. Mehrfacher Querfeld-Widerspruch."
  },
  {
    "id": "elektrik.1",
    "page": "elektrik",
    "domain": "wp",
    "label": "hat_erdung nicht ausgefuellt",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": null
    },
    "expect": "block",
    "why": "Pflichtfeld. Ohne Aussage zum Potentialausgleich/Erdung kann der WP-Elektroanschluss nicht beurteilt werden - leeres Bool ist keine gueltige Aufnahme."
  },
  {
    "id": "elektrik.2",
    "page": "elektrik",
    "domain": "wp",
    "label": "hat_erdung als Freitext statt Bool",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": "vielleicht"
    },
    "expect": "block",
    "why": "Falscher Typ. Feld ist boolean (ja/nein), Freitext wie 'vielleicht'/'unklar' ist kein gueltiger Wert - erzwingt eindeutige Ja/Nein-Entscheidung vor Ort."
  },
  {
    "id": "elektrik.3",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdung fehlt, aber Erdungswiderstand gemessen",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": false,
      "erdungswiderstand_ohm": 12
    },
    "expect": "block",
    "why": "Widerspruch. Wenn keine Erdung vorhanden ist, kann kein Erdungswiderstand gemessen worden sein. Entweder hat_erdung=true oder der Messwert ist falsch."
  },
  {
    "id": "elektrik.4",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdung vorhanden, aber Widerstand exakt 0 Ohm",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": true,
      "erdungswiderstand_ohm": 0
    },
    "expect": "soft",
    "why": "Physikalisch praktisch unmoeglich. Ein realer Erder hat einen Ausbreitungswiderstand > 0; exakt 0 Ohm deutet auf Mess-/Eingabefehler (Klemme nicht angeschlossen, Default-Null)."
  },
  {
    "id": "elektrik.5",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungswiderstand negativ",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": true,
      "erdungswiderstand_ohm": -5
    },
    "expect": "block",
    "why": "Ein Widerstand kann nicht negativ sein - physikalisch unmoeglich, klarer Tippfehler."
  },
  {
    "id": "elektrik.6",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungswiderstand absurd hoch",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": true,
      "erdungswiderstand_ohm": 50000
    },
    "expect": "soft",
    "why": "50 kOhm ist faktisch keine wirksame Erdung mehr (Richtwert Anlagenerder < ~100 Ohm, Fundamenterder oft < 10 Ohm). Solche Werte deuten Einheiten-/Tippfehler (kOhm statt Ohm) oder defekten Erder an."
  },
  {
    "id": "elektrik.7",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdung vorhanden, aber Erdungstyp 'keiner'",
    "field": "erdungstyp",
    "values": {
      "hat_erdung": true,
      "erdungstyp": "keiner"
    },
    "expect": "block",
    "why": "Enum-Widerspruch. hat_erdung=true verlangt einen Erdertyp (Fundamenterder/Banderder/Tiefenerder/Staberder); 'keiner' widerspricht der Vorhandensein-Angabe."
  },
  {
    "id": "elektrik.8",
    "page": "elektrik",
    "domain": "wp",
    "label": "Keine Erdung, aber Erdungstyp Fundamenterder gewaehlt",
    "field": "erdungstyp",
    "values": {
      "hat_erdung": false,
      "erdungstyp": "fundamenterder"
    },
    "expect": "block",
    "why": "Enum-Widerspruch. hat_erdung=false, trotzdem ist ein konkreter Erdertyp angegeben - eins von beidem ist falsch."
  },
  {
    "id": "elektrik.9",
    "page": "elektrik",
    "domain": "wp",
    "label": "Keine Erdung, aber Potentialausgleichsschiene vorhanden",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": false,
      "hat_potentialausgleichsschiene": true
    },
    "expect": "soft",
    "why": "Fachlich kaum plausibel. Eine Haupterdungsschiene (PAS) ist Teil des Erdungs-/Potentialausgleichssystems; ist sie vorhanden, sollte hat_erdung in der Regel true sein. Kombination deutet auf Falscheingabe."
  },
  {
    "id": "elektrik.10",
    "page": "elektrik",
    "domain": "wp",
    "label": "Keine Erdung, aber Netzform TT angegeben",
    "field": "netzform",
    "values": {
      "hat_erdung": false,
      "netzform": "TT"
    },
    "expect": "soft",
    "why": "Im TT-Netz beruht der Schutz auf einem anlagenseitigen Erder beim Verbraucher. 'TT' bei gleichzeitig fehlender Erdung ist widerspruechlich bzw. ein Sicherheitsmangel, der gepruefte Eingabe erfordert."
  },
  {
    "id": "elektrik.11",
    "page": "elektrik",
    "domain": "wp",
    "label": "FI/RCD vorhanden behauptet, aber keine Erdung im TN-S",
    "field": "hat_fi_schutzschalter",
    "values": {
      "hat_erdung": false,
      "hat_fi_schutzschalter": true,
      "netzform": "TN-S"
    },
    "expect": "soft",
    "why": "RCD-Schutz im TN-S/TT setzt einen funktionierenden Schutzleiter/Erdung voraus. FI vorhanden bei fehlender Erdung ist sicherheitstechnisch widerspruechlich und sollte hinterfragt werden."
  },
  {
    "id": "elektrik.12",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zuleitungsquerschnitt 0",
    "field": "zuleitung_querschnitt_mm2",
    "values": {
      "hat_erdung": true,
      "zuleitung_querschnitt_mm2": 0
    },
    "expect": "block",
    "why": "Ein Leiterquerschnitt von 0 oder negativ ist physikalisch unmoeglich - ohne Querschnitt gibt es keine Zuleitung."
  },
  {
    "id": "elektrik.13",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zuleitungsquerschnitt unrealistisch klein fuer WP-Last",
    "field": "zuleitung_querschnitt_mm2",
    "values": {
      "hat_erdung": true,
      "zuleitung_querschnitt_mm2": 0.5,
      "wp_leistung_kw": 12
    },
    "expect": "soft",
    "why": "0,5 mm2 traegt keine WP-Last (12 kW braucht typ. >= 2,5-6 mm2). Werte unter ~1,5 mm2 fuer einen WP-Stromkreis sind technisch unzulaessig und deuten Tipp-/Einheitenfehler."
  },
  {
    "id": "elektrik.14",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zuleitungsquerschnitt unrealistisch gross",
    "field": "zuleitung_querschnitt_mm2",
    "values": {
      "hat_erdung": true,
      "zuleitung_querschnitt_mm2": 500
    },
    "expect": "soft",
    "why": "500 mm2 ist Industrie-/Trafogroessenordnung, im Wohnhaus fuer einen WP-Anschluss voellig unrealistisch - vermutlich Verwechslung Einheit oder Tippfehler."
  },
  {
    "id": "elektrik.15",
    "page": "elektrik",
    "domain": "wp",
    "label": "Hauptsicherung 0 A",
    "field": "hauptsicherung_ampere",
    "values": {
      "hat_erdung": true,
      "hauptsicherung_ampere": 0
    },
    "expect": "block",
    "why": "Eine Hausanschluss-/Hauptsicherung mit 0 A oder negativ ist unmoeglich - kein Stromfluss, ungueltiger Wert."
  },
  {
    "id": "elektrik.16",
    "page": "elektrik",
    "domain": "wp",
    "label": "Hauptsicherung absurd hoch fuer Wohnhaus",
    "field": "hauptsicherung_ampere",
    "values": {
      "hat_erdung": true,
      "hauptsicherung_ampere": 2000
    },
    "expect": "soft",
    "why": "Wohngebaeude-Hausanschluesse liegen typ. bei 35-63 A (selten bis 100/125 A). 2000 A ist Trafostation - klarer Einheiten-/Eingabefehler."
  },
  {
    "id": "elektrik.17",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP-Absicherung groesser als Hauptsicherung",
    "field": "wp_absicherung_ampere",
    "values": {
      "hat_erdung": true,
      "hauptsicherung_ampere": 35,
      "wp_absicherung_ampere": 63
    },
    "expect": "block",
    "why": "Selektivitaet/Logik verletzt: Eine nachgelagerte WP-Absicherung kann nicht groesser sein als die vorgeordnete Hauptsicherung - sonst loest die Hauptsicherung zuerst aus."
  },
  {
    "id": "elektrik.18",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP-Anschlussleistung sprengt Hausanschluss",
    "field": "wp_leistung_kw",
    "values": {
      "hat_erdung": true,
      "hauptsicherung_ampere": 35,
      "wp_leistung_kw": 40
    },
    "expect": "soft",
    "why": "35 A x 3 x 230 V ~ 24 kW Gesamthaus. Eine WP mit 40 kW elektrischer Aufnahme sprengt den Hausanschluss - Netzverstaerkung noetig, Eingabe wahrscheinlich falsch (kW thermisch vs. elektrisch verwechselt)."
  },
  {
    "id": "elektrik.19",
    "page": "elektrik",
    "domain": "wp",
    "label": "Einphasiger Anschluss bei hoher WP-Leistung",
    "field": "anschluss_phasen",
    "values": {
      "hat_erdung": true,
      "anschluss_phasen": 1,
      "wp_leistung_kw": 9
    },
    "expect": "soft",
    "why": "9 kW einphasig (~39 A) ist unzulaessig/unrealistisch (16 A einphasig ~3,7 kW Grenze). WP dieser Groesse erfordert Drehstrom (3 Phasen) - Kombination deutet Falscheingabe."
  },
  {
    "id": "elektrik.20",
    "page": "elektrik",
    "domain": "wp",
    "label": "Phasenzahl ausserhalb 1 oder 3",
    "field": "anschluss_phasen",
    "values": {
      "hat_erdung": true,
      "anschluss_phasen": 2
    },
    "expect": "block",
    "why": "In DE-Wohngebaeuden gibt es nur Wechselstrom (1 Phase) oder Drehstrom (3 Phasen). 2 oder andere Werte sind technisch nicht moeglich."
  },
  {
    "id": "elektrik.21",
    "page": "elektrik",
    "domain": "wp",
    "label": "Netzspannung unrealistisch",
    "field": "netzspannung_volt",
    "values": {
      "hat_erdung": true,
      "netzspannung_volt": 12
    },
    "expect": "block",
    "why": "Hausnetz in DE ist 230 V (L-N) bzw. 400 V (L-L). 12 V (oder Werte weit ausserhalb ~207-253/360-440 V) sind kein gueltiges Niederspannungsnetz - Tippfehler."
  },
  {
    "id": "elektrik.22",
    "page": "elektrik",
    "domain": "wp",
    "label": "Separater WP-Zaehler ohne Zaehlerschrank",
    "field": "hat_zaehlerschrank",
    "values": {
      "hat_erdung": true,
      "hat_separater_wp_zaehler": true,
      "hat_zaehlerschrank": false
    },
    "expect": "soft",
    "why": "Ein separater WP-/Waermestromzaehler braucht einen Zaehlerplatz/Zaehlerschrank. 'Zaehler ja' bei 'Zaehlerschrank nein' ist widerspruechlich und sollte geprueft werden."
  },
  {
    "id": "elektrik.23",
    "page": "elektrik",
    "domain": "wp",
    "label": "Baujahr Elektroinstallation in der Zukunft",
    "field": "elektro_installation_baujahr",
    "values": {
      "hat_erdung": true,
      "elektro_installation_baujahr": 2030
    },
    "expect": "block",
    "why": "Ein Installations-/Baujahr nach dem heutigen Datum ist unmoeglich - Datums-/Zahlenfehler."
  },
  {
    "id": "elektrik.24",
    "page": "elektrik",
    "domain": "wp",
    "label": "Baujahr Elektroinstallation vor Stromzeitalter",
    "field": "elektro_installation_baujahr",
    "values": {
      "hat_erdung": true,
      "elektro_installation_baujahr": 1700
    },
    "expect": "block",
    "why": "Elektrische Hausinstallation vor ~1900 existiert nicht. Werte wie 1700 sind unmoeglich - Tippfehler bei der Jahreszahl."
  },
  {
    "id": "elektrik.25",
    "page": "elektrik",
    "domain": "wp",
    "label": "Letzte E-Pruefung in der Zukunft",
    "field": "letzte_e_pruefung_datum",
    "values": {
      "hat_erdung": true,
      "letzte_e_pruefung_datum": "2027-08-01"
    },
    "expect": "block",
    "why": "Eine bereits durchgefuehrte Pruefung (E-Check) kann nicht in der Zukunft liegen. Datums-Logikfehler."
  },
  {
    "id": "elektrik.26",
    "page": "elektrik",
    "domain": "wp",
    "label": "Letzte E-Pruefung vor Errichtung der Installation",
    "field": "letzte_e_pruefung_datum",
    "values": {
      "hat_erdung": true,
      "elektro_installation_baujahr": 2015,
      "letzte_e_pruefung_datum": "2005-01-01"
    },
    "expect": "block",
    "why": "Reihenfolge-Widerspruch: Eine Pruefung kann nicht stattgefunden haben, bevor die Installation ueberhaupt existierte."
  },
  {
    "id": "elektrik.27",
    "page": "elektrik",
    "domain": "wp",
    "label": "Freie Sicherungsplaetze negativ",
    "field": "freie_sicherungsplaetze",
    "values": {
      "hat_erdung": true,
      "freie_sicherungsplaetze": -3
    },
    "expect": "block",
    "why": "Eine negative Anzahl freier Reiheneinbauplaetze im Verteiler ist unmoeglich - mindestens 0."
  },
  {
    "id": "elektrik.28",
    "page": "elektrik",
    "domain": "wp",
    "label": "Freie Sicherungsplaetze unrealistisch hoch",
    "field": "freie_sicherungsplaetze",
    "values": {
      "hat_erdung": true,
      "freie_sicherungsplaetze": 500
    },
    "expect": "soft",
    "why": "Ein Wohnhaus-Verteiler hat selten mehr als ~50 TE. 500 freie Plaetze ist unrealistisch und deutet Tippfehler."
  },
  {
    "id": "elektrik.29",
    "page": "elektrik",
    "domain": "wp",
    "label": "Wallbox vorhanden, aber keine Erdung",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": false,
      "hat_wallbox": true
    },
    "expect": "soft",
    "why": "Eine betriebene Wallbox erfordert Schutzleiter/Erdung und RCD. 'Wallbox vorhanden' bei 'keine Erdung' ist sicherheitstechnisch widerspruechlich - Eingabe pruefen."
  },
  {
    "id": "elektrik.30",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungswiderstand erfasst, hat_erdung aber unbeantwortet",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": null,
      "erdungswiderstand_ohm": 8
    },
    "expect": "soft",
    "why": "Messwert vorhanden, aber Grundfrage 'Erdung vorhanden?' nicht beantwortet. Inkonsistente Teilausfuellung - hat_erdung muss dann true sein."
  },
  {
    "id": "elektrik.31",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zuleitungslaenge 0 bei WP-Aussenstandort",
    "field": "zuleitung_laenge_m",
    "values": {
      "hat_erdung": true,
      "zuleitung_laenge_m": 0,
      "wp_standort": "garten"
    },
    "expect": "soft",
    "why": "Bei einem WP-Aussenstandort (Garten) kann die Zuleitungslaenge nicht 0 m sein. 0 oder negativ ist physikalisch/logisch unmoeglich fuer eine raeumlich getrennte Aufstellung."
  },
  {
    "id": "elektrik.32",
    "page": "elektrik",
    "domain": "wp",
    "label": "Pauschal Erdung true bei sehr altem TN-C-Altbau unbekannter Netzform",
    "field": "netzform",
    "values": {
      "hat_erdung": true,
      "netzform": "unbekannt",
      "elektro_installation_baujahr": 1955
    },
    "expect": "soft",
    "why": "Altbau 1955 mit klassischer Nullung (TN-C) hat oft keinen separaten Schutzerder im heutigen Sinn. Pauschal 'Erdung vorhanden' bei unbekannter, sehr alter Netzform sollte fachlich verifiziert werden."
  },
  {
    "id": "elektrik.33",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP-Absicherung kleiner als WP-Nennstrom",
    "field": "wp_absicherung_a",
    "values": {
      "wp_anschlussleistung_kw": 9,
      "netzspannung_v": 400,
      "phasenzahl": 3,
      "wp_absicherung_a": 6
    },
    "expect": "block",
    "why": "9 kW dreiphasig zieht ca. 13 A je Phase; eine 6-A-Absicherung loest sofort aus und kann die WP gar nicht betreiben - physikalisch inkonsistent mit der angegebenen Leistung."
  },
  {
    "id": "elektrik.34",
    "page": "elektrik",
    "domain": "wp",
    "label": "Leitungsschutzschalter ueber zulaessigem Strom des Querschnitts",
    "field": "wp_absicherung_a",
    "values": {
      "zuleitungsquerschnitt_mm2": 1.5,
      "wp_absicherung_a": 32
    },
    "expect": "block",
    "why": "1,5 mm2 Kupfer darf nach VDE max. ~16 A abgesichert werden; eine 32-A-Sicherung auf 1,5 mm2 ist Brandgefahr und normwidrig - Querschnitt und Absicherung passen nicht zusammen."
  },
  {
    "id": "elektrik.35",
    "page": "elektrik",
    "domain": "wp",
    "label": "Querschnitt zu klein fuer die gewaehlte WP-Absicherung",
    "field": "zuleitungsquerschnitt_mm2",
    "values": {
      "wp_absicherung_a": 25,
      "zuleitungsquerschnitt_mm2": 2.5
    },
    "expect": "soft",
    "why": "2,5 mm2 traegt nur ca. 16-20 A; bei 25 A Absicherung ist der Leiter unzureichend geschuetzt - Querschnitt/Absicherung widerspruechlich."
  },
  {
    "id": "elektrik.36",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungswiderstand ueber Schutzziel trotz behaupteter funktionierender Erdung",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": true,
      "erdungswiderstand_ohm": 250
    },
    "expect": "soft",
    "why": "Fuer einen wirksamen Schutz-/Funktionserder werden typ. unter ~100 Ohm (oft < 10 Ohm) gefordert; 250 Ohm bedeutet praktisch keine wirksame Erdung, widerspricht 'hat_erdung = ja'."
  },
  {
    "id": "elektrik.37",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungswiderstand mit unrealistischem Nachkomma-Rauschen / falsche Einheit kOhm",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": true,
      "erdungswiderstand_ohm": 0.0001
    },
    "expect": "soft",
    "why": "0,0001 Ohm ist niedriger als jeder reale Erder (selbst grosse Fundamenterder liegen im einstelligen Ohm-Bereich); deutet auf Tippfehler oder verwechselte Einheit (mOhm statt Ohm) hin."
  },
  {
    "id": "elektrik.38",
    "page": "elektrik",
    "domain": "wp",
    "label": "Netzform TN-C mit separater Potentialausgleichsschiene UND FI vorgeschaltet behauptet",
    "field": "netzform",
    "values": {
      "netzform": "TN-C",
      "hat_fi_rcd": true
    },
    "expect": "soft",
    "why": "Im klassischen TN-C-Netz (kombinierter PEN) ist ein RCD/FI grundsaetzlich nicht wirksam einsetzbar; 'FI vorhanden' bei reiner TN-C-Angabe ist technisch widerspruechlich."
  },
  {
    "id": "elektrik.39",
    "page": "elektrik",
    "domain": "wp",
    "label": "Netzform IT in normalem Wohngebaeude",
    "field": "netzform",
    "values": {
      "netzform": "IT",
      "gebaeudetyp": "wohngebaeude"
    },
    "expect": "soft",
    "why": "IT-Netze kommen in Wohngebaeuden praktisch nie vor (eher Industrie/Medizin/Inseln); in einem normalen Einfamilienhaus ist IT hoechst unplausibel und deutet auf Fehlauswahl."
  },
  {
    "id": "elektrik.40",
    "page": "elektrik",
    "domain": "wp",
    "label": "Phasenzahl 3 angegeben, aber Netzspannung 230 V (Aussenleiterspannung fehlt)",
    "field": "netzspannung_v",
    "values": {
      "phasenzahl": 3,
      "netzspannung_v": 230
    },
    "expect": "soft",
    "why": "Bei einem dreiphasigen Anschluss ist die nutzbare Netz-/Aussenleiterspannung 400 V; 230 V passt zu einphasig. Phasenzahl 3 mit 230 V ist widerspruechlich (verwechselte Strang-/Aussenleiterspannung)."
  },
  {
    "id": "elektrik.41",
    "page": "elektrik",
    "domain": "wp",
    "label": "Einphasig angegeben, aber 400 V eingetragen",
    "field": "netzspannung_v",
    "values": {
      "phasenzahl": 1,
      "netzspannung_v": 400
    },
    "expect": "block",
    "why": "Einphasiger Anschluss liefert 230 V gegen Neutral; 400 V gibt es nur zwischen zwei Aussenleitern (dreiphasig). Phasenzahl 1 mit 400 V ist physikalisch unmoeglich."
  },
  {
    "id": "elektrik.42",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP-Anschlussleistung dreiphasig, aber nur eine freie Phase / 1 Sicherungsplatz",
    "field": "freie_sicherungsplaetze",
    "values": {
      "phasenzahl": 3,
      "wp_anschlussleistung_kw": 12,
      "freie_sicherungsplaetze": 1
    },
    "expect": "soft",
    "why": "Eine dreiphasige WP-Absicherung belegt 3 nebeneinanderliegende Plaetze; bei nur 1 freien Platz kann der dreiphasige Anschluss nicht gesetzt werden - Plausibilitaetswiderspruch."
  },
  {
    "id": "elektrik.43",
    "page": "elektrik",
    "domain": "wp",
    "label": "Hauptsicherung kleiner als bereits installierte WP-Absicherung plus Grundlast unmoeglich",
    "field": "hauptsicherung_a",
    "values": {
      "hauptsicherung_a": 16,
      "wp_absicherung_a": 16,
      "phasenzahl": 3
    },
    "expect": "soft",
    "why": "Wenn Haupt- und WP-Absicherung beide 16 A betragen, bleibt fuer den gesamten restlichen Haushalt kein Strom; eine 16-A-Hauptsicherung fuer ein Haus mit WP ist real ausgeschlossen."
  },
  {
    "id": "elektrik.44",
    "page": "elektrik",
    "domain": "wp",
    "label": "Selektivitaetsverstoss: WP-Absicherung gleich Hauptsicherung",
    "field": "wp_absicherung_a",
    "values": {
      "hauptsicherung_a": 35,
      "wp_absicherung_a": 35
    },
    "expect": "soft",
    "why": "Eine nachgeordnete WP-Absicherung muss kleiner als die Hauptsicherung sein (Selektivitaet); identische Werte bedeuten, die WP allein koennte schon die Hauptsicherung ausloesen - praktisch unzulaessig."
  },
  {
    "id": "elektrik.45",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zuleitungslaenge unrealistisch lang fuer Wohngebaeude",
    "field": "zuleitungslaenge_m",
    "values": {
      "zuleitungslaenge_m": 500
    },
    "expect": "soft",
    "why": "500 m Zuleitung vom Zaehlerschrank zur WP gibt es bei einem Wohnhaus nicht; bei dieser Laenge waere der Spannungsfall ohnehin unzulaessig - klar unplausibel (Tippfehler m vs. cm)."
  },
  {
    "id": "elektrik.46",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zuleitungslaenge negativ",
    "field": "zuleitungslaenge_m",
    "values": {
      "zuleitungslaenge_m": -5
    },
    "expect": "block",
    "why": "Eine Leitungslaenge kann nicht negativ sein - physikalisch unmoeglich."
  },
  {
    "id": "elektrik.47",
    "page": "elektrik",
    "domain": "wp",
    "label": "Spannungsfall bei kleinem Querschnitt + grosser Laenge + hoher Last",
    "field": "zuleitungsquerschnitt_mm2",
    "values": {
      "zuleitungsquerschnitt_mm2": 1.5,
      "zuleitungslaenge_m": 80,
      "wp_anschlussleistung_kw": 11,
      "phasenzahl": 3
    },
    "expect": "soft",
    "why": "1,5 mm2 ueber 80 m bei 11 kW erzeugt einen Spannungsfall weit ueber den zulaessigen Grenzwerten; diese Kombination kann real nicht funktionieren - querfeld unplausibel."
  },
  {
    "id": "elektrik.48",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungstyp Tiefenerder, aber Erdungswiderstand 0,5 Ohm im Fels/Sandboden plausibel? extrem niedrig",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": true,
      "erdungstyp": "tiefenerder",
      "erdungswiderstand_ohm": 0.2
    },
    "expect": "soft",
    "why": "Ein einzelner Tiefenerder erreicht real selten unter ~2-5 Ohm; 0,2 Ohm ist fuer einen einzelnen Staberder unrealistisch niedrig und deutet auf Messfehler/Einheitenverwechslung."
  },
  {
    "id": "elektrik.49",
    "page": "elektrik",
    "domain": "wp",
    "label": "Baujahr Elektroinstallation aelter als Baujahr des Gebaeudes",
    "field": "baujahr_elektroinstallation",
    "values": {
      "baujahr_gebaeude": 1995,
      "baujahr_elektroinstallation": 1970
    },
    "expect": "block",
    "why": "Die Elektroinstallation kann nicht aelter sein als das Gebaeude, in dem sie verbaut ist - Reihenfolge-/Datumswiderspruch."
  },
  {
    "id": "elektrik.50",
    "page": "elektrik",
    "domain": "wp",
    "label": "Letzte E-Pruefung liegt vor dem Aufmass-/Erfassungsdatum-Tag plausibel, aber Jahrzehnte zurueck bei behaupteter geprueft-ok",
    "field": "letzte_e_pruefung",
    "values": {
      "letzte_e_pruefung": "1990-01-01",
      "e_pruefung_bestanden": true
    },
    "expect": "soft",
    "why": "Eine vor 35 Jahren liegende E-Pruefung kann nicht als aktueller Nachweis 'bestanden/gueltig' gelten (E-Check-Intervalle 4 Jahre); Kombination 'kuerzlich bestanden' + Datum 1990 ist widerspruechlich."
  },
  {
    "id": "elektrik.51",
    "page": "elektrik",
    "domain": "wp",
    "label": "FI/RCD Bemessungsfehlerstrom unzulaessig hoch fuer Personenschutz",
    "field": "fi_bemessungsfehlerstrom_ma",
    "values": {
      "hat_fi_rcd": true,
      "fi_bemessungsfehlerstrom_ma": 1000
    },
    "expect": "soft",
    "why": "Fuer Personenschutz sind 30 mA Standard; 1000 mA (1 A) schuetzt keine Personen mehr und ist als 'FI fuer den WP-Endstromkreis' fachlich falsch/unplausibel."
  },
  {
    "id": "elektrik.52",
    "page": "elektrik",
    "domain": "wp",
    "label": "FI/RCD vorhanden, aber Bemessungsfehlerstrom 0 mA",
    "field": "fi_bemessungsfehlerstrom_ma",
    "values": {
      "hat_fi_rcd": true,
      "fi_bemessungsfehlerstrom_ma": 0
    },
    "expect": "block",
    "why": "Ein RCD mit 0 mA Bemessungsfehlerstrom existiert nicht; entweder loest er nie aus oder dauernd - physikalisch unmoeglicher Wert."
  },
  {
    "id": "elektrik.53",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP-Anschlussleistung 0 kW",
    "field": "wp_anschlussleistung_kw",
    "values": {
      "wp_anschlussleistung_kw": 0
    },
    "expect": "block",
    "why": "Eine Waermepumpe mit 0 kW elektrischer Anschlussleistung kann nicht existieren - Nullwert ist unmoeglich."
  },
  {
    "id": "elektrik.54",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP-Anschlussleistung negativ",
    "field": "wp_anschlussleistung_kw",
    "values": {
      "wp_anschlussleistung_kw": -8
    },
    "expect": "block",
    "why": "Elektrische Anschlussleistung kann nicht negativ sein - physikalisch unmoeglich."
  },
  {
    "id": "elektrik.55",
    "page": "elektrik",
    "domain": "wp",
    "label": "WP-Anschlussleistung absurd hoch fuer Einfamilienhaus",
    "field": "wp_anschlussleistung_kw",
    "values": {
      "wp_anschlussleistung_kw": 200,
      "gebaeudetyp": "wohngebaeude"
    },
    "expect": "soft",
    "why": "200 kW elektrische WP-Leistung entspricht einer Gewerbe-/Industrieanlage; in einem Wohngebaeude voellig unrealistisch (Tippfehler oder Verwechslung mit thermischer Leistung)."
  },
  {
    "id": "elektrik.56",
    "page": "elektrik",
    "domain": "wp",
    "label": "Phasenzahl als Dezimalzahl",
    "field": "phasenzahl",
    "values": {
      "phasenzahl": 1.5
    },
    "expect": "block",
    "why": "Die Phasenzahl muss eine ganze Zahl (1 oder 3) sein; 1,5 Phasen gibt es nicht - unmoegliche Eingabe."
  },
  {
    "id": "elektrik.57",
    "page": "elektrik",
    "domain": "wp",
    "label": "Hauptsicherung als Dezimalwert ausserhalb Normreihe",
    "field": "hauptsicherung_a",
    "values": {
      "hauptsicherung_a": 37.5
    },
    "expect": "soft",
    "why": "Hauptsicherungen folgen der Normreihe (25/35/50/63/80/100 A); 37,5 A existiert nicht als NH-/Hausanschlusssicherung - unplausibler Zwischenwert."
  },
  {
    "id": "elektrik.58",
    "page": "elektrik",
    "domain": "wp",
    "label": "Netzspannung mit falscher Einheit (kV statt V)",
    "field": "netzspannung_v",
    "values": {
      "netzspannung_v": 0.4
    },
    "expect": "block",
    "why": "0,4 als Spannung in Volt ist physikalisch unmoeglich fuer einen Hausanschluss; gemeint waren vermutlich 400 V (kV/V verwechselt) - Einheitenfalle."
  },
  {
    "id": "elektrik.59",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zaehlertyp Drehstromzaehler, aber Phasenzahl 1 angegeben",
    "field": "phasenzahl",
    "values": {
      "zaehlertyp": "drehstromzaehler",
      "phasenzahl": 1
    },
    "expect": "soft",
    "why": "Ein Drehstrom-(Dreiphasen-)Zaehler setzt einen dreiphasigen Anschluss voraus; Kombination mit Phasenzahl 1 ist widerspruechlich."
  },
  {
    "id": "elektrik.60",
    "page": "elektrik",
    "domain": "wp",
    "label": "Separater WP-Zaehler (Waermestromtarif) ohne dreiphasigen Anschluss",
    "field": "phasenzahl",
    "values": {
      "separater_wp_zaehler": true,
      "phasenzahl": 1,
      "wp_anschlussleistung_kw": 10
    },
    "expect": "soft",
    "why": "Eine 10-kW-WP mit separatem Waermestromzaehler ist faktisch immer dreiphasig; separater WP-Zaehler bei einphasig + 10 kW ist unplausibel."
  },
  {
    "id": "elektrik.61",
    "page": "elektrik",
    "domain": "wp",
    "label": "Freie Sicherungsplaetze hoeher als Gesamtplaetze im Verteiler",
    "field": "freie_sicherungsplaetze",
    "values": {
      "gesamt_sicherungsplaetze": 12,
      "freie_sicherungsplaetze": 18
    },
    "expect": "block",
    "why": "Es koennen nicht mehr Plaetze frei sein als der Verteiler ueberhaupt besitzt - logischer Querfeld-Widerspruch."
  },
  {
    "id": "elektrik.62",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungstyp 'fundamenterder' bei Bestandsgebaeude mit nachtraeglich gesetztem Erder unmoeglich kombiniert",
    "field": "erdungstyp",
    "values": {
      "hat_erdung": true,
      "erdungstyp": "fundamenterder",
      "baujahr_gebaeude": 1955,
      "erder_nachtraeglich": true
    },
    "expect": "soft",
    "why": "Ein Fundamenterder wird beim Bau in das Fundament eingegossen und kann nicht nachtraeglich ergaenzt werden; 'Fundamenterder' + 'nachtraeglich gesetzt' ist technisch widerspruechlich (waere dann Ring-/Tiefenerder)."
  },
  {
    "id": "elektrik.63",
    "page": "elektrik",
    "domain": "wp",
    "label": "Hausanschlussleistung kleiner als Summe Hauptsicherung",
    "field": "hausanschlussleistung_kw",
    "values": {
      "hauptsicherung_a": 63,
      "phasenzahl": 3,
      "netzspannung_v": 400,
      "hausanschlussleistung_kw": 20
    },
    "expect": "soft",
    "why": "63 A dreiphasig bei 400 V entsprechen ca. 43 kW Anschlussleistung; eine angegebene Hausanschlussleistung von nur 20 kW widerspricht der 63-A-Hauptsicherung."
  },
  {
    "id": "elektrik.64",
    "page": "elektrik",
    "domain": "wp",
    "label": "Spannungsfall-Querschnitt: WP-Leistung steigt, aber Querschnitt bleibt 4 mm2 bei 22 kW",
    "field": "zuleitungsquerschnitt_mm2",
    "values": {
      "wp_anschlussleistung_kw": 22,
      "phasenzahl": 3,
      "netzspannung_v": 400,
      "zuleitungsquerschnitt_mm2": 4
    },
    "expect": "soft",
    "why": "22 kW ziehen ca. 32 A je Phase; 4 mm2 traegt dafuer dauerhaft zu wenig (Grenze ~25-32 A nur kurz). Leistung und Querschnitt passen nicht zusammen."
  },
  {
    "id": "elektrik.65",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungswiderstand gemessen mit Nachkommastelle, aber als ganzzahlige Megaohm interpretierbar (Isolations- statt Erdungsmessung)",
    "field": "erdungswiderstand_ohm",
    "values": {
      "hat_erdung": true,
      "erdungswiderstand_ohm": 1000000
    },
    "expect": "block",
    "why": "1 MOhm ist ein Isolationswiderstandswert, kein Erdungswiderstand; ein Erder mit 1 MOhm ist faktisch nicht geerdet - falsche Messgroesse/Einheit eingetragen."
  },
  {
    "id": "elektrik.66",
    "page": "elektrik",
    "domain": "wp",
    "label": "Letzte E-Pruefung exakt am selben Tag wie Errichtung, aber Pruefintervall ueberschritten gemeldet",
    "field": "letzte_e_pruefung",
    "values": {
      "baujahr_elektroinstallation": 2024,
      "letzte_e_pruefung": "2024-01-01",
      "pruefung_ueberfaellig": true
    },
    "expect": "soft",
    "why": "Eine 2024 errichtete und gleichzeitig gepruefte Installation kann am Erfassungstag 2026 nicht 'ueberfaellig' sein (4-Jahres-Intervall noch offen) - Querfeld-Widerspruch."
  },
  {
    "id": "elektrik.67",
    "page": "elektrik",
    "domain": "wp",
    "label": "Anzahl WP-Phasen-Belegung 2 (zweiphasig)",
    "field": "phasenzahl",
    "values": {
      "phasenzahl": 2
    },
    "expect": "block",
    "why": "Ein zweiphasiger Hausanschluss existiert in Deutschland nicht; gueltig sind nur 1 (Wechselstrom) oder 3 (Drehstrom)."
  },
  {
    "id": "elektrik.68",
    "page": "elektrik",
    "domain": "wp",
    "label": "Hat keine Erdung, aber FI-Bemessungsfehlerstrom erfasst",
    "field": "fi_bemessungsfehlerstrom_ma",
    "values": {
      "hat_erdung": false,
      "hat_fi_rcd": false,
      "fi_bemessungsfehlerstrom_ma": 30
    },
    "expect": "soft",
    "why": "Wenn weder Erdung noch FI vorhanden sind, kann kein Bemessungsfehlerstrom eines FI gemessen/eingetragen worden sein - Datenherkunft widerspruechlich."
  },
  {
    "id": "elektrik.69",
    "page": "elektrik",
    "domain": "wp",
    "label": "Netzform TN-S, aber kein separater PE/Potentialausgleich vorhanden",
    "field": "netzform",
    "values": {
      "netzform": "TN-S",
      "hat_potentialausgleich": false,
      "hat_erdung": true
    },
    "expect": "soft",
    "why": "TN-S setzt einen durchgehend getrennten Schutzleiter samt Haupterdungsschiene/Potentialausgleich voraus; 'TN-S' ohne jeden Potentialausgleich ist normativ widerspruechlich."
  },
  {
    "id": "elektrik.70",
    "page": "elektrik",
    "domain": "wp",
    "label": "Wallbox-Leistung plus WP-Leistung sprengt Hausanschluss ohne Lastmanagement",
    "field": "hausanschlussleistung_kw",
    "values": {
      "hat_wallbox": true,
      "wallbox_leistung_kw": 22,
      "wp_anschlussleistung_kw": 12,
      "hausanschlussleistung_kw": 14,
      "lastmanagement": false
    },
    "expect": "soft",
    "why": "22 kW Wallbox + 12 kW WP = 34 kW Spitzenlast bei nur 14 kW Hausanschluss ohne Lastmanagement ist real nicht betreibbar - Querfeld-Ueberlast."
  },
  {
    "id": "elektrik.71",
    "page": "elektrik",
    "domain": "wp",
    "label": "Baujahr Elektroinstallation gesetzt, aber kein Gebaeude-Baujahr und Pruefdatum vor Installationsjahr",
    "field": "letzte_e_pruefung",
    "values": {
      "baujahr_elektroinstallation": 2010,
      "letzte_e_pruefung": "2005-06-01"
    },
    "expect": "block",
    "why": "Die letzte Pruefung kann nicht vor der Errichtung der Installation liegen (hier 2005 vs. 2010) - Datums-Reihenfolge unmoeglich."
  },
  {
    "id": "elektrik.72",
    "page": "elektrik",
    "domain": "wp",
    "label": "Zuleitungsquerschnitt mit Nachkommarauschen statt Normquerschnitt",
    "field": "zuleitungsquerschnitt_mm2",
    "values": {
      "zuleitungsquerschnitt_mm2": 3.7
    },
    "expect": "soft",
    "why": "Leitungsquerschnitte folgen der Normreihe (1,5/2,5/4/6/10/16 mm2); 3,7 mm2 gibt es als Kabel nicht - unplausibler Zwischenwert (geschaetzt statt abgelesen)."
  },
  {
    "id": "elektrik.73",
    "page": "elektrik",
    "domain": "wp",
    "label": "Hauptsicherung kleiner als WP-Absicherung trotz dreiphasig (umgekehrtes Verhaeltnis schon, aber hier knapp gleich-darunter)",
    "field": "hauptsicherung_a",
    "values": {
      "hauptsicherung_a": 20,
      "wp_absicherung_a": 25
    },
    "expect": "block",
    "why": "Die WP-Absicherung (25 A) liegt ueber der Hauptsicherung (20 A); die nachgeordnete Sicherung kann nicht groesser sein als die vorgeordnete - logisch unmoeglich."
  },
  {
    "id": "elektrik.74",
    "page": "elektrik",
    "domain": "wp",
    "label": "Erdungswiderstand und Netzform TT, aber Wert so hoch dass RCD nicht ausloesen wuerde",
    "field": "erdungswiderstand_ohm",
    "values": {
      "netzform": "TT",
      "hat_fi_rcd": true,
      "fi_bemessungsfehlerstrom_ma": 30,
      "erdungswiderstand_ohm": 5000
    },
    "expect": "soft",
    "why": "Im TT-Netz muss der Erdungswiderstand niedrig genug sein, dass der RCD ausloest (Ra x IdN <= 50 V, also bei 30 mA max. ~1667 Ohm); 5000 Ohm verletzt die Abschaltbedingung - inkonsistent mit 'TT + 30-mA-RCD funktionsfaehig'."
  },
  {
    "id": "elektrik.75",
    "page": "elektrik",
    "domain": "wp",
    "label": "Anschlussleistung in W statt kW eingetragen",
    "field": "wp_anschlussleistung_kw",
    "values": {
      "wp_anschlussleistung_kw": 9000
    },
    "expect": "block",
    "why": "9000 als WP-Anschlussleistung in kW ist unmoeglich (das waere 9 MW); gemeint waren 9000 W = 9 kW - klassische Einheitenfalle W vs. kW."
  },
  {
    "id": "aufstellort.1",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Negative Distanz Außeneinheit-Kernloch",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": -3
    },
    "expect": "block",
    "why": "Eine Distanz kann physikalisch nicht negativ sein."
  },
  {
    "id": "aufstellort.2",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz Außeneinheit-Kernloch = 0",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 0
    },
    "expect": "soft",
    "why": "0 m würde bedeuten, das Außengerät steht direkt an der Wand am Kernloch ohne jeden Leitungsweg - unrealistisch, denn Außengeräte brauchen Wandabstand für Luftführung/Schall."
  },
  {
    "id": "aufstellort.3",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Außeneinheit-Kernloch absurd weit",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 80
    },
    "expect": "block",
    "why": "Kältemittelleitungen einer Mono-/Splitanlage sind herstellerseitig auf typ. 15-30 m begrenzt; 80 m überschreitet jede zulässige Leitungslänge und ist baulich auf einem Wohngrundstück unrealistisch."
  },
  {
    "id": "aufstellort.4",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Außeneinheit-Kernloch grenzwertig lang",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 35
    },
    "expect": "soft",
    "why": "Über ~30 m liegt man jenseits der üblichen herstellerfreigegebenen Kältemittel-/Hydraulikleitungslänge - möglich, aber stark erklärungsbedürftig."
  },
  {
    "id": "aufstellort.5",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz Außeneinheit-Kernloch mit Tippfehler (cm statt m)",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 350
    },
    "expect": "block",
    "why": "350 (vermutlich cm-Eingabe statt 3,5 m) ist als Meterwert physikalisch unmöglich für einen Leitungsweg auf dem Grundstück."
  },
  {
    "id": "aufstellort.6",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Negative Distanz Kernloch-Innengerät",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_kernloch_innengeraet": -1.5
    },
    "expect": "block",
    "why": "Distanz kann nicht negativ sein."
  },
  {
    "id": "aufstellort.7",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz Kernloch-Innengerät = 0",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_kernloch_innengeraet": 0
    },
    "expect": "soft",
    "why": "0 m hieße, das Innengerät/die Hydraulikstation sitzt exakt am Kernloch in der Wand - praktisch nie der Fall, mind. der Wand-/Geräteabstand bleibt."
  },
  {
    "id": "aufstellort.8",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz Kernloch-Innengerät unrealistisch lang",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_kernloch_innengeraet": 60
    },
    "expect": "block",
    "why": "60 m Leitungsweg vom Kernloch zum Innengerät innerhalb eines Wohngebäudes ist baulich nicht möglich und überschreitet zulässige Leitungslängen."
  },
  {
    "id": "aufstellort.9",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz Kernloch-Innengerät grenzwertig",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_kernloch_innengeraet": 28
    },
    "expect": "soft",
    "why": "Über ~25 m innerhalb des Hauses ist für ein typisches Wohngebäude sehr lang und sollte begründet werden."
  },
  {
    "id": "aufstellort.10",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Anzahl Durchbrüche negativ",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": -2
    },
    "expect": "block",
    "why": "Eine Anzahl Durchbrüche kann nicht negativ sein."
  },
  {
    "id": "aufstellort.11",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Anzahl Durchbrüche = 0 trotz Leitungsweg",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": 0,
      "distanz_ausseneinheit_kernloch": 5
    },
    "expect": "soft",
    "why": "Wenn ein Leitungsweg vom Außengerät über ein Kernloch ins Gebäude führt, muss mindestens ein Durchbruch (Kernloch) existieren; 0 widerspricht dem Vorhandensein eines Kernlochs."
  },
  {
    "id": "aufstellort.12",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Anzahl Durchbrüche als Kommazahl",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": 2.5
    },
    "expect": "block",
    "why": "Durchbrüche sind ganzzahlig - 2,5 Durchbrüche sind unmöglich."
  },
  {
    "id": "aufstellort.13",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Anzahl Durchbrüche absurd hoch",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": 25
    },
    "expect": "soft",
    "why": "Für eine Wärmepumpen-Leitungsführung sind realistisch 1-3 Wand-/Deckendurchbrüche nötig; 25 ist baulich extrem unplausibel."
  },
  {
    "id": "aufstellort.14",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aufstellort geändert, aber Distanz fehlt/0",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 0
    },
    "expect": "soft",
    "why": "Wenn der Aufstellort geändert wurde, muss zwischen altem und neuem Ort ein Abstand > 0 bestehen; 0 m widerspricht der Aussage 'Ort geändert'."
  },
  {
    "id": "aufstellort.15",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz alt/neu gesetzt, aber keine Änderung",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": false,
      "distanz_alter_neuer_aufstellort": 4
    },
    "expect": "block",
    "why": "Querfeld-Widerspruch: Es wird ein Abstand zwischen altem und neuem Aufstellort angegeben, obwohl 'Aufstellort-Änderung' = nein ist."
  },
  {
    "id": "aufstellort.16",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz alt/neuer Aufstellort negativ",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": -5
    },
    "expect": "block",
    "why": "Distanz kann nicht negativ sein."
  },
  {
    "id": "aufstellort.17",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz alt/neuer Aufstellort unrealistisch weit",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 200
    },
    "expect": "block",
    "why": "200 m Verschiebung des Aufstellortes auf einem Wohngrundstück ist baulich unmöglich (Grundstücke sind selten so groß und die Leitungslänge wäre unzulässig)."
  },
  {
    "id": "aufstellort.18",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Gesamtleitungsweg überschreitet Herstellergrenze (Querfeld)",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 18,
      "distanz_kernloch_innengeraet": 18
    },
    "expect": "soft",
    "why": "Summe Außengerät→Kernloch + Kernloch→Innengerät = 36 m überschreitet die übliche maximale freigegebene Kältemittel-/Anbindeleitungslänge (typ. 30 m) - in Summe unplausibel, auch wenn jeder Einzelwert für sich okay aussieht."
  },
  {
    "id": "aufstellort.19",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Alternative 2 vorhanden ohne Alternative 1",
    "field": "alternative_2_vorhanden",
    "values": {
      "alternative_1_vorhanden": false,
      "alternative_2_vorhanden": true
    },
    "expect": "soft",
    "why": "Logischer Reihenfolge-Widerspruch: Eine zweite Alternative ohne erste ist inkonsistent - Alternativen werden aufsteigend belegt (erst 1, dann 2)."
  },
  {
    "id": "aufstellort.20",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz-Felder als Text/Nicht-Zahl",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": "ca. 5"
    },
    "expect": "block",
    "why": "Distanzfeld muss numerisch sein; freier Text wie 'ca. 5' ist kein gültiger Zahlenwert und nicht auswertbar."
  },
  {
    "id": "aufstellort.21",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aufstellort geändert = ja, aber Distanz leer/NULL",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": null
    },
    "expect": "block",
    "why": "Bei aktivierter Aufstellort-Änderung ist die Distanz alt/neu ein Pflichtfeld - NULL/leer ist unvollständig und macht die Angabe wertlos."
  },
  {
    "id": "aufstellort.22",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Mikroskopische Distanz (Tippfehler / Einheit verrutscht)",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_kernloch_innengeraet": 0.01
    },
    "expect": "soft",
    "why": "0,01 m (1 cm) als Leitungsweg ist physikalisch faktisch null - deutet auf Tippfehler oder falsche Einheit (mm/cm) hin."
  },
  {
    "id": "aufstellort.23",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Anzahl Durchbrüche unrealistisch klein bei großer Distanz und Geschosswechsel",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": 1,
      "distanz_kernloch_innengeraet": 25
    },
    "expect": "soft",
    "why": "Ein 25-m-Leitungsweg im Haus führt realistisch durch mehrere Wände/Decken; nur 1 Durchbruch dabei ist baulich unplausibel."
  },
  {
    "id": "aufstellort.24",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Innendistanz weit groesser als Aussendistanz ohne plausiblen Grund",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_ausseneinheit_kernloch": 1,
      "distanz_kernloch_innengeraet": 45
    },
    "expect": "soft",
    "why": "Innenleitung (Kernloch->Innengeraet) von 45 m im Gebaeude ist bei nur 1 m Aussenstrecke untypisch - in Wohngebaeuden liegt das Innengeraet (Hydraulikmodul) meist nahe der Wand. Solche Verhaeltnisse deuten auf Verwechslung der beiden Felder oder Fehleingabe hin."
  },
  {
    "id": "aufstellort.25",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Mehr Kernlochdurchbrueche als physikalisch fuer eine Leitung noetig",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": 12,
      "distanz_ausseneinheit_kernloch": 2,
      "distanz_kernloch_innengeraet": 3
    },
    "expect": "soft",
    "why": "Eine Monoblock/Split-WP braucht typisch 1-2 Kernbohrungen (Vor-/Ruecklauf bzw. Kaeltemittel + Kondensat/Strom). 12 Durchbrueche auf so kurzer Strecke ist baulich unplausibel und deutet auf Zahlendreher oder Verwechslung mit anderer Groesse."
  },
  {
    "id": "aufstellort.26",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz alt/neuer Aufstellort groesser als gesamter Leitungsweg moeglich",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 60,
      "distanz_ausseneinheit_kernloch": 3
    },
    "expect": "soft",
    "why": "Eine Verschiebung des Aufstellorts um 60 m bei Wohngebaeuden ist faktisch ein voellig anderer Standort (jenseits typischer Grundstuecksgeometrie an der Hauswand). Plausibel sind wenige Meter bis ~max. 15-20 m."
  },
  {
    "id": "aufstellort.27",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aufstellort geaendert, aber Distanz alt/neu = neue Aussendistanz identisch (Feldverwechslung)",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 0
    },
    "expect": "block",
    "why": "Wenn der Aufstellort geaendert wurde, ist die Verschiebung per Definition > 0. Ein Wert von exakt 0 widerspricht dem gesetzten Aenderungs-Flag (logischer Querfeld-Widerspruch)."
  },
  {
    "id": "aufstellort.28",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Alternative 1 vorhanden, aber Aufstellort NICHT geaendert und keine Distanz",
    "field": "alternative_1_vorhanden",
    "values": {
      "aufstellort_aenderung": false,
      "alternative_1_vorhanden": true,
      "alternative_2_vorhanden": false,
      "distanz_alter_neuer_aufstellort": 0
    },
    "expect": "soft",
    "why": "Wenn Alternativ-Aufstellorte erfasst werden (alternative_1_vorhanden=true), aber zugleich keine Aufstellort-Aenderung vorliegt und keine Distanz zur Alternative angegeben ist, fehlt die zugehoerige Lageinformation - inkonsistente Erfassung."
  },
  {
    "id": "aufstellort.29",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Gesamtleitungsweg sehr kurz, aber mehrere Durchbrueche (Widerspruch)",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 0.5,
      "distanz_kernloch_innengeraet": 0.5,
      "anzahl_durchbrueche_kernloch": 5
    },
    "expect": "soft",
    "why": "Bei einem Gesamtweg von nur 1 m durch genau eine Wand sind 5 separate Durchbrueche raeumlich kaum unterzubringen. Mehrere Durchbrueche implizieren mehrere durchquerte Bauteile/Strecken - passt nicht zur Mini-Distanz."
  },
  {
    "id": "aufstellort.30",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aussendistanz als sehr genaue Nachkommazahl (Scheingenauigkeit/Sensorartefakt)",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 7.3841
    },
    "expect": "soft",
    "why": "Ein per Hand/Massband aufgenommenes Mass mit vier Nachkommastellen ist physisch nicht messbar (mm-Genauigkeit am Massband endet). Deutet auf versehentliche Roh-/Sensorwert-Eingabe oder Komma-/Punktfehler hin."
  },
  {
    "id": "aufstellort.31",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz mit Tausendertrennzeichen als Punkt fehlinterpretiert (z.B. 1.500 = 1500 m)",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_kernloch_innengeraet": 1500
    },
    "expect": "block",
    "why": "Eingabe '1.500' (gemeint 1,5 m mit deutschem Komma) wird als 1500 m geparst. 1500 m Innenleitung ist physikalisch unmoeglich in einem Wohngebaeude - klassische Dezimal-/Tausendertrenner-Falle (DE-Komma vs. EN-Punkt)."
  },
  {
    "id": "aufstellort.32",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aussendistanz exakt gleich Innendistanz bei untypischen runden Grosswerten (Copy-Paste-Verdacht)",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_ausseneinheit_kernloch": 25,
      "distanz_kernloch_innengeraet": 25
    },
    "expect": "soft",
    "why": "Zwei voneinander unabhaengige Strecken (aussen bis Kernloch, Kernloch bis Innengeraet) mit identisch grossem Wert von je 25 m sind statistisch unwahrscheinlich und deuten auf versehentliche Doppeleingabe desselben Werts."
  },
  {
    "id": "aufstellort.33",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aufstellort nicht geaendert, aber beide Alternativen vorhanden (widerspruechliche Erfassungslogik)",
    "field": "aufstellort_aenderung",
    "values": {
      "aufstellort_aenderung": false,
      "alternative_1_vorhanden": true,
      "alternative_2_vorhanden": true
    },
    "expect": "soft",
    "why": "Werden zwei Alternativ-Aufstellorte dokumentiert, deutet das auf eine offene/geaenderte Standortfrage hin. Gleichzeitig aufstellort_aenderung=false ist inkonsistent - entweder es gibt eine Aenderungs-/Entscheidungssituation oder nicht."
  },
  {
    "id": "aufstellort.34",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aussendistanz vorhanden, aber Innendistanz fehlt/NULL trotz Innengeraet",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_ausseneinheit_kernloch": 8,
      "distanz_kernloch_innengeraet": null
    },
    "expect": "block",
    "why": "Der Leitungsweg endet zwingend am Innengeraet. Ist die Aussenstrecke erfasst, muss auch die Innenstrecke (mind. > 0) angegeben sein - ein fehlender Wert macht die Gesamtleitungslaenge unbestimmbar."
  },
  {
    "id": "aufstellort.35",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Negative Anzahl Durchbrueche als Sonderfall -1 trotz vorhandener Leitung",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": -1,
      "distanz_ausseneinheit_kernloch": 5
    },
    "expect": "block",
    "why": "Eine Anzahl Bohrungen kann nie negativ sein; -1 ist haeufig ein versehentlich uebernommener Default/Sentinel-Wert. Bei vorhandenem Leitungsweg sind zudem >=1 Durchbrueche zwingend."
  },
  {
    "id": "aufstellort.36",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Gesamtleitungslaenge ueberschreitet maximale Kaeltemittel-Leitungslaenge (Split-WP) deutlich",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 40,
      "distanz_kernloch_innengeraet": 35
    },
    "expect": "soft",
    "why": "Bei Split-Geraeten ist die zulaessige Kaeltemittelleitungslaenge herstellerseitig begrenzt (oft ~30 m, max ~75 m je nach Modell). Eine Summe von 75 m liegt am/ueber dem oberen Limit und sollte geprueft/abgesichert werden."
  },
  {
    "id": "aufstellort.37",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Distanz alt/neuer Aufstellort gesetzt, aber Aenderungs-Flag fehlt UND Distanz absurd klein (mm)",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 0.02
    },
    "expect": "soft",
    "why": "Eine 'Aenderung' des Aufstellorts um 2 cm ist praktisch keine Standortaenderung (innerhalb Geraetebreite/Messtoleranz). Entweder Einheit verrutscht (cm/m) oder das Aenderungs-Flag wurde faelschlich gesetzt."
  },
  {
    "id": "aufstellort.38",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Anzahl Durchbrueche realistisch, aber als String mit Einheit ('2 Stk')",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": "2 Stk"
    },
    "expect": "block",
    "why": "Das Feld ist eine Ganzzahl. Eine Eingabe mit angehaengter Einheit/Text ist kein gueltiger Integer und wuerde beim Parsen scheitern oder unkontrolliert truncieren."
  },
  {
    "id": "aufstellort.39",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Aussen- und Innendistanz vertauscht (Aussen winzig, Innen riesig) bei Gartenaufstellung",
    "field": "distanz_ausseneinheit_kernloch",
    "values": {
      "distanz_ausseneinheit_kernloch": 0.3,
      "distanz_kernloch_innengeraet": 30
    },
    "expect": "soft",
    "why": "0,3 m Aussengeraet-zu-Kernloch deutet auf Wandmontage direkt am Haus, dann sind 30 m Innenstrecke fast nie noetig. Konstellation legt eine Vertauschung der beiden Distanzfelder nahe."
  },
  {
    "id": "sanitaer.1",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Negative Duschenzahl",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": -1
    },
    "expect": "block",
    "why": "Eine negative Anzahl an Duschen ist physikalisch unmoeglich. Anzahl ist eine Zaehlgroesse >= 0."
  },
  {
    "id": "sanitaer.2",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Negative Badewannenzahl",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": -2
    },
    "expect": "block",
    "why": "Negative Stueckzahl existiert nicht. Eine Zaehlgroesse kann nicht kleiner als 0 sein."
  },
  {
    "id": "sanitaer.3",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Nachkommastelle bei Duschen",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 2.5
    },
    "expect": "block",
    "why": "Duschen sind ganzzahlig. 2,5 Duschen sind baulich nicht moeglich, Feld ist als Ganzzahl definiert."
  },
  {
    "id": "sanitaer.4",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Nachkommastelle bei Badewannen",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 1.5
    },
    "expect": "block",
    "why": "Badewannen sind ganzzahlig. Halbe Badewanne ist baulich unmoeglich."
  },
  {
    "id": "sanitaer.5",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Unrealistisch hohe Duschenzahl (Wohngebaeude)",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 50
    },
    "expect": "soft",
    "why": "50 Duschen sind in einem Wohngebaeude extrem unplausibel (typisch 1-5). Deutet auf Tippfehler oder falsche Einheit hin; theoretisch denkbar bei Sonderbau, daher soft."
  },
  {
    "id": "sanitaer.6",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Absurd hohe Duschenzahl (physikalisch)",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 999
    },
    "expect": "block",
    "why": "999 Duschen sprengen jede reale Wohngebaeude-Grenze. Klarer Eingabefehler, hart abzuweisen."
  },
  {
    "id": "sanitaer.7",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Absurd hohe Badewannenzahl",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 500
    },
    "expect": "block",
    "why": "500 Badewannen passen in kein Wohngebaeude. Physikalisch/baulich unmoeglich."
  },
  {
    "id": "sanitaer.8",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Unplausibel viele Badewannen pro Bewohner",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 20,
      "anzahl_bewohner": 2
    },
    "expect": "soft",
    "why": "20 Badewannen bei 2 Bewohnern ist wirtschaftlich/baulich extrem unplausibel. Querfeld-Verhaeltnis weit ausserhalb der Norm."
  },
  {
    "id": "sanitaer.9",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Regendusche=ja, aber keine Dusche vorhanden",
    "field": "hat_regendusche",
    "values": {
      "hat_regendusche": true,
      "anzahl_duschen": 0
    },
    "expect": "block",
    "why": "Eine Regendusche ist eine Bauart der Dusche. Wenn anzahl_duschen=0 ist, kann es keine Regendusche geben - direkter Querfeld-Widerspruch."
  },
  {
    "id": "sanitaer.10",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Gar keine Sanitaer-Entnahmestelle bei vorhandenen Bewohnern",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "anzahl_badewannen": 0,
      "anzahl_bewohner": 4
    },
    "expect": "soft",
    "why": "Ein bewohntes Wohngebaeude (4 Bewohner) ohne jede Dusche UND ohne Badewanne ist hoechst unplausibel - es gibt keine Warmwasser-Zapfstelle fuers Baden/Duschen, was die WP-Dimensionierung (Trinkwarmwasser) unmoeglich macht."
  },
  {
    "id": "sanitaer.11",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Mehr Duschen als realistisch pro Bewohner",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 15,
      "anzahl_bewohner": 1
    },
    "expect": "soft",
    "why": "15 Duschen bei 1 Bewohner ist baulich/wirtschaftlich nicht plausibel. Stark abweichendes Querfeld-Verhaeltnis, deutet auf Tippfehler."
  },
  {
    "id": "sanitaer.12",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Bewohnerzahl negativ",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": -3
    },
    "expect": "block",
    "why": "Eine negative Bewohnerzahl ist unmoeglich. Personenzahl ist >= 0 (bzw. >=1 bei bewohntem Objekt)."
  },
  {
    "id": "sanitaer.13",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Bewohnerzahl Null bei bewohntem Aufmass",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": 0,
      "anzahl_duschen": 2
    },
    "expect": "soft",
    "why": "0 Bewohner bei vorhandenen Duschen/Sanitaer ist fuer ein zu beheizendes Wohngebaeude unplausibel; Trinkwarmwasserbedarf laesst sich ohne Personen nicht dimensionieren. Bei Leerstand theoretisch denkbar, daher soft."
  },
  {
    "id": "sanitaer.14",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Nachkommastelle bei Bewohnerzahl",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": 3.5
    },
    "expect": "block",
    "why": "Personen sind ganzzahlig. 3,5 Bewohner gibt es nicht, Feld ist Ganzzahl."
  },
  {
    "id": "sanitaer.15",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Absurd hohe Bewohnerzahl (Wohngebaeude)",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": 1000
    },
    "expect": "block",
    "why": "1000 Bewohner sprengen jede Einfamilien-/Mehrfamilienhaus-Realitaet im Aufmasskontext. Klarer Eingabefehler."
  },
  {
    "id": "sanitaer.16",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Sehr hohe Bewohnerzahl (grenzwertig MFH)",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": 60
    },
    "expect": "soft",
    "why": "60 Bewohner sind fuer das typische WP-Aufmass eines Wohngebaeudes (EFH/kleines MFH) sehr unplausibel; bei grossem MFH theoretisch moeglich, daher soft."
  },
  {
    "id": "sanitaer.17",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Leeres/fehlendes Pflichtfeld Duschen",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": null
    },
    "expect": "block",
    "why": "Anzahl Duschen ist fuer die Warmwasser-Dimensionierung erforderlich. Leerer/NULL-Wert darf nicht akzeptiert werden."
  },
  {
    "id": "sanitaer.18",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Text statt Zahl bei Duschen",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": "zwei"
    },
    "expect": "block",
    "why": "Falscher Typ: Das Feld ist eine Ganzzahl. Freitext wie 'zwei' ist nicht verwertbar."
  },
  {
    "id": "sanitaer.19",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Mehr Badewannen als Bewohner-realistisch und hoch",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 30,
      "anzahl_bewohner": 5
    },
    "expect": "soft",
    "why": "30 Badewannen bei 5 Bewohnern ist baulich/oekonomisch nicht plausibel. Verhaeltnis weit ueber jeder Norm."
  },
  {
    "id": "sanitaer.20",
    "page": "sanitaer",
    "domain": "wp",
    "label": "hat_regendusche kein Boolean",
    "field": "hat_regendusche",
    "values": {
      "hat_regendusche": "vielleicht"
    },
    "expect": "block",
    "why": "Falscher Typ: Feld ist boolesch (ja/nein). Werte wie 'vielleicht' sind nicht zulaessig."
  },
  {
    "id": "sanitaer.21",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Summe Sanitaerobjekte unplausibel hoch fuer EFH",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 40,
      "anzahl_badewannen": 40,
      "anzahl_bewohner": 4
    },
    "expect": "soft",
    "why": "80 Sanitaerobjekte bei 4 Bewohnern sind fuer ein Wohngebaeude voellig unrealistisch; deutet auf systematischen Eingabefehler in beiden Feldern."
  },
  {
    "id": "sanitaer.22",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Regendusche=ja bei genau 0 Duschen widerspricht Duschenzahl",
    "field": "hat_regendusche",
    "values": {
      "hat_regendusche": true,
      "anzahl_duschen": 0
    },
    "expect": "block",
    "why": "Eine Regendusche IST ein Duschplatz. Wenn anzahl_duschen=0, kann es technisch keine Regendusche geben - direkter Querfeld-Widerspruch (separat vom bereits gelisteten 'keine Dusche vorhanden', hier explizit der Zahlenwert 0)."
  },
  {
    "id": "sanitaer.23",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Badewannen vorhanden, aber gar keine Bewohner",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 1,
      "anzahl_duschen": 0,
      "anzahl_bewohner": 0
    },
    "expect": "soft",
    "why": "Sanitärobjekte in einem unbewohnten Objekt (0 Bewohner) sind für die WP-Warmwasser-Auslegung unplausibel - es gibt keinen Warmwasserbedarf, der die Entnahmestelle rechtfertigt."
  },
  {
    "id": "sanitaer.24",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Sehr viele Duschen bei nur 1 Bewohner",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 4,
      "anzahl_bewohner": 1
    },
    "expect": "soft",
    "why": "4 Duschen für eine Einzelperson ist für die Warmwasser-Gleichzeitigkeit unplausibel - so viele Entnahmestellen pro Kopf treiben die Auslegung unrealistisch nach oben."
  },
  {
    "id": "sanitaer.25",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Badewannen und Duschen beide 0 bei vorhandenen Bewohnern",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "anzahl_badewannen": 0,
      "hat_regendusche": false,
      "anzahl_bewohner": 3
    },
    "expect": "block",
    "why": "Bei 3 Bewohnern und KEINER einzigen Warmwasser-Entnahmestelle (weder Dusche, Regendusche noch Wanne) fehlt jede Zapfstelle - eine WP-Warmwasser-Auslegung ist ohne Entnahmestelle physikalisch sinnlos."
  },
  {
    "id": "sanitaer.26",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Extrem hohe Bewohnerzahl bei null Sanitärobjekten",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "anzahl_badewannen": 0,
      "anzahl_bewohner": 12
    },
    "expect": "block",
    "why": "Querfeld-Widerspruch: 12 Bewohner ohne jede Dusche/Wanne ist baulich unmöglich (Bad-Pflicht), die Kombination null Objekte + zweistellige Bewohnerzahl ist unzulässig."
  },
  {
    "id": "sanitaer.27",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Nachkommastelle/Komma bei Duschen (z.B. 2,5)",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 2.5
    },
    "expect": "block",
    "why": "Bereits 'Nachkommastelle bei Duschen' gelistet - hier der spezifische Fall eines deutschen Komma-Werts/0.5-Anteils als eigenständige Einheitenfalle; eine halbe Dusche existiert physikalisch nicht."
  },
  {
    "id": "sanitaer.28",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Badewanne aber keinerlei Dusche bei mehreren Bewohnern (untypisch)",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "hat_regendusche": false,
      "anzahl_badewannen": 1,
      "anzahl_bewohner": 5
    },
    "expect": "soft",
    "why": "5 Bewohner mit ausschließlich einer Badewanne und keiner einzigen Dusche ist für ein modernes Wohngebäude untypisch und sollte zumindest hinterfragt werden (Plausibilität der Warmwasser-Spitzenlast)."
  },
  {
    "id": "sanitaer.29",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Anzahl Duschen als Wert, der die Bewohnerzahl unrealistisch übersteigt (mehr Duschen als Personen-Vielfaches)",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 8,
      "anzahl_bewohner": 2
    },
    "expect": "soft",
    "why": "8 Duschen bei 2 Bewohnern (4 pro Kopf) ist für ein Wohngebäude unplausibel und verzerrt die Gleichzeitigkeits-/Warmwasserberechnung erheblich."
  },
  {
    "id": "sanitaer.30",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Regendusche-Flag bei leerem/fehlendem Duschenfeld",
    "field": "hat_regendusche",
    "values": {
      "hat_regendusche": true,
      "anzahl_duschen": null
    },
    "expect": "block",
    "why": "hat_regendusche=ja setzt eine Dusche voraus; wenn das Pflichtfeld anzahl_duschen leer/null ist, ist die Regenduschen-Angabe haltlos und das Formular inkonsistent."
  },
  {
    "id": "sanitaer.31",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Summe Dusche+Regendusche+Wanne übersteigt plausible Bäderzahl pro Bewohner massiv",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_duschen": 6,
      "hat_regendusche": true,
      "anzahl_badewannen": 6,
      "anzahl_bewohner": 3
    },
    "expect": "soft",
    "why": "Gesamt 12 Großzapfstellen bei 3 Bewohnern (4 Bäder pro Person) ist für ein Wohngebäude unrealistisch hoch - Querfeld-Plausibilität der gesamten Sanitärausstattung verletzt."
  },
  {
    "id": "sanitaer.32",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Anzahl Badewannen positiv, Bewohnerzahl fehlt/leer",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_badewannen": 2,
      "anzahl_duschen": 2,
      "anzahl_bewohner": null
    },
    "expect": "block",
    "why": "Ohne Bewohnerzahl lässt sich die Sanitärausstattung nicht plausibilisieren und keine Warmwasser-Auslegung rechnen - das Kontext-Pflichtfeld darf bei ausgefülltem Sanitärblock nicht leer sein."
  },
  {
    "id": "sanitaer.33",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Bewohnerzahl als Text/nicht-Zahl",
    "field": "anzahl_bewohner",
    "values": {
      "anzahl_bewohner": "vier"
    },
    "expect": "block",
    "why": "Bewohnerzahl ist eine Ganzzahl; ein Textwert ('vier') ist ein Typfehler (analog zum gelisteten Text-bei-Duschen-Fall, hier für das Kontextfeld Bewohner)."
  },
  {
    "id": "sanitaer.34",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Anzahl Badewannen als Text/nicht-Zahl",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": "eine"
    },
    "expect": "block",
    "why": "anzahl_badewannen ist eine Ganzzahl; ein Textwert ist ein Typfehler (das Gegenstück zum bereits gelisteten Text-bei-Duschen fehlt für Badewannen)."
  },
  {
    "id": "sanitaer.35",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Sehr hohe Badewannenzahl bei einem Bewohner",
    "field": "anzahl_badewannen",
    "values": {
      "anzahl_badewannen": 3,
      "anzahl_bewohner": 1
    },
    "expect": "soft",
    "why": "3 Badewannen für eine einzelne Person sind unplausibel; pro-Kopf-Verhältnis der Wannen ist deutlich zu hoch für ein realistisches Wohngebäude."
  },
  {
    "id": "unbegehbar.1",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Negative Raumanzahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": -1
    },
    "expect": "block",
    "why": "Eine Anzahl von Raeumen kann physikalisch nie negativ sein. Minimum ist 0."
  },
  {
    "id": "unbegehbar.2",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Stark negativer Wert",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": -5
    },
    "expect": "block",
    "why": "Negative Stueckzahl ist logisch unmoeglich; deutet auf Vorzeichen-/Tippfehler hin."
  },
  {
    "id": "unbegehbar.3",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Kommazahl statt Ganzzahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 2.5
    },
    "expect": "block",
    "why": "Raeume sind diskret zaehlbar; ein halber unbegehbarer Raum existiert nicht. Feld ist als Ganzzahl definiert."
  },
  {
    "id": "unbegehbar.4",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Kleine Dezimalstelle (Rundungs-/Tippfehler)",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 1.1
    },
    "expect": "block",
    "why": "Nicht-ganzzahliger Wert verletzt Datentyp; nur ganze Raeume zaehlbar."
  },
  {
    "id": "unbegehbar.5",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Wert oberhalb der fachlichen Obergrenze",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 6
    },
    "expect": "soft",
    "why": "Fachliche Spanne ist 0-5. 6 ist theoretisch denkbar, aber bei einem Wohngebaeude-Aufmass unplausibel und sollte hinterfragt werden."
  },
  {
    "id": "unbegehbar.6",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Deutlich zu hohe Raumanzahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 12
    },
    "expect": "soft",
    "why": "12 unbegehbare Raeume in einem Wohngebaeude sind realitaetsfern; vermutlich verwechselt mit Gesamtraumzahl."
  },
  {
    "id": "unbegehbar.7",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Absurd hohe Raumanzahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 99
    },
    "expect": "block",
    "why": "99 unbegehbare Raeume ueberschreiten jede reale Wohngebaeude-Groesse; physikalisch/baulich ausgeschlossen."
  },
  {
    "id": "unbegehbar.8",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Extremwert / Platzhalter-Zahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 9999
    },
    "expect": "block",
    "why": "Typischer Dummy-/Platzhalterwert, baulich unmoeglich. Muss hart abgewiesen werden."
  },
  {
    "id": "unbegehbar.9",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Integer-Overflow-Versuch",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 2147483648
    },
    "expect": "block",
    "why": "Wert oberhalb 32-bit-Integer-Grenze; weder fachlich noch technisch sinnvoll."
  },
  {
    "id": "unbegehbar.10",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Leeres Feld / fehlende Eingabe",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": null
    },
    "expect": "block",
    "why": "Pflichtfeld der Seite; ohne Angabe kann nicht zwischen '0 Raeume' und 'nicht ausgefuellt' unterschieden werden. Aufmass unvollstaendig."
  },
  {
    "id": "unbegehbar.11",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Leerstring statt Zahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": ""
    },
    "expect": "block",
    "why": "Leerer String ist keine gueltige Ganzzahl; Feld bleibt faktisch unbeantwortet."
  },
  {
    "id": "unbegehbar.12",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Text statt Zahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "zwei"
    },
    "expect": "block",
    "why": "Numerisches Feld darf keine Buchstaben/Worte annehmen; nicht maschinell auswertbar."
  },
  {
    "id": "unbegehbar.13",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Zahl mit Einheit als String",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "3 Raeume"
    },
    "expect": "block",
    "why": "Einheit/Text im Zahlenfeld; Feld erwartet reine Ganzzahl, kein gemischtes Format."
  },
  {
    "id": "unbegehbar.14",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Komma als Dezimaltrenner (DE-Locale)",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "1,5"
    },
    "expect": "block",
    "why": "Deutscher Komma-Dezimaltrenner ergibt erstens keinen Integer und zweitens keinen ganzen Raum; muss abgewiesen werden."
  },
  {
    "id": "unbegehbar.15",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Fuehrende Null / Oktal-Mehrdeutigkeit",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "03"
    },
    "expect": "soft",
    "why": "Fuehrende Null deutet auf Copy-Paste/Tippfehler; je nach Parser Oktal-Interpretation. Wert sollte normalisiert/hinterfragt werden."
  },
  {
    "id": "unbegehbar.16",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Boolean statt Ganzzahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": true
    },
    "expect": "block",
    "why": "Typfehler: Ja/Nein-Wert im Zahlenfeld; 'unbegehbare Raeume' ist eine Stueckzahl, kein Boolean."
  },
  {
    "id": "unbegehbar.17",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Wissenschaftliche Notation",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "1e2"
    },
    "expect": "block",
    "why": "Exponentialschreibweise (=100) ist weder erwartetes Eingabeformat noch fachlich plausible Raumzahl."
  },
  {
    "id": "unbegehbar.18",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unendlich / NaN",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "Infinity"
    },
    "expect": "block",
    "why": "Kein endlicher ganzzahliger Wert; technisch und fachlich unmoeglich als Raumzahl."
  },
  {
    "id": "unbegehbar.19",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Whitespace-only Eingabe",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "   "
    },
    "expect": "block",
    "why": "Nur Leerzeichen ist keine gueltige Zahl; faktisch leeres Pflichtfeld."
  },
  {
    "id": "unbegehbar.20",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Obergrenze gerade noch ueberschritten",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 5.0001
    },
    "expect": "block",
    "why": "Kombiniert Verletzung der Obergrenze (5) und Nicht-Ganzzahligkeit; klarer Eingabefehler."
  },
  {
    "id": "unbegehbar.21",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unbegehbare Räume gleich Gesamtraumzahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 4,
      "anzahl_raeume_gesamt": 4
    },
    "expect": "block",
    "why": "Wenn alle Räume des Gebäudes unbegehbar sind, kann kein Aufmaß stattfinden - es gäbe keinen einzigen begehbaren Raum, von dem aus aufgemessen wird. Unbegehbare = Gesamtanzahl ist logisch ein widersprüchlicher Aufmaßzustand."
  },
  {
    "id": "unbegehbar.22",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Mehr unbegehbare Räume als Gesamträume",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 5,
      "anzahl_raeume_gesamt": 3
    },
    "expect": "block",
    "why": "Eine Teilmenge (unbegehbare Räume) kann nie größer sein als die Gesamtmenge der Räume im Gebäude. Mathematisch und baulich unmöglich."
  },
  {
    "id": "unbegehbar.23",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unbegehbare Räume aber Wohnfläche null",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 2,
      "wohnflaeche_qm": 0
    },
    "expect": "block",
    "why": "Ein Gebäude mit 0 m² Wohnfläche existiert nicht und kann folglich keine unbegehbaren Räume haben. Querfeld-Widerspruch zwischen Gebäudegröße und Raumzahl."
  },
  {
    "id": "unbegehbar.24",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Viele unbegehbare Räume bei winziger Wohnfläche",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 5,
      "wohnflaeche_qm": 25
    },
    "expect": "soft",
    "why": "5 separate unbegehbare Räume auf nur 25 m² Gesamtwohnfläche ist baulich extrem unplausibel - ein Raum hätte im Schnitt unter 5 m². Querfeld-Plausibilität Raumzahl vs. Fläche."
  },
  {
    "id": "unbegehbar.25",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unbegehbare Räume in Wohnung ohne Keller/Dachgeschoss",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 3,
      "gebaeudetyp": "Wohnung"
    },
    "expect": "soft",
    "why": "In einer einzelnen Etagenwohnung gibt es typischerweise keine 3 unbegehbaren Räume (unbegehbar betrifft meist Speicher/Keller/verschlossene Technikräume). Bei Gebäudetyp Wohnung ist eine hohe Zahl unplausibel."
  },
  {
    "id": "unbegehbar.26",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Hex-/Sonderzahlbasis statt Dezimal",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "0x3"
    },
    "expect": "block",
    "why": "Hexadezimal-Notation (0x3) ist keine gültige dezimale Ganzzahl-Eingabe für eine Raumanzahl und muss abgelehnt werden."
  },
  {
    "id": "unbegehbar.27",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Tausendertrennzeichen in Eingabe",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "1.000"
    },
    "expect": "block",
    "why": "'1.000' mit Punkt-Tausendertrennzeichen (DE-Locale) würde als 1000 gemeint sein oder als 1,0 fehlinterpretiert - mehrdeutig und außerhalb des fachlichen Bereichs. Muss abgewiesen werden."
  },
  {
    "id": "unbegehbar.28",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Bruch-/Verhältnis-Schreibweise",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "1/2"
    },
    "expect": "block",
    "why": "Eine Bruchschreibweise '1/2' ist keine parsebare Ganzzahl und ergibt fachlich keinen halben unbegehbaren Raum."
  },
  {
    "id": "unbegehbar.29",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Vorzeichen-Plus mit Leerzeichen",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "+ 2"
    },
    "expect": "block",
    "why": "'+ 2' mit Leerzeichen zwischen Vorzeichen und Ziffer ist kein sauber parsebarer Integer-String und sollte als ungültiges Format abgelehnt werden."
  },
  {
    "id": "unbegehbar.30",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Null-Byte / Steuerzeichen in Eingabe",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "2\u0000"
    },
    "expect": "block",
    "why": "Eine Zahl gefolgt von einem Null-Byte/Steuerzeichen ist kein valider Ganzzahl-Wert und kann auf Parser-/Injection-Probleme hindeuten."
  },
  {
    "id": "unbegehbar.31",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unicode-Ziffern statt ASCII",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "２"
    },
    "expect": "block",
    "why": "Fullwidth-/Unicode-Ziffer '２' ist optisch eine 2, aber kein ASCII-Integer und wird von strengen Parsern nicht akzeptiert - muss normalisiert oder abgelehnt werden."
  },
  {
    "id": "unbegehbar.32",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Array statt Skalar",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": [
        2
      ]
    },
    "expect": "block",
    "why": "Ein Array [2] statt einer einzelnen Ganzzahl ist ein falscher Datentyp und muss abgelehnt werden."
  },
  {
    "id": "unbegehbar.33",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Null (null) explizit gesetzt",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": null
    },
    "expect": "block",
    "why": "Ein explizites null ist kein gültiger Zahlenwert; das Pflichtfeld muss eine konkrete Ganzzahl (inkl. 0) erhalten."
  },
  {
    "id": "unbegehbar.34",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unbegehbare Räume gesetzt aber Aufmaß als vollständig markiert",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 2,
      "aufmass_vollstaendig": true
    },
    "expect": "soft",
    "why": "Wenn unbegehbare Räume existieren, kann das Aufmaß dieser Räume nicht physisch erfolgt sein - ein als 'vollständig' markiertes Aufmaß widerspricht dem Vorhandensein unbegehbarer (nicht aufmessbarer) Räume."
  },
  {
    "id": "unbegehbar.35",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unbegehbare Räume bei Neubau im Rohbau",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 4,
      "baujahr": 2026,
      "gebaeudezustand": "Neubau"
    },
    "expect": "soft",
    "why": "Ein Neubau/Rohbau ist normalerweise komplett begehbar (noch keine vollgestellten/verschlossenen Räume). 4 unbegehbare Räume in einem Neubau sind fachlich unplausibel."
  },
  {
    "id": "unbegehbar.36",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Nicht-ganzzahliger String mit Exponent-Bruchteil",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": "2.5e0"
    },
    "expect": "block",
    "why": "'2.5e0' ergibt 2,5 - ein halber unbegehbarer Raum ist physikalisch unmöglich und die wissenschaftlich-dezimale Mischform ist als Ganzzahl ungültig."
  },
  {
    "id": "unbegehbar.37",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Datentyp Objekt/Map statt Zahl",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": {
        "value": 2
      }
    },
    "expect": "block",
    "why": "Ein verschachteltes Objekt statt eines Skalars ist ein falscher Datentyp und muss zurückgewiesen werden."
  },
  {
    "id": "pv.1",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung negativ",
    "field": "dachneigung",
    "values": {
      "dachneigung": -10
    },
    "expect": "block",
    "why": "Eine Dachneigung kann nicht negativ sein. Neigung ist als Winkel 0-90 Grad definiert; Werte < 0 sind physikalisch unmoeglich."
  },
  {
    "id": "pv.2",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung > 90 Grad",
    "field": "dachneigung",
    "values": {
      "dachneigung": 120
    },
    "expect": "block",
    "why": "Ein Dach kann maximal 90 Grad (senkrecht) geneigt sein. Ueber 90 Grad gibt es keine Dachflaeche mehr, das ist geometrisch unmoeglich."
  },
  {
    "id": "pv.3",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung exakt 90 Grad",
    "field": "dachneigung",
    "values": {
      "dachneigung": 90
    },
    "expect": "soft",
    "why": "90 Grad waere eine senkrechte Flaeche (Wand), kein bewohnbares Schraegdach. Theoretisch erfassbar (Fassaden-PV), fuer ein Wohndach aber praktisch unmoeglich und sehr begruendungspflichtig."
  },
  {
    "id": "pv.4",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung unrealistisch steil fuer Wohndach",
    "field": "dachneigung",
    "values": {
      "dachneigung": 75
    },
    "expect": "soft",
    "why": "Wohngebaeude-Schraegdaecher liegen real bei ~15-50 Grad. Ueber ~70 Grad ist keine normale Eindeckung/Modulmontage mehr moeglich - unplausibel, aber nicht ausgeschlossen (Sonderdach)."
  },
  {
    "id": "pv.5",
    "page": "pv",
    "domain": "pv",
    "label": "Satteldach mit 0 Grad Neigung",
    "field": "dachneigung",
    "values": {
      "dachform": "Satteldach",
      "dachneigung": 0
    },
    "expect": "soft",
    "why": "Ein Satteldach hat per Definition zwei geneigte Flaechen. 0 Grad waere ein Flachdach - die Dachform widerspricht der Neigung."
  },
  {
    "id": "pv.6",
    "page": "pv",
    "domain": "pv",
    "label": "Flachdach mit hoher Neigung",
    "field": "dachneigung",
    "values": {
      "dachform": "Flachdach",
      "dachneigung": 35
    },
    "expect": "soft",
    "why": "Ein Flachdach hat definitionsgemaess <= ~5-7 Grad Neigung. 35 Grad widerspricht der gewaehlten Dachform Flachdach."
  },
  {
    "id": "pv.7",
    "page": "pv",
    "domain": "pv",
    "label": "Ziegel-Neigungswinkel negativ",
    "field": "ziegel_neigung_grad",
    "values": {
      "ziegel_neigung_grad": -5
    },
    "expect": "block",
    "why": "Der Ziegel-Neigungswinkel ist ein Winkel und kann nicht negativ sein. Werte < 0 Grad sind physikalisch unmoeglich."
  },
  {
    "id": "pv.8",
    "page": "pv",
    "domain": "pv",
    "label": "Ziegel-Neigungswinkel > 90 Grad",
    "field": "ziegel_neigung_grad",
    "values": {
      "ziegel_neigung_grad": 95
    },
    "expect": "block",
    "why": "Ein Neigungswinkel kann 90 Grad nicht ueberschreiten. 95 Grad ist geometrisch unmoeglich."
  },
  {
    "id": "pv.9",
    "page": "pv",
    "domain": "pv",
    "label": "Ziegelneigung weicht stark von Dachneigung ab",
    "field": "ziegel_neigung_grad",
    "values": {
      "dachneigung": 30,
      "ziegel_neigung_grad": 70
    },
    "expect": "soft",
    "why": "Die Ziegel folgen der Dachflaeche; Ziegelneigung und Dachneigung sollten nahe beieinander liegen. 70 Grad Ziegel auf 30 Grad Dach ist widerspruechlich und begruendungspflichtig."
  },
  {
    "id": "pv.10",
    "page": "pv",
    "domain": "pv",
    "label": "Gebaeude-Entfernung negativ",
    "field": "gebaeude_entfernung",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": -5
    },
    "expect": "block",
    "why": "Eine Entfernung kann nicht negativ sein. Abstand zwischen zwei Gebaeuden ist immer >= 0 m."
  },
  {
    "id": "pv.11",
    "page": "pv",
    "domain": "pv",
    "label": "Module auf anderem Gebaeude, aber Entfernung 0 m",
    "field": "gebaeude_entfernung",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": 0
    },
    "expect": "block",
    "why": "Wenn Module und Wechselrichter auf VERSCHIEDENEN Gebaeuden sind, muss der Abstand > 0 m sein. 0 m widerspricht module_gleiches_gebaeude=false direkt."
  },
  {
    "id": "pv.12",
    "page": "pv",
    "domain": "pv",
    "label": "Gebaeude-Entfernung angegeben trotz gleichem Gebaeude",
    "field": "gebaeude_entfernung",
    "values": {
      "module_gleiches_gebaeude": true,
      "gebaeude_entfernung": 20
    },
    "expect": "soft",
    "why": "Bei module_gleiches_gebaeude=true gibt es kein zweites Gebaeude. Eine Gebaeude-Entfernung von 20 m ist dann gegenstandslos/widerspruechlich (das Feld wird im UI normalerweise gar nicht angezeigt)."
  },
  {
    "id": "pv.13",
    "page": "pv",
    "domain": "pv",
    "label": "Gebaeude-Entfernung unrealistisch gross",
    "field": "gebaeude_entfernung",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": 5000
    },
    "expect": "soft",
    "why": "Bei DC-Verkabelung zwischen Modul- und WR-Gebaeude sind 5000 m voellig unrealistisch (DC-Verluste, Kosten). Auf einem Wohngrundstueck liegen die Gebaeude i.d.R. < 50 m auseinander."
  },
  {
    "id": "pv.14",
    "page": "pv",
    "domain": "pv",
    "label": "Andere Gebaeude weit entfernt, aber DC nicht > 10 m",
    "field": "dc_ueber_10m",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": 50,
      "dc_ueber_10m": false
    },
    "expect": "soft",
    "why": "Wenn die Gebaeude 50 m auseinanderliegen, muss die DC-Leitung dazwischen zwangslaeufig > 10 m sein. dc_ueber_10m=false widerspricht der Entfernung von 50 m."
  },
  {
    "id": "pv.15",
    "page": "pv",
    "domain": "pv",
    "label": "Aufdachdaemmungs-Dicke negativ",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": -10
    },
    "expect": "block",
    "why": "Eine Daemmstaerke kann nicht negativ sein. Materialdicke ist immer >= 0."
  },
  {
    "id": "pv.16",
    "page": "pv",
    "domain": "pv",
    "label": "Aufdachdaemmung ja, aber Dicke 0",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 0
    },
    "expect": "block",
    "why": "Wenn aufdachdaemmung=true gesetzt ist, muss eine Daemmschicht > 0 vorhanden sein. 0 cm/mm Dicke widerspricht der Angabe, dass eine Aufdachdaemmung existiert."
  },
  {
    "id": "pv.17",
    "page": "pv",
    "domain": "pv",
    "label": "Aufdachdaemmungs-Dicke unrealistisch dick (Einheiten-/Wertfehler)",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 120
    },
    "expect": "soft",
    "why": "Das UI-Label sagt 'mm' (Platzhalter 120), die Feld-Grenzen erlauben aber max 60 (cm). 120 cm Aufdachdaemmung ist baulich absurd; typische Aufdachdaemmung liegt bei 8-24 cm. Klassischer mm/cm-Einheitenfehler."
  },
  {
    "id": "pv.18",
    "page": "pv",
    "domain": "pv",
    "label": "Aufdachdaemmungs-Dicke physikalisch unmoeglich gross",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 300
    },
    "expect": "block",
    "why": "300 cm (3 m) Aufdachdaemmung ist baulich unmoeglich. Selbst grosszuegigste Aufsparrendaemmung bleibt deutlich unter ~50 cm."
  },
  {
    "id": "pv.19",
    "page": "pv",
    "domain": "pv",
    "label": "Daemmstaerke angegeben trotz Aufdachdaemmung nein",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": false,
      "aufdachdaemmung_dicke": 20
    },
    "expect": "soft",
    "why": "Bei aufdachdaemmung=false darf es keine Daemmstaerke geben. 20 cm Dicke widerspricht der Angabe, dass keine Aufdachdaemmung vorhanden ist (Feld normalerweise ausgeblendet)."
  },
  {
    "id": "pv.20",
    "page": "pv",
    "domain": "pv",
    "label": "Denkmalschutz + Aufdachdaemmung (Aufbau veraendert Erscheinungsbild)",
    "field": "denkmalschutz",
    "values": {
      "denkmalschutz": "denkmalschutz",
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 20
    },
    "expect": "soft",
    "why": "Eine nachtraegliche Aufdachdaemmung hebt die Dachflaeche an und veraendert das Erscheinungsbild - bei Denkmalschutz meist genehmigungspflichtig/unzulaessig. Plausibel zu hinterfragen."
  },
  {
    "id": "pv.21",
    "page": "pv",
    "domain": "pv",
    "label": "Solarthermie vorhanden auf gleicher Dachflaeche wie geplante PV",
    "field": "solarthermie_vorhanden",
    "values": {
      "solarthermie_vorhanden": true,
      "dachform": "Pultdach"
    },
    "expect": "soft",
    "why": "Bestehende Solarthermie belegt Dachflaeche, die dann fuer PV-Module fehlt. Auf einem kleinen Pultdach kann das einen Konflikt um die Belegungsflaeche bedeuten - erfassen und pruefen."
  },
  {
    "id": "pv.22",
    "page": "pv",
    "domain": "pv",
    "label": "Trapezdach mit normaler Ziegeleindeckung/Ziegelneigung",
    "field": "ziegel_neigung_grad",
    "values": {
      "trapezdach": true,
      "ziegel_neigung_grad": 25
    },
    "expect": "soft",
    "why": "Ein Trapezblechdach hat keine Dachziegel. Eine Ziegelneigung anzugeben widerspricht der Angabe Trapezdach=true (Metalldach statt Ziegeldach)."
  },
  {
    "id": "pv.23",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung als Nachkommastelle unplausibel praezise / Komma-Verwechslung",
    "field": "dachneigung",
    "values": {
      "dachneigung": 3000
    },
    "expect": "block",
    "why": "3000 Grad ist als Winkel unmoeglich (typischer Tippfehler ohne Dezimalpunkt, z.B. 30,00 -> 3000). Jeder Winkel > 90 ist fuer eine Dachneigung ausgeschlossen."
  },
  {
    "id": "pv.24",
    "page": "pv",
    "domain": "pv",
    "label": "Ensembleschutz + Modulausrichtung Nord (sinnlos) bei Denkmal-Auflagen",
    "field": "dachausrichtung",
    "values": {
      "denkmalschutz": "ensembleschutz",
      "dachausrichtung": "Nord"
    },
    "expect": "soft",
    "why": "Reine Nordausrichtung liefert minimalen PV-Ertrag; in Kombination mit Ensembleschutz (zusaetzliche Genehmigungshuerden) ist eine reine Nord-Belegung wirtschaftlich/fachlich fragwuerdig - markieren."
  },
  {
    "id": "pv.25",
    "page": "pv",
    "domain": "pv",
    "label": "DC-Kabelweg > 10 m verneint, aber Fassaden- UND Dachhautweg verneint",
    "field": "dc_ueber_10m",
    "values": {
      "dc_fassade_moeglich": false,
      "dc_dachhaut_moeglich": false,
      "dc_ueber_10m": false
    },
    "expect": "soft",
    "why": "Wenn weder Fassade noch Dachhaut als DC-Weg moeglich sind, gibt es keinen plausiblen kurzen Verlegeweg - dass der Weg dann trotzdem unter 10 m bleibt, ist widerspruechlich und sollte begruendet werden."
  },
  {
    "id": "pv.26",
    "page": "pv",
    "domain": "pv",
    "label": "Daemmstaerke 30 in mm-Feld, aber als cm interpretiert (Einheiten-Trap)",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 30
    },
    "expect": "soft",
    "why": "UI-Label sagt 'Dämmstärke (mm)', Schema/Bounds rechnen in cm (max 60). 30 als cm = 30 cm Aufdachdämmung ist baulich extrem dick; 30 mm waeren plausibel. Die mm/cm-Diskrepanz zwischen Label und Speicherung muss abgefangen werden, sonst Faktor-10-Fehler."
  },
  {
    "id": "pv.27",
    "page": "pv",
    "domain": "pv",
    "label": "Daemmstaerke ungewoehnlich duenn (1 cm bringt nichts)",
    "field": "aufdachdaemmung_dicke",
    "values": {
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 1
    },
    "expect": "soft",
    "why": "1 cm Aufdachdämmung ist energetisch wirkungslos und als eigenständige Aufdachdämmung baupraktisch unüblich (Mindeststärken liegen real bei ~8-24 cm). Deutet auf Tippfehler/Einheitenfehler hin."
  },
  {
    "id": "pv.28",
    "page": "pv",
    "domain": "pv",
    "label": "Thermodach + separate Aufdachdaemmung gemeinsam angegeben",
    "field": "thermodach",
    "values": {
      "thermodach": true,
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 20
    },
    "expect": "soft",
    "why": "Ein Thermodach IST bereits ein gedämmtes Dachsystem (integrierte Aufdach-/Aufsparrendämmung). Zusätzlich separat 'Aufdachdämmung ja' mit Dicke ist eine widersprüchliche Doppelangabe desselben Sachverhalts."
  },
  {
    "id": "pv.29",
    "page": "pv",
    "domain": "pv",
    "label": "Flachdach mit Ziegelneigung/Ziegelgrad angegeben",
    "field": "ziegel_neigung_grad",
    "values": {
      "dachform": "Flachdach",
      "ziegel_neigung": "positiv",
      "ziegel_neigung_grad": 15
    },
    "expect": "soft",
    "why": "Ein Flachdach hat keine geneigte Ziegeleindeckung; ein Ziegel-Neigungsgrad von 15° widerspricht der Dachform Flachdach (üblicherweise Bitumen/Folie/Kies, nicht Pfannenziegel)."
  },
  {
    "id": "pv.30",
    "page": "pv",
    "domain": "pv",
    "label": "Ziegel-Neigungsgrad groesser als Dachneigung (geometrisch unmoeglich)",
    "field": "ziegel_neigung_grad",
    "values": {
      "dachneigung": 20,
      "ziegel_neigung": "positiv",
      "ziegel_neigung_grad": 35
    },
    "expect": "block",
    "why": "Der Ziegel liegt auf der Dachfläche; sein Eindeckungswinkel kann den Dachneigungswinkel nicht überschreiten. Ziegelneigung > Dachneigung ist geometrisch unmöglich."
  },
  {
    "id": "pv.31",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung unter Mindestdachneigung der Ziegeleindeckung",
    "field": "dachneigung",
    "values": {
      "dachform": "Satteldach",
      "dacheindeckung_art": "Tonziegel",
      "dachneigung": 5
    },
    "expect": "soft",
    "why": "Pfannen-/Tonziegel-Eindeckung braucht die Regeldachneigung (meist ~22°, mind. ~10° mit Zusatzmaßnahmen). 5° Dachneigung mit Tonziegel ist regelwidrig/unplausibel — entweder Neigung oder Eindeckungsart falsch."
  },
  {
    "id": "pv.32",
    "page": "pv",
    "domain": "pv",
    "label": "Module auf gleichem Gebaeude, aber DC-Kabelweg > 10 m verneint trotz grossem Dach",
    "field": "dc_ueber_10m",
    "values": {
      "module_gleiches_gebaeude": true,
      "dc_fassade_moeglich": false,
      "dc_dachhaut_moeglich": false,
      "dc_ueber_10m": false
    },
    "expect": "soft",
    "why": "Wenn weder Fassaden- noch Dachhautweg möglich ist, muss das DC-Kabel einen Umweg nehmen; dass es dabei unter 10 m bleibt, ist unplausibel. Spiegelfall zum bereits erfassten gebäudefremden Fall, hier am gleichen Gebäude."
  },
  {
    "id": "pv.33",
    "page": "pv",
    "domain": "pv",
    "label": "DC-Kabel laenger als 10 m verneint trotz grosser Gebaeudeentfernung",
    "field": "dc_ueber_10m",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": 9,
      "dc_ueber_10m": false
    },
    "expect": "soft",
    "why": "Bei ~9 m reiner Gebäudeentfernung kommen Dachweg, Fassadenführung und Hauseinführung hinzu — der reale DC-Kabelweg liegt dann fast sicher über 10 m. 'dc_ueber_10m=false' widerspricht der Entfernung."
  },
  {
    "id": "pv.34",
    "page": "pv",
    "domain": "pv",
    "label": "Gebaeudeentfernung knapp unter 1 m bei separatem Gebaeude",
    "field": "gebaeude_entfernung",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": 0.3
    },
    "expect": "soft",
    "why": "Zwei eigenständige Gebäude mit nur 0,3 m Abstand sind baulich kaum trennbar (Brandwand/Grenzabstand); so dicht ist eher dasselbe Gebäude oder ein Anbau. Entweder module_gleiches_gebaeude oder die Entfernung ist falsch."
  },
  {
    "id": "pv.35",
    "page": "pv",
    "domain": "pv",
    "label": "Nicht-Trapezdach, aber Trapezdach-Art ausgefuellt",
    "field": "trapezdach_art",
    "values": {
      "trapezdach": false,
      "trapezdach_art": "Stahltrapez"
    },
    "expect": "soft",
    "why": "Detailfeld 'Art des Trapezdachs' darf nur Inhalt haben, wenn trapezdach=true. Eine Trapez-Art bei trapezdach=false ist ein Querfeld-Widerspruch (Detail ohne Auslöser)."
  },
  {
    "id": "pv.36",
    "page": "pv",
    "domain": "pv",
    "label": "Trapezdach + Ziegeleindeckung/Ziegelneigung gleichzeitig",
    "field": "trapezdach",
    "values": {
      "trapezdach": true,
      "dacheindeckung_art": "Tonziegel",
      "ziegel_neigung": "positiv",
      "ziegel_neigung_grad": 20
    },
    "expect": "soft",
    "why": "Ein Trapezblechdach hat keine Ziegeleindeckung. Trapezdach=ja zusammen mit Tonziegel + Ziegelneigungsgrad ist ein direkter Widerspruch der Dachhaut-Angaben (eine fixe Befestigung statt Dachhaken)."
  },
  {
    "id": "pv.37",
    "page": "pv",
    "domain": "pv",
    "label": "Attika-Masse ausgefuellt, obwohl Attika nicht vorhanden",
    "field": "attika_masse",
    "values": {
      "attika_vorhanden": false,
      "attika_masse": "30 cm Höhe"
    },
    "expect": "soft",
    "why": "Attika-Maße dürfen nur bei attika_vorhanden=true existieren. Maßangabe ohne vorhandene Attika ist ein Detail-ohne-Auslöser-Widerspruch."
  },
  {
    "id": "pv.38",
    "page": "pv",
    "domain": "pv",
    "label": "Attika vorhanden, aber Satteldach (Attika gehoert zum Flachdach)",
    "field": "attika_vorhanden",
    "values": {
      "dachform": "Satteldach",
      "attika_vorhanden": true
    },
    "expect": "soft",
    "why": "Eine Attika (umlaufende Dachrandaufkantung) ist ein Flachdach-/Pultdach-Merkmal. Bei einem klassischen Satteldach ist 'Attika vorhanden' fachlich unplausibel — vermutlich Dachform oder Attika falsch."
  },
  {
    "id": "pv.39",
    "page": "pv",
    "domain": "pv",
    "label": "Flachdach mit Dachausrichtung Sued (Flachdach hat keine First-/Trauf-Ausrichtung)",
    "field": "dachausrichtung",
    "values": {
      "dachform": "Flachdach",
      "dachneigung": 0,
      "dachausrichtung": "Süd"
    },
    "expect": "soft",
    "why": "Bei 0° Flachdach gibt es keine geneigte Dachfläche mit Himmelsrichtung; die Module werden frei aufgeständert. Eine fixe 'Süd'-Dachausrichtung ist für ein echtes Flachdach inhaltlich sinnlos (Ost-West-Aufständerung üblich)."
  },
  {
    "id": "pv.40",
    "page": "pv",
    "domain": "pv",
    "label": "Walmdach mit voller Suedflaeche behandelt (Geometrie-Hinweis)",
    "field": "dachform",
    "values": {
      "dachform": "Walmdach",
      "dachausrichtung": "Süd",
      "dachneigung": 45
    },
    "expect": "soft",
    "why": "Ein Walmdach hat allseitig geneigte, kleinere Teilflächen statt einer großen durchgehenden Südfläche. Die Kombination ist nicht falsch, aber belegungstechnisch zu prüfen — Hinweis, dass die nutzbare Südfläche begrenzt ist."
  },
  {
    "id": "pv.41",
    "page": "pv",
    "domain": "pv",
    "label": "Denkmalschutz + Thermodach (Dachaufbau/Optik veraendert sich)",
    "field": "thermodach",
    "values": {
      "denkmalschutz": "denkmalschutz",
      "thermodach": true
    },
    "expect": "soft",
    "why": "Ein Thermodach hebt den Dachaufbau an und verändert Dachhöhe/Traufdetail sichtbar. Bei Denkmalschutz ist eine solche Veränderung des Erscheinungsbilds genehmigungskritisch — analog zur bereits erfassten Denkmal+Aufdachdämmung-Regel, hier für Thermodach."
  },
  {
    "id": "pv.42",
    "page": "pv",
    "domain": "pv",
    "label": "Blitzschutz nicht vorhanden, aber als geprueft/abbaubar markiert",
    "field": "blitzschutz_geprueft",
    "values": {
      "blitzschutz_vorhanden": false,
      "blitzschutz_geprueft": true,
      "blitzschutz_abbaubar": true
    },
    "expect": "soft",
    "why": "Wenn kein Blitzschutz vorhanden ist, kann er weder geprüft noch als abbaubar bewertet werden. Detailangaben zu einer nicht existenten Anlage sind ein Querfeld-Widerspruch."
  },
  {
    "id": "pv.43",
    "page": "pv",
    "domain": "pv",
    "label": "Solarthermie vorhanden, aber kein Dach/Flachdach 0 Grad widerspruechlich zur ST-Nutzung",
    "field": "solarthermie_vorhanden",
    "values": {
      "solarthermie_vorhanden": true,
      "dachform": "Flachdach",
      "dachneigung": 0,
      "denkmalschutz": "denkmalschutz"
    },
    "expect": "soft",
    "why": "Bestehende Solarthermie auf einem denkmalgeschützten Gebäude ist genehmigungsrechtlich ungewöhnlich (sichtbare Kollektoren meist untersagt). Kombination Denkmalschutz + vorhandene ST sollte zur Prüfung markiert werden."
  },
  {
    "id": "pv.44",
    "page": "pv",
    "domain": "pv",
    "label": "Ziegel lose = ja, aber Trapezblechdach (keine losen Ziegel moeglich)",
    "field": "ziegel_lose",
    "values": {
      "trapezdach": true,
      "ziegel_lose": "ja"
    },
    "expect": "soft",
    "why": "Ein Trapezblechdach hat keine losen Einzelziegel. 'Ziegel lose = ja' bei trapezdach=true ist sachlich unmöglich — es gibt keine Ziegel, die lose sein könnten."
  },
  {
    "id": "pv.45",
    "page": "pv",
    "domain": "pv",
    "label": "Mansarddach mit einer einzigen Dachneigung (Mansarddach hat zwei)",
    "field": "dachneigung",
    "values": {
      "dachform": "Mansarddach",
      "dachneigung": 30
    },
    "expect": "soft",
    "why": "Ein Mansarddach hat per Definition zwei unterschiedliche Neigungen je Dachfläche (steiler unterer, flacherer oberer Teil). Eine einzelne Neigung von 30° bildet die für die Modulbelegung relevante Geometrie nicht ab — zur Klärung welche Fläche gemeint ist."
  },
  {
    "id": "pv.46",
    "page": "pv",
    "domain": "pv",
    "label": "Gebaeudeentfernung 0 bei separatem Gebaeude (Null wo unmoeglich)",
    "field": "gebaeude_entfernung",
    "values": {
      "module_gleiches_gebaeude": false,
      "gebaeude_entfernung": 0
    },
    "expect": "block",
    "why": "Wenn Module und Wechselrichter auf verschiedenen Gebäuden sind, ist eine Entfernung von exakt 0 m logisch unmöglich — bei 0 m wäre es dasselbe Gebäude. (Distinkt vom bereits erfassten 'Module auf anderem Gebaeude, aber Entfernung 0 m', hier explizit als Block mit allen drei beteiligten Feldern.)"
  },
  {
    "id": "pv.47",
    "page": "pv",
    "domain": "pv",
    "label": "Pultdach mit Dachneigung 0 Grad",
    "field": "dachneigung",
    "values": {
      "dachform": "Pultdach",
      "dachneigung": 0
    },
    "expect": "block",
    "why": "Ein Pultdach ist definitionsgemäß eine einseitig GENEIGTE Dachfläche. 0° Neigung widerspricht der Dachform Pultdach (das wäre ein Flachdach) — analog zur erfassten Satteldach-0°-Regel, hier für Pultdach."
  },
  {
    "id": "pv.48",
    "page": "pv",
    "domain": "pv",
    "label": "Dachneigung als Promille/Gefaelle statt Grad eingegeben",
    "field": "dachneigung",
    "values": {
      "dachform": "Flachdach",
      "dachneigung": 2
    },
    "expect": "soft",
    "why": "Flachdächer werden oft mit Gefälle in Prozent (z.B. 2%) geplant. Wird '2' als 2° Grad gespeichert, ist das ein Einheiten-Mix (Gefälle-% vs. Neigungsgrad). 2° ist zwar technisch ein flaches Dach, der Wert deutet auf %-statt-Grad-Verwechslung hin und sollte geprüft werden."
  },
  {
    "id": "pv.49",
    "page": "pv",
    "domain": "pv",
    "label": "Lagermoeglichkeit verneint, aber Beschreibung ausgefuellt",
    "field": "lagermoeglichkeit_beschreibung",
    "values": {
      "lagermoeglichkeit": false,
      "lagermoeglichkeit_beschreibung": "Garage"
    },
    "expect": "soft",
    "why": "Eine Beschreibung der Lagermöglichkeit ('Garage') bei lagermoeglichkeit=false ist ein Detail-ohne-Auslöser-Widerspruch — entweder ist eine Lagermöglichkeit vorhanden oder nicht."
  },
  {
    "id": "pv.50",
    "page": "pv",
    "domain": "pv",
    "label": "Ziegelneigung negativ, aber Neigungsgrad als negative Zahl statt positivem Betrag",
    "field": "ziegel_neigung_grad",
    "values": {
      "ziegel_neigung": "negativ",
      "ziegel_neigung_grad": -10
    },
    "expect": "block",
    "why": "Die Richtung steckt bereits im Enum ziegel_neigung='negativ'; das Gradfeld trägt nur den Betrag und muss >= 0 sein. Ein zusätzlich negativer Grad-Wert (-10) ist doppelte Negation und als Betrag unmöglich."
  },
  {
    "id": "pv.51",
    "page": "pv",
    "domain": "pv",
    "label": "Fassade gedaemmt, aber DC-Kabel ueber Fassade als problemlos moeglich UND > 10 m verneint",
    "field": "dc_fassade_moeglich",
    "values": {
      "fassade_gedaemmt": true,
      "dc_fassade_moeglich": true,
      "fassade_daemmung_dicke": "20 cm"
    },
    "expect": "soft",
    "why": "Bei einer 20 cm dicken (WDVS-)Fassadendämmung ist eine Aufputz-DC-Leitung über die Fassade nur mit Eingriff in die Dämmebene möglich. 'dc_fassade_moeglich=true' ohne Vermerk bei gedämmter Fassade sollte zur Prüfung markiert werden."
  }
];
