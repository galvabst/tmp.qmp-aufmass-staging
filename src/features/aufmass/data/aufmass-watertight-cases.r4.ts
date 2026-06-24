import type { WatertightCase } from './aufmass-watertight-cases';

// AUTOGENERIERT aus Workflow aufmass-watertight-enumerate-r4 (Runde 4). Nicht von Hand pflegen.
export const GENERATED_CASES_R4: WatertightCase[] = [
  {
    "id": "r4.techniker.1",
    "page": "techniker",
    "domain": "wp",
    "label": "Aufmaßtechniker und bestätigender Kunde sind dieselbe Person",
    "field": "techniker_name",
    "values": {
      "techniker_name": "Max Mustermann",
      "kunde_bestaetigung_vorname": "Max",
      "kunde_bestaetigung_nachname": "Mustermann"
    },
    "expect": "soft",
    "why": "Der Techniker führt das Vor-Ort-Aufmaß durch, der Kunde bestätigt es UNABHÄNGIG (kunde_aufstellort_bestaetigt + Vor-/Nachname als Pflichtfelder = der ganze Sinn der Bestätigungsseite). Ist der Name des Technikers identisch mit dem bestätigenden Kunden, bestätigt der Techniker sein eigenes Aufmaß selbst — die Vier-Augen-/Kunden-Freigabe ist wertlos. Das ist ein echter Querfeld-Widerspruch über zwei verschiedene Formularseiten hinweg, den keine Bereichs-/Format-/Einzelfeldregel findet: Name und Telefon werden je einzeln auf Buchstabe bzw. 6–16 Ziffern geprüft, aber techniker_name wird NIRGENDS gegen kunde_bestaetigung_vorname/-nachname verglichen (im gesamten validation- und plausibility-Layer kein Vergleich vorhanden). Nur soft, kein block: in seltenen Fällen vermisst ein Techniker sein eigenes Haus — physikalisch möglich, aber die Bestätigung ist dann faktisch eine Selbstbestätigung und gehört begründet. Normalisiert vergleichen (trim + lowercase, techniker_name vs. zusammengesetzter Kundenname in beiden Reihenfolgen Vorname/Nachname)."
  },
  {
    "id": "r4.heizung_termin.1",
    "page": "heizung_termin",
    "domain": "wp",
    "label": "Defekte (nicht funktionstüchtige) Heizung soll als fossiler Brennstoff weiterlaufen",
    "field": "fossile_brennstoffe_nach_austausch",
    "values": {
      "heizung_funktionstuechtig": false,
      "fossile_brennstoffe_nach_austausch": true
    },
    "expect": "block",
    "why": "Querfeld heizung_funktionstuechtig=false × fossile_brennstoffe_nach_austausch=true. Wenn der Bestandserzeuger nachweislich NICHT funktionstüchtig ist, kann er nach dem WP-Einbau nicht weiter fossil heizen/zuheizen — eine defekte Anlage als bleibende fossile Wärmequelle ist ein echter logischer Selbstwiderspruch, nicht nur das schon erfasste GEG-Zielargument (fossile.bleibt, das auch bei intakter Heizung greift). Reduziert sich nicht auf fossile.bleibt (anderer Auslöser: Defekt) und nicht auf eine Bereichsprüfung. Begründung: ist die Anlage defekt, gibt es nichts, das fossil weiterläuft."
  },
  {
    "id": "r4.gebaeude.1",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Heizung als nicht funktionstüchtig markiert, aber 3-Jahres-Verbrauch der laufenden Anlage angegeben",
    "field": "heizung_funktionstuechtig",
    "values": {
      "heizung_funktionstuechtig": false,
      "durchschnittsverbrauch_3_jahre": 18000,
      "heizungsart": "gas",
      "beheizte_wohnflaeche_m2": 140
    },
    "expect": "soft",
    "why": "Querfeld-Widerspruch, den keine bestehende Einzelregel fängt: Der vorhandene 'fossile.bleibt'-, Datums- und Verbrauchsband-Check prüfen Verbrauch nie GEGEN den Heizungszustand. Eine als defekt/nicht funktionstüchtig erfasste Bestandsheizung kann keinen belastbaren 3-Jahres-Durchschnittsverbrauch produziert haben (entweder lief sie, dann ist sie nicht 'nicht funktionstüchtig', oder der Verbrauch stammt von einer anderen Quelle). Das ist die ehrlichste verbliebene Lücke. Soft, weil ein defektes Gerät erst kürzlich ausgefallen sein könnte und der Schnitt aus der Vorzeit stammt."
  },
  {
    "id": "r4.gebaeude.2",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Reine Fußbodenheizung mit Spreizung > ~10 K physikalisch nicht haltbar",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 40,
      "ruecklauftemperatur": 18
    },
    "expect": "soft",
    "why": "Die generische Spreizungsregel blockt erst > 25 K und der Rücklauf-hardMin liegt bei 10 °C, daher rutscht eine FBH-Auslegung mit 22 K Spreizung (40/18) komplett durch, obwohl eine reine Fußbodenheizung bauphysikalisch auf ~5-10 K Spreizung ausgelegt ist (sonst kalte Estrichzonen / unzulässige Oberflächentemperatur-Differenz). Existierende FBH-Regeln prüfen nur Vorlauf-Obergrenzen (>45 soft, >60 block), nie die Spreizung im FBH-Kontext. Soft, da Messunsicherheit im Teillastbetrieb möglich ist."
  },
  {
    "id": "r4.gebaeude.3",
    "page": "gebaeude",
    "domain": "wp",
    "label": "Solarthermie für Warmwasser vorhanden, aber im Gebäude keinerlei Warmwasser-Zapfstelle (0 Duschen + 0 Badewannen)",
    "field": "hat_solarthermie",
    "values": {
      "hat_solarthermie": true,
      "anzahl_duschen": 0,
      "anzahl_badewannen": 0,
      "anzahl_bewohner": 3
    },
    "expect": "soft",
    "why": "Die bestehende 'sanitaer.keine'-Regel meldet zwar 0 Dusche/0 Wanne generisch, aber NICHT im Zusammenhang mit Solarthermie. Solarthermie dient in Wohngebäuden ganz überwiegend der Warmwasserbereitung; ist gleichzeitig gar keine Warmwasser-Entnahmestelle vorhanden, ist die Kombination widersprüchlich (entweder reine Heizungsunterstützung – selten und dann anders zu erfassen – oder eine Zapfstelle fehlt in der Erfassung). Reduziert sich NICHT auf die reine 0/0-Regel, weil erst die Solarthermie die Aussage 'es muss Warmwasser geben' erzwingt. Soft."
  },
  {
    "id": "r4.heizungsraum.1",
    "page": "heizungsraum",
    "domain": "wp",
    "label": "Warmwasser-Leitung verlegt, aber keine Kaltwasser-Zuleitung am neuen Standort",
    "field": "anschluss_kaltwasser_vorhanden",
    "values": {
      "heizungsraum_verlegen": true,
      "anschluss_vorlauf_vorhanden": true,
      "anschluss_vorlauf_distanz": 6,
      "anschluss_ruecklauf_vorhanden": true,
      "anschluss_ruecklauf_distanz": 6,
      "anschluss_warmwasser_vorhanden": true,
      "anschluss_warmwasser_distanz": 8,
      "anschluss_kaltwasser_vorhanden": false,
      "anschluss_kaltwasser_distanz": 0,
      "anschluss_zirkulation_vorhanden": false,
      "anschluss_zirkulation_distanz": 0
    },
    "expect": "soft",
    "why": "Hydraulische Abhaengigkeit eine Ebene tiefer als die bereits gepruefte Regel 'Zirkulation setzt Warmwasser voraus' (zirkOhneWw): Warmwasser entsteht nicht aus dem Nichts, es kommt aus einem Trinkwasserspeicher/WP-Hygienespeicher, der KALT gespeist und WARM abgegeben wird. Eine zum neuen Standort gefuehrte Warmwasserleitung (vorhanden=true) impliziert zwingend eine Kaltwasser-Zuleitung dorthin, die den Speicher nachspeist. Warmwasser vorhanden + Kaltwasser 'nicht vorhanden' bedeutet einen Speicher, der Warmwasser liefert, ohne je kaltes Wasser zu bekommen - thermodynamisch/hydraulisch unmoeglich. Die Engine kennt nur die Kette Zirk->WW, aber NICHT die naechste Stufe WW->KW. Kein Einzelregel-Treffer: KW vorhanden=false mit dist=0 ist konsistent (kein dist>0-Widerspruch), VL/RL-Paar stimmt, verlegen=true mit vorhandenen Leitungen ist plausibel. Soft statt block, weil eine reine Heizkreis-Verlegung mit unveraendert woanders stehendem, extern gespeistem Speicher ein seltener gueltiger Sonderfall bleibt - dann sollte aber WW dort ebenfalls 'nicht vorhanden' sein, weshalb WW=ja + KW=nein eine Begruendung verdient."
  },
  {
    "id": "r4.heizungsart.1",
    "page": "heizungsart",
    "domain": "wp",
    "label": "Mehrere Öltanks, aber Gesamtvolumen impliziert physikalisch unmöglich kleines Volumen je Tank",
    "field": "oeltank_anzahl",
    "values": {
      "heizungsart": "oel",
      "oeltank_anzahl": 8,
      "oeltank_liter_gesamt": 800,
      "oeltank_liter_aktuell": 300,
      "oeltank_transport_beschreibung": "Über Kellertreppe"
    },
    "expect": "soft",
    "why": "8 Tanks bei nur 800 L Gesamtvolumen ergeben 100 L je Tank. Das ist kleiner als der kleinste real gefertigte Heizöl-Batterietank (~200-750 L). Beide Einzelwerte sind gültig: 800 L liegt über literHardMin (200) und 8 liegt im Anzahl-Bereich. Die einzige Querfeld-Regel (proTank) prüft NUR die Obergrenze (>5000 L/Tank); eine Untergrenze je Tank existiert nicht. Eine Anzahl, die zu einem Volumen je Tank unterhalb des kleinsten realen Tanks führt, ist eine echte Kreuzfeld-Unmöglichkeit, die keine Bereichsprüfung und keine bestehende Regel fängt (z. B. 8 Tanks à 100 L = jemand hat Anzahl und Gesamtvolumen verwechselt oder die Anzahl falsch eingegeben)."
  },
  {
    "id": "r4.heizkoerper.1",
    "page": "heizkoerper",
    "domain": "wp",
    "label": "Reine Fußbodenheizung mit unrealistisch großer Spreizung",
    "field": "ruecklauftemperatur",
    "values": {
      "heizkoerper_typ": "fussbodenheizung",
      "vorlauftemperatur": 40,
      "ruecklauftemperatur": 20,
      "rohrsystem": "zweirohr"
    },
    "expect": "soft",
    "why": "Eine reine Fußbodenheizung fährt konstruktiv eine sehr enge Spreizung (Auslegung ~5-7 K, max ~10 K), weil die Oberflaechentemperatur des Estrichs begrenzt ist und die Heizkreise lang sind. 40/20 (= 20 K Spreizung) ist fuer eine FBH physikalisch praktisch unmoeglich (ungleichmaeßig heißer/kalter Boden, viel zu geringer Volumenstrom), waehrend beide Einzelwerte fuer sich im gueltigen FBH-Bereich liegen und der Vorlauf (40 °C) keine bestehende FBH-Regel ausloest. Die generische Spreizungs-Soft-Grenze greift erst >25 K, also faellt dieser Fall heute durch jede Pruefung. Echte Kreuzfeld-Pruefung (heizkoerper_typ + VL + RL), reduziert sich nicht auf die generische Spreizungsregel oder eine VL-Regel. Schwelle z. B. >12 K bei reiner FBH."
  },
  {
    "id": "r4.pv.1",
    "page": "pv",
    "domain": "pv",
    "label": "Module auf gleichem Gebäude (module_gleiches_gebaeude=true), aber beide DC-Verlegewege ausgeschlossen (Fassade UND Dachhaut nicht möglich)",
    "field": "dc_dachhaut_moeglich",
    "values": {
      "module_gleiches_gebaeude": true,
      "dc_fassade_moeglich": false,
      "dc_dachhaut_moeglich": false
    },
    "expect": "soft",
    "why": "Die bestehende Regel pv.dc.keinWeg meldet zwar 'weder Fassade noch Dachhaut' isoliert. Der hier zusätzlich verschärfende Fakt: Module und Wechselrichter sind auf DEMSELBEN Gebäude (module_gleiches_gebaeude=true), d.h. es gibt physisch nur dieses eine Gebäude, durch dessen Außenhaut (Dachhaut oder Fassade) das DC-Kabel zwangsläufig geführt werden MUSS. Sind beide einzigen möglichen Durchführungswege der Gebäudehülle ausgeschlossen, existiert keine physikalisch mögliche Kabeltrasse zum WR — anders als bei zwei getrennten Gebäuden (Erdverlegung/Freileitung als Ausweg). Das ist keine reine Wiederholung von pv.dc.keinWeg, weil erst die Kopplung an 'ein einziges Gebäude' den Fall von 'unbequem' auf 'kein Pfad' hebt. Grenzfall der Ehrlichkeit: reduziert sich teilweise auf pv.dc.keinWeg, daher nur soft."
  },
  {
    "id": "r4.pv.2",
    "page": "pv",
    "domain": "pv",
    "label": "Negative Ziegelneigung gewählt (ziegel_neigung='negativ'), aber Neigungsgrad als positiver Zahlenwert eingetragen",
    "field": "ziegel_neigung_grad",
    "values": {
      "ziegel_neigung": "negativ",
      "ziegel_neigung_grad": 12
    },
    "expect": "soft",
    "why": "Das Formular trennt Richtung (ziegel_neigung positiv/negativ) und Betrag (ziegel_neigung_grad). Die Abweichungsregel pv.ziegelNeigung.abweichung vergleicht |ziegel_neigung_grad − dachneigung| und behandelt ziegel_neigung_grad implizit als gleichgerichtet zur Dachneigung. Bei ziegel_neigung='negativ' zeigt die Ziegellage GEGEN die Dachneigungsrichtung — ein als positive Zahl eingetragener Grad widerspricht dann dem Richtungsfeld bzw. macht den Vergleich mit der (positiven) Dachneigung physikalisch falsch (eine negativ geneigte Fläche müsste in der Abweichung mit umgekehrtem Vorzeichen eingehen). Weder die Bereichsprüfung (0–90°) noch die Abweichungsregel berücksichtigen das Vorzeichenfeld, daher fällt die Richtungs-/Betrags-Inkonsistenz durch. Reduziert sich NICHT auf eine bestehende Einzelregel, weil ziegel_neigung (das Richtungs-Enum) in keiner Plausibilitätsregel vorkommt."
  },
  {
    "id": "r4.cross_heizung.1",
    "page": "heizung",
    "domain": "wp",
    "label": "heizungsart='sonstige' deaktiviert jede Einheiten-/Absolut-Prüfung des Verbrauchs, obwohl der spezifische kWh/m²·a-Check + Energieband den Rohwert weiter als kWh interpretiert und gegen die Dämmung spiegelt",
    "field": "durchschnittsverbrauch_3_jahre",
    "values": {
      "heizungsart": "sonstige",
      "heizungsart_sonstige": "Holzvergaser / Scheitholz",
      "durchschnittsverbrauch_3_jahre": 25,
      "beheizte_wohnflaeche_m2": 160,
      "fassade_gedaemmt": false,
      "dach_gedaemmt": false,
      "verglasung": "einfach",
      "bauantrag_datum": "1968-04-01",
      "anzahl_bewohner": 4,
      "anzahl_etagen": 2,
      "gebaeudetyp": "einfamilienhaus",
      "vorlauftemperatur": 70,
      "ruecklauftemperatur": 55,
      "heizkoerper_typ": "heizkoerper",
      "rohrsystem": "zweirohr"
    },
    "expect": "soft",
    "why": "Mehrstufiger Widerspruch heizungsart × durchschnittsverbrauch_3_jahre (Einheit) × Wohnfläche × Dämmung/Verglasung, der durch eine Lücke in der else-if-Kette der Verbrauchsprüfung fällt. In aufmass-plausibility.ts (Z.166-194) werden Absolut-Caps NUR für 'oel' (oelMaxLiter) und 'gas' (gasMaxKwh) gesetzt; für heizungsart='sonstige' (Holz/Pellets/Scheitholz/Fernwärme) gibt es KEINE einheitsspezifische Prüfung. Die Engine rechnet den Rohwert dann im else-if-Zweig stillschweigend als kWh: kwh = istOel ? v*10 : v — bei 'sonstige' also 1:1 als kWh. Bei Scheitholz wird der Verbrauch real in Ster/Raummeter erfasst (1 Ster Buche ≈ 1500 kWh). Trägt der Techniker '25' (Ster) ein, ergibt proM2 = 25/160 ≈ 0,16 kWh/m²·a → UNTER verbrauchProM2.hardMin (10) → die Engine feuert verbrauchProM2.hard (block) und behauptet 'physikalisch unmöglich', obwohl der Wert in der korrekten Holz-Einheit (≈37.500 kWh, also ~234 kWh/m²·a für den unsanierten Altbau mit VL/RL 70/55) völlig plausibel ist. Umgekehrt rutscht ein als kWh-getippter Pellet-Kessel-Wert je nach Größe durch die hardMin/hardMax-Wände, während die Energieband-Prüfung (klasse aus Dämmung+Verglasung+bauantrag abgeleitet) ihn fälschlich als kWh gegen die Hülle spiegelt. Kern der Lücke: Es gibt keine einheits-/heizungsart-bewusste Verbrauchsprüfung für 'sonstige' — heizkoerper_typ, rohrsystem, VL/RL und der unsanierte Hüllen-Kontext bestätigen hier zwar einen echten Altbau-Heizfall, aber genau dieser Kontext wird beim Verbrauch nicht herangezogen, um die Einheiten-Inkonsistenz zu erkennen. Soft (nicht block): legitime 'sonstige'-Träger wie Fernwärme/Pellets liefern sehr wohl kWh, deshalb darf der bloße Verdacht den Submit nicht hart sperren, sondern nur eine Pflicht-Begründung/Einheitenklärung erzwingen. Reduziert sich NICHT auf r2.cross_heizung.1/2 (die nur 'oel'/'gas' und deren feste ×10- bzw. m³-Verwechslung behandeln) und NICHT auf das Energieband (das die Einheit als gegeben annimmt)."
  }
];
