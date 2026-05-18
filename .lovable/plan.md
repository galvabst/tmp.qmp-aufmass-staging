## Problem-Analyse Alexandra Jaap (profile_id `a5e43e83-…1136206f09bc`)

### Aktueller DB-Zustand
- `current_step = akademie`
- `akademie_test_bestanden = FALSE`
- `praxistest_scan_url`, `praxistest_video_url`, `praxistest_eingereicht_am` → **alle NULL**
- 0 Einträge in `contractor_akademie_lektions_fortschritt`
- 0 Einträge in `contractor_akademie_quiz_ergebnis`

Heißt: aus DB-Sicht hat Alexandra **noch nicht einmal den Akademie-Abschlusstest bestanden**, geschweige denn den Praxistest eingereicht. Sie hat aber lokal sicher gespielt (LocalStorage hydratisiert in `useOnboardingState`), deshalb sieht sie das Praxistest-Formular und versucht es einzureichen — und es passiert **schweigend nichts**.

### Root-Causes (mehrere übereinanderliegende Bugs)

**Bug 1 — RPC-Overload schreibt in nicht-existente Spalte (HARDFAIL beim Einreichen)**
In der DB existieren zwei Overloads von `public.update_contractor_praxistest`:
- 2-arg `(p_scan_url, p_video_url)` → schreibt `SET … updated_at = NOW()`
- 3-arg `(p_scan_url, p_video_url, p_target_profile_id)` → korrekt

Die Tabelle `thermocheck.contractor_onboarding` hat **kein** `updated_at`, sondern `aktualisiert_am`. Der Standard-Aufruf vom Techniker (ohne `p_target_profile_id`) löst die 2-arg-Variante aus → Postgres wirft `column "updated_at" does not exist` → RPC `throw` → React-Mutation `reject`.

**Bug 2 — Frontend frisst Fehler still (kein Toast, kein Banner)**
In `OnboardingScreen.tsx` `onPraxistestEinreichen` läuft `await savePraxistest(...)` ohne `try/catch`. PraxistestSection setzt im `finally` nur `isSubmitting=false` zurück. Effekt für Alexandra: Button hört auf zu drehen — sonst nichts. „Hängt fest".

**Bug 3 — Quiz-Speicherung schluckt Fehler ebenfalls still**
`handleQuizComplete` setzt lokal `akademieTestBestanden=true` + Toast „Bestanden 🎉" **bevor** der RPC `update_contractor_akademie_test_bestanden` läuft. Wenn der RPC fehlschlägt, gibt es nur `console.warn`. Erklärt, warum sie lokal weiterläuft, in der DB aber `false` bleibt → Innendienst sieht sie weiter im Schritt „akademie", obwohl sie gefühlt weiter ist.

**Bug 4 (Hygiene) — auch der 3-arg Praxistest-RPC aktualisiert `aktualisiert_am` nicht**
Kein Hardfail, aber das Update-Datum bleibt stehen, was Reports & „letzte Aktivität" verfälscht.

---

## Plan zur Behebung

### 1. DB-Migration: kaputten Overload entfernen + korrekten RPC härten
```sql
-- Defekten 2-arg Overload entfernen
DROP FUNCTION IF EXISTS public.update_contractor_praxistest(text, text);

-- 3-arg Version: explizit aktualisiert_am setzen, defensiv „NOT FOUND" werfen
CREATE OR REPLACE FUNCTION public.update_contractor_praxistest(
  p_scan_url text,
  p_video_url text,
  p_target_profile_id uuid DEFAULT NULL
) …
  UPDATE thermocheck.contractor_onboarding
  SET praxistest_scan_url       = p_scan_url,
      praxistest_video_url      = p_video_url,
      praxistest_eingereicht_am = NOW(),
      aktualisiert_am           = NOW()
  WHERE profile_id = v_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'No onboarding record found'; END IF;
```

### 2. Frontend defensiv machen (kein Silent-Fail mehr)
`src/components/OnboardingScreen.tsx`
- `onPraxistestEinreichen`: `try/catch` mit `toast.error(err.message ?? 'Einreichen fehlgeschlagen — bitte erneut versuchen.')`. Local-State `setPraxistestEingereicht(true)` nur im Success-Pfad.
- `handleQuizComplete`: lokalen State erst **nach** erfolgreichem RPC setzen; bei Fehler `toast.error` + lokalen Flag nicht setzen, damit DB und UI nicht auseinanderlaufen.
- `onPraxistestVideoUpload`: Upload-Fehler ebenfalls als Toast surface'n (aktuell nur `finally`).

`src/components/onboarding/steps/PraxistestSection.tsx`
- `handleSubmit`: Fehler explizit anzeigen statt nur `setIsSubmitting(false)`.

### 3. Datenkorrektur Alexandra Jaap (einmaliger Reset, damit sie sauber neu einreichen kann)
Nichts schreiben, bis die obigen Fixes live sind. Danach **eine** der zwei Optionen je nach Realität:

a) **Sie hat den Akademie-Abschlusstest tatsächlich gemacht** (per Telefon prüfen):  
  `akademie_test_bestanden=TRUE` setzen via bestehendem RPC `update_contractor_akademie_test_bestanden` (Admin-Variante notfalls neu, siehe 4) — danach kann sie Praxistest direkt hochladen.

b) **Sie hat ihn nicht gemacht**: nichts ändern, sie macht den Quiz nochmal — diesmal wird der Fortschritt dank Fix 2 sauber in der DB landen.

Aktuell sind ohnehin `praxistest_scan_url`/`_video_url`/`_eingereicht_am` alle NULL, es gibt nichts „halb-Eingereichtes" zu bereinigen.

### 4. (optional, falls Innendienst Alexandra direkt anschieben soll) Admin-Overload für Akademie-Test
Analog zum Praxistest einen `p_target_profile_id`-Parameter ergänzen (Admin-Guard via `thermocheck.is_innendienst()`), damit der Innendienst sie ohne SQL-Eingriff freischalten kann.

### 5. Validierung (Pflicht-7-Schritt-Protokoll)
1. Migration deployen, beide Overloads in `pg_proc` prüfen.
2. Edge-Free RPC-Test: `select update_contractor_praxistest('https://x','https://y')` als Techniker → erwartet success, `praxistest_eingereicht_am` & `aktualisiert_am` gesetzt.
3. UI-Flow im Admin-Preview-Mode für einen Test-Techniker durchklicken (Upload Video, Autarc-Link, Einreichen) — Toast bei Erfolg, Toast bei provoziertem Fehler.
4. Alexandras Datensatz nach ihrer erneuten Einreichung erneut abfragen: `praxistest_eingereicht_am IS NOT NULL`.
5. Trainer-Queue (`TrainerPraxistestQueue`) zeigt Alexandra nach Einreichung an → Trainer kann freigeben → `praxistest_freigabe=true` → sie kommt in Schritt `coaching`/`nachweise`.
6. Lighthouse/Console: keine neuen Fehler.
7. Memory `mem://features/coaching/praxistest-system` ergänzen: „RPC schreibt `aktualisiert_am`, Frontend toastet Fehler, kein Silent-Fail".

---

## Was der User danach sieht
- Klick auf „Praxistest einreichen" → entweder grüner Toast „Eingereicht, warte auf Trainer-Freigabe" und der Bereich klappt um auf den Warte-Zustand, oder ein klarer roter Toast mit Fehlertext (nie mehr „nichts passiert").
- Der Praxistest erscheint im Trainer-Hub und kann freigegeben werden — sauber, transaktional, ohne LocalStorage-Drift.
