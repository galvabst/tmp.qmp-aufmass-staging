

# Einweisungen als zweiter Auftragstyp im Pool

## Analyse des Ist-Zustands

**Datenbank:**
- `thermocheck.auftragstyp_preise` hat bereits `einweisung` mit `default_betrag_netto = 50.00`
- `thermocheck.contractor_grundpreise` hat bereits `einweisung`-Einträge (50.00€)
- `thermocheck.v_thermocheck_auftraege` hat Spalte `auftragstyp` — aktuell nur `thermocheck`-Werte vorhanden
- ENUM `AuftragstypEnum` hat bereits `'einweisung'` definiert
- **Es gibt kein `einweisung_freigabe`-Feld** in `contractor_onboarding` → muss angelegt werden
- `accept_pool_order` RPC liest bereits `auftragstyp` und lädt den passenden `contractor_grundpreise`-Preis → funktioniert schon für Einweisungen

**Frontend:**
- `usePoolOrders` filtert aktuell nur `pipeline_status=termin_abwarten` + `zugewiesener_techniker_id=is.null` — kein `auftragstyp`-Filter → Einweisungen würden automatisch erscheinen, sobald welche in der DB stehen
- `TechnicianOrderCard` zeigt `AUFTRAGSTYP_LABELS[order.auftragstyp]` als Badge → Label "Einweisung" ist bereits vorhanden
- `useMyThermocheckGrundpreis` lädt nur den `thermocheck`-Preis → muss erweitert werden für alle Auftragstypen

## User Stories

1. **Contractor ohne Einweisung-Freigabe**: Sieht Einweisungsaufträge im Pool, aber ausgegraut mit Schloss-Icon. Klick zeigt Hinweis "Nicht für Einweisungen freigegeben".
2. **Contractor mit Einweisung-Freigabe**: Sieht Einweisungsaufträge normal und kann sie annehmen. Vergütung wird aus `contractor_grundpreise` (auftragstyp=einweisung) geladen.
3. **Admin**: Kann im Contractor-Detail `einweisung_freigabe` setzen.

## Rollen-Matrix

| Aktion | User (Contractor) | Admin/Manager |
|--------|-------------------|---------------|
| Einweisung im Pool sehen | ✓ (ausgegraut wenn nicht freigegeben) | n/a (Admin sieht kein Pool) |
| Einweisung annehmen | Nur wenn `einweisung_freigabe = true` | n/a |
| `einweisung_freigabe` setzen | ✗ | ✓ |

## Umsetzungsplan

### 1. DB-Migration: `einweisung_freigabe` Feld

```sql
ALTER TABLE thermocheck.contractor_onboarding 
  ADD COLUMN einweisung_freigabe BOOLEAN NOT NULL DEFAULT false;
```

Kein RLS-Änderungsbedarf — die bestehende Policy erlaubt bereits authenticated SELECT auf `contractor_onboarding`, und UPDATE ist über RPCs gesteuert.

### 2. Hook: `useMyGrundpreise` (Alle Preise laden)

Refaktor von `useMyThermocheckGrundpreis` → neuer Hook `useMyGrundpreise` der alle Auftragstyp-Preise als Map zurückgibt statt nur Thermocheck. Der bestehende Hook bleibt als Wrapper erhalten.

**Datei:** `src/hooks/useContractorGrundpreise.ts` (erweitern)

### 3. Hook: `usePoolOrders` erweitern

- Lädt zusätzlich `auftragstyp` aus der View
- Lädt `einweisung_freigabe` aus eigenem `contractor_onboarding`-Record
- Setzt `billableAmount` basierend auf dem jeweiligen `auftragstyp` (nicht hardcoded thermocheck)
- Markiert Einweisungen als `locked: true` wenn `einweisung_freigabe = false`

**Datei:** `src/hooks/usePoolOrders.ts`

### 4. Type: `TechnicianOrder` erweitern

Neues Feld `isLocked?: boolean` + `lockReason?: string` im Interface.

**Datei:** `src/types/technician.ts`

### 5. UI: `TechnicianOrderCard` — Locked-State

- Wenn `order.isLocked = true`: Karte ausgegraut (`opacity-50`), Schloss-Icon statt ChevronRight
- `onClick` zeigt Toast-Hinweis statt Navigation

**Datei:** `src/components/TechnicianOrderCard.tsx`

### 6. UI: `TechnicianOrderDetail` — Locked-Guard

- Wenn `isLocked`, keine "Annehmen"-Buttons anzeigen, stattdessen Hinweis

**Datei:** `src/components/TechnicianOrderDetail.tsx`

### 7. RPC-Absicherung: `accept_pool_order`

Der RPC prüft bereits den Preis via `contractor_grundpreise`. Wenn ein Contractor keinen Einweisungs-Preis hat, wird der Auftrag abgelehnt. Zusätzliche serverseitige Prüfung von `einweisung_freigabe`:

```sql
-- Innerhalb accept_pool_order, nach v_auftragstyp-Ermittlung:
IF v_auftragstyp = 'einweisung' THEN
  IF NOT (SELECT einweisung_freigabe FROM thermocheck.contractor_onboarding 
          WHERE id = v_contractor_id) THEN
    RETURN json_build_object('success', false, 'error', 'Nicht für Einweisungen freigegeben');
  END IF;
END IF;
```

### 8. Admin: Einweisung-Freigabe im Contractor-Detail

- Neues Toggle/Checkbox im Admin-ContractorDetailView
- RPC `update_contractor_einweisung_freigabe(p_contractor_id, p_freigabe)` (Admin-only)

**Dateien:**
- `src/features/contractors/ui/ContractorDetailView.tsx`
- DB-Migration für RPC

### 9. `useMyAssignedOrders` erweitern

- `auftragstyp` aus der View lesen (bereits vorhanden)
- `description` dynamisch setzen ("Einweisung" vs "Thermocheck-Termin")
- `billableAmount` basierend auf auftragstyp

## Edge Cases

| Edge Case | Lösung |
|-----------|--------|
| Contractor hat keinen Einweisungs-Grundpreis | Karte zeigt "Preis n.V." / RPC lehnt Annahme ab |
| Einweisung-Freigabe wird entzogen nach Buchung | Bestehende Buchungen bleiben, nur neue werden blockiert |
| Auftragstyp fehlt in DB (null) | Fallback auf `thermocheck` (bestehende Logik im RPC) |
| Pool-Ansicht zeigt beides gemischt | Auftragstyp-Filter in FilterRow ist bereits implementiert |

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| DB-Migration | `einweisung_freigabe` Spalte + `accept_pool_order` Guard + Admin-RPC |
| `src/types/technician.ts` | `isLocked`, `lockReason` Felder |
| `src/hooks/usePoolOrders.ts` | Auftragstyp + einweisung_freigabe laden, isLocked setzen |
| `src/hooks/useContractorGrundpreise.ts` | `useMyGrundpreise()` — alle Preise als Map |
| `src/hooks/useMyAssignedOrders.ts` | Auftragstyp-basierte Beschreibung + Preis |
| `src/components/TechnicianOrderCard.tsx` | Locked-State UI (grau + Schloss) |
| `src/components/TechnicianOrderDetail.tsx` | Locked-Guard |
| `src/features/contractors/ui/ContractorDetailView.tsx` | Einweisung-Freigabe Toggle |
| `.lovable/validation-einweisung-pool.md` | Validierungsdokumentation |

