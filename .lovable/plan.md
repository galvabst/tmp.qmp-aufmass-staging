

# Dashboard-Graph Fix + Anton Berger Ready-Status

## Problem 1: Graph zeigt nur flache Linien
Der Zeitreihen-Graph hat nur 2 Datenpunkte (Feb/Mrz) und "Einsatzbereit" ist immer 0, weil `onboarding_status = 'ready'` bei niemandem gesetzt ist. Es fehlen historische Zeitstempel pro Onboarding-Schritt, daher ist eine echte Zeitreihe nicht aussagekraftig.

## Losung: Funnel-Chart statt Zeitreihe
Ersetze den Onboarding-Trend-Linechart durch einen **horizontalen Funnel-Balkendiagramm**, der die aktuelle Verteilung aller Techniker uber die Onboarding-Phasen zeigt:

```text
Registriert        ████████████████████  17
Stammdaten         ████████████████      14
Bestellungen       ██████████            9
Akademie           ████████              7
Prufung bestanden  ███                   3
Coaching           ██                    2
Einsatzbereit      █                     1
```

Jeder Balken zahlt kumulativ: Wer bei "Coaching" ist, hat auch Stammdaten, Bestellungen und Akademie hinter sich. So sieht der Admin sofort, wo der Engpass im Funnel ist.

**Berechnung pro Stufe** (kumulativ = hat mindestens diese Stufe erreicht):
- Registriert: alle non-Trainer
- Stammdaten: `completedSteps` enthalt `profil`
- Bestellungen: `completedSteps` enthalt `bestellungen`
- Akademie: `completedSteps` enthalt `akademie` ODER `currentStep = 'akademie'` mit Lektionen > 0
- Prufung bestanden: `akademieTestBestanden = true`
- Coaching: `completedSteps` enthalt `coaching` ODER `coachingTermin` vorhanden
- Einsatzbereit: `onboardingStatus = 'ready'`

## Problem 2: Anton Berger nicht als "ready"
Der DB-Trigger `sync_onboarding_status` setzt `ready` nur wenn `completed_steps` genau 7 Eintrage hat UND alle internen Admin-Flags gesetzt sind (`trainer_freigabe`, `vertrag_geprueft_intern`, `kleidung_bestellt_intern`, `lizenzen_bereitgestellt_intern`). Anton hat wahrscheinlich nicht alle 7 Steps completed oder die internen Flags fehlen.

**Fix**: Migration die Antons `completed_steps` und interne Flags aktualisiert, damit der Trigger ihn auf `ready` setzt. Alternativ: Die Admin-Flags im Contractor-Detail-View setzbar machen (aber das ist ein separates Feature).

**Kurzfristiger Fix**: SQL-Migration die fur Anton die fehlenden completed_steps erganzt und die internen Flags setzt.

## Betroffene Dateien

| Datei | Anderung |
|-------|----------|
| `AdminDashboardView.tsx` | Linechart → Funnel-Barchart mit kumulativer Stufenberechnung |
| Migration (SQL) | Anton Berger Status-Fix |

