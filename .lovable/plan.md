# Fix: Trainer-Bestanden → Nachweise → Einsatzbereit

## Problem (evidence)

Bei drei "Bestanden"-Trainees auf der Karte fehlt der Aktiv-Status, obwohl der Trainer die Mitfahrt akzeptiert hat:

| Trainee | Steps | trainer_freigabe | mitfahrt_bezahlt_am | Status heute | erwartet |
|---|---|---|---|---|---|
| Michel Süße | 6/7 (current=`nachweise`) | ✅ | ❌ NULL | `mitfahrt` | nach Nachweise-Upload → `ready` |
| Brian Maina | 4/7 (current=`akademie`) | ✅ | ❌ NULL | `mitfahrt` | erst akademie/coaching/nachweise nachholen |
| Alexandra Jaap | 4/7 | ✅ | ❌ NULL | `inaktiv` (manuell) | bleibt `inaktiv` bis Admin reaktiviert |

Zwei Defekte verursachen das:

**A) `bewerte_coaching_mitfahrt('bestanden')` fasst die Onboarding-Steps nicht an.**
Es setzt nur `coaching_bewertung='bestanden'`, `trainer_freigabe=true` — aber `completed_steps` und `current_step` bleiben unverändert. Der Trainee sieht in seiner Onboarding-UI den nächsten Step (Nachweise) gar nicht und kann nicht abschließen.

**B) `sync_onboarding_status` macht `mitfahrt_bezahlt_am` zum harten Ready-Gate.**
Priority 2 zieht den Status zurück auf `mitfahrt`, solange `gebuchter_coaching_termin IS NOT NULL AND mitfahrt_bezahlt_am IS NULL`. Du verrechnest Mitfahrten manuell später → `mitfahrt_bezahlt_am` wird im operativen Betrieb nie zeitnah gesetzt → `ready` wird nie erreicht.

## Lösung

### 1. RPC `bewerte_coaching_mitfahrt` erweitern (bei Entscheidung `'bestanden'`)

Zusätzlich zum bestehenden Update auf `contractor_onboarding`:
- `completed_steps` um `'coaching'` ergänzen (idempotent, nur wenn fehlt)
- `current_step` auf `'nachweise'` setzen, **wenn** aktuell `current_step IN ('coaching','akademie','mitfahrt')` ist (nicht zurückspringen, falls Trainee schon weiter ist)

Damit sieht der Trainee nach Bestätigung sofort den Nachweise-Step in seiner Onboarding-Maske.

### 2. Trigger `sync_onboarding_status` entkoppeln von Mitfahrt-Bezahlung

Priority 2 (`mitfahrt_gebucht` / `mitfahrt_in_rechnung`) wird **nur noch** angewendet, wenn der Trainer **noch nicht** bestanden hat (`coalesce(trainer_freigabe,false) = false`). Sobald `trainer_freigabe=true`, fällt die Logik durch zu Priority 4 (Ready-Prüfung) bzw. zu Priority 5 (in_progress), je nach Step-Stand.

Effekt:
- Trainee mit Trainer-Freigabe + 7/7 Steps + Admin-Gates (Vertrag, Kleidung, Lizenzen) → `ready`
- Trainee mit Trainer-Freigabe aber noch nicht alle Steps → `in_progress` (sinnvoller als „mitfahrt", denn die Mitfahrt ist ja durch)
- `mitfahrt_bezahlt_am` bleibt als Feld erhalten und kann weiter manuell gesetzt werden — ist nur kein UI-Blocker mehr

### 3. Backfill bestehender Trainees

Einmalig nach dem Migrations-Deploy: für alle Onboardings mit `coaching_bewertung='bestanden' AND trainer_freigabe=true` die Logik aus Punkt 1 nachholen (coaching-step ergänzen, current_step ggf. auf nachweise heben). Anschließend ein leeres `UPDATE` triggert den `sync_onboarding_status` neu → Status wird korrekt umgerechnet.

Erwartung danach:
- Michel Süße: bleibt `mitfahrt`/`nachweise` bis er den Nachweise-Step abschließt → dann automatisch `ready` (sofern Admin-Gates true)
- Brian Maina: wird `in_progress` (Trainer-Freigabe ja, aber Akademie/Coaching/Nachweise noch offen)
- Alexandra Jaap: bleibt `inaktiv` (manueller Admin-Status, wird vom Trigger nicht überschrieben)

### 4. Admin-UI: „Was fehlt für ready?"

In der Contractor-Liste (Admin) pro Eintrag mit `trainer_freigabe=true AND onboarding_status != 'ready'` eine kleine Hinweis-Zeile rendern, die genau zeigt was noch fehlt:
- „Steps offen: nachweise"
- „Vertrag nicht geprüft"
- „Kleidung nicht bestellt"
- „Lizenzen nicht bereitgestellt"

Reine Lesedarstellung aus den vorhandenen Spalten — kein zusätzlicher RPC, kein Datenschreiben.

## Was sich NICHT ändert

- Admin-Gates (`vertrag_geprueft_intern`, `kleidung_bestellt_intern`, `lizenzen_bereitgestellt_intern`) bleiben Pflicht — du behältst die manuelle Kontrolle.
- `mitfahrt_bezahlt_am` bleibt als Spalte für die Buchhaltung erhalten.
- Trainer-Bewertungen `nicht_bestanden`/`abgesagt`/`no_show` verhalten sich unverändert.
- Hiring-Map-Logik (`onboarding_status='ready'` → Aktiv) bleibt wie sie ist.

## Technische Details

**Migration (eine Transaktion):**
1. `CREATE OR REPLACE FUNCTION thermocheck.bewerte_coaching_mitfahrt(...)` — im `bestanden`-Branch das `UPDATE thermocheck.contractor_onboarding ... SET` um `completed_steps = (CASE WHEN 'coaching' = ANY(completed_steps) THEN completed_steps ELSE array_append(completed_steps, 'coaching') END)` und `current_step = CASE WHEN current_step IN ('coaching','akademie','mitfahrt') THEN 'nachweise' ELSE current_step END` erweitern.
2. `CREATE OR REPLACE FUNCTION thermocheck.sync_onboarding_status()` — Priority-2-Block einklammern mit `AND coalesce(NEW.trainer_freigabe, false) = false`.
3. Backfill-Statement: `UPDATE thermocheck.contractor_onboarding SET completed_steps = array_append(completed_steps, 'coaching'), current_step = 'nachweise' WHERE coaching_bewertung='bestanden' AND trainer_freigabe=true AND NOT ('coaching' = ANY(completed_steps)) AND current_step IN ('coaching','akademie','mitfahrt');` — der `BEFORE UPDATE`-Trigger rechnet den Status dabei automatisch neu.

**Frontend:**
- `src/features/contractors/hooks/useAdminContractorList.ts` und `AdminContractorListItem` (oder die Stelle, die die Liste rendert) um eine `readinessGapHint`-Berechnung erweitern. Reine Funktion über bestehende Felder.

**Validation nach Deploy:**
- DB-Read: `SELECT id, onboarding_status, current_step FROM thermocheck.contractor_onboarding WHERE coaching_bewertung='bestanden'` — Michel sollte `current_step=nachweise` haben, Brian `in_progress`.
- Hiring-Map manuell neu laden → Aktiv-Counter sollte sich erhöhen, sobald Michel den Nachweise-Step abschließt.
- Memory `mem://technical/ready-status-kriterien-v2` aktualisieren (Mitfahrt-Bezahlung ist kein Ready-Gate mehr).
