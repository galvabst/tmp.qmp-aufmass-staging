# Validation: Trainer-Akademie- & Coaching-Bypass

**Datum:** 2026-02-17

## Änderungen

### DB-Migration
- `thermocheck.get_my_contractor_onboarding()` gibt jetzt `co.is_trainer` zurück
- Public Wrapper `public.get_my_contractor_onboarding()` ebenfalls aktualisiert

### Frontend (6 Dateien)
1. **`useContractorOnboardingStatus.ts`**: `is_trainer: boolean` im Interface + Mapping
2. **`Index.tsx`**: `isTrainer` in `dbStatus` Objekt durchgereicht
3. **`OnboardingScreen.tsx`**: `isTrainer` Prop im Interface + an `useOnboardingState` und `AcademyStep` weitergeleitet; Trainer-Banner im Coaching-Step
4. **`useOnboardingState.ts`**: Neuer `isTrainer` Parameter → `isStepComplete('akademie')` und `isStepComplete('coaching')` geben `true` zurück wenn Trainer
5. **`AcademyStep.tsx`**: Info-Banner für Trainer + alle Module freigeschaltet (kein Lock)
6. **`CoachingStep`** (in OnboardingScreen): Info-Banner für Trainer ("Als Trainer ist die Mitfahrt für dich nicht erforderlich.")

## Rollen-Matrix

| Rolle | Akademie-Pflicht? | Coaching-Pflicht? | Module freigeschaltet? | Weiter-Button aktiv? |
|---|---|---|---|---|
| user (is_trainer=false) | Ja | Ja | Sequenziell | Nur wenn alle Lektionen + Test / Ride gebucht |
| user (is_trainer=true) | Nein | Nein | Alle offen | Sofort | Kein Warten auf Freigabe |
| Preview-Modus | Nein | Nein | Alle offen | Sofort |

## Edge Cases

| Szenario | Status |
|---|---|
| Trainer will Akademie trotzdem machen | ✅ Alle Module freigeschaltet |
| Trainer will trotzdem Ride buchen | ✅ UI bleibt funktional |
| Trainer wird auf is_trainer=false gesetzt | ✅ Akademie + Coaching werden Pflicht (nächster Load) |
| Normaler User | ✅ Keine Änderung |
| Trainer hat teilweise Fortschritt | ✅ Fortschritt bleibt, Steps sind "complete" |

## RLS-Analyse
- Keine neuen RLS-Policies nötig (SECURITY DEFINER RPC)
- `is_trainer` wird nur per RPC gelesen (read-only für User)

## Keine neuen Dependencies
