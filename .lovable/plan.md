

# Fix: Akademie-Lektionen werden nie als "completed" in DB gespeichert

## Root Cause

**`completeAkademieUnterpunkt()` schreibt NUR in localStorage**, nie in die DB-Tabelle `contractor_akademie_lektions_fortschritt`. Das `useSaveVideoProgress` Hook upserted immer mit `status: 'in_progress'` und hört auf zu speichern sobald `isCompleted = true` (also wenn die Lektion lokal als abgeschlossen gilt). Es gibt keinen Code der den DB-Record auf `status = 'completed'` + `completed_at` setzt.

Zum Vergleich: `PflichtVideoOverlay` macht es richtig — dort wird direkt `status: 'completed'` + `completed_at` in die DB geschrieben.

## Betroffene Stellen

| Stelle | Problem |
|--------|---------|
| `AkademieModul.tsx` → `handleMarkComplete()` | Navigiert nur zurück mit state, kein DB-Write |
| `OnboardingScreen.tsx` → useEffect mit `completedUnterpunktId` | Ruft nur `completeAkademieUnterpunkt()` auf (localStorage only) |
| `useSaveVideoProgress.ts` | Schreibt immer `status: 'in_progress'`, nie `completed` |

## Lösung

### 1. DB-Completion beim "Als abgeschlossen markieren" Klick

In `OnboardingScreen.tsx` — dort wo `completeAkademieUnterpunkt` aufgerufen wird (Zeile 460-463): Zusätzlich einen DB-Upsert machen:

```typescript
// Nach completeAkademieUnterpunkt (localStorage)
await supabaseTC.from('contractor_akademie_lektions_fortschritt').upsert({
  contractor_id: contractorId,
  lektion_id: unterpunktId,
  status: 'completed',
  completed_at: new Date().toISOString(),
  started_at: new Date().toISOString(),
  video_progress_seconds: 0,
}, { onConflict: 'contractor_id,lektion_id' });
```

Der `contractorId` ist bereits via `useContractorProfile` im `OnboardingScreen` verfügbar (aus `dbStatus`).

### 2. Datenmigration: Bestehende in_progress Records fixen

Für Marius und alle anderen Contractors, die Lektionen bereits abgeschlossen haben (lokal), aber deren DB-Records noch `in_progress` sind:

SQL-Migration die alle `in_progress` Records auf `completed` setzt, wenn der Contractor `akademie` in `completed_steps` hat (= hat die Akademie bestanden, also alle Lektionen gesehen).

```sql
UPDATE thermocheck.contractor_akademie_lektions_fortschritt f
SET status = 'completed', completed_at = f.started_at
FROM thermocheck.contractor_onboarding o
WHERE f.contractor_id = o.id
  AND f.status = 'in_progress'
  AND 'akademie' = ANY(o.completed_steps);
```

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/OnboardingScreen.tsx` | DB-Upsert mit `status: 'completed'` beim Lektion-Abschluss |
| Migration (SQL) | Bestehende `in_progress` Records auf `completed` setzen |

### Edge Cases

- **Kein contractorId verfügbar**: Guard-Check, localStorage-Write passiert trotzdem
- **DB-Fehler beim Upsert**: Warn-Log, localStorage bleibt korrekt → Lektion gilt lokal trotzdem als abgeschlossen
- **Doppelklick/Race Condition**: Upsert mit `onConflict` ist idempotent
- **intro-video / outro-video**: Haben eigene RPCs, nicht betroffen
- **PflichtVideoOverlay**: Schreibt bereits korrekt `completed`, nicht betroffen
- **Lektion ohne Video**: Wird ebenfalls über `handleMarkComplete` → gleicher Pfad → Fix greift

### Rollen-Matrix

| Rolle | DB-Write Fortschritt | Begründung |
|-------|---------------------|-----------|
| Contractor (authenticated) | ✅ | RLS: ALL for authenticated = true |
| Admin | ✅ | Gleiche Policy |
| Trainer | ✅ | Gleiche Policy (nutzt aber Onboarding-Bypass) |

