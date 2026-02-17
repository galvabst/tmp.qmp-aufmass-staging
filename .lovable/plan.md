
## Trainer-Preis Self-Service

### Was wird gemacht
Trainer koennen im TrainerProfileEditor ihren Coaching-Preis (brutto, in Euro) selbst eintragen. Dieser Preis wird dann im Coaching-Step des Onboardings dynamisch angezeigt statt des hardcodierten 149-Euro-Werts.

### Aenderungen

#### 1. DB-Migration: Neue Spalte `trainer_coaching_preis`
- Spalte `trainer_coaching_preis NUMERIC(8,2) DEFAULT NULL` in `thermocheck.contractor_onboarding` hinzufuegen
- NULL bedeutet: kein Preis hinterlegt (Fallback auf 0 oder "Preis auf Anfrage" im UI)

#### 2. Hook `useTrainerProfile` erweitern
- `TrainerProfileData` Interface: `trainer_coaching_preis: number | null` hinzufuegen
- SELECT erweitern um `trainer_coaching_preis`
- Update-Mutation akzeptiert `trainer_coaching_preis`

#### 3. TrainerProfileEditor: Preis-Feld hinzufuegen
- Neues Input-Feld zwischen Bio und Save-Button
- Label: "Coaching-Preis (brutto)" mit Euro-Icon
- Input type="number", min=0, step=0.01, Placeholder "z.B. 149.00"
- Suffix "EUR" rechts im Input
- Aenderungs-Tracking in `hasChanges` integrieren

#### 4. OnboardingScreen: Preis dynamisch laden
- In `useAvailableCoachingRides` (useCoachingSlots.ts): `trainer_coaching_preis` aus `contractor_onboarding` mitlesen
- Im Coaching-Step den Preis aus den Trainer-Daten nehmen statt hardcoded 149
- Fallback: Wenn NULL, "Preis auf Anfrage" anzeigen oder 0

### Technische Details

| Datei | Aenderung |
|---|---|
| SQL-Migration | `ALTER TABLE thermocheck.contractor_onboarding ADD COLUMN trainer_coaching_preis NUMERIC(8,2) DEFAULT NULL` |
| `src/hooks/useTrainerProfile.ts` | Interface + SELECT + Update erweitern |
| `src/components/trainer/TrainerProfileEditor.tsx` | Neues Preis-Input-Feld |
| `src/hooks/useCoachingSlots.ts` | `trainer_coaching_preis` aus Trainer-Daten lesen und zurueckgeben |
| `src/components/OnboardingScreen.tsx` | Zeilen 382 + 403: `preis: trainer.coaching_preis ?? 0` statt `preis: 149` |

### Keine RLS-Aenderung noetig
Die bestehenden RLS-Policies auf `contractor_onboarding` decken die neue Spalte automatisch ab (Spalten-Level, nicht Row-Level).
