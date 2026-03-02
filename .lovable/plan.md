

# Plan: Admin-Panel -- Akademie-Management + Onboarding-Detailansicht

## Scope-Analyse

Das ist ein Giga-Feature mit zwei Kernbereichen. Ich schlage eine **Phasen-Aufteilung** vor, damit nichts kaputtgeht:

**Phase 1 (dieser Prompt):** Akademie-Content-Management (CRUD fuer Module/Lektionen) + neuer Admin-Tab
**Phase 2 (naechster Prompt):** Contractor-Onboarding-Detailansicht mit Fortschrittsdaten aus DB

Grund: Beide Bereiche zusammen waeren 1500+ Zeilen neuer Code mit Migration, RPCs, RLS, und 8+ neuen Dateien. Ein Profi wuerde das splitten.

---

## Phase 1: Akademie-Content-Management

### Ist-Zustand (verifiziert)

- **Module:** `thermocheck.contractor_akademie_module` (id, code, titel, beschreibung, reihenfolge, ist_aktiv) -- 10+ Module vorhanden
- **Lektionen:** `thermocheck.contractor_akademie_lektionen` (id, modul_id, code, titel, beschreibung, reihenfolge, video_url, video_dauer_minuten, text_inhalt, text_zusammenfassung, zusatzmaterial_urls, ist_aktiv, content_version)
- **RLS:** Nur SELECT-Policies existieren (`ist_aktiv = true`). **Keine** INSERT/UPDATE/DELETE Policies
- **`is_admin()`:** Prueft `iam.user_system_roles` auf `admin`/`superadmin` (SECURITY DEFINER)
- **Thermocheck-Client:** Separater Supabase-Client mit `schema: 'thermocheck'` existiert bereits (`supabaseTC`)

### DB-Migration

**1. RLS-Policies fuer Admin-Schreibzugriff:**

```sql
-- contractor_akademie_module
CREATE POLICY "Admin can insert modules" ON thermocheck.contractor_akademie_module
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update modules" ON thermocheck.contractor_akademie_module
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete modules" ON thermocheck.contractor_akademie_module
  FOR DELETE TO authenticated USING (public.is_admin());

-- contractor_akademie_lektionen (analog)
-- contractor_akademie_quiz (analog)
```

**2. RPCs (thermocheck + public wrapper):**

- `thermocheck.admin_upsert_akademie_modul(p_data jsonb)` -- Insert/Update Modul
- `thermocheck.admin_upsert_akademie_lektion(p_data jsonb)` -- Insert/Update Lektion
- `thermocheck.admin_delete_akademie_lektion(p_lektion_id uuid)` -- Soft-Delete (ist_aktiv = false)
- `thermocheck.admin_reorder_akademie_lektionen(p_modul_id uuid, p_order jsonb)` -- Reihenfolge aendern

Jede RPC prueft `is_admin()` am Anfang und gibt `{success, error?}` zurueck.

### Neue Dateien

```text
src/features/admin/
  ui/
    AdminBottomNav.tsx          -- Erweitern um "Akademie" Tab
    akademie/
      AkademieAdminView.tsx     -- Hauptansicht: Modul-Liste mit Akkordeon
      ModulEditor.tsx           -- Dialog: Modul erstellen/bearbeiten
      LektionEditor.tsx         -- Dialog: Lektion erstellen/bearbeiten (Video-URL, Text, Pflicht/Optional)
      LektionListItem.tsx       -- Einzelne Lektion in der Liste (drag-reorder spaeter)
  hooks/
    useAdminAkademieModule.ts   -- Alle Module + Lektionen laden (auch inaktive)
    useAdminMutateModul.ts      -- useMutation fuer Modul CRUD
    useAdminMutateLektion.ts    -- useMutation fuer Lektion CRUD
```

### UI-Design

**AkademieAdminView:**
- AdminLayout mit Titel "Akademie-Inhalte"
- Button "Neues Modul +" oben rechts
- Akkordeon pro Modul: Titel, Code, Reihenfolge, ist_aktiv Badge
- Aufgeklappt: Liste der Lektionen mit Edit/Deaktivieren-Buttons
- Button "Neue Lektion +" pro Modul

**LektionEditor (Dialog/Sheet):**
- Titel (text, required)
- Code (text, required, Pattern X-Y)
- Beschreibung (textarea)
- Video-URL (text, Bunny Stream URL)
- Video-Dauer Minuten (number)
- Text-Inhalt (textarea/markdown)
- Text-Zusammenfassung (textarea)
- ist_aktiv Toggle
- Reihenfolge (number)

### Rollen-Matrix

| Rolle | Module lesen | Module schreiben | Lektionen lesen | Lektionen schreiben |
|---|---|---|---|---|
| superadmin | Alle (inkl. inaktive) | Ja | Alle (inkl. inaktive) | Ja |
| admin | Alle (inkl. inaktive) | Ja | Alle (inkl. inaktive) | Ja |
| manager | Nur aktive (via Techniker-App) | Nein | Nur aktive | Nein |
| user/techniker | Nur aktive | Nein | Nur aktive | Nein |

Die bestehenden SELECT-Policies filtern auf `ist_aktiv = true`. Admins brauchen eine zusaetzliche SELECT-Policy ohne diesen Filter. Loesung: Neue Policy `"Admin can read all modules"` mit `USING (public.is_admin())` die auch inaktive zeigt.

### Edge Cases

| Szenario | Handling |
|---|---|
| Modul loeschen mit bestehenden Lektionen | Soft-Delete (ist_aktiv = false), Lektionen bleiben |
| Lektion deaktivieren mit laufendem Fortschritt | Fortschritt bleibt, Lektion wird im Onboarding uebersprungen |
| Neue Lektion hinzufuegen → Catch-Up-Mechanismus | Bereits implementiert (Memory: academy-mandatory-catchup) |
| Reihenfolge aendern | Batch-Update aller reihenfolge-Werte |
| content_version bei Lektion-Update | Automatisch inkrementieren im RPC |
| Admin ohne contractor_onboarding | Funktioniert -- Admin-Route ist getrennt |

### Betroffene bestehende Dateien

1. `src/features/admin/ui/AdminBottomNav.tsx` -- Neuer Tab "Akademie"
2. `src/pages/Admin.tsx` -- Neuen Tab rendern

---

## Phase 2 (naechster Prompt): Contractor-Detail mit Fortschritt

- ContractorListView: Mock-Daten durch `get_contractors` RPC ersetzen
- Neue ContractorDetailView mit:
  - Onboarding-Step-Fortschritt (aus `contractor_onboarding`)
  - Akademie-Fortschritt pro Lektion (aus `contractor_akademie_lektions_fortschritt`)
  - Quiz-Ergebnisse mit Versuchsanzahl (aus `contractor_akademie_quiz_ergebnis`)
  - Video-Fortschritt in Sekunden pro Lektion
  - Coaching-Buchung (aus `contractor_onboarding` + `contractor_coaching_slots`)

---

## Entscheidungsfrage

Soll ich Phase 1 (Akademie-CRUD) jetzt umsetzen und Phase 2 (Contractor-Detail) im naechsten Prompt? Oder beides zusammen riskieren?

