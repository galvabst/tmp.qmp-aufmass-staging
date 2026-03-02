

# Grundpreis-System: 3-Stufen-Modell

## Ist-Zustand (verifiziert)

- `thermocheck.contractor_onboarding`: 20 Eintraege, keine Preis-Spalten
- `thermocheck.thermocheck_auftraege`: Kein `auftragstyp`, kein `vereinbarter_preis`
- `v_thermocheck_auftraege`: View ohne Preis-/Typ-Spalten
- `accept_pool_order` RPC: Weist Techniker zu, setzt `pipeline_status = 'wc1_durchfuehren'`, kein Preis-Handling
- `is_admin()`: Prueft gegen `iam.user_system_roles` (admin/superadmin)
- RLS auf `contractor_onboarding`: SELECT/UPDATE fuer alle auth'd Users, INSERT fuer auth'd, Manager-Policy fuer Trainer-Freigabe
- `TechnicianOrder.billableAmount` existiert bereits im Frontend-Type aber wird nie befuellt
- `AuftragstypEnum` existiert bereits in `src/lib/enums.ts` (thermocheck, pv, einweisung)

## Architektur (3 Stufen)

```text
Stufe 1: KATALOG           thermocheck.auftragstyp_preise
         (globale Defaults)  thermocheck → 140, einweisung → 50, pv → 100
                             Admin kann aendern, wirkt nur auf NEUE Contractors

Stufe 2: VEREINBARUNG       thermocheck.contractor_grundpreise
         (pro Contractor)    Kopie aus Katalog bei Onboarding-Anlage (Trigger)
                             Admin kann individuell anpassen

Stufe 3: BELEG              thermocheck_auftraege.vereinbarter_preis
         (Snapshot)          Eingefroren bei accept_pool_order aus Stufe 2
```

## Aenderungen

### 1. DB-Migration (ein SQL-Script)

**Katalog-Tabelle** `thermocheck.auftragstyp_preise`:
- `auftragstyp text PK` (thermocheck, einweisung, pv)
- `default_betrag_netto numeric(10,2) NOT NULL`
- `updated_at timestamptz DEFAULT now()`
- `updated_by uuid`
- RLS: SELECT alle auth'd, UPDATE/INSERT/DELETE nur `is_admin()`
- Seed: 3 Rows (140, 50, 100)

**Contractor-Preise** `thermocheck.contractor_grundpreise`:
- `id uuid PK DEFAULT gen_random_uuid()`
- `contractor_id uuid FK → contractor_onboarding(id) ON DELETE CASCADE NOT NULL`
- `auftragstyp text NOT NULL`
- `betrag_netto numeric(10,2) NOT NULL`
- `erstellt_am timestamptz DEFAULT now()`
- `aktualisiert_am timestamptz DEFAULT now()`
- `aktualisiert_von uuid`
- `UNIQUE(contractor_id, auftragstyp)`
- RLS: SELECT eigene (`contractor_id` via `profile_id = auth.uid()`) ODER `is_admin()`, UPDATE/INSERT/DELETE nur `is_admin()`
- updated_at Trigger

**Neue Spalten** auf `thermocheck_auftraege`:
- `auftragstyp text DEFAULT 'thermocheck'`
- `vereinbarter_preis numeric(10,2)` (nullable)

**View** `v_thermocheck_auftraege` neu erstellen: alle bestehenden Spalten + `auftragstyp`, `vereinbarter_preis`

**Trigger** `trg_copy_katalog_preise` auf `contractor_onboarding` (AFTER INSERT):
- Fuer jeden Eintrag in `auftragstyp_preise`: INSERT in `contractor_grundpreise` mit Katalog-Default

**accept_pool_order anpassen**:
- Nach Techniker-Zuweisung: Liest `betrag_netto` aus `contractor_grundpreise` WHERE `contractor_id = v_contractor_id` AND `auftragstyp = 'thermocheck'`
- Schreibt in `vereinbarter_preis` auf dem Auftrag
- Auftragstyp bleibt vorerst immer 'thermocheck' (Default)

**RPCs** (mit public Wrapper):
- `get_contractor_grundpreise(p_contractor_id uuid)`: Gibt alle Preise zurueck. Contractor darf eigene, Admin alle.
- `update_contractor_grundpreis(p_contractor_id uuid, p_auftragstyp text, p_betrag numeric)`: UPSERT, nur Admin.
- `get_auftragstyp_preise()`: Gibt Katalog zurueck (alle auth'd).
- `update_auftragstyp_preis(p_auftragstyp text, p_betrag numeric)`: Nur Admin.

### 2. Daten-Migration (INSERT-Tool, nach Schema)

- 20 bestehende Contractors × 3 Auftragstypen = 60 Zeilen in `contractor_grundpreise` (140, 50, 100)
- Bestehende Auftraege: alle bekommen `auftragstyp = 'thermocheck'` (ist eh Default)

### 3. Frontend

**Neuer Hook** `src/hooks/useContractorGrundpreise.ts`:
- Query: Laedt Grundpreise via `get_contractor_grundpreise` RPC
- Mutation: Admin kann Preis aendern via `update_contractor_grundpreis` RPC

**Pool-View** (`usePoolOrders.ts`):
- Contractor-spezifischen Grundpreis fuer `thermocheck` laden
- `billableAmount` auf `TechnicianOrder` setzen
- Anzeige im `TechnicianOrderCard`

**Assigned Orders** (`useMyAssignedOrders.ts`):
- `vereinbarter_preis` aus View lesen
- `billableAmount` auf `TechnicianOrder` mappen

**TechnicianOrderCard** / **TechnicianOrderDetail**:
- `billableAmount` anzeigen (z.B. "140,00 EUR")

### 4. Rollen-Matrix

| Aktion | superadmin/admin | manager | user (Contractor) |
|---|---|---|---|
| auftragstyp_preise SELECT | Ja | Ja (auth'd) | Ja (auth'd) |
| auftragstyp_preise UPDATE | Ja (`is_admin`) | Nein | Nein |
| contractor_grundpreise SELECT | Alle | Alle | Nur eigene |
| contractor_grundpreise UPDATE | Ja (`is_admin`) | Nein | Nein |
| vereinbarter_preis lesen | Via View | Via View | Via View (nur eigene Auftraege, bestehende RLS) |

Hinweis: `is_admin()` prueft nur `admin` und `superadmin`, nicht `manager`. Manager hat also keinen Schreibzugriff auf Preise -- das ist korrekt so, nur Admins sollen Preise aendern.

### 5. Edge Cases

| Szenario | Verhalten |
|---|---|
| Neuer Contractor wird angelegt | Trigger kopiert 3 Katalog-Preise automatisch |
| Katalog-Preis wird geaendert | Nur neue Contractors betroffen |
| Admin aendert individuellen Preis | Nur neue Auftraege betroffen |
| Contractor hat keinen Preis-Eintrag | accept_pool_order: Fallback auf 0 oder Fehler? → Fehler, muss existieren |
| Auftragstyp NULL auf altem Auftrag | Default 'thermocheck' greift |
| Preis 0 erlaubt? | Ja (z.B. Probe-Auftraege) |
| Pool-Ansicht: Preis anzeigen | Liest aus contractor_grundpreise des eingeloggten Users |

### 6. Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration SQL | Tabellen, View, Trigger, RPCs, RLS |
| INSERT SQL | 60 Seed-Rows fuer bestehende Contractors |
| `src/hooks/useContractorGrundpreise.ts` | Neuer Hook |
| `src/hooks/usePoolOrders.ts` | billableAmount aus eigenem Grundpreis |
| `src/hooks/useMyAssignedOrders.ts` | vereinbarter_preis aus View → billableAmount |
| `src/components/TechnicianOrderCard.tsx` | Preis-Anzeige |
| `src/components/TechnicianOrderDetail.tsx` | Preis-Anzeige |
| `.lovable/validation-grundpreise.md` | Validierungs-Dokumentation |

