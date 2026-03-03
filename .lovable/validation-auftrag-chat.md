# Validierung: Auftragschat (auftrag_nachrichten) + Unread-Badge

**Datum**: 2026-03-03
**Feature**: Auftragsbezogener Chat + Unread-Benachrichtigungen

## Datenbank

### Chat-Nachrichten
- **Tabelle**: `thermocheck.auftrag_nachrichten` (id, auftrag_id, autor_id, inhalt, erstellt_am, aktualisiert_am)
- **RLS**: Aktiviert mit 4 Policies (SELECT, INSERT, UPDATE, DELETE)
- **Helper**: `is_innendienst()` prüft admin + superadmin + manager

### Unread-Tracking
- **Tabelle**: `thermocheck.auftrag_chat_gelesen` (id, auftrag_id, user_id, gelesen_am)
- **UNIQUE**: (auftrag_id, user_id)
- **RLS**: 4 Policies – alle auf `user_id = auth.uid()`
- **Index**: `idx_chat_gelesen_user_auftrag` (user_id, auftrag_id)

## RLS Policy Matrix – auftrag_nachrichten

| Operation | Policy | Contractor | Admin/Manager |
|-----------|--------|-----------|---------------|
| SELECT | "Chat: select own order messages" | Eigene Aufträge | Alle (is_innendienst) |
| INSERT | "Chat: insert messages for own orders" | Eigene Aufträge + eigene autor_id | Alle + eigene autor_id |
| UPDATE | "Chat: update own messages" | Eigene Nachrichten | Eigene Nachrichten |
| DELETE | "Chat: admins delete messages" | ❌ | ✅ (is_innendienst) |

## RLS Policy Matrix – auftrag_chat_gelesen

| Operation | Policy | Bedingung |
|-----------|--------|-----------|
| SELECT | chat_gelesen_select_own | user_id = auth.uid() |
| INSERT | chat_gelesen_insert_own | user_id = auth.uid() |
| UPDATE | chat_gelesen_update_own | user_id = auth.uid() |
| DELETE | chat_gelesen_delete_own | user_id = auth.uid() |

## Unread-Count Logik

Nachrichten in `auftrag_nachrichten` WHERE:
- `autor_id != current_user` (eigene zählen nicht)
- `erstellt_am > gelesen_am` (oder alle wenn kein gelesen-Eintrag)

## Auto-Read-Mark

- `AuftragChatSection` ruft `useMarkChatRead()` beim Mount und bei neuen Nachrichten auf
- UPSERT auf `auftrag_chat_gelesen` mit `gelesen_am = now()`

## Edge Cases

| Szenario | Verhalten | Status |
|----------|-----------|--------|
| Pool-Auftrag (kein Techniker) | Chat nicht angezeigt, kein Badge | ✅ |
| User hat Chat nie geöffnet | Alle fremden Nachrichten = unread | ✅ |
| User sendet eigene Nachricht | Zählt nicht als unread für ihn | ✅ |
| Auftrag gelöscht | CASCADE löscht gelesen + nachrichten | ✅ |
| Admin antwortet → Contractor sieht Badge | Korrekt, autor_id != contractor | ✅ |
| Leere Nachricht | CHECK constraint blockiert | ✅ |
| Nachricht > 2000 Zeichen | Frontend-Limit | ✅ |
| Gelöschter User | "Ehemaliger Nutzer" als Name | ✅ |

## Frontend-Dateien

| Datei | Funktion |
|-------|----------|
| `src/features/chat/hooks/useAuftragChat.ts` | Query + Mutation |
| `src/features/chat/hooks/useUnreadChatCounts.ts` | Batch unread count per auftrag |
| `src/features/chat/hooks/useMarkChatRead.ts` | UPSERT gelesen_am |
| `src/features/chat/ui/AuftragChatSection.tsx` | Chat-UI + Auto-Read-Mark |
| `src/components/BookingsView.tsx` | Unread-Badge auf Buchungskarten |
| `src/components/ActiveOrdersView.tsx` | Unread-Badge auf aktiven Auftragskarten |
| `src/pages/Index.tsx` | Hook-Integration + Count-Weiterleitung |

## Known Issues

- Kein Realtime-Subscription (Polling alle 30s) — ausreichend für MVP
