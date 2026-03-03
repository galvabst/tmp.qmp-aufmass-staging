

# Unread-Chat-Badge: Benachrichtigung für neue Nachrichten

## Ziel

Contractors sollen auf einen Blick sehen, wenn es ungelesene Chat-Nachrichten gibt -- sowohl auf der Auftragskarte in der Liste als auch im Auftragsdetail-Header.

## Ansatz

### Datenbank: `thermocheck.auftrag_chat_gelesen`

Eine kleine Tracking-Tabelle speichert pro User pro Auftrag den Zeitpunkt der letzten Lesebestätigung:

```text
thermocheck.auftrag_chat_gelesen
├── id              uuid PK DEFAULT gen_random_uuid()
├── auftrag_id      uuid FK → thermocheck_auftraege(id) ON DELETE CASCADE
├── user_id         uuid NOT NULL (auth.uid())
├── gelesen_am      timestamptz DEFAULT now()
└── UNIQUE(auftrag_id, user_id)
```

**RLS**: Jeder authentifizierte User kann nur seine eigene Row lesen/schreiben (user_id = auth.uid()).

### Unread-Count Query

Ungelesene Nachrichten = Nachrichten in `auftrag_nachrichten` WHERE:
- `autor_id != current_user` (eigene Nachrichten zählen nicht)
- `erstellt_am > gelesen_am` (oder alle wenn kein gelesen-Eintrag)

### "Gelesen" markieren

Wenn der User den Chat öffnet/sieht (in `AuftragChatSection`), wird automatisch ein UPSERT auf `auftrag_chat_gelesen` gemacht mit `gelesen_am = now()`.

## Frontend-Änderungen

### 1. Neuer Hook: `useUnreadChatCounts`

- Batch-Query: Für alle zugewiesenen Auftrags-IDs die ungelesenen Nachrichten-Counts laden
- Gibt `Map<auftragId, number>` zurück
- Polling alle 30s (wie der Chat selbst)

### 2. `TechnicianOrderCard` -- Badge anzeigen

- Neues optionales Prop `unreadCount?: number`
- Wenn > 0: orangener Badge mit Zahl (z.B. "3") neben dem Kundennamen oder Chevron

### 3. `AuftragChatSection` -- Auto-Read-Mark

- Beim Mount und bei neuen Nachrichten: UPSERT `gelesen_am = now()`
- Dadurch verschwindet der Badge sobald der User den Chat sieht

### 4. Integration in Auftragsliste

- `useUnreadChatCounts` im Parent aufrufen (z.B. `Index.tsx` oder wo die Order-Liste gerendert wird)
- Count per `auftragId` an `TechnicianOrderCard` durchreichen

## RLS-Policies für `auftrag_chat_gelesen`

| Operation | Policy |
|-----------|--------|
| SELECT | `user_id = auth.uid()` |
| INSERT | `user_id = auth.uid()` |
| UPDATE | `user_id = auth.uid()` |
| DELETE | `user_id = auth.uid()` |

Einfach und sicher -- jeder User verwaltet nur seine eigene Lesebestätigung.

## Edge Cases

| Szenario | Verhalten |
|----------|-----------|
| User hat Chat nie geöffnet | Kein `gelesen`-Eintrag → alle fremden Nachrichten = unread |
| User sendet eigene Nachricht | Zählt nicht als unread für ihn selbst |
| Auftrag gelöscht | CASCADE löscht gelesen-Einträge |
| Kein Chat (Pool-Auftrag) | Kein Badge, kein Count |
| Admin antwortet → Contractor sieht Badge | Korrekt, da `autor_id != contractor` |

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration SQL | `auftrag_chat_gelesen` Tabelle + RLS |
| `src/features/chat/hooks/useUnreadChatCounts.ts` | NEU: Batch unread count hook |
| `src/features/chat/hooks/useAuftragChat.ts` | UPSERT gelesen_am beim Laden |
| `src/features/chat/ui/AuftragChatSection.tsx` | Mark-as-read Logik |
| `src/components/TechnicianOrderCard.tsx` | Unread-Badge anzeigen |
| `src/pages/Index.tsx` (oder Parent) | Hook einbinden, Counts durchreichen |
| `.lovable/validation-auftrag-chat.md` | Update mit Unread-Feature |

