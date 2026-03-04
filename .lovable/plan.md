
Ziel: Der „Praxis-Phase abgeschlossen“-Video-Gate im Onboarding soll nur einmal verpflichtend sein. Sobald gesehen (`is_watched = true`), darf er beim Vor/Zurück-Navigieren nicht erneut blockieren.

1) Ursachenanalyse (aus dem aktuellen Code)
- `OnboardingScreen.tsx` zeigt das Outro-Video immer bei `state.currentStep === 'akademie'` (ohne persistiertes „schon gesehen“-Flag).
- `OutroVideo.tsx` aktiviert den Weiter-Button nur über `isVideoEnded`; dieser Wert ist nur runtime-local und nach Remount wieder `false`.
- Es gibt bereits `intro_video_watched` in `contractor_onboarding`, aber kein entsprechendes Feld für das Outro.

2) DB-Änderung (persistentes Flag)
- Neue Migration:
  - `ALTER TABLE thermocheck.contractor_onboarding ADD COLUMN IF NOT EXISTS outro_video_watched boolean NOT NULL DEFAULT false;`
  - Backfill, damit bestehende Nutzer nicht ungewollt erneut blockiert werden:
    - `outro_video_watched = true` für User, die schon bei/über Coaching sind (`current_step in ('coaching','nachweise')`, oder `completed_steps` enthält `coaching`, oder `onboarding_status='ready'`).
  - `public.get_contractor_onboarding_state` um `outro_video_watched` erweitern (RETURNS + SELECT).
  - Neue RPC `public.update_contractor_outro_video_watched()` analog zu `update_contractor_intro_video_watched()`.

3) Frontend-State erweitern
- `src/types/onboarding.ts`: `outroVideoWatched: boolean` in `OnboardingState`.
- `src/lib/onboarding-config.ts`: initial auf `false`.
- `src/hooks/useContractorProfile.ts`:
  - `ContractorOnboardingData`/`ContractorOnboardingState` um Feld erweitern.
  - neue Mutation `saveOutroVideoWatched`.
- `src/hooks/useOnboardingState.ts`:
  - Setter `setOutroVideoWatched`.
  - `hydrateFromDb` um `outroVideoWatched` ergänzen.
  - Boolean-Merge auf `??` statt `||` für korrekte true/false-Synchronisierung.

4) Onboarding-Flow fixen
- `src/components/OnboardingScreen.tsx`:
  - DB-Hydration: `outroVideoWatched` ins lokale State übernehmen.
  - Outro-Gate nur noch, wenn `state.currentStep === 'akademie' && !state.outroVideoWatched`.
  - In `handleOutroComplete`:
    - zuerst lokal `setOutroVideoWatched(true)`,
    - dann `saveOutroVideoWatched()` (DB),
    - danach wie bisher `goToNextStep()` + `saveProgress(...)`.
  - Wenn bereits watched, Akademie → Coaching direkt ohne erneutes Video.

5) UX-Härtung im Outro-Player
- `src/components/onboarding/OutroVideo.tsx`:
  - Button-Freigabe auf `canMarkComplete` (statt nur `isVideoEnded`), damit bereits vollständig gesehener Zustand nach Remount korrekt erkannt wird.

6) Validierung (E2E)
- Fall A: Erstes Mal Akademie abgeschlossen → Outro erscheint, nach Abschluss weiter zu Coaching.
- Fall B: Von Coaching zurück zu Akademie und wieder vor → kein erneutes Outro.
- Fall C: App-Reload nach abgeschlossenem Outro → kein erneutes Outro.
- Fall D: Teilweise gesehen + verlassen → weiterhin blockierend bis vollständig gesehen.
- Fall E: Bereits fortgeschrittene Bestandsnutzer (Backfill) werden nicht fälschlich erneut blockiert.
