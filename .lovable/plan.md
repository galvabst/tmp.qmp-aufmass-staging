

## Coaching-Preis: Netto-Eingabe + 30% Marge

### Problem
Der Trainer gibt aktuell einen **Brutto-Preis** ein. Gewuenscht ist:
1. Der Trainer gibt seinen **Netto-Preis** ein (was er selbst bekommt)
2. Im Hintergrund wird automatisch **30% Marge** draufgerechnet
3. Der Trainee sieht den Endpreis (Netto + 30%)

### Beispiel
- Trainer gibt ein: **300 EUR netto**
- Gespeichert in DB: weiterhin 300 (= sein Netto-Preis)
- Trainee sieht: **390 EUR** (300 * 1.30)

### Technischer Plan

| Datei | Aenderung |
|---|---|
| `src/components/trainer/TrainerProfileEditor.tsx` | Label von "Coaching-Preis (brutto)" auf "Coaching-Preis (netto)" aendern. Placeholder anpassen. Unter dem Input eine Vorschau anzeigen: "Endpreis fuer Trainee: XXX EUR (inkl. 30% Marge)" |
| `src/components/OnboardingScreen.tsx` | Bei der Preis-Zuweisung `preis: (ride.trainer_coaching_preis ?? 0) * 1.3` statt direkt den DB-Wert |
| `src/components/onboarding/steps/CoachingStep.tsx` | Preis-Anzeige bekommt ggf. Formatierung auf 2 Dezimalstellen (`preis.toFixed(0)` oder aehnlich, damit z.B. 390 statt 390.0 angezeigt wird) |

### DB-Spalte bleibt gleich
`trainer_coaching_preis` speichert weiterhin den Netto-Betrag des Trainers. Die 30%-Marge wird nur im Frontend berechnet. Das ist bewusst so gewaehlt, damit:
- Der Trainer seinen echten Preis sieht
- Die Marge zentral an einer Stelle (OnboardingScreen) berechnet wird
- Spaeter die Marge einfach angepasst werden kann (z.B. als Konstante)

### Keine DB-Migration noetig
Nur Frontend-Aenderungen.

