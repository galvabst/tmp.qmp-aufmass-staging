

# Praxistest: Ablehnungs-Flow + saubere Sichtbarkeit

## Was heute fehlt (validiert)
1. Trainer/Admin sehen Praxistests nur als Mini-Tab unter „Quality Gate" → leicht zu übersehen.
2. Es gibt nur **Freigeben** — kein **Ablehnen mit Begründung**, kein Wiederholungs-Loop.
3. Der Techniker sieht nach einer Ablehnung keinen Hinweis, was zu tun ist.
4. Es gibt keine zuverlässige In-App-Benachrichtigung für Praxistest-Events.

> **Wichtige Korrektur zu meiner ersten Skizze:** `auftrag_nachrichten` ist an einen konkreten `auftrag_id` gebunden (Foreign Key + RLS) — eignet sich also **nicht** als Träger für Praxistest-Notifications. Lösung siehe Punkt 6.

## Plan

### 1) Datenmodell erweitern (Migration)
Neuer ENUM `thermocheck.praxistest_status_enum`:
`nicht_eingereicht | eingereicht | abgelehnt | freigegeben`

Neue Spalten auf `thermocheck.contractor_onboarding`:
| Spalte | Typ | Default |
|---|---|---|
| `praxistest_status` | `praxistest_status_enum` | `'nicht_eingereicht'` |
| `praxistest_ablehnung_grund` | text | null |
| `praxistest_ablehnung_am` | timestamptz | null |
| `praxistest_ablehnung_von` | uuid | null |
| `praxistest_versuche` | int | 0 |

Alle bestehenden Felder (`praxistest_freigabe`, `praxistest_eingereicht_am`, `praxistest_scan_url`, `praxistest_video_url`) bleiben — Status wird konsistent daneben geführt. Idempotent mit `IF NOT EXISTS`. Backfill: vorhandene Datensätze werden anhand der bestehenden Felder auf den korrekten neuen Status gesetzt.

### 2) RPCs (SECURITY DEFINER, public-Schema)
**Neu: `reject_contractor_praxistest(p_onboarding_id uuid, p_grund text)`**
- Berechtigung: nur `is_innendienst()` ODER aktiver Trainer (Coach des Technikers)
- Validierung: `length(trim(p_grund)) >= 10`, sonst Exception
- Setzt `praxistest_status = 'abgelehnt'`, schreibt Grund + `now()` + `auth.uid()`
- **Leert** `praxistest_eingereicht_am`, `praxistest_scan_url`, `praxistest_video_url` (Techniker muss neu hochladen)
- Inkrementiert `praxistest_versuche`

**Update: `approve_contractor_praxistest`**
- Setzt zusätzlich `praxistest_status = 'freigegeben'`

**Update: `update_contractor_praxistest`**
- Setzt zusätzlich `praxistest_status = 'eingereicht'`

**Update: `get_pending_praxistests`**
- Gibt zusätzlich `praxistest_versuche` zurück (für „2. Versuch"-Badge im UI)

### 3) Trainer-/Admin-UI: Ablehnen-Dialog
- `TrainerPraxistestQueue.tsx` und `QGQueueView.tsx` (Tab Praxistests) bekommen neben „Freigeben" einen zweiten, destruktiven Button **„Ablehnen"**.
- Dialog mit Pflicht-Textarea (`min 10 Zeichen`, Counter), plus 4 Quick-Chips zum Vorbefüllen: „Drohnenvideo unvollständig", „Heizlast fehlt", „Raumscan fehlerhaft", „Falsches Projekt".
- Bestätigen → ruft RPC, invalidiert Queries (`admin-qg-praxistests`, `coaching-ride-alongs`).
- Versuche > 1 wird als kleine Badge angezeigt („Versuch 2/∞").

### 4) Techniker-UI: Ablehnungs-Zustand
In `PraxistestSection.tsx` neuer Render-Zweig **vor** dem Upload-Formular, wenn `praxistestStatus === 'abgelehnt'`:
- Rote Hinweis-Karte „Praxistest wurde nicht freigegeben"
- Wörtlich angezeigte Begründung des Trainers + Datum
- Klare Anleitung: „Bitte korrigiere die Punkte und reiche den Praxistest erneut ein."
- Darunter erneut das normale Upload-Formular (Felder sind durch RPC bereits geleert).

`useContractorProfile`, `useOnboardingState`, `OnboardingScreen` und `AcademyStep` bekommen die neuen Felder durchgereicht (`praxistestStatus`, `praxistestAblehnungGrund`, `praxistestAblehnungAm`, `praxistestVersuche`).

### 5) Sichtbarkeit für Trainer & Innendienst
- **AdminDashboardView**: eigener „Praxistest wartet auf Freigabe"-Block oben (Anzahl + Direkt-Sprung in den QG-Tab Praxistests). Quality-Gate-Tab-Badge bleibt zusätzlich.
- **Trainer-Hub**: oberhalb der Liste eine deutliche Hinweis-Karte „X Praxistests warten auf Deine Prüfung", farblich abgesetzt — damit es nicht in der Warnung-Liste verschwindet.

### 6) Benachrichtigungen — pragmatischer Ansatz
Da `auftrag_nachrichten` an einen Auftrag gebunden ist und für Praxistest-Events *kein* Auftrag existiert, **kein Missbrauch dieser Tabelle**. Stattdessen:

**a) Für den Techniker (Empfänger):**
Die bestehende UI ist bereits Single Source of Truth (`PraxistestSection`), sobald er den Onboarding-Tab öffnet. Ergänzung: **kleiner roter Dot auf dem Onboarding-Step „Akademie"** in der Step-Navigation, wenn `praxistest_status = 'abgelehnt'` — damit er den Hinweis findet, ohne durch alle Schritte zu klicken. Reine Frontend-Logik aus dem bereits geladenen Onboarding-State.

**b) Für Trainer/Admin (Empfänger):**
- Die Counts auf `AdminBottomNav` (Badge) und auf `AdminDashboardView` (Hinweis-Karte) sind die Notification.
- Trainer-Hub zeigt seinen eigenen Count.
Beide nutzen Polling aus den bereits existierenden Queries — keine neue Infrastruktur, kein RLS-Risiko.

> Eine eigene Notifications-Tabelle wäre möglich, ist aber für diesen Loop Over-Engineering. Sollte später ein generisches In-App-Notification-System gewünscht sein, ist das ein eigenes Feature.

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `supabase/migrations/<neu>.sql` | ENUM + Spalten + Backfill + 4 RPC-Updates/-Neu |
| `src/features/quality-gate/hooks/useAdminQGQueue.ts` | `useRejectPraxistest` + Status/Versuche im Typ |
| `src/features/quality-gate/ui/QGQueueView.tsx` | Ablehnen-Button + Dialog |
| `src/components/trainer/TrainerPraxistestQueue.tsx` | Ablehnen-Button + Dialog + Hinweis-Karte oben |
| `src/components/onboarding/steps/PraxistestSection.tsx` | Neuer „abgelehnt"-Render-Zweig |
| `src/components/onboarding/steps/AcademyStep.tsx` | Neue Praxistest-Props durchreichen |
| `src/hooks/useContractorProfile.ts` | Neue Felder lesen + Typ erweitern |
| `src/hooks/useOnboardingState.ts`, `src/types/onboarding.ts` | Status/Versuche/Grund im State |
| `src/components/OnboardingScreen.tsx` | Felder in DB-Hydration + Step-Dot |
| `src/features/admin/ui/AdminDashboardView.tsx` | „Praxistest wartet"-Karte |

## Akzeptanz (E2E)
1. Trainer öffnet Profil-Hub → sofort große Karte „X Praxistests warten" + klickbare Liste.
2. Trainer klickt „Ablehnen" → Dialog erzwingt Begründung ≥ 10 Zeichen.
3. Daten werden RPC-seitig geleert, `versuche` inkrementiert, Status = `abgelehnt`.
4. Techniker sieht im Akademie-Step einen roten Dot, öffnet → rote Karte mit wörtlicher Trainer-Begründung + leeres Upload-Formular.
5. Techniker reicht erneut ein → Status `eingereicht` → Trainer sieht ihn wieder mit „Versuch 2"-Badge.
6. Loop beliebig oft wiederholbar bis Freigabe.
7. Admin-Dashboard zeigt offene Praxistests prominent oben.
8. Keine Konsolen-/Network-Fehler in keiner Rolle (Trainer, Admin, Techniker).

## Risiken / bewusste Entscheidungen
- **Keine eigene Notifications-Tabelle** — bewusst vermieden, weil Onboarding-State + Admin/Trainer-Counts bereits zuverlässig sind und Polling läuft.
- **Felder werden geleert** statt versioniert — einfaches mentales Modell für Techniker und für die UI; Audit-Trail über neuen Spaltensatz (`versuche`, `ablehnung_*`) bleibt erhalten. Wenn historische Scan-/Video-Links archiviert werden sollen, wäre das ein separates `praxistest_versuche`-Audit-Table-Feature (nicht in diesem Loop).
- **RPC-Berechtigung** wird streng auf `is_innendienst()` ODER aktiver Coach des betreffenden Onboarding-Datensatzes begrenzt — nicht auf alle Trainer pauschal.

