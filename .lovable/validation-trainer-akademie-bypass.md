# Validation: Trainer-Akademie-Bypass

**Datum:** 2026-02-17

## Änderungen

### DB-Migration
- `thermocheck.get_my_contractor_onboarding()` gibt jetzt `co.is_trainer` zurück
- Public Wrapper `public.get_my_contractor_onboarding()` ebenfalls aktualisiert

### Frontend (5 Dateien)
1. **`useContractorOnboardingStatus.ts`**: `is_trainer: boolean` im Interface + Mapping
2. **`Index.tsx`**: `isTrainer` in `dbStatus` Objekt durchgereicht
3. **`OnboardingScreen.tsx`**: `isTrainer` Prop im Interface + an `useOnboardingState` und `AcademyStep` weitergeleitet
4. **`useOnboardingState.ts`**: Neuer `isTrainer` Parameter → `isStepComplete('akademie')` gibt `true` zurück wenn Trainer
5. **`AcademyStep.tsx`**: Info-Banner für Trainer + alle Module freigeschaltet (kein Lock)

## Rollen-Matrix

| Rolle | Akademie-Pflicht? | Module freigeschaltet? | Weiter-Button aktiv? |
|---|---|---|---|
| user (is_trainer=false) | Ja | Sequenziell | Nur wenn alle Lektionen + Test |
| user (is_trainer=true) | Nein | Alle offen | Sofort |
| Preview-Modus | Nein | Alle offen | Sofort |

## Edge Cases

| Szenario | Status |
|---|---|
| Trainer will Akademie trotzdem machen | ✅ Alle Module freigeschaltet |
| Trainer wird auf is_trainer=false gesetzt | ✅ Akademie wird Pflicht (nächster Load) |
| Normaler User | ✅ Keine Änderung |
| Trainer hat teilweise Fortschritt | ✅ Fortschritt bleibt, Step ist "complete" |

## RLS-Analyse
- Keine neuen RLS-Policies nötig (SECURITY DEFINER RPC)
- `is_trainer` wird nur per RPC gelesen (read-only für User)

## Keine neuen Dependencies
