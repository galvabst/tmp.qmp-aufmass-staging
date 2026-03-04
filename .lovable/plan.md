
Ziel: Fehlerursache ohne Mutmaßung beheben, damit Till in „In Prüfung“ nicht leer sieht und die 5‑Sterne‑Bewertung im Profil angezeigt wird.

1) Verifizierte Ist-Analyse (Reverse Engineering)
- Reale DB-Daten (Till):
  - `thermocheck.v_thermocheck_auftraege`: Auftrag `56149a8c-...` hat `pipeline_status = angebotstermin_abwarten`.
  - `thermocheck.techniker_bewertungen`: 1 Eintrag mit `bewertung = 5` für genau diesen Auftrag.
- Code-Ursachen:
  - `src/hooks/useMyAssignedOrders.ts`:
    - `deriveStatus()` kennt nur wenige Pipeline-Status und **nicht** `angebotstermin_abwarten`.
    - Ergebnis: Auftrag wird als `booked` statt Review-Status gemappt.
  - `src/pages/Index.tsx`:
    - Profil-Statistik `rating` ist hart auf `0` gesetzt.
    - Ergebnis: Bewertung bleibt leer trotz DB-Daten.
- RLS-/IAM-Befund für betroffene Tabellen:
  - `techniker_bewertungen`: SELECT für authenticated erlaubt (`auth.uid() IS NOT NULL`).
  - `thermocheck_auftraege`, `thermocheck_terminvorschlaege`, `contractor_onboarding`: breite authenticated-Policies + SECURITY DEFINER RPCs.
  - Kein akuter RLS-Blocker für dieses Problem.

2) Betroffene User Stories
- US1 (Techniker): „Wenn mein Auftrag schon in Angebotsphase ist, sehe ich ihn in Review statt leerer Liste.“
- US2 (Techniker): „Wenn ich eine 5‑Sterne-Bewertung habe, sehe ich diese im Profil.“
- US3 (Trainer/Techniker): „Review-KPI und Profil-KPI sind konsistent zur DB.“

3) End-to-End Flow (Klick → API → DB → UI)
- Review-Tab:
  - Klick „Prüfung“ → `Index` nutzt `useMyAssignedOrders`
  - API:
    1) `contractor_onboarding?profile_id=...&select=id`
    2) `v_thermocheck_auftraege?zugewiesener_techniker_id=...`
    3) `thermocheck_terminvorschlaege?...&status=eq.angenommen`
    4) (neu) `techniker_bewertungen?thermocheck_auftrag_id=in(...)`
  - Mapping:
    - Wenn Bewertung existiert → `approved`
    - Sonst wenn Pipeline in Review-Pipeline → `submitted`
    - Sonst bisherige Regeln
  - UI: `ReviewView` zeigt Karten/Listen nicht mehr leer
- Profil:
  - `Index` lädt (neu) Bewertungs-Stats-Hook
  - DB: `techniker_bewertungen` für eigenen `techniker_id` (contractor_onboarding.id)
  - UI: `ProfileView` zeigt Durchschnitt statt 0

4) Umsetzungsplan (Dateien)
A. Status-Ableitung robust machen
- Datei: `src/hooks/useMyAssignedOrders.ts`
- Änderungen:
  - Review-Status-Liste erweitern (mindestens `angebotstermin_abwarten`).
  - Zusätzlichen Fetch auf `thermocheck.techniker_bewertungen` für geladene Aufträge.
  - `deriveStatus()` auf datengetriebene Priorität umstellen:
    1. Bewertung vorhanden => `approved`
    2. `eingereicht_am` oder Review-Pipeline => `submitted`
    3. Check-in aktiv => `in_progress`
    4. sonst `booked`
  - Optional `approvedAt` aus `techniker_bewertungen.created_at` ins Order-Mapping geben.

B. Bewertungs-KPI im Profil korrekt anzeigen
- Datei: `src/hooks/` (neu, z. B. `useTechnikerBewertungStats.ts`)
  - Input: `contractorOnboardingId`
  - Query: AVG/COUNT aus `thermocheck.techniker_bewertungen` für `techniker_id`.
- Datei: `src/pages/Index.tsx`
  - Hook anbinden.
  - `profile.stats.rating` aus Hook setzen (z. B. 1 Dezimalstelle), nicht mehr hardcoded `0`.

C. Architektur-Härtung (Anti-Vibe-Coding)
- Status-Mapping als zentrale Konstante auslagern (kleine Domain-Utility), damit keine versteckten Magic-Strings.

5) Rollen-Matrix (für diese Änderung)
Hinweis: In dieser App sind systemisch relevant: `superadmin`, `admin`, `manager`, `user`. Rollen wie `coach/closer/setter` kommen aus anderem Kontext und werden hier als „nicht direktes IAM-Systemrole-Mapping“ behandelt.
- user (Till):
  - SELECT `v_thermocheck_auftraege`, `thermocheck_terminvorschlaege`, `techniker_bewertungen` => erlaubt
  - INSERT/UPDATE/DELETE für diesen Fix nicht nötig
- admin/manager/superadmin:
  - Lesen ebenfalls möglich; keine Sonderlogik im Frontend für diesen Bug
- Konsequenz: Kein RLS-Migrationsbedarf für diesen Fix.

6) Edge-Case-Validierung (code-basiert, ohne Frontend-Automation)
- Mapping-Tests (Unit):
  - pipeline = `angebotstermin_abwarten` + keine Bewertung => `submitted`
  - pipeline = `vot_formular_abfragen` + keine Bewertung => bleibt nach Regel (booked/submitted je finaler Liste)
  - Bewertung vorhanden + beliebige Pipeline => `approved`
  - `eingereicht_am` gesetzt + keine Bewertung => `submitted`
  - aktive Check-in-Phase + keine Bewertung + nicht review-pipeline => `in_progress`
- Datenkanten:
  - Keine Termine gefunden
  - Mehrere Bewertungszeilen (defensiv latest/avg)
  - Null/fehlender `vereinbarter_preis`
  - Leere Auftragsliste
- Sicherheits-/Robustheit:
  - Kein Write-Pfad geändert
  - Fehlerobjekte aller Supabase-Reads explizit prüfen

7) Post-Migration / Daten-Migration Check
- Für den Kernfix: **keine DB-Migration erforderlich**.
- Daten-Glättung:
  - Nicht notwendig, da Auftrag+Bewertung bereits korrekt in DB vorhanden.
- Optional später:
  - Performance-Index auf `techniker_bewertungen(techniker_id, created_at)` prüfen/ergänzen (aktuell nur PK + unique auf auftrag_id).

8) Dokumentation (pflichtgemäß)
- Datei anlegen/aktualisieren: `.lovable/validation-review-status-and-rating.md`
- Inhalt:
  - Datum
  - User-Stories
  - API/DB-Flow
  - Rollen-Matrix
  - Edge-Case-Testliste + Ergebnis
  - Known Issues (falls vorhanden)

9) Kritische Selbstprüfung vor Umsetzung
- Passt in bestehende Architektur: Ja (Hook/Domain-Mapping, keine UI-Business-Logik-Ausweitung).
- Minimale invasive Änderung: Ja (2–3 Dateien + optional Utility/Hook).
- Risiko:
  - Falsche Status-Priorisierung => wird durch Unit-Tests und klare Prioritätsregel abgefangen.
- Professioneller Standard:
  - Keine Mutmaßungen, auf realen DB-Befunden basiert, mit reproduzierbaren Testfällen.
