

# Zwei Features: Abrechnungs-Workflow + Radius im Profil

## A) Abrechnungs-Workflow: Techniker "Rechnung gestellt" + Admin-Verwaltung

### Status Quo
- `contractor_abrechnungen` Tabelle existiert bereits (thermocheck Schema)
- `useAbrechnungStatus` Hook liest nur (SELECT)
- `AbrechnungStepper` zeigt 4 Stufen: Abgenommen → Rechnung → Prüfung → Bezahlt
- Techniker hat aktuell **keine Möglichkeit**, den Status zu ändern
- Admin hat **keine UI** zum Pflegen des Abrechnungsstatus
- RLS: Techniker hat nur SELECT, INSERT/UPDATE liegt bei Innendienst (`is_innendienst()`)

### Problem: RLS erlaubt Techniker kein UPDATE
Der Techniker darf laut RLS weder INSERT noch UPDATE auf `contractor_abrechnungen`. Um "Rechnung gestellt" zu ermöglichen, brauchen wir entweder:
- Eine neue RLS Policy für Techniker-UPDATE (nur eigene, nur auf `rechnung_eingegangen`)
- Oder eine RPC-Funktion (SECURITY DEFINER), die validiert und den Status setzt

**Empfehlung**: RPC `mark_rechnung_gestellt(p_auftrag_id uuid)` als SECURITY DEFINER — sicherer, da die Funktion validiert, dass der Techniker der Besitzer ist und der Status noch `offen` war.

### Techniker-Seite

**Datei: `src/hooks/useAbrechnungStatus.ts`**
- Neue Mutation `useMarkRechnungGestellt` hinzufügen
- Ruft RPC `mark_rechnung_gestellt` auf
- Invalidiert `abrechnung-status` Query

**Datei: `src/components/TechnicianOrderDetail.tsx`**
- Im `AbrechnungStepper`: Wenn Status `offen`, Button "Rechnung gestellt" anzeigen unter dem Stepper
- Klick → RPC aufrufen → Stepper aktualisiert sich auf "Rechnung eingegangen"

**Migration**: 
- RPC `mark_rechnung_gestellt(p_auftrag_id uuid)`:
  - Prüft ob der aufrufende User der Contractor dieses Auftrags ist
  - Prüft ob Status noch `offen`
  - UPSERT in `contractor_abrechnungen` mit Status `rechnung_eingegangen` + `rechnung_eingegangen_am = now()`
  - Falls kein Eintrag existiert: INSERT (contractor_id, thermocheck_auftrag_id, status, rechnung_eingegangen_am)
  - Falls bereits vorhanden: UPDATE status + timestamp

### Admin-Seite

**Datei: `src/features/quality-gate/ui/QGQueueView.tsx`** (oder neuer Tab)
- Neuer Tab "Abrechnung" in der Quality Gate View
- Listet alle Aufträge mit Status `approved` + deren Abrechnungsstatus
- Pro Eintrag: Kundenname, Techniker, Betrag, aktueller Status
- Dropdown oder Buttons zum Weiterschalten: Rechnung → Prüfung → Bezahlt

**Neuer Hook: `src/hooks/useAdminAbrechnung.ts`**
- `useAdminAbrechnungen()`: Lädt alle `contractor_abrechnungen` mit JOIN auf Auftragsdaten
- `useUpdateAbrechnungStatus()`: Mutation zum Weiterschalten (nur Innendienst via bestehende RLS)

### Rollen-Matrix (erweitert)

| Rolle | SELECT | "Rechnung gestellt" | in_pruefung setzen | bezahlt setzen |
|---|---|---|---|---|
| Techniker | eigene | Ja (via RPC) | Nein | Nein |
| Admin/Innendienst | alle | Nein (irrelevant) | Ja | Ja |

---

## B) Radius im Profil änderbar

### Status Quo
- `wunsch_radius_km` wird beim Onboarding gespeichert (ProfileStep mit Slider 10-150 km)
- Gespeichert in `thermocheck.contractor_onboarding.wunsch_radius_km`
- Nach dem Onboarding gibt es **keine Möglichkeit**, den Wert zu ändern
- ProfileView zeigt den Radius aktuell gar nicht an

### Umsetzung

**Datei: `src/hooks/useContractorProfile.ts`**
- `wunschRadiusKm` in den geladenen Profildaten ergänzen (aus dem Onboarding-State RPC)
- Neue Mutation `useUpdateWunschRadius` — direktes UPDATE auf `contractor_onboarding.wunsch_radius_km`

**Datei: `src/components/ProfileView.tsx`**
- Neuer Abschnitt "Einsatzradius" mit Slider (gleich wie im Onboarding: 10-150 km)
- Im Edit-Modus: Slider editierbar
- Im View-Modus: Aktuelle Zahl anzeigen (z.B. "60 km")
- Beim Speichern: `useUpdateWunschRadius` aufrufen

**RLS**: Techniker hat bereits UPDATE-Zugriff auf eigene `contractor_onboarding`-Zeile (über bestehende Policy `contractor_update_own`).

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| Migration | RPC `mark_rechnung_gestellt` |
| `src/hooks/useAbrechnungStatus.ts` | Mutation `useMarkRechnungGestellt` hinzufügen |
| `src/components/TechnicianOrderDetail.tsx` | Button "Rechnung gestellt" im AbrechnungStepper |
| `src/hooks/useAdminAbrechnung.ts` | Neuer Hook: Admin-Abrechnungsliste + Status-Update |
| `src/features/quality-gate/ui/QGQueueView.tsx` | Neuer Tab "Abrechnung" mit Statusverwaltung |
| `src/hooks/useContractorProfile.ts` | `wunschRadiusKm` laden + Update-Mutation |
| `src/components/ProfileView.tsx` | Radius-Slider Anzeige + Bearbeitung |
| `.lovable/validation-contractor-abrechnung.md` | Update: Admin-UI + Techniker-Aktion dokumentiert |

