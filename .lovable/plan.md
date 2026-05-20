## Praxistest-Feedback-System (Trainer + Admin)

Ziel: Praxistest kann nicht nur freigegeben, sondern auch **mit detailliertem Feedback abgelehnt** werden — pro Komponente (3D-Scan und/oder Drohnenvideo) getrennt. Quiz-Status bleibt unangetastet.

### Verhalten

**Trainer/Admin (gleiches Tool):**
- Karte in der Praxistest-Queue zeigt zusätzlich „Feedback geben" neben „Freigeben".
- Im Feedback-Dialog wählt der Prüfer per Toggle, was abgelehnt wird: **Scan**, **Video** oder beides.
- Pro abgelehnter Komponente:
  - Pflicht-Textkommentar (warum abgelehnt).
  - Optional: 1–n Screenshots hochladen, direkt im Canvas mit **Freihand-Strichen, Pfeilen und Text-Stickies** (eine Akzentfarbe) markieren, speichern.
- Klick „Ablehnung absenden" → Onboarding wechselt zurück in „nachbessern"-Modus für genau die markierten Teile.

**Techniker:**
- PraxistestSection zeigt prominenten roten Hinweis: „Praxistest abgelehnt — bitte X neu einreichen".
- Pro abgelehnte Komponente: Feedback-Karte mit Trainer-Kommentar + Bildgalerie (annotierte Screenshots, klickbar/lightbox).
- Nur die abgelehnten Felder sind editierbar (Scan-URL und/oder Video-Upload); freigegebene Komponente bleibt sichtbar mit grünem Häkchen.
- „Erneut einreichen" sendet zurück → neue Runde mit `eingereicht_am = now()`.
- **Quiz wird nie zurückgesetzt** — `theorie_bestanden` bleibt `true`, kein neuer Theorie-Test.

### Datenmodell (neu)

`thermocheck.praxistest_feedback`
- `id uuid pk`
- `onboarding_id uuid fk → contractor_onboarding(id) on delete cascade`
- `runde int` (1, 2, … – pro Einreichung inkrementiert)
- `komponente komponente_enum` — `'scan' | 'video'` (zwei Zeilen möglich pro Runde)
- `kommentar text not null`
- `pruefer_profile_id uuid fk → profiles(id)`
- `pruefer_rolle text` — `'trainer' | 'admin'`
- `erstellt_am timestamptz default now()`

`thermocheck.praxistest_feedback_bilder`
- `id uuid pk`
- `feedback_id uuid fk on delete cascade`
- `storage_path text` (annotiertes PNG)
- `position int` (Sortierung)
- `erstellt_am timestamptz default now()`

Neue ENUM `thermocheck.praxistest_komponente AS ENUM ('scan','video')`.

Spalten an `contractor_onboarding`:
- `praxistest_runde int default 1`
- `praxistest_scan_freigegeben bool default false`
- `praxistest_video_freigegeben bool default false`
- (vorhandenes `praxistest_freigabe` bleibt → `true` wenn beide oben `true`)

Storage-Bucket `praxistest-feedback` (private), Pfad: `{onboarding_id}/runde-{n}/feedback-{feedback_id}/{position}.png`. RLS: Insert nur Innendienst/Trainer, Read für Eigentümer (Techniker) + Innendienst.

### RPCs (SECURITY DEFINER)

1. **`reject_contractor_praxistest(p_onboarding_id, p_components jsonb[])`**
   - `is_innendienst() OR is_trainer()` Check.
   - Pro Komponente in `p_components` (`{komponente, kommentar, bild_pfade[]}`):
     - Insert in `praxistest_feedback` + Bilder.
     - Setze entsprechende `praxistest_*_freigegeben = false` und lösche `praxistest_*_url`.
   - Wenn beide Komponenten abgelehnt → `eingereicht_am = null`, `freigabe = false`.
   - Wenn nur eine → die andere bleibt freigegeben, `eingereicht_am = null` damit Techniker neu einreichen kann.
   - `praxistest_runde + 1`.
   - Returnt `{ feedback_ids[] }`.

2. **`approve_praxistest_komponente(p_onboarding_id, p_komponente)`** (Erweiterung)
   - Setzt nur die jeweilige `*_freigegeben = true`. Wenn beide true → `praxistest_freigabe = true` + bestehender Approval-Flow.

3. Bestehendes `approve_contractor_praxistest` ruft intern beide Komponenten ab.

### Frontend

**Neu**
- `src/features/praxistest-feedback/types.ts` — Typen.
- `src/features/praxistest-feedback/hooks/usePraxistestFeedback.ts` — Read-Hook (Feedback aller Runden für ein Onboarding).
- `src/features/praxistest-feedback/hooks/useRejectPraxistest.ts` — Mutation, lädt Bilder hoch, ruft RPC.
- `src/features/praxistest-feedback/ui/PraxistestFeedbackDialog.tsx` — Modal mit Komponenten-Toggle + pro Komponente Textarea + Bilder-Liste.
- `src/features/praxistest-feedback/ui/ImageAnnotator.tsx` — Canvas-Komponente (react-konva) mit Tools: Freihand, Pfeil, Text-Sticky, Undo, „Speichern" → PNG-Blob.
- `src/features/praxistest-feedback/ui/PraxistestFeedbackViewer.tsx` — Read-only Galerie für Techniker (Kommentar + Lightbox-Bilder).

**Angepasst**
- `src/components/trainer/TrainerPraxistestQueue.tsx` — Zusatz-Button „Feedback geben" öffnet Dialog.
- `src/features/contractors/ui/AdminPraxistestActions.tsx` — bestehender Admin-Reject wird durch denselben Dialog ersetzt (einheitliches Tool).
- `src/components/onboarding/steps/PraxistestSection.tsx` — neue Props `rejectionFeedback`, `scanApproved`, `videoApproved`. Renderlogik:
  - Wenn Feedback offen → rote Header-Card mit Viewer.
  - Komponenten-Felder einzeln gesperrt/offen je nach `*_freigegeben`.
- `src/hooks/useOnboardingState.ts` — neue Felder mappen, `onEinreichen` schickt nur noch nicht freigegebene Teile.
- `src/features/quality-gate/hooks/useAdminQGQueue.ts` — Liste enthält Runde + Komponentenstatus.

**Dependency:** `react-konva` + `konva` (Annotator).

### Technisches

- Bild-Upload-Reihenfolge: Erst alle PNG-Blobs in Storage hochladen → Pfade sammeln → RPC mit Pfaden aufrufen (transaktional in DB).
- Bei RPC-Fehler: hochgeladene Bilder werden im `catch` per `storage.remove()` aufgeräumt (Defensive Cleanup).
- Theorie/Quiz: keinerlei Änderung an `theorie_bestanden` oder Academy-Tabellen — explizit dokumentiert im RPC-Kommentar.
- Activity-Log: Eintrag „Praxistest Komponente X abgelehnt von {Trainer}" via bestehendem Unified-Log-Pattern.
- LOC-Caps eingehalten: Annotator als eigene Komponente, FeedbackDialog ≤ 350 LOC.

### Migrationen

1. ENUM + zwei Tabellen + RLS-Policies + Storage-Bucket.
2. Spalten an `contractor_onboarding` + Backfill (`scan_freigegeben = praxistest_freigabe`, `video_freigegeben = praxistest_freigabe`).
3. Drei RPCs.

### Out of Scope
- Mehrere Annotations-Farben, Undo/Redo-Stack über Tools hinweg, Mobile-Touch-Optimierung (nur Basis).
- Email-Notification an Techniker (folgt separat, falls nicht schon abgedeckt durch bestehendes Notification-System).
