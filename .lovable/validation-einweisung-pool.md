# Validierung: Einweisungen als zweiter Auftragstyp im Pool

## Datum: 2026-03-06

## Schema-Änderungen

### Neue Spalte
- `thermocheck.contractor_onboarding.einweisung_freigabe` (BOOLEAN, NOT NULL, DEFAULT false)

### Geänderte RPCs
- `thermocheck.accept_pool_order` – Neue Guard-Prüfung: Wenn `auftragstyp = 'einweisung'` → `einweisung_freigabe` muss `true` sein
- `thermocheck.update_contractor_einweisung_freigabe(p_contractor_id, p_freigabe)` – Admin-only RPC (SECURITY DEFINER)
- `public.update_contractor_einweisung_freigabe` – Public Wrapper

## Rollen-Matrix

| Aktion | User (Contractor) | Admin/Superadmin |
|--------|-------------------|------------------|
| Einweisung im Pool sehen | ✓ (ausgegraut wenn nicht freigegeben) | n/a |
| Einweisung annehmen | Nur wenn `einweisung_freigabe = true` | n/a |
| `einweisung_freigabe` setzen | ✗ | ✓ (via RPC) |
| Grundpreise sehen | Eigene | Alle |

## RPC-Absicherung

### accept_pool_order
```
IF auftragstyp = 'einweisung' AND NOT einweisung_freigabe THEN
  → Fehler: 'Nicht für Einweisungen freigegeben'
END IF
```
- Server-seitiger Guard unabhängig vom Frontend
- FOR UPDATE Lock gegen Race Conditions
- Preis-Snapshot aus `contractor_grundpreise`

### update_contractor_einweisung_freigabe
- `is_admin()` Check (SECURITY DEFINER)
- Fehler wenn Contractor nicht gefunden

## Frontend-Änderungen

| Datei | Änderung |
|-------|----------|
| `src/types/technician.ts` | `isLocked`, `lockReason` Felder |
| `src/hooks/useContractorGrundpreise.ts` | `useMyGrundpreise()` – alle Preise als Map |
| `src/hooks/usePoolOrders.ts` | Auftragstyp + einweisung_freigabe laden, isLocked setzen |
| `src/hooks/useMyAssignedOrders.ts` | Auftragstyp-basierte Beschreibung + Preis |
| `src/components/TechnicianOrderCard.tsx` | Locked-State UI (grau + Schloss-Icon) |
| `src/components/TechnicianOrderDetail.tsx` | Locked-Guard im Action Bar |
| `src/features/contractors/hooks/useAdminContractorList.ts` | `einweisungFreigabe` Feld |
| `src/features/contractors/ui/ContractorDetailView.tsx` | Toggle unter Interne Checks |

## Edge Cases

| Edge Case | Status |
|-----------|--------|
| Contractor ohne Einweisungs-Grundpreis | ✅ RPC lehnt ab ("Kein Grundpreis") |
| Contractor nicht freigegeben, versucht anzunehmen | ✅ Server-Guard + UI-Lock |
| Freigabe entzogen nach Buchung | ✅ Bestehende bleiben, neue blockiert |
| Auftragstyp NULL → Fallback thermocheck | ✅ COALESCE im RPC |
| Pool zeigt Thermocheck + Einweisung gemischt | ✅ Auftragstyp-Badge + Filter |
| Preis aus eigenem Grundpreis-Katalog | ✅ useMyGrundpreise() Map-basiert |
| Admin setzt Freigabe → sofort im Pool nutzbar | ✅ Query-Invalidierung |

## Known Issues
- Keine Einweisungs-Aufträge in der DB zum Testen (auftragstyp = 'einweisung' muss manuell erstellt werden)
- Katalog-Admin-UI für Preise noch nicht gebaut
