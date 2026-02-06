
# Equipment-Status in der Datenbank persistieren

## Ziel
Die Angaben zu Drohne und iPhone (ob eigenes vorhanden) gehen beim Geraetewechsel verloren, da sie nur im localStorage stehen. DB wird zur SSoT.

## 1. Datenbank-Migration

Neue JSONB-Spalte + zwei RPCs (thermocheck-Schema + public Wrapper):

**Spalte:**
```text
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN equipment_status JSONB DEFAULT '{}';
```

**RPC zum Speichern (SECURITY DEFINER, auth.uid()-basiert):**
```text
thermocheck.update_contractor_equipment_status(p_equipment JSONB) RETURNS void
  UPDATE thermocheck.contractor_onboarding
  SET equipment_status = p_equipment, aktualisiert_am = now()
  WHERE profile_id = auth.uid();
```

**Public Wrapper (gleicher Pattern wie Gewerbeschein/Progress):**
```text
public.update_contractor_equipment_status(p_equipment JSONB) RETURNS void
  RETURN thermocheck.update_contractor_equipment_status(p_equipment);
```

**get_contractor_onboarding_state erweitern:**
`equipment_status` zum Rueckgabetyp hinzufuegen (DROP + RECREATE der Funktion).

## 2. Hook: `src/hooks/useContractorProfile.ts`

- `ContractorOnboardingData`-Interface: neues Feld `equipment_status?: Record<string, unknown> | null`
- `ContractorOnboardingState`-Interface: neues Feld `equipmentStatus?: Record<string, { hatEigenes: boolean; nachweisUrl?: string }>`
- Mapping in `onboardingStateQuery`: `equipment_status` aus DB-Row mappen
- Neue Mutation `saveEquipmentStatusMutation` (analog zu `saveGewerbescheinMutation`)
- Im Return-Objekt: `saveEquipmentStatus` exponieren

## 3. Hydration: `src/components/OnboardingScreen.tsx`

Im bestehenden Hydrations-useEffect (wo Gewerbeschein + Fortschritt geladen werden):
- Wenn `dbOnboardingState.equipmentStatus` vorhanden, via `updateEquipmentStatus` in den lokalen State uebernehmen (pro Equipment-ID)

## 4. Speichern: `src/components/OnboardingScreen.tsx`

In `handleNext`, wenn `state.currentStep === 'equipment'`:
- `saveEquipmentStatus(state.equipmentStatus)` aufrufen (non-blocking, analog zum Gewerbeschein-Pattern)
- Console-Log bei Erfolg/Fehler

## Betroffene Dateien

1. **Neue SQL-Migration** - Spalte + 3 Funktionen (thermocheck RPC, public Wrapper, get_state erweitern)
2. `src/hooks/useContractorProfile.ts` - Interface + Mutation + Mapping
3. `src/components/OnboardingScreen.tsx` - Hydration + Speichern bei "Weiter"
