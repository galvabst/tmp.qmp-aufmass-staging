

## Coaching-Step: Enterprise-Level Redesign

Das aktuelle Layout wiederholt Informationen, die der Wrapper-Header bereits anzeigt ("Coaching", "Buche deine Praxis-Begleitung"), und die Cards wirken gestapelt statt wie ein durchdachter Flow. Enterprise-Software wuerde hier mit klarer visueller Hierarchie, einem "Boarding-Pass"-Feeling fuer gebuchte Termine und einem aufregenden Empty State arbeiten.

---

### Kompletter Umbau: `src/components/onboarding/steps/CoachingStep.tsx`

#### A) Leerer Zustand (keine Slots verfuegbar)

Statt einer langweiligen grauen Box mit "Keine Termine verfuegbar" wird ein visueller 3-Schritt-Prozess gezeigt, der erklaert wie Coaching funktioniert -- gefolgt von einem ansprechenden Hinweis, dass neue Termine kommen:

```text
+------------------------------------------+
|  [1]--------[2]--------[3]               |
|  Termin     Mitfahrt    Zertifiziert     |
|  buchen     & lernen    & startklar      |
+------------------------------------------+

+------------------------------------------+
|  (Kalender-Illustration)                 |
|  Neue Termine werden vorbereitet         |
|  Wir benachrichtigen dich, sobald        |
|  ein Trainer verfuegbar ist.             |
|                                          |
|  [Seite neu laden]                       |
+------------------------------------------+
```

- 3-Step-Flow mit verbindenden Linien, Icons (CalendarCheck, Car, Award) und Labels
- Dezente Animation der Punkte
- Reload-Button im Empty State

#### B) Slots verfuegbar

Die redundante "Praxis-Coaching"-Headercard und "So funktioniert's" werden ersetzt durch einen kompakten Flow-Indikator + direkt die Slot-Liste:

- **Kompakter 3-Schritt-Flow** oben (gleich wie bei leerem Zustand, aber kleiner)
- **Slot-Cards** bekommen ein Premium-Upgrade:
  - Groesserer Avatar (14x14) mit Status-Ring
  - Trainer-Name prominenter
  - Region als farbige Badge
  - Preis in einer eigenen Box mit Hintergrund
  - Bei Selektion: leuchtender Border + animierter Checkmark + leichter Scale-Effekt
- **Counter-Badge** "3 verfuegbar" bleibt

#### C) Gebuchter Zustand ("Boarding Pass")

Statt der aktuellen Success-Card wird ein "Boarding-Pass"-artiges Design verwendet:

```text
+==========================================+
|  *** PRAXIS-BEGLEITUNG BESTAETIGT ***    |
|  -  -  -  -  -  -  -  -  -  -  -  -  -  |
|                                          |
|  [Avatar]  Max Mustermann                |
|            Erfahrener Thermocheck-Coach  |
|                                          |
|  Datum        Region        Dauer        |
|  Di, 25.02.   NRW-West      Ganztaegig  |
|                                          |
|  -  -  -  -  -  -  -  -  -  -  -  -  -  |
|  Bringe deine komplette Ausstattung mit  |
+==========================================+
```

- Gestrichelte Trennlinien wie bei einem echten Ticket
- Grosser Avatar mit gruener Status-Border
- Daten in einem Grid-Layout (3 Spalten)
- Dezente Confetti/Sparkle-Dekoration
- Gruener Top-Accent-Stripe

---

### Zusammenfassung

| Datei | Aenderung |
|---|---|
| `src/components/onboarding/steps/CoachingStep.tsx` | Komplett ueberarbeitet: 3-Schritt-Flow, Boarding-Pass fuer gebuchten Slot, Premium Slot-Cards, besserer Empty State |

Keine neuen Dateien oder Dependencies noetig. Alles mit bestehenden Tailwind-Klassen und lucide-react Icons.

