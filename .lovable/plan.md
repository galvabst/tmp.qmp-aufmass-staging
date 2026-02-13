

## Reihenfolge aendern: Coaching vor Nachweise

Die Schritte 6 und 7 werden getauscht. Neue Reihenfolge:

1. Profil -> 2. Dokumente -> 3. Bestellungen -> 4. Equipment -> 5. Akademie -> **6. Coaching** -> **7. Nachweise**

Logik: Erst die Mitfahrt beim Trainer absolvieren, dann bestaetigen, dass alles da ist und man einsatzbereit ist.

---

### Aenderungen

**1. `src/types/onboarding.ts`** -- STEP_ORDER Array anpassen:
- `coaching` vor `nachweise` setzen

**2. `src/lib/onboarding-config.ts`** -- ONBOARDING_STEPS Array anpassen:
- Coaching-Eintrag vor Nachweise-Eintrag verschieben

**3. `src/components/OnboardingScreen.tsx`** -- Button-Labels und Fortschrittslogik anpassen:
- `getNextLabel()`: "Weiter zu Coaching" nach Akademie, "Weiter zu Nachweise" nach Coaching, "Onboarding abschliessen" bei Nachweise
- `handleNext()`: Step-Array in der Fortschrittsspeicherung aktualisieren
- Completion-Check: `isComplete` basiert jetzt auf `nachweise` als letztem Schritt (Nachweise-Abschluss statt Coaching-Abschluss)

**4. `src/hooks/useOnboardingState.ts`** -- isComplete Pruefung anpassen:
- `isComplete` auf letzten Schritt (jetzt `nachweise`) umstellen statt `coachingAbgeschlossen`

Keine DB-Migration noetig -- die Reihenfolge ist rein Frontend-seitig gesteuert.

