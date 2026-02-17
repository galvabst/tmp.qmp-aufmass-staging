

## Masterplan: Trainer-Bypass End-to-End-Fix fuer Till

### Problem-Analyse (Reverse Engineering)

Till (`is_trainer=true`, profile_id `c0893b68-bc58-4694-94dc-9d991efdec12`) steckt im Onboarding fest. Es gibt **4 verkettete Blocker**, die sich gegenseitig blockieren:

```text
Blocker 1: "Onboarding abschliessen"-Button ist DISABLED
  └─ Zeile 843 OnboardingScreen.tsx prueft coaching_bewertung aus DB (= 'ausstehend')
     Trainer-Override wird nur an ProofStep (UI) weitergegeben, NICHT an die Button-Logik
  
Blocker 2: completed_steps hat nur 6/7 (nachweise fehlt)
  └─ Kann nicht gesetzt werden weil Button disabled (Blocker 1)
  
Blocker 3: DB-Trigger setzt onboarding_status nie auf 'ready' fuer Trainer
  └─ Trigger verlangt vertrag_geprueft_intern + kleidung_bestellt_intern + lizenzen_bereitgestellt_intern
     Alle drei = false. Kein Trainer-Bypass im Trigger.
  
Blocker 4: Frontend isDbReady hat keinen Trainer-Bypass
  └─ OnboardingScreen Zeile 431: isDbReady = status === 'ready' && trainerFreigabe
     Kein Trainer-Check.
  └─ useContractorOnboardingStatus: isReady verlangt status === 'ready' (auch mit Trainer-Bypass)
```

### Loesung (4 Aenderungen)

#### 1. DB-Trigger: Trainer-Bypass fuer `ready`-Status

**Datei:** Neue SQL-Migration

Der Trigger `thermocheck.sync_onboarding_status()` muss fuer Trainer die internen Admin-Checks ueberspringen:

```text
-- Aktuelle Logik (Zeile 28-33):
IF v_completed_count = 7
   AND NEW.trainer_freigabe = true
   AND NEW.vertrag_geprueft_intern = true
   AND NEW.kleidung_bestellt_intern = true
   AND NEW.lizenzen_bereitgestellt_intern = true
THEN v_new_status := 'ready';

-- Neue Logik:
IF v_completed_count = 7
   AND (
     NEW.is_trainer = true
     OR (
       NEW.trainer_freigabe = true
       AND NEW.vertrag_geprueft_intern = true
       AND NEW.kleidung_bestellt_intern = true
       AND NEW.lizenzen_bereitgestellt_intern = true
     )
   )
THEN v_new_status := 'ready';
```

#### 2. Frontend: Button-Disable-Logik fixen

**Datei:** `src/components/OnboardingScreen.tsx`, Zeile 843

Aktuell:
```text
nextDisabled={
  !canProceed || isAdvancing || 
  (state.currentStep === 'nachweise' && (dbOnboardingState as any)?.coachingBewertung !== 'bestanden')
}
```

Fix: Trainer-Bypass hinzufuegen:
```text
nextDisabled={
  !canProceed || isAdvancing || 
  (state.currentStep === 'nachweise' && !dbStatus?.isTrainer && (dbOnboardingState as any)?.coachingBewertung !== 'bestanden')
}
```

#### 3. Frontend: `isDbReady` in OnboardingScreen

**Datei:** `src/components/OnboardingScreen.tsx`, Zeile 431

Aktuell:
```text
const isDbReady = dbStatus?.onboardingStatus === 'ready' && dbStatus?.trainerFreigabe === true;
```

Fix: Trainer-Bypass:
```text
const isDbReady = dbStatus?.isTrainer
  ? dbStatus?.onboardingStatus === 'ready'
  : (dbStatus?.onboardingStatus === 'ready' && dbStatus?.trainerFreigabe === true);
```

#### 4. Daten-Fix fuer Till

**SQL UPDATE** (kein Schema-Change, via Insert-Tool):

```text
UPDATE thermocheck.contractor_onboarding
SET completed_steps = ARRAY['profil','dokumente','bestellungen','equipment','akademie','coaching','nachweise'],
    current_step = 'nachweise'
WHERE profile_id = 'c0893b68-bc58-4694-94dc-9d991efdec12';
```

Nach dem Trigger-Update (Aenderung 1) wird der Trigger automatisch `onboarding_status = 'ready'` setzen, weil:
- `completed_steps` = 7
- `is_trainer` = true (Trainer-Bypass)

### Rollen-Matrix

| Rolle | completed=7 | is_trainer | trigger setzt ready? | Frontend isReady? |
|---|---|---|---|---|
| Normaler User | Ja | false | Nur wenn alle 4 Flags true | Nur wenn status=ready + alle Flags |
| Trainer (Till) | Ja | true | Ja (Bypass) | Ja (Bypass) |
| Admin ohne Onboarding | - | - | - | Redirect zu /admin |

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Trainer wird is_trainer=false gesetzt | Trigger re-evaluiert: braucht wieder alle Flags. Frontend zeigt Onboarding. |
| Trainer hat nur 6 Steps | Trigger setzt NICHT ready (completed_count != 7). Frontend zeigt Onboarding. |
| Normaler User | Keine Aenderung. Alle 4 Flags + 7 Steps noetig. |
| Trainer klickt "Onboarding abschliessen" | handleNext setzt alle 7 Steps, speichert in DB, Trigger setzt ready, refetch zeigt Pool. |
| coaching_bewertung bleibt 'ausstehend' fuer Trainer | Kein Problem: Button-Disable hat Trainer-Bypass, ProofStep bekommt 'bestanden'. |

### Dateien die geaendert werden

| Datei | Aenderung | Umfang |
|---|---|---|
| Neue SQL-Migration | Trigger `sync_onboarding_status` mit Trainer-Bypass | ~5 Zeilen geaendert |
| `src/components/OnboardingScreen.tsx` | Zeile 431 isDbReady + Zeile 843 nextDisabled | 2 Zeilen |
| `.lovable/validation-trainer-akademie-bypass.md` | Dokumentation aktualisieren | Update |
| Data-Fix SQL | completed_steps fuer Till auf 7 setzen | 1 UPDATE |

### Selbst-Validierung

Nach Umsetzung wird folgendes geprueft:
1. Till's DB-Record: `onboarding_status` muss `ready` sein
2. RPC `get_my_contractor_onboarding` fuer Till: `is_trainer=true`, `onboarding_status='ready'`
3. Frontend-Flow: `useContractorOnboardingStatus.isReady` = true (weil status='ready' + Trainer-Bypass im Hook bereits vorhanden)
4. Index.tsx Zeile 240: `!isDbReady` = false, also Pool wird angezeigt
5. Kein WaitingForApproval-Screen fuer Trainer
6. Normale User: Keine Aenderung, alle Flags weiterhin erforderlich

