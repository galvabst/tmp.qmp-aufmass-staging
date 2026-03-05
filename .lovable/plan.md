

# Fix: Lektionen/Quiz-Daten werden mit falschem Key gejoined

## Root Cause

In `useAdminContractorList.ts` Zeile 182-183 werden Lektionen- und Quiz-Daten mit `o.profile_id` nachgeschlagen, aber die DB-Tabellen `contractor_akademie_lektions_fortschritt` und `contractor_akademie_quiz_ergebnis` verwenden `contractor_id` = `contractor_onboarding.id` (die Onboarding-ID, NICHT die Profile-ID).

Deshalb zeigt jeder Contractor 0/51 Lektionen, 0 Quiz-Versuche, 0% Best Score — die Map-Lookups finden nie einen Treffer.

## Fix

**Datei:** `src/features/contractors/hooks/useAdminContractorList.ts`

**Zeile 182-183** ändern von:
```typescript
const lekt = o.profile_id ? lektionenMap.get(o.profile_id) : null;
const quiz = o.profile_id ? quizMap.get(o.profile_id) : null;
```
zu:
```typescript
const lekt = lektionenMap.get(o.id) ?? null;
const quiz = quizMap.get(o.id) ?? null;
```

Zusätzlich: `quizBestanden` Zeile 209 auch defensiv mit `completedSteps.includes('akademie')` absichern, wie beim Abschlusstest.

Das ist ein 2-Zeilen-Fix. Keine Migration nötig — die Daten in der DB sind korrekt, nur der Join-Key im Frontend war falsch.

