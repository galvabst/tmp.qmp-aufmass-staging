

# Praxistest im Akademie-Schritt + Quality Gate Erweiterung

## Überblick

Der Akademie-Schritt bekommt nach dem theoretischen Abschlusstest einen **Praxistest**: Techniker müssen einen 3D-Scan-Link und ein Drohnenvideo hochladen. Der Admin prüft und gibt diese in der Quality Gate frei. Erst dann gilt die Akademie als abgeschlossen.

---

## 1. Datenbank: Neue Felder + Tabelle

**Migration: `contractor_onboarding` erweitern**
```sql
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN praxistest_scan_url TEXT,
  ADD COLUMN praxistest_video_url TEXT,
  ADD COLUMN praxistest_eingereicht_am TIMESTAMPTZ,
  ADD COLUMN praxistest_freigabe BOOLEAN DEFAULT FALSE,
  ADD COLUMN praxistest_freigabe_am TIMESTAMPTZ,
  ADD COLUMN praxistest_freigabe_von UUID REFERENCES auth.users(id);
```

RLS: Bestehende Policies auf `contractor_onboarding` decken diese Felder bereits ab.

---

## 2. Onboarding State erweitern

**`src/types/onboarding.ts` -- OnboardingState**
Neue Felder:
- `praxistestScanUrl?: string`
- `praxistestVideoUrl?: string`
- `praxistestEingereicht?: boolean`
- `praxistestFreigabe?: boolean`

**`src/hooks/useOnboardingState.ts`**
- Neue Setter: `setPraxistestScanUrl`, `setPraxistestVideoUrl`, `setPraxistestEingereicht`
- `isStepComplete('akademie')`: Zusätzlich prüfen `state.praxistestFreigabe === true` (neben `allLeafsComplete && akademieTestBestanden`)
- `hydrateFromDb`: Neue Felder mit aufnehmen

---

## 3. AcademyStep UI erweitern

**`src/components/onboarding/steps/AcademyStep.tsx`**

Nach dem "Abschlusstest bestanden" Block: Neuer Abschnitt **"Praxistest"**:
- Textfeld für Scan-Link (URL-Input)
- Upload-Zone für Drohnenvideo (Datei-Upload nach `contractor-documents` Bucket)
- "Einreichen" Button (disabled bis beides vorhanden)
- Nach Einreichung: Wartestatus "Warte auf Admin-Freigabe"
- Nach Freigabe: Grüner Erfolgshinweis

Props erweitern um: `praxistestScanUrl`, `praxistestVideoUrl`, `praxistestEingereicht`, `praxistestFreigabe`, `onScanUrlChange`, `onVideoUpload`, `onEinreichen`

---

## 4. OnboardingScreen: Praxistest-Logik

**`src/components/OnboardingScreen.tsx`**
- Scan-URL und Video-URL in DB persistieren (wie gewerbeschein_url Pattern)
- Einreichen-Action: `praxistest_eingereicht_am` setzen
- DB-Hydration: `praxistest_freigabe` aus DB laden

---

## 5. Quality Gate: Praxistests anzeigen

**`src/features/quality-gate/hooks/useAdminQGQueue.ts`**
- Zweite Query: `contractor_onboarding` WHERE `praxistest_eingereicht_am IS NOT NULL AND praxistest_freigabe = FALSE`
- JOIN mit `profiles` für Name/Avatar
- Neues Interface `AdminQGPraxistest` mit scanUrl, videoUrl, contractorName, eingereichtAm

**`src/features/quality-gate/ui/QGQueueView.tsx`**
- Tabs: "Aufträge" | "Praxistests"
- Praxistest-Karten: Name, Scan-Link (klickbar), Video-Link/Preview, "Freigeben" Button
- Freigeben-Action: UPDATE `praxistest_freigabe = true, praxistest_freigabe_am = now(), praxistest_freigabe_von = auth.uid()`

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration (SQL) | 6 neue Spalten in `contractor_onboarding` |
| `src/types/onboarding.ts` | 4 neue Felder in OnboardingState |
| `src/hooks/useOnboardingState.ts` | Setter + isStepComplete erweitern |
| `src/components/onboarding/steps/AcademyStep.tsx` | Praxistest-UI nach Quiz |
| `src/components/OnboardingScreen.tsx` | Praxistest-Persistierung + Hydration |
| `src/features/quality-gate/hooks/useAdminQGQueue.ts` | Praxistests laden |
| `src/features/quality-gate/ui/QGQueueView.tsx` | Tabs + Freigabe-UI |

