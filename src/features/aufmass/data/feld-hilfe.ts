/**
 * Feld-Hilfe-Register — laientaugliche Hilfe pro Formularfeld.
 *
 * Drei Ebenen pro Feld:
 *  1. inline  — immer sichtbare Kurzzeile unter dem Feld (sagt WO man den Wert findet).
 *  2. sheet   — optionale Tiefe im Bottom-Sheet (nur "schwere" Felder).
 *  3. kiFrage — vorbefüllte Frage für den "KI fragen"-Button (nur schwere Felder).
 *
 * Statisch, kein KI-Call. Faktenbasis: Aufmaß-Feld-Research (verifiziert),
 * GEG-/U-Wert-Referenzen korrigiert (siehe Werte in den Sheets).
 *
 * KI/Bild-Ehrlichkeit: Nur Typenschild-/Beleg-OCR ist zuverlässig. Bei Feldern wie
 * fassade_gedaemmt, vorlauftemperatur, rohrsystem wird KEIN "Foto-und-KI-erkennt-das"
 * versprochen — dort echte Text-Tipps (Klopftest, Energieausweis, Eigentümer fragen).
 */

export interface FeldHilfeSheet {
  titel: string;
  /** "Wo finde ich das?" — Quellen in Prioritätsreihenfolge, menschenlesbar (z.B. "Energieausweis Seite 1", "Schornsteinfeger-Protokoll", "Eigentümer fragen"). KEINE URLs. */
  quellen?: string[];
  /** Schritt-für-Schritt vor Ort (z.B. Reflextest am Fenster). Optional. */
  schritte?: string[];
  /** Typische Werte / Plausibilität (kurz). */
  typisch?: string;
  /** Häufigste Fehler / Verwechslungen (kurz). */
  fallstricke?: string;
  /** Pfad zu einem Referenzbild unter /public (optional, wir liefern Bilder später nach). */
  bildUrl?: string;
}

export interface FeldHilfe {
  /** Ebene 1: immer sichtbare Inline-Zeile unter dem Feld. MAX ~12 Wörter, Du-Form, sagt WO man den Wert findet. */
  inline: string;
  /** Ebene 2: optionale Tiefe im Bottom-Sheet (nur "schwere" Felder). */
  sheet?: FeldHilfeSheet;
  /** Ebene 3: vorbefüllte KI-Frage für den "KI fragen"-Button (nur schwere Felder). */
  kiFrage?: string;
}

/** Key = Formular-Feldname (Schema). Verschachtelte U-Werte als Punkt-Pfad. */
export const FELD_HILFE: Record<string, FeldHilfe> = {
  /* ============================ Techniker ============================ */
  techniker_name: {
    inline: 'Dein Name als Aufmaßmeister vor Ort.',
  },
  techniker_telefon: {
    inline: 'Deine Rückruf-Nummer für den Innendienst.',
  },
  thermocheck_datum: {
    inline: 'Tag des Vor-Ort-Termins, meist automatisch gesetzt.',
  },

  /* ====================== Bestehende Heizung ======================== */
  heizung_inbetriebnahme_datum: {
    inline: 'Steht auf dem Typenschild am Kessel oder im Schornsteinfeger-Protokoll.',
    sheet: {
      titel: 'Wann wurde der jetzige Kessel eingebaut?',
      quellen: [
        'Typenschild am Kessel (seitlich / hinter der Frontabdeckung)',
        'Schornsteinfeger- / Feuerstättenbescheid, letztes Kehr-/Messprotokoll',
        'Wartungsprotokoll der Heizungsfirma',
        'Energieausweis Seite 1, Feld "Baujahr Wärmeerzeuger"',
        'Installations-Rechnung oder Eigentümer fragen',
      ],
      typisch: 'Bestandskessel meist 1995–2015. Kessel über 30 Jahre (Konstanttemperatur) ist oft austauschpflichtig.',
      fallstricke: 'Häufigste Verwechslung: Hausbaujahr statt Kesselbaujahr. Der Kessel wurde oft 1–2× erneuert. Brennwertgeräte sind von der 30-Jahre-Regel ausgenommen.',
    },
    kiFrage: 'Wie finde ich heraus, in welchem Jahr mein Heizkessel eingebaut wurde?',
  },
  heizung_funktionstuechtig: {
    inline: 'Läuft die Heizung noch? Beim Eigentümer erfragen, im Display nach Fehlern schauen.',
  },
  bauantrag_datum: {
    inline: 'Näherungswert: "Baujahr Gebäude" aus dem Energieausweis Seite 1.',
    sheet: {
      titel: 'Bauantragsdatum → Baualtersklasse / Dämmstandard',
      quellen: [
        'Energieausweis Seite 1 ("Baujahr Gebäude" — gute Näherung)',
        'Bauakte / Baugenehmigung beim Bauamt (exaktes Datum)',
        'Kaufvertrag, Grundbuch oder Teilungserklärung',
        'Eigentümer fragen ("Wann wurde gebaut?") — grobes Jahr reicht',
      ],
      typisch: 'Bestand meist 1950–2010. Wichtige Dämm-Schwellen: vor 1977 (kaum Dämmung), WSVO 1977/1984/1995, EnEV 2002.',
      fallstricke: 'Bauantrag ≠ Fertigstellung ≠ Sanierungsjahr. Eine spätere Dämmung ändert das Antragsdatum NICHT (separat über U-Werte erfassen). Bei Fertigstellung minus 1–2 Jahre rechnen.',
    },
    kiFrage: 'Wo finde ich das Baujahr meines Hauses, wenn ich keinen Energieausweis habe?',
  },
  fossile_brennstoffe_nach_austausch: {
    inline: 'Planungsfrage: Bleibt nach dem Umbau noch Gas/Öl (Hybrid)? Voll-Wärmepumpe = nein.',
    sheet: {
      titel: 'Nach Austausch noch fossil heizen?',
      quellen: [
        'Keine Ablesequelle — ergibt sich aus dem geplanten Konzept',
        'Mit Eigentümer / Berater klären: alter Kessel als Spitzenlast behalten?',
      ],
      typisch: 'Bei Galvanek meist "nein" (Voll-Wärmepumpe). "Ja/teilweise" nur bei Hybrid (alte Heizung bleibt als Backup).',
      fallstricke: 'Fossil = Gas und Öl. Holz/Pellets = biogen, Strom-Wärmepumpe = nicht fossil. Bei Hybrid muss die Wärmepumpe führend sein (GEG-65%-EE).',
    },
    kiFrage: 'Was bedeutet "fossile Brennstoffe" und wann zählt meine geplante Anlage als Hybrid?',
  },

  /* =========================== Gebäude ============================== */
  gebaeudetyp: {
    inline: 'Vor Ort ansehen: freistehend, Doppelhaushälfte, Reihenhaus oder Mehrfamilienhaus?',
    sheet: {
      titel: 'Welcher Gebäudetyp ist es?',
      quellen: [
        'Einfamilienhaus = freistehend, ringsum keine angebauten Nachbarhäuser',
        'Doppelhaushälfte = an EINER Seite mit dem Nachbarhaus verbunden',
        'Reihenhaus = mitten in einer Reihe, beide Seiten Nachbarn',
        'Reihenendhaus = am Ende der Reihe, eine Seite frei',
        'Mehrfamilienhaus = mehrere Wohnungen in einem Gebäude',
        'Gewerbe = gewerblich genutztes Gebäude (kein Wohnhaus)',
      ],
      typisch: 'Genau diese sechs Typen sind wählbar. Maßgeblich ist, an wie vielen Seiten andere beheizte Gebäude angebaut sind (das beeinflusst die Wärmeverluste).',
      fallstricke: 'Reihenmittel- und Reihenendhaus verwechseln (Mitte = beide Seiten Nachbar, Ende = nur eine). Eine angebaute, aber unbeheizte Garage macht aus dem EFH kein angebautes Haus.',
    },
    kiFrage: 'Wie ordne ich mein Haus einem der Gebäudetypen zu (z.B. Reihenhaus vs. Reihenendhaus)?',
  },
  beheizte_wohnflaeche_m2: {
    inline: 'Steht im Energieausweis oder Kaufvertrag — nur beheizte Fläche.',
    sheet: {
      titel: 'Beheizte Wohnfläche in m²',
      quellen: [
        'Energieausweis (Wohnfläche bzw. Gebäudenutzfläche)',
        'Bauakte / Wohnflächenberechnung, Kaufvertrag, Teilungserklärung',
        'Eigentümer fragen — die meisten kennen "ihre" m²',
        'Notfalls grob schätzen: Grundfläche je Etage × beheizte Etagen',
      ],
      typisch: 'EFH 100–200 m², DHH/Reihenhaus 90–160 m², Wohnung 50–120 m². Im Schnitt ~47 m² pro Person.',
      fallstricke: 'Wohnfläche ≠ Gebäudenutzfläche A_N (A_N ist ~1,2–1,35× größer). Unbeheizten Keller/Garage/Dachboden NICHT mitzählen. Dachschrägen unter 1 m gar nicht, 1–2 m nur zur Hälfte.',
    },
    kiFrage: 'Welche Fläche meine ich hier — Wohnfläche oder beheizte Gebäudenutzfläche, und wo steht sie?',
  },
  anzahl_bewohner: {
    inline: 'Eigentümer fragen: Wie viele Personen wohnen dauerhaft hier?',
  },
  anzahl_etagen: {
    inline: 'Nur beheizte Geschosse zählen — unbeheizter Keller/Dachboden zählt NICHT.',
  },
  hat_denkmalschutz: {
    inline: 'Nur Ja/Nein. Die meisten Häuser stehen NICHT unter Schutz — im Zweifel "Nein".',
    sheet: {
      titel: 'Steht das Gebäude unter Denkmalschutz?',
      quellen: [
        'Kaufvertrag (Denkmalstatus steht dort oft drin)',
        'Untere Denkmalschutzbehörde / Denkmalamt der Gemeinde (verbindlich)',
        'Öffentliche Denkmalliste / Denkmal-Atlas des Bundeslandes',
        'Eigentümer fragen (wissen es meist wegen Förderung/Auflagen)',
      ],
      typisch: 'Nur Ja oder Nein (kein "unbekannt"). Entscheidungsregel: Die allermeisten Häuser stehen NICHT unter Denkmalschutz. "Ja" nur, wenn das Gebäude oder Ensemble offiziell als Baudenkmal gelistet ist — typisch bei Fachwerk/historischen Altbauten. Wenn nichts darauf hindeutet → "Nein".',
      fallstricke: 'Alt heißt nicht automatisch denkmalgeschützt. Ensemble-Schutz (ganze Straße) wird übersehen. Teil-Denkmalschutz (nur Fassade) wird zu Unrecht als "kein Schutz" abgehakt — gerade die Außenoptik der Wärmepumpe ist dann betroffen. Im Zweifel den Eigentümer fragen, nicht raten.',
    },
    kiFrage: 'Wie finde ich heraus, ob mein Haus unter Denkmalschutz oder Ensemble-Schutz steht?',
  },
  durchschnittsverbrauch_3_jahre: {
    inline: 'In kWh eintragen. Faustformel: 1 L Heizöl ≈ 10 kWh, 1 m³ Erdgas ≈ 10 kWh.',
    sheet: {
      titel: 'Jahresverbrauch (3-Jahres-Schnitt) in kWh',
      quellen: [
        'Jahresabrechnung des Energieversorgers (Gas und Fernwärme oft direkt in kWh)',
        'Heizöl-Lieferscheine/Tankrechnungen der letzten 3 Jahre (Liter)',
        'Zählerstände (Gas-Zähler m³/Jahr) bzw. Verbrauchs-Energieausweis (kWh/m²·a × Wohnfläche)',
      ],
      typisch: 'Das Feld erwartet eine reine kWh-Zahl — es gibt KEIN Einheitenfeld und KEINE automatische Umrechnung, du musst selbst umrechnen. Faustformel: Heizöl 1 Liter ≈ 10 kWh, Erdgas 1 m³ ≈ 10 kWh. Beispiel: 2.000 L Öl/Jahr → 20.000 kWh. Saniertes EFH ~8.000–15.000 kWh/a, unsaniertes EFH ~20.000–35.000 kWh/a.',
      fallstricke: 'Faktor-10-Fehler: Liter Öl / m³ Gas sind NICHT gleich kWh — erst ×10 rechnen. Bedarfsausweis ist KEIN echter Verbrauch (nur Verbrauchsausweis nehmen). Gesamt-kWh eintragen, nicht den Energieausweis-Kennwert pro m².',
    },
    kiFrage: 'Wie rechne ich meine Liter Öl bzw. m³ Gas pro Jahr in Kilowattstunden um?',
  },
  fassade_gedaemmt: {
    inline: 'Klopftest (hohl = Dämmung) und tiefe Fensterlaibung; sonst Eigentümer / Baujahr.',
    sheet: {
      titel: 'Ist die Außenwand gedämmt?',
      quellen: [
        'Eigentümer fragen ("Fassade saniert/gedämmt? Welches Jahr?") — Rechnung ist Goldstandard',
        'Bauakte beim Bauamt (zeigt Wandaufbau)',
        'Energieausweis Seite 1: Baujahr (vor 1977 fast immer ungedämmt). Achtung: KEINE U-Werte drauf.',
      ],
      schritte: [
        'Laibungs-Test: Tiefe von Außenkante bis Fensterrahmen messen. >20–25 cm mit sichtbarer Stufe = nachträglich gedämmt (Fenster wirkt "versenkt").',
        'Klopftest: auf den Putz klopfen — hohl/dumpf und leicht nachgebend = meist EPS-Dämmung (WDVS); hart/massiv = direkt verputztes Mauerwerk.',
      ],
      typisch: 'Nur Ja/Nein (kein "unbekannt"). Baualter-Entscheidungsregel als ehrlicher Fallback, wenn nicht direkt feststellbar: vor ~1979 meist UNgedämmt (außer sichtbares WDVS / nachträgliche Dämmung); Neubau/Kernsanierung ab ~1995 meist gedämmt. Vor 1977 praktisch immer ungedämmt (U ~1,2–1,7), 1980er 6–8 cm, nachträgliches WDVS meist 12–16 cm. GEG-Referenz Außenwand 0,28 W/(m²K).',
      fallstricke: 'Dicker Putz oder Klinkerriemchen täuschen Dämmung vor. Eine Kerndämmung (im zweischaligen Mauerwerk) ist von außen unsichtbar — hier hilft nur Bauakte/Endoskopie. "Verputzt = gedämmt" ist FALSCH. Wenn nicht sicher feststellbar: anhand Baujahr + sichtbarer Indizien beste Einschätzung, im Zweifel Eigentümer fragen. Kein zuverlässiger Foto-KI-Check.',
    },
    kiFrage: 'Wie finde ich ohne Bauunterlagen heraus, ob meine Fassade gedämmt ist?',
  },
  dach_gedaemmt: {
    inline: 'Auf dem Dachboden nach Dämmmatten zwischen den Sparren schauen.',
    sheet: {
      titel: 'Ist das Dach / die oberste Geschossdecke gedämmt?',
      quellen: [
        'Sichtprüfung von innen auf dem Dachboden',
        'Eigentümer fragen + Sanierungsrechnung',
        'Bauakte / Energieausweis (Baujahr)',
      ],
      schritte: [
        'Dämmmatten zwischen den Sparren (gelb/braun = Mineralwolle, weiß = EPS) + Folie sichtbar = Dach gedämmt.',
        'Nur nackte Sparren + Ziegel/Unterspannbahn von unten = NICHT gedämmt.',
        'Dämmschicht auf dem Dachbodenboden = oberste Geschossdecke gedämmt.',
      ],
      typisch: 'Nur Ja/Nein (kein "unbekannt"). Baualter-Entscheidungsregel als ehrlicher Fallback, wenn nicht direkt feststellbar: vor ~1979 meist UNgedämmt (außer sichtbare nachträgliche Dämmung); Neubau/Kernsanierung ab ~1995 meist gedämmt. Vor 1969 meist ungedämmt (U ~1,2–1,6), ab 1995 10–12 cm, heute 14–22 cm. GEG-Referenz Dach/oberste Geschossdecke 0,20 W/(m²K).',
      fallstricke: 'Eine dünne Folie allein unter den Ziegeln ist nur die Unterspannbahn, KEINE Dämmung. Bei verkleideten Schrägen ist die Dämmung unsichtbar → Befragung/Bauakte. "Spitzboden kalt" heißt nicht ungedämmt. Wenn nicht sicher feststellbar: anhand Baujahr + sichtbarer Indizien beste Einschätzung, im Zweifel Eigentümer fragen.',
    },
    kiFrage: 'Mein Dachboden ist verkleidet — wie finde ich heraus, ob das Dach gedämmt ist? (Es gibt auch einen unverbindlichen Foto-Tipp.)',
  },
  rohrsystem: {
    inline: 'Am Heizkörper: zwei getrennte Anschlüsse = Zweirohr. Unsicher? "Unbekannt" wählen.',
    sheet: {
      titel: 'Einrohr- oder Zweirohrheizung?',
      quellen: [
        'Sichtprüfung am Heizkörper-Anschluss',
        'Rohrführung im Keller verfolgen (durchgehende Ringleitung = Einrohr)',
        'Installateur / Eigentümer fragen',
      ],
      schritte: [
        'Zweirohr: zwei getrennte Anschlüsse, kein wasserführendes Verbindungsrohr dazwischen (heute Standard).',
        'Einrohr: Vor- und Rücklauf enden oft in einer gemeinsamen Block-Armatur; Heizkörper werden mit Entfernung vom Kessel größer.',
      ],
      typisch: 'Einfamilienhäuser meist Zweirohr. Einrohr v.a. 1970er–1980er, oft Mehrfamilien-/Reihenhäuser. "Unbekannt" ist als ehrliche Antwort zulässig.',
      fallstricke: 'Für Laien schwer sicher zu unterscheiden — lieber "unbekannt" als raten. Auch Einrohr-Armaturen haben zwei Anschlüsse (Verwechslungsgefahr). Kein zuverlässiger Foto-KI-Check.',
    },
    kiFrage: 'Wie erkenne ich am Heizkörper, ob ich eine Einrohr- oder Zweirohrheizung habe?',
  },
  verglasung: {
    inline: 'Reflextest im Dunkeln: 2 Lichtreflexe = einfach, 4 = zweifach, 6 = dreifach.',
    sheet: {
      titel: 'Einfach-, Zweifach- oder Dreifachverglasung?',
      quellen: [
        'Reflexionstest mit Flamme/Taschenlampe',
        'Produktionsjahr/Bezeichnung im Abstandhalter (Randverbund) ablesen',
        'Originalrechnung des Fensterbauers / Eigentümer fragen',
      ],
      schritte: [
        'Im Dunkeln Flamme oder Handy-Lampe schräg (~45°) vor die Scheibe halten.',
        'Reflexe zählen: jede Scheibe erzeugt ZWEI Reflexe — 2 = Einfachglas, 4 = Zweifach, 6 = Dreifach.',
        'Eine verfärbte (oft violette) Spiegelflamme = Wärmeschutzbeschichtung (Low-E).',
        'Tipp Wärmeschutz: Eine VIOLETT/anders schimmernde Spiegel-Flamme = Wärmeschutz-Variante (…_waermeschutz) wählen, sonst die Basis-Stufe.',
      ],
      typisch: 'Einfachglas Uw ~5,0–5,8. Altes 2-fach-Isolierglas ~2,5–3,0. 2-fach Wärmeschutz ~1,1–1,6. Modernes 3-fach ~0,7–1,1. GEG-Referenz/Bestands-Höchstwert beim Tausch Uw 1,3 W/(m²K).',
      fallstricke: 'Kasten-/Verbundfenster (zwei Einfachscheiben) zeigen 4 Reflexe und werden fälschlich für modernes 2-fach-Isolierglas gehalten — energetisch fast so schlecht wie Einfachglas. Altes 2-fach ohne Low-E sieht im Test gleich aus wie modernes.',
    },
    kiFrage: 'Wie zähle ich die Reflexe beim Verglasungs-Test richtig und woran erkenne ich eine Wärmeschutzbeschichtung?',
  },
  hat_kamin: {
    inline: 'Kamin/Kaminofen oder Schornstein am Dach vorhanden? Sichtprüfung.',
  },
  hat_solarthermie: {
    inline: 'Solarthermie = Rohre + Warmwasserspeicher (Wärme), NICHT die Strom-PV.',
  },
  vorlauftemperatur: {
    inline: 'Pflichtwert. Nicht ablesbar? Schätzen: alte HK ~60–70 °C, moderne ~45–55, FBH ~30–40.',
    sheet: {
      titel: 'Vorlauftemperatur (°C) — das wärmere Rohr',
      quellen: [
        'Heizungsregler / Display am Kessel (am Display "VL" suchen, Menü "Vorlauf")',
        'Thermometer an der Vorlaufleitung (das wärmere der beiden Rohre am Kessel)',
        'Heizkurve im Regler — am aussagekräftigsten an einem kalten Tag',
        'Eigentümer / Wartungsfirma nach eingestellter Max-Vorlauftemperatur fragen',
      ],
      typisch: 'Pflichtfeld — eine grobe Einordnung genügt, wenn nicht ablesbar. Schätz-Fallback nach Heizkörper-Typ: alte Rippen-/Plattenheizkörper ~60–70 °C; moderne/große Heizkörper ~45–55 °C; Fußbodenheizung ~30–40 °C. WP-freundlich ist ≤45–55 °C.',
      fallstricke: 'Vorlauf mit Rücklauf oder Warmwassertemperatur verwechseln. Im Sommer ist der abgelesene Wert niedriger als der Auslegungswert — der niedrige Sommerwert täuscht WP-Eignung vor (Heizkurve). Soll- vs. Ist-Wert beachten.',
    },
    kiFrage: 'Wo lese ich die Vorlauftemperatur ab und warum ist der Sommerwert nicht aussagekräftig?',
  },
  ruecklauftemperatur: {
    inline: 'Pflichtwert. Nicht ablesbar? Vorlauf minus 7–10 °C, z.B. Vorlauf 60 → Rücklauf ~50.',
    sheet: {
      titel: 'Rücklauftemperatur (°C) — das kühlere Rohr',
      quellen: [
        'Thermometer an der Rücklaufleitung (das kühlere der beiden Rohre am Kessel)',
        'Regler / Display, sofern angezeigt (am Display "RL" suchen)',
        'Differenz zum Vorlauf am Thermometerpaar ablesen',
      ],
      typisch: 'Pflichtfeld — wenn nicht ablesbar, schätzen: Rücklauf ist typisch Vorlauf minus 7–10 °C (Spreizung). Beispiel: Vorlauf 60 → Rücklauf ~50. Bei alten Anlagen kann die Spreizung 10–20 K betragen, Fußbodenheizung-Rücklauf ~25–35 °C.',
      fallstricke: 'Mit Vorlauf verwechselt (kühleres Rohr = Rücklauf). Rücklauf darf nie höher als Vorlauf sein. Bei stehender Pumpe/abgeschalteter Heizung gleichen sich beide an → Messung wertlos.',
    },
    kiFrage: 'Welches der beiden Rohre am Kessel ist der Rücklauf und was sagt die Spreizung aus?',
  },

  /* ============================ U-Werte ============================= */
  /* --- Außenwand --- */
  'u_werte.aussenwand.aussenputz_vorhanden': {
    inline: 'Hat die Außenwand außen eine Putzschicht? Sichtprüfung.',
  },
  'u_werte.aussenwand.aussenputz_cm': {
    inline: 'Putzdicke außen, meist 1,5–3 cm; grobe Schätzung reicht.',
  },
  'u_werte.aussenwand.armierung_vorhanden': {
    inline: 'Armierungsgewebe im Putz (typisch bei WDVS) — meist nur über die Rechnung bekannt.',
  },
  'u_werte.aussenwand.daemmstoff_typ': {
    inline: 'An einer Öffnung (Steckdose/Rollladenkasten) erkennbar; sonst Rechnung/Bauakte.',
    sheet: {
      titel: 'Dämmstofftyp der Außenwand',
      quellen: [
        'Blick in eine Öffnung an der Außenwand (Steckdose, Rollladenkasten)',
        'Originalrechnung des Dämm-Handwerkers',
        'Bauakte / Baubeschreibung beim Bauamt',
      ],
      schritte: [
        'Mineralwolle = faserig, gelb/braun.',
        'EPS/Styropor = weiße Kügelchen.',
        'Holzfaser = braun/holzig.',
      ],
      typisch: 'Lambda gängiger Dämmstoffe: Mineralwolle 0,032–0,040, EPS 0,030–0,040, Holzfaser 0,038–0,050, PUR/PIR 0,022–0,028 W/(mK).',
      fallstricke: 'Innen-/Außenputz wird mit Dämmung verwechselt. Ohne Öffnung ist der Typ Raterei — dann lieber Rechnung/Bauakte. KI kann nicht in die Wand sehen, nur Belege auslesen. Im Zweifel „andere" wählen oder per geprueft_per=ki_abgeleitet aus dem Baujahr ableiten.',
    },
    kiFrage: 'Woran erkenne ich, welcher Dämmstoff in meiner Außenwand steckt?',
  },
  'u_werte.aussenwand.daemmstoff_cm': {
    inline: 'Dämmdicke in cm — aus Rechnung/Bauakte oder an einer Öffnung messen.',
  },
  'u_werte.aussenwand.daemmstoff_jahr': {
    inline: 'Jahr der Fassadendämmung — Eigentümer fragen, Rechnung ist Goldstandard.',
  },
  'u_werte.aussenwand.mauerwerk_material': {
    inline: 'Eigentümer fragen: Ziegel, Kalksandstein, Porenbeton (Ytong) oder Beton?',
    sheet: {
      titel: 'Mauerwerksmaterial der Außenwand',
      quellen: [
        'Eigentümer fragen',
        'Baujahr gibt Hinweis (Energieausweis)',
        'Bauakte / Baubeschreibung',
      ],
      typisch: 'Auswahl: Vollziegel, Hochlochziegel, Kalksandstein, Ytong/Porenbeton, Beton, Bruchstein, Gasbeton oder "Andere". Grobe Laien-Faustregel nach Baualter: Altbau vor ~1950 oft Vollziegel oder Bruchstein; 1960er–80er meist Hochlochziegel oder Kalksandstein; Ytong/Porenbeton = weiße, leichte Blöcke (jünger). Im Zweifel "geprueft_per = ki_abgeleitet" aus dem Baujahr setzen. Mauerwerksdicke Altbau oft 24–49 cm.',
      fallstricke: '"Klinker" ist nur eine Verblendschale, nicht zwingend die tragende Wand. Porenbeton/Leichtziegel dämmen auch ohne Zusatzdämmung relativ gut — nicht unterschätzen. Nicht raten: ohne Beleg lieber "Andere" + Notiz oder über das Baujahr ableiten.',
    },
    kiFrage: 'Wie finde ich heraus, aus welchem Material meine tragende Außenwand besteht?',
  },
  'u_werte.aussenwand.mauerwerk_cm': {
    inline: 'Wanddicke an einer Fensterlaibung oder Außentür messen (cm).',
  },
  'u_werte.aussenwand.innenputz_cm': {
    inline: 'Dicke des Innenputzes in cm — meist 1–2 cm, grob schätzen reicht.',
  },
  'u_werte.aussenwand.geprueft_per': {
    inline: 'Beleg: gemessen, Foto, Kundenangabe (Unterlagen) oder KI-abgeleitet (geschätzt).',
    sheet: {
      titel: 'Womit ist der Wandaufbau belegt?',
      quellen: [
        'gemessen = du hast Dicke/Aufbau selbst nachgemessen',
        'foto = der Aufbau ist auf einem Foto erkennbar (z.B. offene Laibung/Steckdose)',
        'kundenangabe = vom Eigentümer oder aus Unterlagen (Rechnung, Bauakte)',
        'ki_abgeleitet = geschätzt / aus dem Baujahr abgeleitet',
      ],
      typisch: 'Genau diese vier Stufen sind wählbar — keine andere. Je weiter oben, desto belastbarer.',
      fallstricke: 'Schätzung aus dem Baujahr ist "ki_abgeleitet", nicht "kundenangabe". Ein Foto der Fassade ohne sichtbaren Aufbau ist KEIN "foto"-Beleg für die Dämmung.',
    },
  },

  /* --- Dach --- */
  'u_werte.dach.dachtyp': {
    inline: 'Steildach oder Flachdach? Von außen erkennbar.',
    sheet: {
      titel: 'Dachtyp und Aufbau',
      quellen: [
        'Dachboden von innen (beste Quelle für den Aufbau)',
        'Eindeckung von außen ansehen',
        'Eigentümer + Rechnung + Bauakte',
      ],
      schritte: [
        'Satteldach: klassisches Spitzdach mit zwei schrägen Seiten (häufigster Typ).',
        'Pultdach: nur EINE schräge Dachfläche (wie ein Pult).',
        'Walmdach: an allen vier Seiten abgeschrägt (keine senkrechten Giebelwände).',
        'Flachdach: flach bzw. kaum geneigt — von unten sieht man die Dämmung nicht, sie liegt oben in der Abdichtung.',
      ],
      typisch: 'Genau diese vier Typen sind wählbar. Im EFH-Bestand überwiegt das Satteldach mit Ziegel-/Betoneindeckung. GEG-Referenz Dach 0,20 W/(m²K).',
      fallstricke: 'Walmdach mit Satteldach verwechseln (Walm = an allen 4 Seiten abgeschrägt, Sattel = nur 2 Seiten + senkrechte Giebel). Bei bewohntem, innen verkleidetem Dachgeschoss ist der Aufbau unsichtbar. Beim Flachdach sieht man die Dämmung von unten gar nicht.',
    },
    kiFrage: 'Welcher Dachtyp ist meiner und wie erkenne ich den Dämmaufbau?',
  },
  'u_werte.dach.eindeckung_material': {
    inline: 'Eindeckung: Ziegel, Betonstein, Bitumen (Flachdach) oder Metall?',
    sheet: {
      titel: 'Eindeckungsmaterial des Dachs',
      fallstricke: 'Dachziegel aus Ton vs. Beton sind optisch kaum zu unterscheiden — im Zweifel „andere" oder nach Eigentümer-Angabe.',
    },
  },
  'u_werte.dach.unterspannbahn_vorhanden': {
    inline: 'Dünne Folie/Vlies direkt unter den Ziegeln — sie dämmt NICHT.',
  },
  'u_werte.dach.zwischensparren_daemmstoff_typ': {
    inline: 'Dämmung zwischen den Sparren: Mineralwolle (gelb/braun) oder EPS (weiß)?',
    sheet: {
      titel: 'Zwischensparren-Dämmstoff',
      quellen: [
        'Dachboden von innen ansehen (Dämmung zwischen den Sparren)',
        'Dachsanierungs-Rechnung',
        'Bauakte / Baujahr für Schätzung',
      ],
      schritte: [
        'Mineralwolle = faserig, gelb/braun.',
        'EPS = weiß.',
        'Holzfaser = braun/holzig. Raumseitige Folie = Dampfsperre (KEINE Dämmung).',
      ],
      typisch: 'Typische Zwischensparren-Dicke heute 18–24 cm. Lambda: Mineralwolle 0,032–0,040, PUR/PIR 0,022–0,028 W/(mK).',
      fallstricke: 'Unterspannbahn (dünne Folie unter den Ziegeln) und Dampfsperre (raumseitige Folie) werden mit Dämmung verwechselt — beide dämmen nicht.',
    },
    kiFrage: 'Welcher Dämmstoff liegt zwischen meinen Dachsparren und wie unterscheide ich ihn von der Dampfsperre?',
  },
  'u_werte.dach.zwischensparren_cm': {
    inline: 'Dicke der Zwischensparren-Dämmung in cm — an einer offenen Stelle messen.',
  },
  'u_werte.dach.zwischensparren_jahr': {
    inline: 'Jahr der Dämmung — Eigentümer fragen, Rechnung ist der Goldstandard.',
  },
  'u_werte.dach.aufdach_daemmstoff_typ': {
    inline: 'Dämmung oberhalb der Sparren (von innen sieht man nur Holz) — meist über Rechnung.',
  },
  'u_werte.dach.aufdach_cm': {
    inline: 'Dicke der Aufdachdämmung in cm — aus Rechnung/Bauakte.',
  },
  'u_werte.dach.aufdach_jahr': {
    inline: 'Jahr der Aufdach-Dämmung — Eigentümer fragen / Rechnung.',
  },
  'u_werte.dach.untersparren_cm': {
    inline: 'Zusätzliche Dämmlage unter den Sparren, in cm — falls vorhanden.',
  },
  'u_werte.dach.dampfsperre_vorhanden': {
    inline: 'Raumseitige Folie (silbrig/transparent) — Feuchteschutz, keine Dämmung.',
  },
  'u_werte.dach.flachdach_abdichtung': {
    inline: 'Nur bei Flachdach: Abdichtung (Bitumen, Folie) — aus Bauakte/Eigentümer.',
    sheet: {
      titel: 'Abdichtung des Flachdachs',
      fallstricke: 'Bitumen = schwarze Schweißbahn; PVC/TPO = helle Kunststoff-Folie; im Zweifel „andere".',
    },
  },
  'u_werte.dach.flachdach_gefaelle_prozent': {
    inline: 'Nur Flachdach: Neigung in % (meist 2–5 %); aus Bauakte oder grob, im Zweifel leer lassen.',
  },
  'u_werte.dach.geprueft_per': {
    inline: 'Beleg: gemessen, Foto, Kundenangabe (Unterlagen) oder KI-abgeleitet (geschätzt).',
  },

  /* --- Unterer Abschluss --- */
  'u_werte.unten.art': {
    inline: 'Bodenplatte (kein Keller) oder Kellerdecke? Eigentümer fragen / Treppe nach unten.',
    sheet: {
      titel: 'Unterer Abschluss der beheizten Zone',
      quellen: [
        'Keller vorhanden? Eigentümer fragen / Treppe nach unten',
        'Keller beheizt oder kalt? Heizkörper im Keller = beheizt',
        'Kellerdecke von unten ansehen (Dämmplatten vs. nackte Decke)',
      ],
      schritte: [
        'Kein Keller → Bodenplatte direkt auf dem Erdreich (Dämmung im Aufbau, unsichtbar).',
        'Mit Keller → ist er beheizt? Dann zählt die Kellerwand, sonst die Kellerdecke als dämmende Grenze.',
      ],
      typisch: 'U-Wert Kellerdecke/Bodenplatte: vor 1970 ~0,9–1,2; ab 2010 ~0,1–0,18. GEG-Referenz Boden/Keller 0,35 W/(m²K); Bestands-Höchstwert Kellerdecke-Sanierung 0,30.',
      fallstricke: 'Frage beheizt/unbeheizt richtig beantworten — falsche Zonierung verfälscht die Heizlast stark. Kellerdecken-Putz wird mit Dämmung verwechselt. Bodenplatten-Dämmung liegt unter dem Estrich → nicht sichtbar.',
    },
    kiFrage: 'Ist bei mir die Kellerdecke oder die Bodenplatte der relevante untere Abschluss, und wie sehe ich, ob sie gedämmt ist?',
  },
  'u_werte.unten.daemmung_typ': {
    inline: 'An der Kellerdecke angebrachte Platten erkennbar; Bodenplatte über Bauakte.',
  },
  'u_werte.unten.daemmung_cm': {
    inline: 'Dicke der Kellerdecken-/Bodendämmung in cm — meist 6–12 cm.',
  },
  'u_werte.unten.daemmung_jahr': {
    inline: 'Jahr der Dämmung — Eigentümer fragen, Rechnung ist Goldstandard.',
  },
  'u_werte.unten.geprueft_per': {
    inline: 'Beleg: gemessen, Foto, Kundenangabe (Unterlagen) oder KI-abgeleitet (geschätzt).',
  },

  /* --- Fenster --- */
  'u_werte.fenster.getauscht': {
    inline: 'Wurden die Fenster seit dem Baujahr getauscht? Eigentümer fragen.',
  },
  'u_werte.fenster.tausch_jahr': {
    inline: 'Tauschjahr — Eigentümer fragen oder Produktionsjahr im Abstandhalter ablesen.',
  },
  'u_werte.fenster.rahmenmaterial': {
    inline: 'Kunststoff (weiß, hohl), Holz (Maserung), Alu (kalt, metallisch) oder Holz-Alu?',
  },
  'u_werte.fenster.u_wert': {
    inline: 'Uw moderner Fenster (0,4–3,0). Einfachglas gehört NICHT hier rein — leer lassen.',
    sheet: {
      titel: 'Fenster-U-Wert (Uw — ganzes Fenster inkl. Rahmen)',
      quellen: [
        'Originalrechnung des Fensterbauers (Goldstandard: Uw, Jahr, Rahmen)',
        'Energielabel / Aufkleber am Fenster',
        'Sonst aus Verglasungsart + Rahmen + Jahr schätzen',
      ],
      typisch: 'Dieses Feld ist für den Uw moderner Fenster und akzeptiert nur 0,4–3,0. Modernes 3-fach ~0,7–0,95, 2-fach Wärmeschutz ~1,1–1,6, alte Isolierfenster ~2,5–3,0. GEG-Referenz/Bestands-Höchstwert beim Tausch Uw 1,3 W/(m²K).',
      fallstricke: 'Alte Einfachverglasung (Uw ~5) gehört NICHT in dieses Feld — sie liegt über 3,0; dafür ist das Feld "Verglasung". Wenn der Uw unbekannt ist: Feld leer lassen und nur "Verglasung" wählen. Ug (nur Glas) nicht mit Uw (ganzes Fenster inkl. Rahmen) verwechseln — Uw ist immer etwas höher. "Neue Fenster" heißt nicht automatisch 3-fach; Teiltausch (nur EG neu) ist häufig.',
    },
    kiFrage: 'Was ist der Unterschied zwischen Ug und Uw und wo finde ich den Uw-Wert meiner Fenster?',
  },
  'u_werte.fenster.originalrechnung_url': {
    inline: 'Foto/PDF der Fensterrechnung anhängen — Goldstandard für den U-Wert.',
  },

  /* --- Anbau --- */
  'u_werte.anbau.vorhanden': {
    inline: 'Anbau/Aufstockung/Wintergarten? Materialwechsel oder Fuge in der Fassade.',
  },
  'u_werte.anbau.baujahr': {
    inline: 'Baujahr des Anbaus separat erfragen — kann Jahrzehnte jünger sein als das Haus.',
  },
  'u_werte_haftung_bestaetigt': {
    inline: 'Du bestätigst, dass die U-Wert-Angaben nach bestem Wissen korrekt sind.',
  },

  /* ===================== Heizungsraum / Anschlüsse ================== */
  mehr_bilder_heizungsraum: {
    inline: 'Zusätzliche Fotos vom Heizungsraum — je mehr, desto besser für den Innendienst.',
  },
  heizungsraum_verlegen: {
    inline: 'Soll die neue WP-Technik woanders hin als die alte Heizung? Mit Kunde klären.',
  },
  anschluss_gruppe: {
    inline: 'Distanz in Metern vom alten zum neuen Standort — grob mit Bandmaß entlang des Rohrwegs.',
    sheet: {
      titel: 'Anschlüsse am neuen Heizungs-Standort',
      quellen: [
        'Vorlauf = warmes Heizungswasser HIN zu den Heizkörpern',
        'Rücklauf = abgekühltes Wasser ZURÜCK zur Heizung',
        'Warmwasser = warmes Wasser zu Hahn/Dusche',
        'Kaltwasser = Frischwasser-Zulauf',
        'Zirkulation = zusätzliche Warmwasser-Ringleitung, damit sofort warmes Wasser kommt (NICHT in jedem Haus vorhanden — oft fehlt sie)',
      ],
      schritte: [
        '"Vorhanden?" = ob diese Leitung am neuen Standort gebraucht wird bzw. schon dort liegt.',
        'Distanz messen: mit dem Bandmaß entlang des geplanten Rohrwegs vom alten zum neuen Standort, in Metern.',
        'Grob genügt — um Ecken messen, nicht Luftlinie.',
      ],
      typisch: 'Vorlauf, Rücklauf, Warm- und Kaltwasser sind fast immer da. Eine Zirkulationsleitung gibt es nur in einem Teil der Häuser.',
      fallstricke: 'Vorlauf und Rücklauf verwechseln (Vorlauf = hin/warm, Rücklauf = zurück/abgekühlt). Eine fehlende Zirkulationsleitung fälschlich als "vorhanden" markieren. Luftlinie statt Rohrweg messen.',
    },
    kiFrage: 'Was ist eine Zirkulationsleitung und woran erkenne ich, ob mein Haus eine hat?',
  },
  anschluss_vorlauf_distanz: {
    inline: 'Mit dem Bandmaß entlang des Rohrwegs messen (um Ecken, nicht Luftlinie), in Metern.',
  },
  anschluss_vorlauf_vorhanden: {
    inline: 'Liegt diese Leitung am neuen Standort? Details: Hilfe bei „Anschlüsse".',
  },
  anschluss_ruecklauf_vorhanden: {
    inline: 'Liegt diese Leitung am neuen Standort? Details: Hilfe bei „Anschlüsse".',
  },
  anschluss_warmwasser_vorhanden: {
    inline: 'Liegt diese Leitung am neuen Standort? Details: Hilfe bei „Anschlüsse".',
  },
  anschluss_kaltwasser_vorhanden: {
    inline: 'Liegt diese Leitung am neuen Standort? Details: Hilfe bei „Anschlüsse".',
  },
  anschluss_zirkulation_vorhanden: {
    inline: 'Liegt diese Leitung am neuen Standort? Details: Hilfe bei „Anschlüsse".',
  },
  anschluss_ruecklauf_distanz: {
    inline: 'Distanz in Metern, mit Bandmaß entlang des Rohrwegs.',
  },
  anschluss_warmwasser_distanz: {
    inline: 'Distanz in Metern, mit Bandmaß entlang des Rohrwegs.',
  },
  anschluss_kaltwasser_distanz: {
    inline: 'Distanz in Metern, mit Bandmaß entlang des Rohrwegs.',
  },
  anschluss_zirkulation_distanz: {
    inline: 'Distanz in Metern, mit Bandmaß entlang des Rohrwegs.',
  },

  /* =========================== Heizungsart ========================= */
  heizungsart: {
    inline: 'Typenschild am Kessel + Indizien: Öltank = Öl, Gaszähler = Gas.',
    sheet: {
      titel: 'Womit heizt die jetzige Anlage?',
      quellen: [
        'Typenschild am Kessel (Geräteart steht drauf, z.B. "Gas-Brennwertkessel")',
        'Indizien vor Ort: Öltank = Öl, Gaszähler/-anschluss = Gas, Flüssiggastank im Garten, Pelletlager, Übergabestation = Fernwärme',
        'Schornsteinfegerprotokoll, Energieausweis, letzte Brennstoffrechnung',
      ],
      typisch: 'Auswahl ist nur Gas, Öl oder Sonstige. Pellets/Holz, Wärmepumpe, Fernwärme und Nachtspeicher (Strom) → "Sonstige" wählen und im Freitext angeben. DE-Bestand: überwiegend Erdgas, dann Heizöl.',
      fallstricke: 'Gas-Brennwert vs. Gas-Niedertemperatur (beides "Gas"). Flüssiggas (Tank) und Erdgas (Netz) zählen beide als "Gas". Ein stillgelegter Öltank heißt nicht zwingend Ölheizung. Schornstein heißt nicht automatisch Festbrennstoff. Alles, was nicht Gas oder Öl ist, gehört unter "Sonstige".',
    },
    kiFrage: 'Wie erkenne ich am Kessel und im Heizraum, mit welchem Energieträger geheizt wird?',
  },
  heizungsart_sonstige: {
    inline: 'Nur bei "Sonstige": Energieträger als Freitext eintragen.',
  },
  oeltank_liter_gesamt: {
    inline: 'Nennvolumen vom Tankschild/Plakette — bei Batterietanks alle Behälter summieren.',
  },
  oeltank_anzahl: {
    inline: 'Tanks im Keller/Tankraum zählen (Batterietank = mehrere verbundene Behälter).',
  },
  oeltank_liter_aktuell: {
    inline: 'Aktueller Füllstand — am genauesten mit Peilstab; muss ≤ Gesamtvolumen sein.',
  },
  oeltank_transport_beschreibung: {
    inline: 'Wie kommt man an die Tanks ran (Zugang, Türen, Treppen) — für die Demontage.',
  },

  /* ============================ Heizkörper ========================= */
  heizkoerper_typ: {
    inline: 'Heizkörper an der Wand, Fußbodenheizung (Verteilerkasten) oder beides?',
    sheet: {
      titel: 'Wärmeverteilung im Haus',
      quellen: [
        'Sichtprüfung Raum für Raum',
        'Heizkreisverteiler (viele Rohrschleifen) im Flur/HWR = Fußbodenheizung',
        'Eigentümer fragen, in welchen Räumen Fußbodenheizung liegt',
      ],
      schritte: [
        'Heizkörper an Wänden sichtbar = Heizkörper.',
        'Keine Heizkörper, aber warmer Boden + Verteilerkasten = Fußbodenheizung.',
        'Häufig Mischung (Bad/Neubau Boden, Rest Heizkörper).',
      ],
      typisch: 'Bestand überwiegend Heizkörper. Häuser ab ~2000 oft Fußbodenheizung. Große Flächen + gut gedämmt = niedrige Vorlauftemperatur (WP-freundlich).',
      fallstricke: 'Fußbodenheizung wird übersehen, weil unsichtbar — Indiz ist der Heizkreisverteiler, nicht der Bodenbelag. Alte kleine Rippenheizkörper brauchen hohe Vorlauftemperatur (WP-ungeeignet). Elektrische Handtuchheizkörper nicht mitzählen.',
    },
    kiFrage: 'Wie erkenne ich, ob in einem Raum eine Fußbodenheizung liegt, wenn ich keine Heizkörper sehe?',
  },

  /* ============================= Elektrik ========================== */
  hat_erdung: {
    inline: 'Am Zählerschrank nach der Schiene mit grün-gelben Kabeln suchen; unsicher = nein.',
    sheet: {
      titel: 'Erdung / Potentialausgleich vorhanden?',
      quellen: [
        'Sichtprüfung am Zählerschrank / Hausanschlusskasten',
        'Eigentümer / Elektriker fragen',
      ],
      schritte: [
        'Potentialausgleichsschiene (PAS) suchen: Metallschiene nahe Hausanschluss/Wasseruhr.',
        'Mehrere dicke, meist grün-gelbe Erdungskabel laufen dort zusammen (Wasser, Gas, Heizung, Fundamenterder).',
      ],
      typisch: 'In den meisten Bestandsgebäuden ab ~1973/Neubau vorhanden (Fundamenterder Pflicht). "Nein/unklar" bei sehr alten, unsanierten Häusern.',
      fallstricke: 'FI-/Sicherungsautomaten sind NICHT die Erdung. Ein einzelnes grün-gelbes Kabel an der Steckdose belegt keinen vollständigen Potentialausgleich. Im Zweifel "nein/unklar" — die Plausi-Warnung ist gewollt. Endgültige Bewertung macht der Elektriker.',
    },
    kiFrage: 'Wie erkenne ich am Zählerschrank, ob ein Potentialausgleich (Erdung) vorhanden ist?',
  },

  /* ============================ Aufstellort ======================== */
  alternative_1_vorhanden: {
    inline: 'Gibt es einen Ausweich-Stellplatz für die Außeneinheit (im Aufstellort-Check geprüft)?',
  },
  alternative_2_vorhanden: {
    inline: 'Zweiter Ausweich-Stellplatz — nur sinnvoll, wenn es auch eine erste Alternative gibt.',
  },
  kunde_aufstellort_bestaetigt: {
    inline: 'Hat der Kunde den Aufstellort bestätigt? Gehört zu "Aufstellort besprochen".',
  },
  kunde_bestaetigung_vorname: {
    inline: 'Vorname des KUNDEN/Eigentümers, der den Aufstellort bestätigt — nicht dein Name.',
  },
  kunde_bestaetigung_nachname: {
    inline: 'Nachname des Kunden/Eigentümers (gilt als digitale Unterschrift) — nicht dein Name.',
  },
  distanz_ausseneinheit_kernloch: {
    inline: 'Außen messen: Außeneinheit bis Kernloch entlang des Rohrwegs (m).',
  },
  distanz_kernloch_innengeraet: {
    inline: 'Innen messen: Kernloch bis Innengerät/Hydraulik entlang des Rohrwegs (m).',
  },
  anzahl_durchbrueche_kernloch: {
    inline: 'Wände/Decken auf dem Weg zählen — das Kernloch selbst ist mindestens 1.',
  },
  aufstellort_aenderung: {
    inline: 'Soll die WP-Technik an einen anderen Platz als die alte Anlage? Mit Kunde klären.',
  },
  distanz_alter_neuer_aufstellort: {
    inline: 'Entfernung alter zu neuem Standort mit dem Bandmaß messen (m).',
  },

  /* ============================= Sanitär =========================== */
  anzahl_duschen: {
    inline: 'Duschen in allen Bädern/Gäste-WCs abzählen (Regendusche zählt als Dusche).',
  },
  hat_regendusche: {
    inline: 'Große fest montierte Kopfbrause (20–30 cm) mit hohem Durchfluss vorhanden?',
  },
  anzahl_badewannen: {
    inline: 'Badewannen abzählen — mehr Badewannen als Bewohner ist ungewöhnlich.',
  },

  /* ============================ Checkliste ========================= */
  check_raeume_gescannt: {
    inline: 'Bestätige ehrlich: alle Räume per Raumscan erfasst (passt zu "0 unbegehbare").',
  },
  check_anzahl_raeume: {
    inline: 'Bestätige, dass die erfasste Raumanzahl stimmt.',
  },
  check_aufstellort_besprochen: {
    inline: 'Bestätige, dass der Aufstellort mit dem Kunden besprochen wurde.',
  },
  check_alle_bilder: {
    inline: 'Bestätige, dass alle Pflicht-Fotos gemacht sind (KI-Foto-Check läuft separat).',
  },
  check_heizkoerper_aufgenommen: {
    inline: 'Bestätige, dass alle Heizkörper/Heizflächen dokumentiert sind.',
  },

  /* ============================= Sonstiges ========================= */
  bemerkungen: {
    inline: 'Freitext für alles, was sonst nicht ins Formular passt.',
  },
  anzahl_unbegehbare_raeume: {
    inline: 'Räume, die du nicht scannen konntest (0–5). 0 = alles erfasst, bitte bewusst wählen.',
  },
  hat_pv_anlage: {
    inline: 'PV = Strom: Module + Wechselrichter + Einspeisezähler (NICHT die Solarthermie).',
  },
  agb_akzeptiert: {
    inline: 'Bestätigung der AGB — Voraussetzung für die Abgabe.',
  },
};

export function feldHilfe(key: string): FeldHilfe | undefined {
  const direct = FELD_HILFE[key];
  if (direct) return direct;
  // Anbau-Wandaufbau nutzt dasselbe Schema wie die Außenwand → Hilfe spiegeln.
  const ANBAU_PREFIX = 'u_werte.anbau.wand.';
  if (key.startsWith(ANBAU_PREFIX)) {
    return FELD_HILFE['u_werte.aussenwand.' + key.slice(ANBAU_PREFIX.length)];
  }
  return undefined;
}
