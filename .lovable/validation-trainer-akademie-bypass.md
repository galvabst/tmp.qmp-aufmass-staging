# Validation: Trainer-Bypass (Akademie, Coaching, Approval Gate, DB-Trigger)

**Datum:** 2026-02-17

## Änderungen

### DB-Migration 1: RPC
- `thermocheck.get_my_contractor_onboarding()` gibt jetzt `co.is_trainer` zurück
- Public Wrapper `public.get_my_contractor_onboarding()` ebenfalls aktualisiert

### DB-Migration 2: Trigger `sync_onboarding_status`
- Trainer-Bypass: `is_trainer = true` → Trigger setzt `ready` ohne interne Admin-Checks
- Normale User brauchen weiterhin: `trainer_freigabe + vertrag_geprueft_intern + kleidung_bestellt_intern + lizenzen_bereitgestellt_intern`
- Fix: `einsatzbereit` war kein gültiger Substatus-Enum-Wert → bei `ready` bleibt substatus auf letztem Wert (`akademie_abgeschlossen`)

### Frontend (6+ Dateien)
1. **`useContractorOnboardingStatus.ts`**: `is_trainer: boolean` im Interface + Mapping. `isReady` für Trainer: nur `onboarding_status === 'ready'` nötig (kein `trainer_freigabe`, keine internen Flags)
2. **`Index.tsx`**: `isTrainer` in `dbStatus` Objekt durchgereicht
3. **`OnboardingScreen.tsx`**:
   - `isDbReady`: Trainer braucht nur `status === 'ready'`, keine `trainer_freigabe`
   - `nextDisabled` (Nachweise-Step): Trainer-Bypass für `coachingBewertung`-Check
   - Trainer-Banner im Coaching-Step + Nachweise-Step
4. **`useOnboardingState.ts`**: `isTrainer` Parameter → `isStepComplete('akademie')`, `isStepComplete('coaching')`, `isStepComplete('nachweise')` geben `true` zurück
5. **`AcademyStep.tsx`**: Info-Banner für Trainer + alle Module freigeschaltet
6. **`CoachingStep`** (in OnboardingScreen): Info-Banner für Trainer

### Daten-Fix
- Till (`c0893b68-bc58-4694-94dc-9d991efdec12`): `completed_steps` auf alle 7 gesetzt
- Trigger hat automatisch `onboarding_status = 'ready'` gesetzt

## Rollen-Matrix

| Rolle | Akademie-Pflicht? | Coaching-Pflicht? | Nachweise-Gate? | Approval-Gate? | Trigger ready? |
|---|---|---|---|---|---|
| user (is_trainer=false) | Ja | Ja | coaching_bewertung=bestanden | trainer_freigabe + 3 interne Flags | Nur wenn alle Flags |
| user (is_trainer=true) | Nein | Nein | Bypass | Bypass | is_trainer=true + 7 Steps |
| Preview-Modus | Nein | Nein | Bypass | N/A | N/A |

## Edge Cases

| Szenario | Verhalten | Status |
|---|---|---|
| Trainer wird is_trainer=false gesetzt | Trigger re-evaluiert: braucht alle Flags. Frontend zeigt Onboarding. | ✅ |
| Trainer hat nur 6 Steps | Trigger setzt NICHT ready. Frontend zeigt Onboarding. | ✅ |
| Normaler User | Keine Änderung. Alle Flags nötig. | ✅ |
| coaching_bewertung=ausstehend für Trainer | Button-Disable hat Bypass. ProofStep bekommt 'bestanden'. | ✅ |
| Trainer will Akademie trotzdem machen | Alle Module freigeschaltet | ✅ |
| Trainer will trotzdem Ride buchen | UI bleibt funktional | ✅ |

## Trigger-Logik (sync_onboarding_status)

```
IF completed_count = 7 AND (
  is_trainer = true
  OR (trainer_freigabe AND vertrag_geprueft AND kleidung_bestellt AND lizenzen_bereitgestellt)
)
→ status = 'ready'
```

## RLS-Analyse
- Keine neuen RLS-Policies nötig (SECURITY DEFINER RPC + Trigger)
- `is_trainer` wird nur per RPC gelesen (read-only für User)

## Keine neuen Dependencies
