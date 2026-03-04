

# Plan: Abrechnungs-Fortschritt für abgenommene Aufträge

## Was sich ändert

### 1. Neue DB-Tabelle: `thermocheck.contractor_abrechnungen`

Tracking des Abrechnungsstatus pro Auftrag nach Abnahme.

```sql
CREATE TYPE thermocheck.abrechnung_status AS ENUM (
  'offen',              -- Abgenommen, Rechnung noch nicht eingegangen
  'rechnung_eingegangen', -- Rechnung vom Techniker eingegangen
  'in_pruefung',        -- Rechnung wird geprüft
  'bezahlt'             -- Auszahlung erfolgt
);

CREATE TABLE thermocheck.contractor_abrechnungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thermocheck_auftrag_id UUID NOT NULL REFERENCES thermocheck.thermocheck_auftraege(id),
  contractor_id UUID NOT NULL REFERENCES thermocheck.contractor_onboarding(id),
  status thermocheck.abrechnung_status NOT NULL DEFAULT 'offen',
  betrag NUMERIC(10,2),
  rechnung_eingegangen_am TIMESTAMPTZ,
  geprueft_am TIMESTAMPTZ,
  bezahlt_am TIMESTAMPTZ,
  zahlungsart TEXT,       -- z.B. 'ueberweisung', 'stripe'
  referenz TEXT,          -- Zahlungsreferenz/Verwendungszweck
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thermocheck_auftrag_id)
);

ALTER TABLE thermocheck.contractor_abrechnungen ENABLE ROW LEVEL SECURITY;
```

RLS:
- SELECT: Techniker sieht eigene (`contractor_id` matches), Innendienst sieht alle
- INSERT/UPDATE: nur Innendienst (`thermocheck.is_innendienst()`)

### 2. UI: `TechnicianOrderDetail.tsx` – Approved-Ansicht umbauen

Für `isApproved`-Aufträge:
- Navigation-Button (`Navigation starten`) ausblenden
- Adresse auf PLZ + Ort reduzieren (wie Pool-Ansicht)
- Neuer **Abrechnungs-Fortschrittsbalken** mit 4 Stufen:

```text
[ ✓ Abgenommen ] ─── [ Rechnung ] ─── [ Prüfung ] ─── [ Bezahlt ]
     grün              grau/aktiv       grau             grau
```

Jede Stufe zeigt Datum wenn vorhanden. Status wird aus `contractor_abrechnungen` gelesen.

### 3. Neuer Hook: `useAbrechnungStatus.ts`

- Input: `auftragId`
- Fetch: `thermocheck.contractor_abrechnungen` via REST-API (gleicher Pattern wie `useMyAssignedOrders`)
- Output: `{ status, betrag, bezahltAm, ... }`
- Fallback wenn kein Eintrag: Status = `offen` (gerade erst abgenommen)

### 4. Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration (SQL) | Neue Tabelle + ENUM + RLS |
| `src/hooks/useAbrechnungStatus.ts` | Neuer Hook (REST-Fetch) |
| `src/components/TechnicianOrderDetail.tsx` | Approved-Ansicht: Adresse kürzen, Nav weg, Fortschrittsbalken |
| `.lovable/validation-contractor-abrechnung.md` | Dokumentation |

### 5. Rollen-Matrix

| Rolle | SELECT | INSERT/UPDATE |
|-------|--------|---------------|
| user (Techniker) | eigene Rows | nein |
| admin/superadmin/manager | alle | ja |

### 6. Edge Cases

- Kein Abrechnungs-Eintrag vorhanden → UI zeigt "Offen" als Default
- Mehrere Aufträge approved → jeder hat eigenen Abrechnungsstatus
- `betrag` kann von `vereinbarter_preis` abweichen (Abzüge möglich)
- Bezahlt-Datum wird erst gesetzt wenn Innendienst es markiert

### 7. Daten-Migration

Für bereits abgenommene Aufträge (wie Tills): Kein automatischer Eintrag nötig. Der Hook zeigt bei fehlendem Eintrag "Offen" an. Innendienst kann später manuell den Status setzen.

