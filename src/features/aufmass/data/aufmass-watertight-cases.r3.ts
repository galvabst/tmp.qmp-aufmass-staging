import type { WatertightCase } from './aufmass-watertight-cases';

// AUTOGENERIERT aus Workflow aufmass-watertight-enumerate-r3 (Runde 3). Nicht von Hand pflegen.
export const GENERATED_CASES_R3: WatertightCase[] = [
  {
    "id": "r3.techniker.1",
    "page": "techniker",
    "domain": "wp",
    "label": "ThermoCheck-Termin liegt vor dem Bauantrag des Gebäudes",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2018-05-10",
      "bauantrag_datum": "2020-03-01"
    },
    "expect": "block",
    "why": "Der ThermoCheck ist ein Vor-Ort-Aufmaß AM Gebäude. Liegt das Aufnahme-Datum VOR dem Bauantrag, existierte das Haus zum Aufnahmezeitpunkt noch nicht – man kann ein noch nicht beantragtes/gebautes Gebäude nicht vor Ort vermessen. Echte temporale Unmöglichkeit aus dem Zusammenspiel thermocheck_datum + bauantrag_datum. Die Engine prüft thermocheck_datum bisher NUR gegen heute (Zukunft / >3 Mon. zurück), niemals gegen bauantrag_datum. Das bestehende ib<ba-Block (heizung_inbetriebnahme vs bauantrag) deckt diese Paarung nicht ab."
  },
  {
    "id": "r3.techniker.2",
    "page": "techniker",
    "domain": "wp",
    "label": "ThermoCheck-Termin liegt vor Inbetriebnahme der vorgefundenen Bestandsheizung",
    "field": "thermocheck_datum",
    "values": {
      "thermocheck_datum": "2019-02-01",
      "heizung_inbetriebnahme_datum": "2021-09-15"
    },
    "expect": "block",
    "why": "Das Formular dokumentiert die beim ThermoCheck VORGEFUNDENE Bestandsheizung (Heizungsart, Vor-/Rücklauf, Funktionstüchtigkeit). Ist das Aufnahme-Datum FRÜHER als das Inbetriebnahme-Datum dieser Heizung, hätte der Techniker eine Anlage vermessen, die zum Besuchszeitpunkt noch gar nicht in Betrieb war – logisch unmöglich. Cross-Feld thermocheck_datum + heizung_inbetriebnahme_datum; bisher völlig ungeprüft (thermocheck_datum wird nur gegen heute, ib nur gegen ba/heute getestet). Gilt unabhängig von heizung_funktionstuechtig, da die dokumentierte Inbetriebnahme zwingend <= Aufnahmedatum sein muss."
  },
  {
    "id": "r3.heizung_termin.1",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Defekte Heizung jünger als das Gebäude, aber selbst brandneu — Austauschgrund vs. Alter widersprüchlich gegenüber dem Bauantrag",
    "field": "heizung_funktionstuechtig",
    "values": {
      "heizung_funktionstuechtig": false,
      "heizung_inbetriebnahme_datum": "2025-03-01",
      "bauantrag_datum": "1985-01-01",
      "fossile_brennstoffe_nach_austausch": false
    },
    "expect": "soft",
    "why": "Die ib.zuNeu-Regel feuert NUR bei heizung_funktionstuechtig=true (Bedingung !heizungDefekt). Setzt der Techniker 'defekt', schweigt jede Altersprüfung — eine angeblich erst vor Monaten in ein 40 Jahre altes Bestandsgebäude eingebaute Heizung, die bereits defekt ist, läuft komplett ungeprüft durch. Eine Anlage des Baujahres 2025 fällt praktisch nie nach Monaten aus; in Kombination mit dem alten Bauantrag ist das ein starkes Indiz für ein vertauschtes/falsch getipptes Inbetriebnahme-Jahr (z.B. 1995 statt 2025), das die bestehende ib<ba- und Zukunfts-Prüfung nicht fängt, weil ib hier weder vor ba noch in der Zukunft liegt."
  },
  {
    "id": "r3.heizung_termin.2",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Bauantrag und Inbetriebnahme liegen ein ganzes Jahrhundert auseinander — Lebensdauer einer Heizung physikalisch überschritten",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "1905-06-01",
      "heizung_inbetriebnahme_datum": "2024-06-01",
      "heizung_funktionstuechtig": true
    },
    "expect": "soft",
    "why": "Hier ist NICHT der einzelne Wert das Problem (1905>1850 ok, 2024 ok, ib>ba ok, Abstand>6 Monate ok) — sondern der unplausible Spreizungs-Charakter: 119 Jahre zwischen Bauantrag und aktueller Heizungs-Inbetriebnahme. Keine bestehende Regel prüft eine OBERE Grenze des Bau↔Heizung-Abstands; bauZuSchnell prüft nur die UNTERE (<6 Monate). Ein so extremer Sprung ist zwar bei sehr altem Bestand mit nachgerüsteter Heizung physisch denkbar, deutet aber meist auf einen Jahrhundert-Tippdreher in einem der beiden Datumsfelder hin (z.B. Bauantrag 1995 statt 1905). Das Zusammenspiel der drei Datumsangaben bleibt ungeprüft."
  },
  {
    "id": "r3.heizung_termin.3",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Funktionstüchtige fossile Heizung soll fossil bleiben UND ist erst Monate alt — dreifacher Sinnwiderspruch ohne jeden Austauschgrund",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "heizung_funktionstuechtig": true,
      "heizung_inbetriebnahme_datum": "2025-09-01",
      "fossile_brennstoffe_nach_austausch": true,
      "bauantrag_datum": "1990-01-01"
    },
    "expect": "soft",
    "why": "Drei Signale, die einzeln je eine schwache Soft-Regel auslösen (fossile.bleibt, ib.zuNeu), aber in Kombination einen logischen Komplett-Widerspruch zum Auftragszweck ergeben, der NICHT als Einheit geprüft wird: voll funktionstüchtige, erst <1 Jahr alte Heizung, die ausgetauscht werden soll, wobei nach dem Austausch trotzdem fossil weitergeheizt wird. Es fehlt damit JEDER plausible Austauschgrund (nicht defekt, nicht alt, nicht Dekarbonisierung). Ein WP-Aufmaß ohne erkennbaren Auslöser ist ein starkes Indiz für falsch erfasste Felder oder einen Fehlbesuch — das verdient einen kombinierten Hinweis, den die isolierten Einzelregeln nicht geben."
  },
  {
    "id": "r3.heizung_termin.4",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Inbetriebnahme exakt am Bauantragstag UND defekt UND fossil-Verbleib — selber-Tag-Bau-Soft greift, der Cluster bleibt ungewürdigt",
    "field": "heizung_inbetriebnahme_datum",
    "values": {
      "bauantrag_datum": "2008-04-15",
      "heizung_inbetriebnahme_datum": "2008-04-15",
      "heizung_funktionstuechtig": false,
      "fossile_brennstoffe_nach_austausch": true
    },
    "expect": "soft",
    "why": "Grenzfall-Anmerkung: Der reine Selber-Tag-Fall (ba=ib) ist bereits als bauZuSchnell/soft abgedeckt — dieser Case ist nur dann NEU, wenn er als Mehrfeld-Cluster gewertet wird. Da er sich aber im Wesentlichen auf die bestehende bauZuSchnell-Regel reduziert, ist er als eigenständiger neuer Befund SCHWACH und sollte nur aufgenommen werden, falls eine kombinierte Cluster-Bewertung gewünscht ist; sonst weglassen."
  },
  {
    "id": "r3.gebaeude.1",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Vorlauf == Rücklauf (Spreizung 0) — kein Wärmetransport möglich",
    "field": "ruecklauftemperatur",
    "values": {
      "vorlauftemperatur": 45,
      "ruecklauftemperatur": 45
    },
    "expect": "block",
    "why": "Bei VL=RL ist die Spreizung exakt 0 K. Die bestehende Regel 'ruecklauf.ueberVorlauf' (block) feuert nur bei RL>=VL strikt über ihr selbes >= — ABER prüfen: ruecklauf>=vorlauf ist hier true (45>=45), also greift sie. Bereits gefangen. NICHT liefern."
  },
  {
    "id": "r3.gebaeude.2",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Gewerbe mit 1 Bewohner + sehr großer Wohnfläche / Personen-Fläche-Check übersprungen",
    "field": "anzahl_bewohner",
    "values": {
      "gebaeudetyp": "gewerbe",
      "beheizte_wohnflaeche_m2": 800,
      "anzahl_bewohner": 1
    },
    "expect": "soft",
    "why": "flaecheProPerson greift unabhängig vom Typ (800 m²/Person > hardMax 250 → block schon da). Bereits gefangen über flaecheProPerson.hard. NICHT liefern."
  },
  {
    "id": "r3.gebaeude.3",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Solarthermie soll erhalten bleiben, aber Dach wird für WP-relevante Maßnahmen genutzt — reine Spekulation",
    "field": "hat_solarthermie",
    "values": {
      "hat_solarthermie": true
    },
    "expect": "soft",
    "why": "Kein echter Widerspruch, Solarthermie + WP ist gängig (Hybrid). Spekulativ, kein physikalischer Konflikt. NICHT liefern."
  },
  {
    "id": "r3.gebaeude.4",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Dreifach-Wärmeschutzverglasung + einfachverglaster Altbau-Verbrauch — kein Konflikt",
    "field": "verglasung",
    "values": {
      "verglasung": "dreifach_waermeschutz"
    },
    "expect": "soft",
    "why": "Einzelfeld, kein Mehrfeld-Widerspruch; Energieband deckt Verbrauchsseite bereits ab. NICHT liefern."
  },
  {
    "id": "r3.gebaeude.5",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Öltank vorhanden / Heizungsart Öl, aber Verbrauchseinheit als kWh statt Liter eingegeben (10x-Verwechslung)",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "oel",
      "beheizte_wohnflaeche_m2": 150,
      "durchschnittsverbrauch_3_jahre": 18000
    },
    "expect": "soft",
    "why": "18000 'Liter' Öl auf 150 m² → ×10 = 180.000 kWh → 1200 kWh/m²·a → bereits durch verbrauchProM2.hard (>500) als block gefangen. Werte unter dieser Schwelle sind plausible echte Liter. Redundant. NICHT liefern."
  },
  {
    "id": "r3.heizungsraum.1",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Warmwasser-Anschluss vorhanden, aber Kaltwasser-Anschluss nicht vorhanden",
    "field": "anschluss_kaltwasser_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 5,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 5,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 6,
      "anschluss_kaltwasser_vorhanden": false,
      "anschluss_kaltwasser_distanz": 0,
      "anschluss_zirkulation_vorhanden": false,
      "anschluss_zirkulation_distanz": 0
    },
    "expect": "soft",
    "why": "Warmwasser ist erwärmtes Kaltwasser — eine Warmwasserleitung kann ohne Kaltwasser-Zulauf nicht gespeist werden. anschluss_warmwasser_vorhanden=true bei anschluss_kaltwasser_vorhanden=false ist hydraulisch widerspruechlich. Exakte Spiegel-Abhaengigkeit zur bereits vorhandenen Regel anschluss.zirkOhneWw (Zirkulation setzt Warmwasser voraus), die das gleichrangige WW->KW-Paar bisher NICHT abdeckt. Beide Flags sind je fuer sich gueltig (Bereichspruefung findet nichts); der Konflikt liegt nur in der Paarbeziehung Warmwasser<->Kaltwasser. Soft (nicht block), konsistent zur Severity des Schwester-Falls und weil ein separater, nicht ueber den Heizungsraum gefuehrter KW-Strang theoretisch denkbar ist."
  },
  {
    "id": "r3.heizungsraum.2",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Heizkreis verlegt (Vor-/Rücklauf vorhanden), aber gar kein Wasseranschluss (Warm- UND Kaltwasser nicht vorhanden)",
    "field": "anschluss_warmwasser_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 7,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 7,
      "anschluss_warmwasser_vorhanden": false,
      "anschluss_warmwasser_distanz": 0,
      "anschluss_kaltwasser_vorhanden": false,
      "anschluss_kaltwasser_distanz": 0,
      "anschluss_zirkulation_vorhanden": false,
      "anschluss_zirkulation_distanz": 0
    },
    "expect": "soft",
    "why": "Heizkreis wird an den neuen Standort gefuehrt (VL+RL vorhanden), aber am verlegten Heizungsraum existiert weder Warm- noch Kaltwasser. Eine Waermepumpe im WP-Austausch erzeugt i.d.R. auch Trinkwarmwasser; ein neuer Heizungsraum-Standort ganz ohne Wasseranschluss bedeutet, dass dort keine Trinkwasser-Erwaermung moeglich ist. Existierende Regeln greifen nicht: verlegenJaKeineLeitung verlangt ALLE fuenf =false (hier sind VL/RL true), verlegenOhneHeizleitung prueft nur VL/RL. Der Konflikt entsteht erst aus dem Zusammenspiel von verlegen=true + VL/RL=true + WW=false + KW=false (vier Felder). Bewusst soft, da ein reines Heizungs-/Heizkreis-Setup mit separater Trinkwasserversorgung (z.B. dezentrale DHW) als Randfall moeglich bleibt."
  },
  {
    "id": "r3.heizungsart.1",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Aktueller Tankinhalt übersteigt Gesamtkapazität",
    "field": "oeltank_liter_aktuell",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_gesamt": 3000,
      "oeltank_anzahl": 2,
      "oeltank_liter_aktuell": 4500
    },
    "expect": "block",
    "why": "Der aktuell vorhandene Ölfüllstand (4500 L) kann physikalisch nicht größer sein als die gesamte Tankkapazität (3000 L). Ein Tank kann nicht mehr enthalten, als hineinpasst. Das ist eine echte Unmöglichkeit aus dem Zusammenspiel von aktuell vs. gesamt und wird von einer reinen Bereichsprüfung jedes Einzelfeldes nicht gefunden."
  },
  {
    "id": "r3.heizungsart.2",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Gesamtvolumen unplausibel klein für angegebene Tankanzahl",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 5,
      "oeltank_liter_gesamt": 600,
      "oeltank_liter_aktuell": 200
    },
    "expect": "soft",
    "why": "5 Öltanks mit zusammen nur 600 L Gesamtvolumen bedeutet rechnerisch 120 L pro Tank. Reale Heizöltanks (Batterie-/Kunststoff-/Stahltanks) fassen mindestens ~500-750 L je Einheit; Mini-Tanks unter ~200 L existieren für Hausheizungen praktisch nicht. Anzahl und Gesamtvolumen passen nicht zusammen — wahrscheinlich Anzahl/Liter verwechselt oder Tippfehler. Einzelfeld-Bereichsprüfung erkennt das nicht."
  },
  {
    "id": "r3.heizungsart.3",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Mehrere Tanks gemeldet, aber Gesamtvolumen = 0",
    "field": "oeltank_liter_gesamt",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 3,
      "oeltank_liter_gesamt": 0,
      "oeltank_liter_aktuell": 0
    },
    "expect": "block",
    "why": "Es werden 3 Öltanks angegeben, aber das Gesamtvolumen ist 0 L. Ein existierender Tank hat zwangsläufig ein Fassungsvermögen > 0. Anzahl > 0 und Gesamtvolumen = 0 sind widersprüchlich. Das ist eine Kombinations-Inkonsistenz, die die Bereichsprüfung (0 ist als Wert ggf. zulässig) je Einzelfeld nicht abfängt."
  },
  {
    "id": "r3.heizungsart.4",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Ölmengen erfasst, aber Heizungsart ist Gas",
    "field": "heizungsart",
    "values": {
      "heizungsart": "gas",
      "oeltank_anzahl": 2,
      "oeltank_liter_gesamt": 4000,
      "oeltank_liter_aktuell": 1500
    },
    "expect": "soft",
    "why": "Heizungsart ist Gas, dennoch sind Tankanzahl, Gesamt- und Aktualvolumen mit echten Ölmengen befüllt. Eine Gasheizung hat keinen Heizöltank. Entweder die Heizungsart ist falsch (eigentlich Öl) oder die Tankfelder gehören gelöscht. Dieser Querbezug Heizungsart<->befüllte Tankfelder ist eine andere Konstellation als das bereits gefangene Öltank<->Heizungsart-Paar (dort Tank-vorhanden-Flag), hier geht es um die konkret befüllten Mengenfelder bei Gas."
  },
  {
    "id": "r3.heizungsart.5",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Tankanzahl ohne jegliche Volumenangabe bei Öl",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 4,
      "oeltank_liter_gesamt": null,
      "oeltank_liter_aktuell": null
    },
    "expect": "soft",
    "why": "Bei Ölheizung wird die Tankanzahl (4) erfasst, aber weder Gesamt- noch Aktualvolumen. Für die Demontage-/Transportplanung (Restöl absaugen, Tankabbau) ist das Volumen die zentrale Größe; eine reine Stückzahl ohne Liter ist als Aufmaß unvollständig. Das ist eine Vollständigkeits-Inkonsistenz aus dem Zusammenspiel Heizungsart=Öl + Anzahl gesetzt + Volumen leer."
  },
  {
    "id": "r3.heizungsart.6",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Restölmenge zur Transportbeschreibung widersprüchlich",
    "field": "oeltank_transport_beschreibung",
    "values": {
      "heizungsart": "oel",
      "oeltank_liter_aktuell": 0,
      "oeltank_liter_gesamt": 5000,
      "oeltank_transport_beschreibung": "Tank noch zu 3/4 mit Heizöl gefüllt, muss vor Abbau abgesaugt werden"
    },
    "expect": "soft",
    "why": "Das Freitextfeld zur Transport-/Abbaubeschreibung schildert einen zu 3/4 gefüllten Tank (also ~3750 L Restöl), während das strukturierte Feld aktuelles Volumen = 0 L meldet. Strukturierte Mengenangabe und Freitext widersprechen sich direkt. Das ist ein Text<->Zahl-Konflikt, den keine numerische Bereichsprüfung sieht, und betrifft die Demontagekosten (Restöl-Entsorgung)."
  },
  {
    "id": "r3.heizkoerper.1",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine Fußbodenheizung mit Hochtemperatur-Vorlauf 70 °C",
    "field": "heizkoerper_typ",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 70,
      "ruecklauftemperatur": 60
    },
    "expect": "block",
    "why": "Eine Fußbodenheizung ist physikalisch durch die Estrich-Oberflächentemperatur begrenzt: nach DIN EN 1264 / EN 12831 darf die Bodenoberfläche im Aufenthaltsbereich max. ~29 °C (Randzonen ~35 °C) erreichen, was Vorlauftemperaturen real auf ~35–45 °C deckelt. Ein Vorlauf von 70 °C in eine reine FBH ist nicht nur unplausibel, sondern bauphysikalisch UNMÖGLICH (Estrichschaden, Verbrühungsschutz, keine Auslegung erlaubt das). Die bestehende Regel vorlauf.fbh ist nur 'soft' ab 45 °C und kennt keine harte Obergrenze — ab ~60 °C bei AUSSCHLIESSLICH FBH (nicht 'beides', wo ein HK-Kreis die hohe Temperatur erklären könnte) ist es eine echte Unmöglichkeit, kein Grenzfall. Nur über heizkoerper_typ × vorlauftemperatur gemeinsam erkennbar."
  },
  {
    "id": "r3.heizkoerper.2",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine Fußbodenheizung, aber Einrohrsystem gewählt",
    "field": "rohrsystem",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "einrohr",
      "vorlauftemperatur": 35,
      "ruecklauftemperatur": 29
    },
    "expect": "soft",
    "why": "Die bestehende Regel heizkoerper.einrohrFbh triggert auf hatFbh = ('fussbodenheizung' ODER 'beides'). Bei 'beides' ist Einrohr für den Heizkörper-Strang erklärbar (alter HK-Strang + nachgerüstete FBH am Verteiler). Bei AUSSCHLIESSLICH 'fussbodenheizung' gibt es gar keinen Heizkörper-Strang, der einrohrig sein könnte — eine Flächenheizung wird grundsätzlich über einen Heizkreisverteiler (Tichelmann/Zweirohr) gefahren, nie als Einrohr-Reihenschaltung. Das ist also ein deutlich stärkerer, eigenständiger Widerspruch als die generische einrohrFbh-Regel und zeigt eine wahrscheinliche Feld-Verwechslung beim Antippen von heizkoerper_typ oder rohrsystem. Drei-Feld-Zusammenspiel heizkoerper_typ × rohrsystem (× plausibler FBH-Vorlauf, der die FBH bestätigt)."
  },
  {
    "id": "r3.heizkoerper.3",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine Heizkörper, aber Vorlauf/Rücklauf liegen im FBH-Niedertemperaturband",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 32,
      "ruecklauftemperatur": 28
    },
    "expect": "soft",
    "why": "Querfeld heizkoerper_typ × vorlauf × rücklauf: Bestandsheizkörper (auf ~70/55 ausgelegt) können bei nur 32 °C Vorlauf UND nur 4 K Spreizung praktisch keine Heizlast übertragen — die Wärmeabgabe eines Heizkörpers skaliert mit der Übertemperatur (VL/RL gegenüber 20 °C Raum) hoch n≈1,3; bei mittlerer Übertemperatur von ~10 K bleibt nur ein Bruchteil der Nennleistung. Die Einzelregel vorlauf.hk schlägt zwar bei VL<40 an, aber der eigentliche Hinweis hier ist die KOMBINATION mit der kleinen Spreizung (typisches FBH-Profil 35/28): das Muster deutet stark darauf hin, dass in Wahrheit eine Fußbodenheizung erfasst wurde und heizkoerper_typ falsch auf 'heizkoerper' steht. Das ist ein anderer Befund als die isolierte vorlauf.hk-Untergrenze."
  },
  {
    "id": "r3.heizkoerper.4",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Vorlauf und Rücklauf vertauscht eingegeben (RL nur 1 K unter VL, FBH)",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "rohrsystem": "zweirohr",
      "vorlauftemperatur": 35,
      "ruecklauftemperatur": 34
    },
    "expect": "soft",
    "why": "Eigenständiger Befund nur über heizkoerper_typ × spreizung: Bei einer Fußbodenheizung ist die Auslegungs-Spreizung systembedingt klein, aber typisch 5–8 K (z. B. 35/28). Eine Spreizung von nur 1 K bei FBH bedeutet einen extrem hohen Massenstrom / quasi keine Wärmeabgabe — in der Praxis ein Zeichen, dass VL/RL fast gleich eingetippt oder die Werte vertauscht/abgeschrieben wurden. Die generische spreizung.klein-Regel (minSpreizung 3) fängt zwar <3 K allgemein, aber der HEIZKÖRPER-TYP-Kontext schärft das: dass es eine FBH ist, macht 1 K besonders verdächtig und verweist konkret auf die VL/RL-Erfassung dieser Seite. Grenzfall-frei, da 1 K klar unter jeder sinnvollen FBH-Spreizung liegt."
  },
  {
    "id": "r3.elektrik.1",
    "page": "elektrik",
    "domain": "wp",
    "label": "PV-Anlage vorhanden, aber keine Erdung/Potentialausgleich",
    "field": "hat_erdung",
    "values": {
      "hat_erdung": false,
      "hat_pv_anlage": true
    },
    "expect": "soft",
    "why": "Eine bestehende PV-Anlage setzt nach DIN VDE 0100-712 / VDE-AR-E 2100-712 (plus DIN VDE 0185-305 Überspannungs-/Blitzschutz) zwingend einen Schutzpotentialausgleich / eine Erdung voraus – ohne die wäre die Anlage nicht normgerecht abnahmefähig. 'Keine Erdung' bei gleichzeitig vorhandener PV-Anlage ist daher elektrotechnisch widersprüchlich und deutet auf eine fehlerhafte Erfassung hin (Techniker hat die vorhandene Erdung übersehen/falsch markiert). Geht über das generische 'erdung.fehlt' hinaus, weil hier der Widerspruch aus dem Zusammenspiel mit hat_pv_anlage entsteht, nicht aus dem bloßen WP-Anschlussbedarf. Soft, weil es eine reale (wenn auch normwidrige) Bestandsanlage geben kann bzw. der Erfassungsfehler nur eine Prüfung erfordert, keine harte Unmöglichkeit."
  },
  {
    "id": "r3.aufstellort.1",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Gesamte Kaeltemittel-Leitungslaenge (aussen + innen) ueber dem Split-System-Limit, jede Einzelstrecke unauffaellig",
    "field": "distanz_kernloch_innengeraet",
    "values": {
      "distanz_ausseneinheit_kernloch": 14,
      "distanz_kernloch_innengeraet": 19
    },
    "expect": "soft",
    "why": "Bei einer Split-WP ist die physikalisch limitierende Groesse die GESAMTE einfache Kaeltemittel-Leitungslaenge = distanz_ausseneinheit_kernloch + distanz_kernloch_innengeraet (Aussengeraet -> Kernloch -> Hydraulikmodul). Die Engine prueft beide Felder nur EINZELN (aussenSoftMax 15, innenSoftMax 20) und summiert sie nie - der einzige Bezug beider Felder ist die nullTrotzLeitung-OR-Pruefung (Zeile 266). 14 m liegt unter dem Aussen-Soft, 19 m unter dem Innen-Soft, also feuert KEIN Einzelhinweis. Die Summe von 33 m ueberschreitet aber die zulaessige Verrohrungslaenge gaengiger residentieller Split-Systeme (Vaillant/Daikin ~25-30 m einfach, ohne Zusatzkaeltemittel/Oelrueckfuehrungsgrenze). Additive physikalische Restriktion - keine Geometrie-Spekulation -, die nur aus dem Zusammenspiel beider Distanzfelder sichtbar wird; in r2 wird die Summe nur informell als Kontext fuer Durchbruch-Faelle genannt, nie selbst als Verletzung geprueft."
  },
  {
    "id": "r3.aufstellort.2",
    "page": "aufstellort",
    "domain": "wp",
    "label": "Kernloch-Durchbrueche vorhanden, aber beide Leitungswege exakt 0 m (gebohrt ohne zu verlegende Strecke)",
    "field": "anzahl_durchbrueche_kernloch",
    "values": {
      "anzahl_durchbrueche_kernloch": 2,
      "distanz_ausseneinheit_kernloch": 0,
      "distanz_kernloch_innengeraet": 0
    },
    "expect": "soft",
    "why": "anzahl_durchbrueche_kernloch = 2 ist schema-gueltig (>0, <=10) und loest keinen Soft-Hinweis aus (durchbruecheSoftMax 3). Die Gegenprobe nullTrotzLeitung (Zeile 266) feuert NICHT, weil sie distAussen>0 ODER distInnen>0 verlangt - hier sind beide exakt 0. Es bleibt aber ein echter Widerspruch ueber drei Felder: Es wurden zwei Kernlochbohrungen erfasst, obwohl der gesamte Leitungsweg (aussen 0 m + innen 0 m) Null ist - es gibt also keine Strecke, fuer die ueberhaupt eine Wand durchbohrt werden muesste. Entweder wurden die Distanzen vergessen (Pflichtweg fehlt) oder die Durchbruchszahl ist falsch. Die in r2 abgedeckten Faelle pruefen 0-Durchbrueche-trotz-Strecke bzw. viele-Durchbrueche-bei-kurzer-Strecke; der hier umgekehrte Fall (Durchbrueche>0 bei Strecke=0 auf BEIDEN Segmenten) wird von keiner Regel erfasst."
  },
  {
    "id": "r3.sanitaer.1",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Wellness-Ausstattung ohne jede Dusche unplausibel bei Vollbelegung",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 0,
      "hat_regendusche": false,
      "anzahl_badewannen": 0,
      "anzahl_bewohner": 4
    },
    "expect": "soft",
    "why": "Drei Felder zusammen: 0 Duschen UND 0 Badewannen bei 4 Bewohnern bedeutet ein bewohntes Wohngebaeude voellig ohne Koerper-Nasszelle. Das ist fuer die WW-Bedarfsrechnung (Zapfprofil) physikalisch widerspruechlich – ohne Dusche/Wanne entsteht kein nennenswerter WW-Warmwasserbedarf, was die Auslegung der WP-Trinkwassererwaermung sinnlos macht. Einzeln liegt jedes Feld im gueltigen Bereich (0 ist erlaubt), erst die Kombination ist unplausibel. Soft, weil seltene Roh-/Sanierungsobjekte denkbar sind, aber Begruendung erzwungen werden sollte."
  },
  {
    "id": "r3.sanitaer.2",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Sanitaer-Anlagenzahl uebersteigt Bewohnerzahl massiv",
    "field": "anzahl_duschen",
    "values": {
      "anzahl_duschen": 6,
      "hat_regendusche": false,
      "anzahl_badewannen": 4,
      "anzahl_bewohner": 2
    },
    "expect": "soft",
    "why": "Drei-Feld-Interplay: 6 Duschen + 4 Badewannen = 10 Koerper-Nassstellen bei nur 2 Bewohnern. Fuer die WW-Spitzenlast-/Speicherauslegung der WP ist das ein starkes Signal fuer eine Zahlendreher- oder Verwechslung (z.B. Wohnungen statt Anlagen). Pro Person mehr als ~2-3 Nassstellen ist im EFH energetisch nicht abbildbar. Jeder Einzelwert ist gueltig; nur das Verhaeltnis Anlagen:Bewohner ist die echte Unmoeglichkeit. Soft mit Pflicht-Begruendung."
  },
  {
    "id": "r3.sanitaer.3",
    "page": "sanitaer",
    "domain": "wp",
    "label": "Regendusche-Flag gesetzt, aber Duschenzahl null",
    "field": "hat_regendusche",
    "values": {
      "anzahl_duschen": 0,
      "hat_regendusche": true,
      "anzahl_badewannen": 1,
      "anzahl_bewohner": 3
    },
    "expect": "block",
    "why": "Logische Unmoeglichkeit ueber zwei Felder: hat_regendusche=true ist ein Subtyp von Dusche, kann also nicht existieren, wenn anzahl_duschen=0. Eine Regendusche IST eine Dusche und muss in der Duschenzahl enthalten sein. Das ist kein Bereichsfehler (0 und true sind je gueltig), sondern ein harter Eltern-Kind-Widerspruch, der die WW-Komfort-/Durchfluss-Auslegung (Regendusche = hoher Volumenstrom) verfaelscht. Block, da physikalisch ausgeschlossen."
  },
  {
    "id": "r3.unbegehbar.1",
    "page": "unbegehbar",
    "domain": "wp",
    "label": "Unbegehbare Räume angegeben, aber kein Scan durchgeführt und kein Scan-Ersatz dokumentiert",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "anzahl_unbegehbare_raeume": 3,
      "check_raeume_gescannt": false
    },
    "expect": "soft",
    "why": "Bei 1-5 unbegehbaren Räumen MUSS für die Heizlast-/Rohrführungsplanung eine Geometrie-Grundlage existieren. Ist nicht gescannt (check_raeume_gescannt=false) UND es sind unbegehbare Räume deklariert, fehlt jede vermessbare Datenbasis für genau diese Räume – die unbegehbaren Räume werden aber gerade dann zum kritischen Risiko (Rohrführung, Durchbrüche, Heizflächen unbekannt). Das ist nicht durch die bereits gefangene Regel 'unbegehbar<->gescannt' abgedeckt, falls jene nur den umgekehrten Fall (gescannt aber unbegehbar=0) prüft; hier ist die Lücke: deklarierte unbegehbare Räume ohne jeglichen Scan-Nachweis erfordern eine Begründung, wie das Aufmaß dieser Räume erfolgte."
  },
  {
    "id": "r3.pv.1",
    "page": "pv",
    "domain": "pv",
    "label": "Module auf anderem Gebäude, aber DC-Kabelweg ≤10 m verneint — ohne Entfernungswert (rein boolesch)",
    "field": "dc_ueber_10m",
    "values": {
      "module_gleiches_gebaeude": false,
      "dc_ueber_10m": false
    },
    "expect": "soft",
    "why": "Liegen Module und Wechselrichter auf VERSCHIEDENEN Gebäuden (module_gleiches_gebaeude=false), muss das DC-Kabel zwei Gebäude überbrücken (Dach → Abstieg → Querung → Einführung ins zweite Gebäude). Ein Gesamtweg unter 10 m ist dabei praktisch ausgeschlossen. Die bestehende Regel pv.dc.unter10TrotzEntfernung greift NUR, wenn zusätzlich gebaeude_entfernung gesetzt und >10 ist; pv.33 prüft konkret entfernung=9. Die reine 2-Feld-Bool-Kombination (separates Gebäude + ≤10 m) OHNE eingetragene Entfernung fällt durch alle Netze — gerade dieser Fall ist aber häufig, weil der Techniker die Entfernung gern leer lässt."
  },
  {
    "id": "r3.pv.2",
    "page": "pv",
    "domain": "pv",
    "label": "Flachdach (Dachneigung 0°) mit Aufdachdämmung=true — Aufsparrendämmung gibt es auf dem waagerechten Dach nicht",
    "field": "aufdachdaemmung",
    "values": {
      "dachform": "Flachdach",
      "dachneigung": 0,
      "aufdachdaemmung": true,
      "aufdachdaemmung_dicke": 16
    },
    "expect": "soft",
    "why": "Aufdach-/Aufsparrendämmung ist konstruktiv ein Schrägdach-Begriff (Dämmung oberhalb der Sparren unter der geneigten Eindeckung). Ein echtes Flachdach (Dachform Flachdach, dachneigung=0°) wird als Warmdach mit Gefälledämmung im Aufbau gedämmt, nicht als 'Aufdachdämmung' auf Sparren. Die Kombination Flachdach + dachneigung 0 + aufdachdaemmung=true ist daher eine fachlich widersprüchliche Bauteil-Zuordnung. Bestehende Fälle prüfen Aufdachdämmung nur gegen Dicke/Thermodach/Denkmalschutz, nie gegen die Dachform/0°-Neigung — diese 3-Feld-Konstellation ist nicht abgedeckt."
  },
  {
    "id": "r3.pv.3",
    "page": "pv",
    "domain": "pv",
    "label": "DC-Kabelweg >10 m bejaht, obwohl Module auf gleichem Gebäude wie WR und kurze Wege (Fassade UND Dachhaut) beide möglich",
    "field": "dc_ueber_10m",
    "values": {
      "module_gleiches_gebaeude": true,
      "dc_fassade_moeglich": true,
      "dc_dachhaut_moeglich": true,
      "dc_ueber_10m": true
    },
    "expect": "soft",
    "why": "Spiegelfall zu pv.32/r2.pv.2: Liegen Module und Wechselrichter auf demselben Gebäude UND sind BEIDE kurzen Verlegewege (Fassade und Dachhaut) ausdrücklich möglich, gibt es keinen Grund, weshalb der DC-Weg >10 m sein müsste. dc_ueber_10m=true bei gleichem Gebäude plus zwei verfügbaren Direktwegen ist unplausibel (deutet auf falsch gesetztes Flag oder verwechselten >10-m-Schalter hin). Die bestehenden DC-Längen-Regeln prüfen nur den umgekehrten Widerspruch (≤10 m trotz Hindernissen/Entfernung), nie den überlangen Weg trotz idealer Bedingungen."
  },
  {
    "id": "r3.cross_heizung.1",
    "page": "heizung",
    "domain": "wp",
    "label": "Gasverbrauch in m³ statt kWh (Zehnerpotenz-Verwechslung)",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 2200,
      "beheizte_wohnflaeche_m2": 150,
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false,
      "verglasung": "einfach"
    },
    "expect": "soft",
    "why": "Gaszähler messen m³, nicht kWh (1 m³ Erdgas ≈ 10 kWh). Ein 150-m²-Altbau (unsaniert, einfachverglast) verbraucht real ~25.000–35.000 kWh/a. Die Eingabe 2.200 wird vom Feld als kWh interpretiert → proM2 ≈ 15 kWh/m²·a. Das liegt im erlaubten Bereich (hardMin 10) und im teilsaniert/unsaniert-Band nur knapp unter softMin — fällt also durch ALLE bestehenden Prüfungen (gasMax 200k, verbrauchProM2 10–500, Energieklassen-Band), obwohl es eine klassische 10×-Einheitenverwechslung ist. Erst das Zusammenspiel heizungsart=gas × dieser kleine Absolutwert × ungedämmte Hülle macht die m³-Verwechslung sichtbar: ein unsanierter Altbau KANN nicht mit ~15 kWh/m²·a (Passivhaus-Niveau) heizen."
  },
  {
    "id": "r3.cross_heizung.2",
    "page": "heizung",
    "domain": "wp",
    "label": "Großes Gebäude mit Mini-Gasverbrauch trotz ungedämmter Hülle",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "gas",
      "durchschnittsverbrauch_3_jahre": 4500,
      "beheizte_wohnflaeche_m2": 400,
      "gebaeudetyp": "mehrfamilienhaus",
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false,
      "verglasung": "zweifach"
    },
    "expect": "soft",
    "why": "400 m² MFH, ungedämmt → real ~40.000–60.000 kWh/a. 4.500 kWh ergibt proM2 ≈ 11 kWh/m²·a (knapp über hardMin 10, unter keinem block). Die Energieklasse ist hier 'teilsaniert' (Band 50–200), proM2 11 < softMin 50 → die bestehende Regel verbrauch.klasseNiedrig würde EIGENTLICH greifen. ABER: dieselbe Eingabe als m³ gedacht (4.500 m³ ≈ 45.000 kWh) wäre exakt plausibel. Der eigentliche, bisher ungefangene Mehrstufen-Widerspruch ist die Kombination gebaeudetyp=MFH (mind. 120 m² laut mfh.minWohnflaeche) × ungedämmt × so niedriger Absolutverbrauch: ein ungedämmtes 400-m²-MFH mit Passivhaus-Kennwert ist physikalisch ausgeschlossen und deutet zwingend auf eine m³/kWh-Verwechslung hin."
  },
  {
    "id": "r3.cross_heizung.3",
    "page": "heizung",
    "domain": "wp",
    "label": "Öl-Jahresverbrauch (Liter) übersteigt gesamtes Tankvolumen um ein Vielfaches",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "oel",
      "durchschnittsverbrauch_3_jahre": 18000,
      "oeltank_liter_gesamt": 3000,
      "oeltank_anzahl": 1,
      "beheizte_wohnflaeche_m2": 140
    },
    "expect": "soft",
    "why": "Bei Öl ist durchschnittsverbrauch_3_jahre in Litern/Jahr. 18.000 l/a (≈180.000 kWh) auf 140 m² = ~1.286 kWh/m²·a — das wird vom proM2-hardMax (500) korrekt als block gefangen, ist also NICHT die Lücke. Die ungefangene Mehrstufen-Lücke ist verbrauch × oeltank_liter_gesamt × oeltank_anzahl: 18.000 l Jahresverbrauch aus EINEM 3.000-l-Tank erfordert 6 Komplett-Befüllungen/Jahr — bei realer Heizöl-Lieferpraxis (1–2 Tankfüllungen/Jahr) physikalisch/logistisch unplausibel. Bestehende Öltank-Checks vergleichen nur literAktuell vs literGesamt und proTank, NIE den Jahresverbrauch gegen Tankvolumen×Anzahl. Verhältnis Jahresverbrauch/Gesamttankvolumen > ~3 ist ein echtes Konsistenz-Warnsignal (Einheiten- oder Zahlendreher)."
  },
  {
    "id": "r3.cross_heizung.4",
    "page": "heizung",
    "domain": "wp",
    "label": "Niedertemperatur-Vorlauf bei ungedämmtem Altbau mit Heizkörpern",
    "field": "vorlauftemperatur",
    "values": {
      "heizkoerper_typ": "heizkoerper",
      "vorlauftemperatur": 42,
      "ruecklauftemperatur": 38,
      "beheizte_wohnflaeche_m2": 160,
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false,
      "verglasung": "einfach",
      "durchschnittsverbrauch_3_jahre": 32000,
      "heizungsart": "gas"
    },
    "expect": "soft",
    "why": "Ein ungedämmter, einfachverglaster Altbau mit ~200 kWh/m²·a (32.000 kWh / 160 m²) hat eine sehr hohe spezifische Heizlast. Solche Gebäude lassen sich mit klassischen Heizkörpern bei nur 42 °C Vorlauf / 4 K Spreizung NICHT auf Temperatur bringen — Bestandsheizkörper sind auf 70/55 ausgelegt. vorlauf.hk fängt nur VL < 40; bei 42 °C greift es nicht. Erst das Zusammenspiel heizkoerper_typ=Heizkörper × niedriger Vorlauf × ungedämmte Hülle × hoher spezifischer Verbrauch zeigt den Widerspruch: entweder ist der Vorlauf falsch gemessen oder die Dämm-/Verbrauchsangaben passen nicht. Bisher prüft keine Regel Vorlauftemperatur gegen den abgeleiteten energetischen Standard."
  },
  {
    "id": "r3.cross_heizung.5",
    "page": "heizung",
    "domain": "wp",
    "label": "Hohe Spreizung bei Fußbodenheizung (Auslegungs-Widerspruch)",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 40,
      "ruecklauftemperatur": 22,
      "rohrsystem": "zweirohr"
    },
    "expect": "soft",
    "why": "Spreizung VL−RL = 18 K liegt unter dem generischen maxSpreizung (25 K, soft) — wird also NICHT gefangen. Fußbodenheizungen werden aber konstruktiv mit kleiner Spreizung von ~5–8 K (typ. 35/28 oder 40/33) ausgelegt, weil große Spreizungen zu ungleicher Flächentemperatur führen. 18 K bei heizkoerper_typ=Fußbodenheizung ist auslegungstechnisch unplausibel und deutet auf einen Mess-/Eintragsfehler beim Rücklauf hin. Der Widerspruch entsteht erst aus heizkoerper_typ × vorlauftemperatur × ruecklauftemperatur gemeinsam; die bestehende Spreizungsregel ist heizflächen-blind."
  },
  {
    "id": "r3.cross_heizung.6",
    "page": "heizung",
    "domain": "wp",
    "label": "MFH-Verbrauch über alle Wohneinheiten, aber nur eine Wohnfläche/Bewohnerzahl",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "anzahl_etagen": 5,
      "beheizte_wohnflaeche_m2": 90,
      "anzahl_bewohner": 12,
      "durchschnittsverbrauch_3_jahre": 95000,
      "heizungsart": "gas"
    },
    "expect": "soft",
    "why": "Mehrstufiger Widerspruch über gebaeudetyp × etagen × wohnflaeche × bewohner × verbrauch: Ein 5-stöckiges MFH mit 12 Bewohnern, aber nur 90 m² 'beheizte Wohnfläche' und 95.000 kWh Verbrauch. 90 m² für ein 5-Etagen-MFH ist über mfh.minWohnflaeche (120) zwar als 'mfh.klein' soft gefangen, und 95.000/90 = 1.055 kWh/m²·a wird als proM2-block gefangen — ABER die eigentliche Ursache (Wohnfläche wurde fälschlich pro Wohnung statt gesamt erfasst, während Bewohnerzahl und Verbrauch fürs Gesamthaus gelten) ist ein konsistenter Erfassungs-Bezugsfehler über mehrere Felder. 12 Bewohner auf 90 m² (= 7,5 m²/Person) triggert zwar flaecheProPerson.eng, aber die simultane Kombination mit 5 Etagen + Gesamthaus-Verbrauch macht klar, dass die Wohnfläche im falschen Bezugssystem (Wohnung vs. Gebäude) eingegeben wurde."
  },
  {
    "id": "r3.cross_gebaeude.1",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Mehr Sanitärräume (Duschen+Badewannen) als das winzige Gebäude fassen kann",
    "field": "anzahl_duschen",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 60,
      "anzahl_etagen": 1,
      "anzahl_duschen": 6,
      "anzahl_badewannen": 4
    },
    "expect": "soft",
    "why": "10 Nassräume (6 Duschen + 4 Wannen) auf 60 m² eingeschossigem EFH ist räumlich unmöglich: ein Vollbad belegt real ~4-6 m², 10 Bäder bräuchten ~40-60 m² reine Badfläche – es bliebe kein Wohnraum. Keine Einzelregel fängt das: anzahl_duschen=6 liegt unter hardMax 20, badewannen.ueberBewohner und duschen.ueberBewohner feuern nur gegen anzahl_bewohner (hier nicht gesetzt). Erst das Zusammenspiel Sanitäranzahl × Wohnfläche × Etagen deckt die bauliche Unmöglichkeit auf."
  },
  {
    "id": "r3.cross_gebaeude.2",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Unbegehbare Räume übersteigen die Gesamtraumzahl, die die Wohnfläche hergibt",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 45,
      "anzahl_etagen": 1,
      "anzahl_unbegehbare_raeume": 5
    },
    "expect": "soft",
    "why": "45 m² eingeschossig fasst realistisch ~2-3 Räume (Ø Raumgröße 15-20 m²). 5 unbegehbare Räume sind damit mehr Räume als das Gebäude überhaupt haben kann, und zugleich wäre dann faktisch die ganze Wohnung unbegehbar. anzahl_unbegehbare_raeume=5 ist die erlaubte Obergrenze (Schema max 5), also greift keine Bereichsprüfung; nur die Kopplung an Wohnfläche × Etagen (abgeleitete Raumzahl) macht den Widerspruch sichtbar."
  },
  {
    "id": "r3.cross_gebaeude.3",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Aufstellort-Verschiebung weiter als die durch Wohnfläche/Etagen implizierte Gebäudegröße",
    "field": "distanz_alter_neuer_aufstellort",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 80,
      "anzahl_etagen": 2,
      "aufstellort_aenderung": true,
      "distanz_alter_neuer_aufstellort": 28
    },
    "expect": "soft",
    "why": "80 m² auf 2 Etagen = ~40 m² Grundfläche, also eine Gebäudekante von grob ~6-7 m. Eine Aufstellort-Verschiebung von 28 m liegt weit außerhalb des Gebäude-/Grundstücksmaßstabs eines so kleinen EFH – der alte und neue Aufstellort können bei diesem Footprint nicht 28 m auseinanderliegen, ohne das Grundstück zu verlassen. 28 m liegt unter aufstellortSoftMax 30, fällt also durch die Distanz-Soft-Grenze; erst Verschiebung × Wohnfläche × Etagen (Footprint) entlarvt die Geometrie-Unmöglichkeit."
  },
  {
    "id": "r3.cross_gebaeude.4",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Bewohnte EFH mit Bewohnern, aber komplett ohne Wasch-Sanitär",
    "field": "anzahl_duschen",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "anzahl_bewohner": 4,
      "beheizte_wohnflaeche_m2": 140,
      "anzahl_duschen": 0,
      "anzahl_badewannen": 0
    },
    "expect": "soft",
    "why": "Ein bewohntes 140-m²-EFH mit 4 Bewohnern und null Duschen UND null Badewannen ist faktisch unmöglich – eine dauerhaft bewohnte Wohnung hat zwingend mindestens eine Waschmöglichkeit. Die bestehende Regel sanitaer.keine feuert zwar bei duschen=0&badewannen=0, prüft aber NICHT, ob das Gebäude überhaupt bewohnt/wohngenutzt ist; sie würde auch bei einem leerstehenden Rohbau auslösen. Erst die Kopplung an anzahl_bewohner≥1 × Gebäudetyp Wohnhaus macht aus dem schwachen Hinweis einen harten Wohn-Logik-Widerspruch."
  },
  {
    "id": "r3.cross_gebaeude.5",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Mehrfamilienhaus mit vielen Etagen, aber nur einem einzigen Nassraum für alle Wohnungen",
    "field": "anzahl_duschen",
    "values": {
      "gebaeudetyp": "mehrfamilienhaus",
      "anzahl_etagen": 6,
      "anzahl_bewohner": 18,
      "anzahl_duschen": 1,
      "anzahl_badewannen": 0
    },
    "expect": "soft",
    "why": "Ein 6-geschossiges MFH mit 18 Bewohnern hat zwingend pro Wohnung ein eigenes Bad – ein einziger Nassraum (1 Dusche, 0 Wannen) im ganzen Haus ist baulich/rechtlich unmöglich (jede Wohnung braucht eigenes Bad). Keine Einzelregel greift: anzahl_duschen=1 ist gültig, sanitaer.keine feuert nicht (1>0), badewannen/duschen.ueberBewohner feuern nur bei ZU VIEL. Erst Sanitäranzahl × Etagen × Bewohner (Wohnungsanzahl) deckt das krasse Unter-Maß auf."
  },
  {
    "id": "r3.cross_gebaeude.6",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Sehr viele Bewohner und Etagen, aber als Einfamilienhaus deklariert",
    "field": "gebaeudetyp",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "anzahl_bewohner": 11,
      "anzahl_etagen": 3,
      "beheizte_wohnflaeche_m2": 480
    },
    "expect": "soft",
    "why": "11 Bewohner auf 480 m² über 3 Etagen ist faktisch ein Mehrfamilienhaus, nicht ein Einfamilienhaus. Jeder Einzelwert bleibt knapp im EFH-Soft-Rahmen (bewohner.softMaxEfh 12, etagen.softMaxEfh 3, wohnflaeche.softMaxEfh 500), sodass die je-Feld-EFH-Soft-Regeln einzeln NICHT auslösen. Erst die Kombination aus hoher Bewohnerzahl × max. EFH-Etagen × fast-MFH-Fläche zeigt, dass die Typ-Deklaration zur Gebäudegröße im Widerspruch steht (relevant für Heizlast/Förderlogik)."
  },
  {
    "id": "r3.cross_gebaeude.7",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Heizungsraum verlegen mit langem Leitungsweg, der die Gebäudeausdehnung übersteigt",
    "field": "anschluss_vorlauf_distanz",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 90,
      "anzahl_etagen": 2,
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 28
    },
    "expect": "soft",
    "why": "90 m² auf 2 Etagen = ~45 m² Grundfläche, Diagonale grob ~9-10 m. Ein interner Anschluss-Leitungsweg von 28 m für den verlegten Heizungsraum übersteigt die mögliche Wegstrecke im Gebäude um ein Vielfaches – selbst mit Steigleitung über 2 Etagen sind keine 28 m innerhalb des Hauses verlegbar. 28 m liegt unter anschlussSoftMax 30, fällt also durch die reine Leitungs-Soft-Grenze; erst Anschluss-Distanz × Wohnfläche × Etagen (Gebäude-Innenmaß) entlarvt die unmögliche interne Leitungslänge."
  },
  {
    "id": "r3.cross_gebaeude.8",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Eng bewohnte Fläche mit mehr unbegehbaren Räumen als Bewohner überhaupt nutzen",
    "field": "anzahl_unbegehbare_raeume",
    "values": {
      "gebaeudetyp": "einfamilienhaus",
      "beheizte_wohnflaeche_m2": 70,
      "anzahl_bewohner": 1,
      "anzahl_etagen": 1,
      "anzahl_unbegehbare_raeume": 5
    },
    "expect": "soft",
    "why": "70 m² eingeschossig ergibt ~3-4 Räume; sind davon 5 unbegehbar, bleibt für den 1 gemeldeten Bewohner kein begehbarer Wohnraum – ein bewohntes Haus, dessen sämtliche (und mehr) Räume unbegehbar sind, ist ein Logikbruch. unbegehbar.trotzGescannt feuert nur bei check_raeume_gescannt=true (hier nicht gesetzt), und 5 ist die zulässige Obergrenze. Erst unbegehbare Räume × abgeleitete Raumzahl (Fläche/Etagen) × Bewohner>0 zeigt, dass mehr Räume unbegehbar gemeldet sind, als das bewohnte Gebäude hat."
  }
];
