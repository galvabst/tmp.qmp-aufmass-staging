# Validation: Nachrichten-Inbox (Forum → Dual-Tab)

## Datum: 2026-03-03

## Änderungen
- BottomNav "Forum" → "Nachrichten" mit rotem pulsierendem Dot bei ungelesenen Chats
- Dual Sub-Tabs: Nachrichten (default) | Forum
- NachrichtenInboxView: Inbox aller Auftrags-Chats, sortiert nach ungelesen + Zeit
- NachrichtenDetail: Fullscreen Chat-Detail mit AuftragChatSection
- useAuftragChatInbox: Letzte Nachricht pro Auftrag, 30s Polling

## RLS / Sicherheit
- Keine neuen Policies nötig
- auftrag_nachrichten: Contractor sieht nur zugewiesene Aufträge (bestehende RLS)
- auftrag_chat_gelesen: user_id = auth.uid() (bestehende RLS)
- Contractor kann NICHT proaktiv schreiben (kein "Neue Nachricht"-Button in Inbox)
- Chat-Eingabe nur über bestehende AuftragChatSection (Antwort auf Innendienst-Nachrichten)

## Edge Cases
| Szenario | Verhalten |
|----------|-----------|
| Keine Nachrichten | Leerer Zustand: "Sobald der Innendienst Ihnen schreibt..." |
| Innendienst schreibt erste Nachricht | Erscheint in Inbox + roter Dot in BottomNav |
| Contractor öffnet Chat | gelesen_am wird aktualisiert, Badge verschwindet |
| Auftrag im Pool (nicht zugewiesen) | Erscheint nicht in Inbox |
| Alle gelesen | Kein roter Dot, kein Banner |
| Keine zugewiesenen Aufträge | Query disabled, leere Inbox |

## Keine DB-Migration
Alle Daten aus bestehenden Tabellen (auftrag_nachrichten, auftrag_chat_gelesen).

## Betroffene Dateien
- src/components/BottomNav.tsx (Label + unreadChatTotal Dot)
- src/features/chat/hooks/useAuftragChatInbox.ts (NEU)
- src/features/chat/ui/MessagesAndForumView.tsx (NEU)
- src/features/chat/ui/NachrichtenInboxView.tsx (NEU)
- src/features/chat/ui/NachrichtenDetail.tsx (NEU)
- src/pages/Index.tsx (Integration)
