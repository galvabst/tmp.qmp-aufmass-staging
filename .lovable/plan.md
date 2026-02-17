

## Trainer-Akademie-Bypass: Trainers koennen die Akademie ueberspringen

### Problem

Der User `tillibendorf@gmail.com` ist ein Trainer (`is_trainer = true`) und steckt beim Akademie-Schritt fest. Trainer sind bereits zertifizierte Fachkraefte und muessen die Akademie nicht zwingend absolvieren.

### Architektur-Analyse

Der Akademie-Bypass muss an 5 Stellen greifen:

```text
RPC (get_my_contractor_onboarding)
  --> ContractorOnboardingRecord (Interface)
    --> dbStatus (OnboardingScreen Prop)
      --> useOnboardingState (isStepComplete Logik)
        --> AcademyStep UI (Skip-Option)
```

### Schritt 1: RPC erweitern

**`get_my_contractor_onboarding`** gibt aktuell `is_trainer` NICHT zurueck. Migration noetig:

Die RPC in `thermocheck` und der public Wrapper muessen `co.is_trainer` in die SELECT-Liste aufnehmen.

### Schritt 2: TypeScript Interfaces

**`src/hooks/useContractorOnboardingStatus.ts`**
- `ContractorOnboardingRecord` Interface: `is_trainer: boolean | null` hinzufuegen
- Mapping: `is_trainer: record.is_trainer ?? false`

### Schritt 3: dbStatus-Prop erweitern

**`src/components/OnboardingScreen.tsx`**
- `dbStatus` Interface: `isTrainer?: boolean` hinzufuegen

**`src/pages/Index.tsx`**
- `dbStatus` Objekt: `isTrainer: onboardingRecord.is_trainer || false` durchreichen

### Schritt 4: isStepComplete-Logik anpassen

**`src/hooks/useOnboardingState.ts`**
- `useOnboardingState` benoetigt ein neues Argument `isTrainer: boolean`
- `isStepComplete('akademie')`:
  - Wenn `isTrainer === true`: sofort `true` zurueckgeben (Akademie ist optional)
  - Alle anderen User: bisherige Logik (alle Lektionen + Test bestanden)

### Schritt 5: AcademyStep UI fuer Trainer

**`src/components/onboarding/steps/AcademyStep.tsx`**
- Neues Prop: `isTrainer?: boolean`
- Wenn `isTrainer === true`: Info-Banner oben anzeigen:
  - "Als Trainer kannst du die Akademie ueberspringen oder optional durcharbeiten."
- Alle Module sind fuer Trainer freigeschaltet (kein Lock)
- Video-Skipschutz (`allowSeeking`) ist deaktiviert fuer Trainer
- Der "Weiter"-Button im OnboardingStepWrapper ist immer aktiv (da `isStepComplete` true ist)

### Schritt 6: OnboardingScreen Prop-Weiterleitung

**`src/components/OnboardingScreen.tsx`**
- `isTrainer` aus `dbStatus` extrahieren
- An `useOnboardingState` als Argument durchreichen
- An `AcademyStep` als Prop durchreichen

---

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration SQL | RPC erweitern: `co.is_trainer` in SELECT |
| `src/hooks/useContractorOnboardingStatus.ts` | Interface + Mapping |
| `src/pages/Index.tsx` | `isTrainer` in dbStatus |
| `src/components/OnboardingScreen.tsx` | Prop + Weiterleitung |
| `src/hooks/useOnboardingState.ts` | isTrainer-Param + isStepComplete-Logik |
| `src/components/onboarding/steps/AcademyStep.tsx` | Info-Banner + Unlock-All |

---

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Trainer will Akademie trotzdem machen | Kann alles anschauen, Module sind freigeschaltet, kein Zwang |
| Trainer wird spaeter auf is_trainer=false gesetzt | Akademie wird wieder Pflicht (naechster Page-Load) |
| User ist kein Trainer | Keine Aenderung am bisherigen Flow |
| Trainer hat Akademie bereits teilweise absolviert | Fortschritt bleibt erhalten, Step ist trotzdem "complete" |
| Preview-Modus | Akademie bleibt wie bisher (isPreview bypassed schon alles) |

---

### Rollen-Matrix

| Rolle | Akademie-Pflicht? | Module freigeschaltet? | Video-Skipschutz? |
|---|---|---|---|
| user (Onboarder, is_trainer=false) | Ja | Sequenziell | Ja (bis abgeschlossen) |
| user (Trainer, is_trainer=true) | Nein (optional) | Alle offen | Nein (allowSeeking) |
| admin/manager | Kein Onboarding | n/a | n/a |

---

### Keine neuen Dependencies

