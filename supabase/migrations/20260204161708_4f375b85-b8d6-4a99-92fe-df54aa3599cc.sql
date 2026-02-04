-- Lerninhalte für "Was ist der Thermocheck?" einfügen
UPDATE thermocheck.contractor_akademie_lektionen 
SET 
  text_inhalt = '## 1. Das Mindset: „Datenqualität entscheidet über Lebensdauer"

- **Kein „Schnell-Check":** Verstehen, dass wir uns von 2-Stunden-Terminen der Konkurrenz abheben.
- **Verantwortung:** Eine falsche Datenaufnahme führt zu einer falsch dimensionierten Wärmepumpe (Verschleiß nach 8 Jahren statt 30 Jahren).
- **Das Cinderella-Prinzip:** Jedes Haus ist ein Unikat. Die Daten müssen so präzise sein, dass der „Schuh" (die Wärmepumpe) perfekt passt.

## 2. Die technische Datenerfassung (Der Kernauftrag)

- **U-Wert-Ermittlung:** Nicht nur „Fenster" notieren, sondern Material und Verglasungsart (Wärmeschutzglas?) exakt identifizieren.
- **Dämmungs-Check:** Identifikation von Dach-, Decken- und Fassadendämmung (auch nachträgliche Maßnahmen).
- **Heizkörper-Analyse:** Aufnahme von Typ, exakten Maßen und vor allem den Ventilen. Warum sind die Ventile für den hydraulischen Abgleich später so wichtig?
- **Raum-Scanner & 3D-Modell:** Korrekte Durchführung des Scans, Unterscheidung zwischen beheizten und unbeheizten Innen-/Außenwänden.

## 3. Der Workflow & das Vier-Augen-Prinzip

- **Schnittstelle Innendienst:** Wie bereite ich die Daten auf, damit der Heizungsbaumeister und der Energieberater daraus eine „thermische Gebäudesynthese" erstellen können?
- **Simulation verstehen:** Wissen, dass die aufgenommenen Daten durch eine Ganzjahressimulation (4 Jahreszeiten) gejagt werden.',
  text_zusammenfassung = '## „Deine Arbeit vor Ort ist das Gehirn der späteren Anlage."

Der Thermocheck ist eine echte **thermische Gebäudesynthese**. Als Techniker vor Ort bist du nicht zum „Gucken" da, sondern zur hochpräzisen Datengewinnung. Deine Aufgabe ist es, das Gebäude als digitales 3D-Modell so exakt abzubilden, dass eine Simulation über alle vier Jahreszeiten möglich wird.

**Merke:** Ein vergessenes Ventil oder ein falsch geschätzter U-Wert der Fenster führt zu einer falschen Heizlastberechnung. Das kostet den Kunden später tausende Euro an Strom oder zerstört die Anlage vorzeitig. 

Wir investieren **12 Stunden** in die Berechnung – und diese 12 Stunden sind nur so viel wert wie deine Datenaufnahme vor Ort.',
  updated_at = now()
WHERE id = 'f10b3df0-1a58-4d2a-80a1-164b38a21292';