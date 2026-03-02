# Validierung: Auftragschat (auftrag_nachrichten)

**Datum**: 2026-03-02
**Feature**: Auftragsbezogener Chat zwischen Contractor und Innendienst

## Datenbank

- **Tabelle**: `thermocheck.auftrag_nachrichten` (id, auftrag_id, autor_id, inhalt, erstellt_am, aktualisiert_am)
- **RLS**: Aktiviert mit 4 Policies (SELECT, INSERT, UPDATE, DELETE)
- **Helper**: `is_innendienst()` prüft admin + superadmin + manager

## RLS Policy Matrix

| Operation | Policy | Contractor | Admin/Manager |
|-----------|--------|-----------|---------------|
| SELECT | "Chat: select own order messages" | Eigene Aufträge (via contractor_onboarding JOIN) | Alle (is_innendienst) |
| INSERT | "Chat: insert messages for own orders" | Eigene Aufträge + eigene autor_id | Alle + eigene autor_id |
| UPDATE | "Chat: update own messages" | Eigene Nachrichten (autor_id = auth.uid()) | Eigene Nachrichten |
| DELETE | "Chat: admins delete messages" | ❌ | ✅ (is_innendienst) |

## Rollen-Matrix

| Rolle | system_role | SELECT | INSERT | UPDATE | DELETE |
|-------|------------|--------|--------|--------|--------|
| Contractor | user | Eigene Aufträge | ✅ | Eigene | ❌ |
| Admin | admin | Alle | ✅ | Eigene | ✅ |
| Superadmin | superadmin | Alle | ✅ | Eigene | ✅ |
| Manager | manager | Alle | ✅ | Eigene | ✅ |
| Coach/Trainer | user | ❌ (kein zugewiesener_techniker) | ❌ | ❌ | ❌ |

## Edge Cases

| Szenario | Verhalten | Status |
|----------|-----------|--------|
| Pool-Auftrag (kein Techniker) | Chat nicht angezeigt | ✅ |
| Leere Nachricht | CHECK constraint blockiert | ✅ |
| Nachricht > 2000 Zeichen | Frontend-Limit | ✅ |
| Gelöschter User | "Ehemaliger Nutzer" als Name | ✅ |
| Auftrag gelöscht | CASCADE löscht Nachrichten | ✅ |
| Fremder Auftrag | RLS blockiert SELECT + INSERT | ✅ |

## Frontend-Dateien

- `src/features/chat/hooks/useAuftragChat.ts` — Query + Mutation
- `src/features/chat/ui/AuftragChatSection.tsx` — Chat-UI
- `src/components/TechnicianOrderDetail.tsx` — Integration + Layout-Fix (pb-40)

## Known Issues

- Kein Realtime-Subscription (Polling alle 30s) — ausreichend für MVP
