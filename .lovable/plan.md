

# Plan: Pflicht-Videos für Bestandstechniker

## Problem

Wenn du eine neue Lektion hinzufügst, zwingt der aktuelle Catch-Up-Mechanismus fertige Techniker (`status = ready`) zurück ins komplette Onboarding. Der User muss dann durch die Akademie navigieren, das Video schauen, ggf. den Quiz wiederholen etc. Das ist falsch — fertige Techniker sollen nur das neue Video anschauen müssen, nicht zurück ins Onboarding.

## Lösung: Zwei-Schienen-System

**Schiene A — `nur_fuer_neue = true`:** Lektion ist nur für Techniker relevant, die sich aktuell im Onboarding befinden. Fertige Techniker (`ready`) werden komplett ignoriert. Kein Catch-Up.

**Schiene B — `nur_fuer_neue = false` (default):** Lektion ist Pflicht für ALLE. Aber für fertige Techniker greift ein **Pflicht-Video-Overlay** statt des Onboarding-Rückfalls:
- Beim App-Start prüft ein neuer Hook, ob es ungesehene Pflicht-Lektionen gibt
- Falls ja: Full-Screen-Video-Modal (blockierend, nicht schließbar)
- Nach dem Schauen: Fortschritt wird in `contractor_akademie_lektions_fortschritt` gespeichert
- Kein Quiz, kein Onboarding-Rückfall, kein Step-Reset

## Umsetzung

### 1. DB-Migration

- `nur_fuer_neue BOOLEAN NOT NULL DEFAULT false` auf `contractor_akademie_lektionen`
- Update des `admin_upsert_akademie_lektion` RPC um das neue Feld

### 2. Admin-UI: LektionEditor

Neuer Toggle im Editor-Dialog:
- **"Nur für neue Onboarder"** mit Beschreibung: "Bereits fertige Techniker müssen diese Lektion nicht nachholen"
- Wird als `nur_fuer_neue` an die DB übergeben

### 3. Neuer Hook: `usePflichtVideos`

```text
Input:  contractorId, onboardingStatus
Output: { pendingVideos: Lektion[], isLoading }
```

Logik:
1. Nur aktiv wenn `onboardingStatus === 'ready'`
2. Fetcht alle aktiven Lektionen mit `nur_fuer_neue = false` und `video_url IS NOT NULL`
3. Fetcht alle `completed` Einträge aus `contractor_akademie_lektions_fortschritt`
4. Differenz = ungesehene Pflicht-Videos
5. Sortiert nach `content_version DESC` (neueste zuerst)

### 4. Pflicht-Video-Overlay Komponente

`PflichtVideoOverlay.tsx` — Full-Screen-Modal:
- Zeigt Titel + Video (gleicher `MultiSourceVideoPlayer` wie Akademie)
- Kein Skip erlaubt (gleicher Seekschutz wie Intro-Video)
- Nach Abschluss: `saveLektionFortschritt` RPC aufrufen → nächstes Video oder schließen
- Fortschrittsanzeige: "Video 1 von 3"

### 5. Integration in Index.tsx

Nach dem `isDbReady`-Check und VOR dem Haupt-UI:
```text
if (isReady && pendingVideos.length > 0) {
  return <PflichtVideoOverlay videos={pendingVideos} onComplete={...} />;
}
```

### 6. Catch-Up-Logik anpassen (useOnboardingState.ts)

In `hydrateAkademieFromDb` (Zeile 159): Wenn `onboardingStatus === 'ready'` und eine neue Lektion `nur_fuer_neue = true` hat → automatisch als `abgeschlossen` markieren (kein Rückfall ins Onboarding).

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration SQL | `nur_fuer_neue` Spalte + RPC-Update |
| `LektionEditor.tsx` | Neuer Toggle |
| `useAdminMutateLektion.ts` | Feld in Interface |
| `useAdminAkademieModule.ts` | Feld in AdminLektion-Type |
| `usePflichtVideos.ts` | **Neu** — Hook für ungesehene Pflicht-Videos |
| `PflichtVideoOverlay.tsx` | **Neu** — Blocking Video-Modal |
| `Index.tsx` | Pflicht-Video-Gate vor Haupt-UI |
| `useOnboardingState.ts` | Catch-Up-Filter für `nur_fuer_neue` |
| `useAkademieContent.ts` | `nur_fuer_neue` Feld durchreichen |

### Edge Cases

- Kein Video-URL in Pflicht-Lektion → wird übersprungen (nur Text-Lektionen blockieren nicht)
- Techniker mitten im Onboarding → `nur_fuer_neue` irrelevant, normaler Ablauf
- Trainer → Bypass greift weiterhin
- Lektion nachträglich von `nur_fuer_neue: true` auf `false` geändert → Pflicht-Video-Check greift beim nächsten Login
- Mehrere Pflicht-Videos → werden nacheinander abgespielt

