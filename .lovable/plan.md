

# Plan: Forum-Tab zu "Forum + Nachrichten" Inbox umbauen

## Kernidee

Der bestehende "Forum"-Tab in der BottomNav wird zu einem Dual-View mit zwei Sub-Tabs:
1. **Nachrichten** (default, mit Badge) -- Inbox aller Auftrags-Chats mit ungelesenen Nachrichten oben
2. **Forum** -- das bestehende Q&A-Forum (unverandert)

Contractors konnen NUR auf Nachrichten antworten, die der Innendienst initiiert hat. Sie konnen NICHT proaktiv den Innendienst kontaktieren.

## User Flow

```text
BottomNav "Nachrichten" (mit rotem Dot wenn unread)
  └─► Sub-Tabs: [Nachrichten] [Forum]
       │
       ├── Nachrichten-Tab (default)
       │   ├── Unread-Banner: "3 neue Nachrichten"
       │   ├── Auftragskarte (Kunde X, 2 ungelesen) → Tap → Chat-Detail
       │   ├── Auftragskarte (Kunde Y, gelesen) → Tap → Chat-Detail
       │   └── Leerer Zustand: "Keine Nachrichten"
       │
       └── Forum-Tab
           └── Bestehendes ForumView (unverandert)
```

## Technische Umsetzung

### 1. BottomNav anpassen
- Tab-Label von "Forum" zu "Nachrichten" umbenennen
- Tab-ID bleibt `forum` (keine Breaking Changes)
- Neues Prop `unreadChatTotal` fur roten pulsierenden Dot

### 2. Neue Komponente: `NachrichtenInboxView`
- Zeigt alle zugewiesenen Auftrage, die Chat-Nachrichten haben
- Sortierung: ungelesene oben, dann nach letzter Nachricht-Zeit
- Tap auf Karte offnet `AuftragChatSection` als Fullscreen-Detail
- Kein "Neue Nachricht"-Button (Contractor kann nicht proaktiv schreiben)
- Ladt Daten via bestehendem `useUnreadChatCounts` + neuem Hook `useAuftragChatInbox` (holt letzte Nachricht pro Auftrag)

### 3. Neuer Hook: `useAuftragChatInbox`
- Query: Fur alle zugewiesenen `auftragIds`, hole pro Auftrag die letzte Nachricht (autor_name, inhalt, erstellt_am)
- Nutzt `supabaseTC` (thermocheck-Client)
- Polling 30s wie bestehende Hooks

### 4. Wrapper-Komponente: `MessagesAndForumView`
- Ersetzt `ForumView` im Index.tsx
- Zwei Sub-Tabs oben: "Nachrichten" | "Forum"
- Badge auf "Nachrichten"-Sub-Tab zeigt unread count
- "Forum" Sub-Tab rendert bestehendes `ForumView`

### 5. Index.tsx Integration
- `unreadChatTotal` aus bestehendem `useUnreadChatCounts` Hook ableiten (Summe)
- An `BottomNav` als Prop durchreichen
- `MessagesAndForumView` statt `ForumView` rendern

## Einschrankung: Contractor kann nicht proaktiv schreiben

Die Chat-Eingabe in `AuftragChatSection` bleibt aktiv -- Contractor kann antworten. Aber es gibt keinen "Neue Konversation starten"-Button. Chat ist nur zuganglich uber Auftrage, bei denen bereits Nachrichten existieren ODER uber den Auftragsdetail (wo Chat-Section bereits eingebaut ist).

Das heisst: Innendienst muss die erste Nachricht senden. Danach kann der Contractor antworten.

## Keine DB-Migration notig

Alle Daten kommen aus bestehenden Tabellen (`auftrag_nachrichten`, `auftrag_chat_gelesen`). Der neue Inbox-Hook nutzt dieselben Queries.

## Betroffene Dateien

| Datei | Anderung |
|-------|----------|
| `src/components/BottomNav.tsx` | Label "Nachrichten", `unreadChatTotal` Prop, roter Dot |
| `src/features/chat/ui/MessagesAndForumView.tsx` | NEU: Wrapper mit Sub-Tabs |
| `src/features/chat/ui/NachrichtenInboxView.tsx` | NEU: Inbox-Liste aller Auftrags-Chats |
| `src/features/chat/ui/NachrichtenDetail.tsx` | NEU: Fullscreen Chat-Detail (nutzt AuftragChatSection) |
| `src/features/chat/hooks/useAuftragChatInbox.ts` | NEU: Letzte Nachricht pro Auftrag laden |
| `src/pages/Index.tsx` | MessagesAndForumView + unreadChatTotal berechnen |

## Edge Cases

| Szenario | Verhalten |
|----------|-----------|
| Keine Nachrichten bei keinem Auftrag | Leerer Zustand: "Noch keine Nachrichten vom Innendienst" |
| Innendienst schreibt erste Nachricht | Erscheint in Inbox mit Badge |
| Contractor offnet Chat | `gelesen_am` wird aktualisiert, Badge verschwindet |
| Auftrag im Pool (nicht zugewiesen) | Erscheint nicht in Inbox |
| Alle gelesen | Kein roter Dot in BottomNav, kein Banner |

## RLS / Sicherheit

Keine neuen Policies notig. Bestehende RLS auf `auftrag_nachrichten` stellt sicher, dass Contractor nur seine zugewiesenen Auftrage sieht. `auftrag_chat_gelesen` ist auf `user_id = auth.uid()` beschrankt.

