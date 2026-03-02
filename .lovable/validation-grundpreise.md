# Validierung: Grundpreis-System (3-Stufen-Modell)

## Datum: 2026-03-02

## Schema-Änderungen

### Neue Tabellen
- `thermocheck.auftragstyp_preise` – Katalog (3 Rows: thermocheck=140, einweisung=50, pv=100)
- `thermocheck.contractor_grundpreise` – Pro Contractor × Auftragstyp (60 Rows seeded)

### Neue Spalten
- `thermocheck.thermocheck_auftraege.auftragstyp` (text, DEFAULT 'thermocheck')
- `thermocheck.thermocheck_auftraege.vereinbarter_preis` (numeric(10,2), nullable)

### View Update
- `thermocheck.v_thermocheck_auftraege` – auftragstyp + vereinbarter_preis ergänzt

### Trigger
- `trg_copy_katalog_preise` auf `contractor_onboarding` AFTER INSERT → kopiert Katalog-Preise

### RPCs (thermocheck + public wrapper)
- `get_contractor_grundpreise(p_contractor_id)` – Eigene oder Admin
- `update_contractor_grundpreis(p_contractor_id, p_auftragstyp, p_betrag)` – Admin only
- `get_auftragstyp_preise()` – Alle auth'd
- `update_auftragstyp_preis(p_auftragstyp, p_betrag)` – Admin only
- `accept_pool_order` – Jetzt mit Preis-Snapshot (vereinbarter_preis)

## RLS Policy Matrix

| Tabelle | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| auftragstyp_preise | Alle auth'd | is_admin() | is_admin() | is_admin() |
| contractor_grundpreise | Eigene ODER is_admin() | is_admin() | is_admin() | is_admin() |

## Rollen-Matrix

| Aktion | superadmin/admin | manager | user (Contractor) |
|---|---|---|---|
| Katalog-Preise lesen | ✅ | ✅ | ✅ |
| Katalog-Preise ändern | ✅ | ❌ | ❌ |
| Contractor-Preise lesen | Alle | Alle | Nur eigene |
| Contractor-Preise ändern | ✅ | ❌ | ❌ |
| vereinbarter_preis auf Auftrag | Via View (bestehende RLS) | Via View | Via View (nur eigene) |

## Edge Cases

| Szenario | Status |
|---|---|
| Neuer Contractor → Trigger kopiert Preise | ✅ Implementiert |
| Katalog-Preis-Änderung → nur neue Contractors | ✅ By Design |
| Individueller Preis → nur neue Aufträge | ✅ By Design (Snapshot) |
| Kein Grundpreis vorhanden → accept_pool_order | ✅ Fehler wird zurückgegeben |
| Preis 0 erlaubt | ✅ Kein CHECK constraint |
| Pool-Ansicht: Preis aus eigenen Grundpreisen | ✅ useMyThermocheckGrundpreis |
| Assigned Orders: Preis aus vereinbarter_preis | ✅ View-Spalte gemappt |

## Frontend-Änderungen

| Datei | Änderung |
|---|---|
| `src/hooks/useContractorGrundpreise.ts` | Neuer Hook (Query + Mutation) |
| `src/hooks/usePoolOrders.ts` | billableAmount aus eigenem Grundpreis |
| `src/hooks/useMyAssignedOrders.ts` | vereinbarter_preis aus View → billableAmount |
| `src/components/TechnicianOrderCard.tsx` | Zeigt billableAmount (bereits vorhanden) |
| `src/components/TechnicianOrderDetail.tsx` | Vergütung im Header |

## Known Issues
- Admin-UI für Preisanpassung noch nicht gebaut (ContractorListView)
- Katalog-Admin-UI noch nicht gebaut
