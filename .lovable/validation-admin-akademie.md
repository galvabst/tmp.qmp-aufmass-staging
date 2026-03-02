# Validation: Admin Akademie Content Management

**Datum:** 2026-03-02
**Feature:** Phase 1 - Akademie-Content-CRUD im Admin-Panel

## Getestete Rollen

| Rolle | Zugriff auf Admin-Tab | Module lesen (inkl. inaktive) | Module schreiben | Lektionen schreiben |
|---|---|---|---|---|
| superadmin | ✅ via ProtectedAdminRoute | ✅ RLS: `is_admin()` | ✅ RPC + RLS | ✅ RPC + RLS |
| admin | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ (useIsAdmin prüft manager) | ❌ Nur aktive via bestehende Policy | ❌ RPC blockiert | ❌ RPC blockiert |
| user/techniker | ❌ AccessDeniedScreen | ❌ Nur aktive | ❌ | ❌ |

## RLS Policy Matrix

### thermocheck.contractor_akademie_module
| Policy | Cmd | Condition |
|---|---|---|
| Authenticated users can read active modules | SELECT | ist_aktiv = true |
| Admin can read all modules | SELECT | is_admin() |
| Admin can insert modules | INSERT | is_admin() |
| Admin can update modules | UPDATE | is_admin() |
| Admin can delete modules | DELETE | is_admin() |

### thermocheck.contractor_akademie_lektionen
| Policy | Cmd | Condition |
|---|---|---|
| Authenticated users can read active lektionen | SELECT | ist_aktiv = true |
| Admin can read all lektionen | SELECT | is_admin() |
| Admin can insert lektionen | INSERT | is_admin() |
| Admin can update lektionen | UPDATE | is_admin() |
| Admin can delete lektionen | DELETE | is_admin() |

### thermocheck.contractor_akademie_quiz
| Policy | Cmd | Condition |
|---|---|---|
| Authenticated users can read active quiz | SELECT | ist_aktiv = true |
| Admin can read all quiz | SELECT | is_admin() |
| Admin can insert quiz | INSERT | is_admin() |
| Admin can update quiz | UPDATE | is_admin() |
| Admin can delete quiz | DELETE | is_admin() |

## RPCs (alle mit is_admin()-Check)

- `admin_upsert_akademie_modul(p_data jsonb)` → Insert/Update Modul
- `admin_upsert_akademie_lektion(p_data jsonb)` → Insert/Update Lektion, content_version auto-increment
- `admin_reorder_akademie_lektionen(p_modul_id, p_order)` → Batch-Reihenfolge-Update

## Edge Cases

| Szenario | Status |
|---|---|
| Modul soft-delete (ist_aktiv = false) | ✅ Lektionen bleiben, werden im Onboarding übersprungen |
| Lektion deaktivieren mit laufendem Fortschritt | ✅ Fortschritt bleibt erhalten |
| Neue Lektion → Catch-Up | ✅ Bereits implementiert (academy-mandatory-catchup) |
| content_version Inkrement | ✅ Automatisch im RPC bei Update |
| Admin ohne contractor_onboarding | ✅ Admin-Route ist getrennt |
| Doppelter Code | ⚠️ DB hat kein UNIQUE constraint auf code — akzeptabel da Admin-kontrolliert |

## Known Issues
- Manager sieht Admin-Tab aber kann keine Akademie-Inhalte schreiben (RPC blockiert korrekt)
- Drag-Reorder UI noch nicht implementiert (admin_reorder_akademie_lektionen RPC ist bereit)
