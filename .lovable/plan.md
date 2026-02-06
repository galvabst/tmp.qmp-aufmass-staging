

# Nachweis-Upload fuer alle Equipment-Items + DB-Persistierung

## Zusammenfassung

Wenn ein Bewerber bei Drohne, iPhone oder Massband "Ja, ich habe eins" auswaehlt, muss er einen Nachweis (Foto/Kaufbeleg) hochladen. Ohne Upload ist "Weiter" blockiert. Nachweise werden dauerhaft im Supabase Storage gespeichert und ueber das bestehende `equipment_status` JSONB-Feld persistiert.

## Aktualisierter Drohnen-Link

Der Kauf-Link fuer die Drohne wird auf den neuen Link aktualisiert:
```text
https://amzn.to/46kuuoo
```
(ersetzt den bisherigen `https://amzn.to/4tkCQpV`)

## Aenderungen

### 1. Konfiguration: `src/lib/onboarding-config.ts`

Drohne `kaufLink` aktualisieren auf `https://amzn.to/46kuuoo`.

### 2. Hook: `src/hooks/useContractorProfile.ts`

Neue Funktion `uploadEquipmentNachweis`:
- Upload in Bucket `contractor-documents` unter Pfad `{userId}/equipment-{equipId}-{timestamp}.{ext}`
- Gibt permanente `publicUrl` zurueck
- Im Return-Objekt exponieren

### 3. UI: `src/components/onboarding/steps/EquipmentStep.tsx`

**Props erweitern:**
- `onFileUpload: (equipId: string, file: File) => Promise<string>` -- zentraler Upload-Handler

**Drohne:** `URL.createObjectURL` ersetzen durch Aufruf von `onFileUpload('drohne', file)` mit permanenter URL.

**iPhone-Block:** Statischen "bestaetigt"-Haken ersetzen durch Upload-Zone mit Drag-and-Drop (gleicher Pattern wie Drohne):
- Upload-Zone wenn kein Nachweis vorhanden
- Gruene Bestaetigung + Loeschen-Button wenn Nachweis vorhanden

**Massband-Block:** Gleiche Aenderung wie iPhone.

**Eigene Drag-States** fuer iPhone und Massband hinzufuegen.

**Radio-Change Handler:** Bei Wechsel auf "Nein" wird `nachweisUrl` zurueckgesetzt.

### 4. Integration: `src/components/OnboardingScreen.tsx`

Neuer `handleEquipmentFileUpload`-Handler:
- Ruft `uploadEquipmentNachweis(equipId, file)` auf
- Gibt permanente URL zurueck
- Wird als `onFileUpload`-Prop an `EquipmentStep` durchgereicht

### 5. Validierung: `src/hooks/useOnboardingState.ts`

`canProceed` fuer Equipment vereinheitlichen:

```text
const itemValid = (item) =>
  item && (
    (item.hatEigenes === true && !!item.nachweisUrl) ||
    item.hatEigenes === false
  );

return itemValid(drohne) && itemValid(iphone) && itemValid(massband);
```

### 6. DB-Persistierung

Keine Schema-Aenderung noetig. Die `nachweisUrl` (permanente Storage-URL) wird als Teil des `equipmentStatus`-Objekts beim Klick auf "Weiter" via `saveEquipmentStatus()` in die JSONB-Spalte geschrieben und beim naechsten Login zurueckgelesen.

## Betroffene Dateien

1. `src/lib/onboarding-config.ts` -- Drohne kaufLink aktualisieren
2. `src/hooks/useContractorProfile.ts` -- `uploadEquipmentNachweis` hinzufuegen
3. `src/components/onboarding/steps/EquipmentStep.tsx` -- Upload-Zonen fuer alle drei Items
4. `src/components/OnboardingScreen.tsx` -- Upload-Handler + Prop durchreichen
5. `src/hooks/useOnboardingState.ts` -- `canProceed` vereinheitlichen

