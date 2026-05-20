## Ziel

Admin/Innendienst soll an drei Stellen manuell eingreifen können — **mit exakt der gleichen DB-Wirkung**, als hätte es Trainee/Trainer selbst gemacht. Alle Aktionen laufen über `SECURITY DEFINER` RPCs mit `is_innendienst()`-Check (kein Bypass per Frontend).

---

## 1. Coaching-Mitfahrt manuell zuweisen

**Wo:** Admin → Techniker-Detail → neuer Abschnitt „Coaching-Mitfahrt orchestrieren" (sichtbar wenn `current_step` ≤ coaching ODER noch keine Bewertung).

**Flow:**
1. Trainer auswählen (Dropdown aller `is_trainer = true`)
2. Auftrag dieses Trainers wählen — Liste aller `thermocheck_auftraege` mit `zugewiesener_techniker_id = trainer` **inkl. vergangener Daten** (Nacherfassung), mit Termin-Anzeige + Hinweis ob schon belegt
3. Bestätigen → RPC `admin_book_coaching_ride(p_trainee_profile_id, p_auftrag_id)`

**RPC-Verhalten** (identisch zu `book_coaching_ride`, nur:
- Auth-Check: `is_innendienst()` statt `auth.uid()`
- `coaching_gebucht_von` = **Trainee** (nicht Caller)
- Override-Flag: erlaubt auch wenn Trainee bereits Buchung hat (alte wird gelöscht / Hinweis)
- Setzt `gebuchter_coaching_termin` + `gebuchter_coach_name` auf Trainee-Onboarding wie das Original.

---

## 2. Onboarding-Step manuell setzen

**Wo:** Admin → Techniker-Detail → Step-Liste (bereits sichtbar). Neuer Button „Step setzen" pro Step (Admin only).

**RPC:** `admin_set_onboarding_step(p_profile_id, p_target_step)`
- Validiert Step ∈ ALL_STEPS ∪ {'einsatzbereit'}
- Setzt `current_step = p_target_step`
- `completed_steps` = alle Steps **vor** dem Ziel-Step
- Bei Sprung nach `einsatzbereit`: `onboarding_status = 'ready'`, sonst zurück auf `in_progress`
- Audit: `aktualisiert_am = now()`

---

## 3. Praxistest manuell freigeben/ablehnen

**Wo:** Admin → Techniker-Detail → neue Aktions-Zeile im Praxistest-Block. Auch wenn `praxistest_eingereicht_am IS NULL`.

**RPCs:**
- `approve_contractor_praxistest` (existiert) → wird wiederverwendet für Freigabe
- Neu: `admin_reject_praxistest(p_onboarding_id, p_notiz)` → setzt `praxistest_freigabe = false`, `praxistest_scan_url`/`praxistest_video_url` = NULL, Trainee muss neu einreichen. Notiz wird in `interner_kommentar` angehängt.

---

## Technik

### DB-Migration (1 Migration, 3 RPCs)
```sql
-- alle SECURITY DEFINER, search_path = thermocheck, public
-- Auth: IF NOT thermocheck.is_innendienst() THEN raise/return error END IF;

CREATE OR REPLACE FUNCTION thermocheck.admin_book_coaching_ride(
  p_trainee_profile_id uuid,
  p_auftrag_id uuid
) RETURNS jsonb ...

CREATE OR REPLACE FUNCTION thermocheck.admin_set_onboarding_step(
  p_profile_id uuid,
  p_target_step text
) RETURNS jsonb ...

CREATE OR REPLACE FUNCTION thermocheck.admin_reject_praxistest(
  p_onboarding_id uuid,
  p_notiz text DEFAULT NULL
) RETURNS jsonb ...

-- + public wrapper für jede RPC (sql, SECURITY DEFINER)
```

### Frontend
| Datei | Änderung |
|---|---|
| `src/features/contractors/hooks/useAdminContractorActions.ts` (NEU, <200 LOC) | 3 React-Query Mutations + Hook für „verfügbare Trainer-Aufträge" |
| `src/features/contractors/ui/AdminCoachingAssignment.tsx` (NEU, <200 LOC) | UI-Card mit Trainer-/Auftrag-Picker + Bestätigungs-Dialog |
| `src/features/contractors/ui/AdminStepOverride.tsx` (NEU, <150 LOC) | Step-Dropdown + Bestätigungs-Dialog |
| `src/features/contractors/ui/AdminPraxistestActions.tsx` (NEU, <150 LOC) | Freigeben + Ablehnen Buttons mit Notiz |
| `src/features/contractors/ui/ContractorDetailView.tsx` | 3 neue Sektionen einhängen, hinter `useIsAdmin()`-Gate |

### Sicherheit & Konventionen
- Alle RPCs prüfen `thermocheck.is_innendienst()` → Verstoß = `jsonb {success:false, message:'Unzureichende Berechtigung'}`
- `FOR UPDATE` Locks wo State-Übergänge stattfinden
- Explizites `{ error }`-Handling im Frontend (Memory: Supabase Error Protocol)
- Bestätigungs-Dialoge mit klarem Warntext (irreversibel / überschreibt Historie)
- Audit-Spalten: `aktualisiert_am`, bei coaching ride `coaching_gebucht_am = now()`

---

## Out of Scope (bewusst)
- Manuelle Coaching-Bewertung durch Admin (bereits Teil eines vorherigen Tasks)
- Free-form Datum ohne Auftrag (Nacherfassung läuft über existierende Trainer-Aufträge)
- Bulk-Operationen über mehrere Techniker

---

## Reihenfolge
1. DB-Migration (3 RPCs + Wrapper) → Approval abwarten
2. Hook + 3 UI-Komponenten
3. In `ContractorDetailView` einhängen
4. Manuelle Verifikation in `/admin` → Techniker auswählen → 3 neue Sektionen testen
