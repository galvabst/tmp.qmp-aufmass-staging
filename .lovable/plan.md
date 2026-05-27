# Step-Verweildauer pro Techniker

## Ziel
In der Admin-Techniker-Detailansicht (und kompakt in der Liste) sehen, wie lange ein Techniker bereits im aktuellen Schritt ist und wie lange er für jeden vorherigen Schritt gebraucht hat — z.B. Dennis Capell: „Profil 2 Tage · Dokumente 1 Tag · Bestellungen 4 Tage · Equipment 12 Tage (aktuell)".

## Datenquelle
Es gibt **keine** dedizierte Step-History-Tabelle, aber `thermocheck.contractor_audit_log` protokolliert jedes Update von `contractor_onboarding` mit `payload->'old'` und `payload->'new'`. Daraus lassen sich alle `current_step`-Übergänge inkl. Zeitstempel rekonstruieren — rückwirkend für alle bestehenden Techniker, ohne Migration der historischen Daten.

## Umsetzung

### 1. Migration — neue View + RPC
**View `thermocheck.v_contractor_step_history`**
- Aus `contractor_audit_log` (action_type `contractor_onboarding_updated`) alle Zeilen filtern, bei denen `payload->'new'->>'current_step'` ≠ `payload->'old'->>'current_step'`
- Pro `object_id` (= onboarding_id) chronologisch sortieren
- Felder: `onboarding_id`, `from_step`, `to_step`, `changed_at`, `duration_seconds` (= `changed_at` − vorheriger Übergang bzw. `erstellt_am` für den ersten)
- Zusätzlich erste Zeile pro Techniker = Start (`from_step=null`, `to_step=erster current_step`, `changed_at=erstellt_am`)

**View `thermocheck.v_contractor_step_summary`**
- Aggregiert pro `(onboarding_id, step)`: `total_seconds`, `entered_count`, `last_entered_at`
- Plus eine Zeile pro Techniker für den **aktuellen** Schritt mit `is_current=true`, `current_seconds = now() − last_entered_at`

**RPC `thermocheck.get_contractor_step_timeline(_onboarding_id uuid)`**
- SECURITY DEFINER, Zugriff nur für `is_innendienst()`
- Liefert: aktuelle Step + Sekunden darin, plus Array aller Steps mit Dauer

### 2. Hook `useContractorStepTimeline(onboardingId)`
- React Query gegen die RPC, `staleTime: 30s`

### 3. UI in `ContractorDetailView.tsx`
- Neuer Apple-minimaler Block „Onboarding-Verlauf" (kollabierbar, direkt unter dem Status-Header):
  - **Aktueller Schritt** prominent: „Equipment · seit 12 Tagen 4 Std" mit Ampel-Farbe (grün <3 d, amber 3–7 d, rot >7 d — konfigurierbar pro Step)
  - **Timeline** der abgeschlossenen Schritte: Step-Label · Dauer (z.B. „Profil — 2 d 4 h"), mit dezenter Trennlinie. Nutze `STEP_LABELS` aus `useAdminContractorList`.
  - Gesamtdauer seit `erstellt_am` als Footer-Zeile.

### 4. Kompakt in `ContractorListView` (optional, gleiche PR)
- Neben dem `current_step`-Badge eine kleine Zeit-Chip: „seit 12 d" — nutzt `v_contractor_step_summary` (eine Query für alle Techniker, im bestehenden `useAdminContractorList` als Join).

## Technische Notizen
- Keine Daten-Backfill nötig: Audit-Log existiert seit Projektstart und enthält alle relevanten Updates.
- Ampel-Schwellenwerte pro Step als Konstante im Frontend (`src/features/contractors/lib/step-thresholds.ts`).
- Edge Case: Wenn `current_step` mehrfach hin- und herwechselt, summiert die View alle Aufenthalte und zeigt den letzten Eintritt als „aktuell".

## Validierung
- RPC für Dennis Capell aufrufen, Ergebnis gegen sichtbare Timestamps in `contractor_onboarding` (`erstellt_am`, `praxistest_eingereicht_am`, `trainer_freigabe_am`) plausibilisieren.
- UI in der Detailansicht von Dennis Capell und 2 weiteren Technikern prüfen.