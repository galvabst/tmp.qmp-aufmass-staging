

# Auftragschat + Layout-Fix: Masterplan

## Problem 1: Layout-Overlap

Die `TechnicianOrderDetail`-Komponente hat ein `fixed bottom-20`-Action-Bar (Zeile 647), das die Inhalte ueberlappt. Der Content-Bereich hat nur `pb-24` (Zeile 212), was bei laengeren Inhalten (submitted-Status mit "Warte auf Pruefung" + VOT-Protokoll + Billing) nicht ausreicht.

**Fix**: `pb-24` auf `pb-40` erhoehen und die Action-Bar von `fixed` auf sticky oder groeßerem Abstand aendern, damit nichts ueberlappt.

## Problem 2: Auftragschat (Haupt-Feature)

### User Stories

1. **Contractor** oeffnet Auftragsdetail → sieht Chat-Bereich → schreibt Nachricht/Rueckfrage zum Auftrag
2. **Innendienst** (Heat Pump Hub) oeffnet Auftrag → sieht Chat → antwortet dem Contractor
3. Nachrichten sind **auftragsbezogen** (1 Chat pro `thermocheck_auftrag_id`)
4. Beide Seiten sehen chronologisch alle Nachrichten

### Datenbank-Design

**Neue Tabelle**: `thermocheck.auftrag_nachrichten`

```text
thermocheck.auftrag_nachrichten
├── id              uuid PK DEFAULT gen_random_uuid()
├── auftrag_id      uuid FK → thermocheck_auftraege(id) ON DELETE CASCADE NOT NULL
├── autor_id        uuid NOT NULL REFERENCES profiles(id)
├── inhalt          text NOT NULL CHECK (char_length(inhalt) > 0)
├── erstellt_am     timestamptz DEFAULT now()
├── aktualisiert_am timestamptz DEFAULT now()
└── UNIQUE: keiner (mehrere Nachrichten pro User/Auftrag moeglich)
```

**Indizes**:
- `idx_auftrag_nachrichten_auftrag` ON (auftrag_id, erstellt_am ASC)
- `idx_auftrag_nachrichten_autor` ON (autor_id)

**updated_at Trigger**: Wie bei Forum-Tabellen.

### RLS-Policies

Die RLS-Logik muss zwei Gruppen abdecken:
- **Contractors**: Nur Nachrichten zum eigenen Auftrag (WHERE `zugewiesener_techniker_id` = eigene `contractor_onboarding.id`)
- **Admins**: Alle Nachrichten (via `is_admin()`)

| Operation | Contractor | Admin |
|-----------|-----------|-------|
| SELECT | Eigene Auftraege | Alle |
| INSERT | Eigene Auftraege, eigene `autor_id` | Alle, eigene `autor_id` |
| UPDATE | Eigene Nachrichten | Eigene Nachrichten |
| DELETE | Nein | Ja (`is_admin()`) |

**SELECT-Policy** (Contractor sieht eigene Auftrags-Chats):
```sql
CREATE POLICY "Contractor can view own order messages"
  ON thermocheck.auftrag_nachrichten FOR SELECT TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM thermocheck.thermocheck_auftraege a
      JOIN thermocheck.contractor_onboarding co ON co.id = a.zugewiesener_techniker_id
      WHERE a.id = auftrag_nachrichten.auftrag_id
        AND co.profile_id = auth.uid()
    )
  );
```

**INSERT-Policy** (Nur in eigene Auftraege schreiben, nur eigene `autor_id`):
```sql
CREATE POLICY "Users can insert messages for own orders"
  ON thermocheck.auftrag_nachrichten FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM thermocheck.thermocheck_auftraege a
        JOIN thermocheck.contractor_onboarding co ON co.id = a.zugewiesener_techniker_id
        WHERE a.id = auftrag_nachrichten.auftrag_id
          AND co.profile_id = auth.uid()
      )
    )
  );
```

**UPDATE-Policy** (Nur eigene Nachrichten):
```sql
CREATE POLICY "Users can update own messages"
  ON thermocheck.auftrag_nachrichten FOR UPDATE TO authenticated
  USING (autor_id = auth.uid())
  WITH CHECK (autor_id = auth.uid());
```

**DELETE-Policy** (Nur Admins):
```sql
CREATE POLICY "Admins can delete messages"
  ON thermocheck.auftrag_nachrichten FOR DELETE TO authenticated
  USING (is_admin());
```

### Rollen-Matrix (Validierung)

| Rolle | System-Rolle | SELECT | INSERT | UPDATE | DELETE |
|-------|-------------|--------|--------|--------|--------|
| Contractor (user) | user | Eigene Auftraege | Eigene Auftraege, eigene autor_id | Eigene Nachrichten | Nein |
| Admin | admin/superadmin | Alle | Alle, eigene autor_id | Eigene Nachrichten | Alle |
| Manager | manager | Alle (via is_admin) | Alle, eigene autor_id | Eigene Nachrichten | Alle |
| Coach/Trainer | user (kein admin) | Nein (kein zugewiesener_techniker) | Nein | Nein | Nein |

Hinweis: `is_admin()` im DB-Schema prueft `admin` und `superadmin` in `iam.user_system_roles`. Manager wird im Frontend als Admin behandelt (`useIsAdmin` inkludiert manager), aber `is_admin()` in DB ist nur admin/superadmin. Fuer den Chat brauchen Manager auch Zugriff.

**Korrektur**: Die SELECT/INSERT Policies muessen auch Manager abdecken. Da Manager nicht in `is_admin()` enthalten ist, muss die Policy erweitert werden um einen Check auf `iam.user_system_roles` WHERE `role = 'manager'`, ODER wir verwenden eine neue Helper-Funktion `is_innendienst()` die admin + superadmin + manager prueft.

**Loesung**: Neue `SECURITY DEFINER` Funktion `thermocheck.is_innendienst()`:
```sql
CREATE FUNCTION thermocheck.is_innendienst()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM iam.user_system_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin', 'manager')
  )
$$;
```
Plus public Wrapper. Dann `is_innendienst()` statt `is_admin()` in den Chat-Policies.

### Frontend-Implementierung

**Neuer Hook**: `src/features/chat/hooks/useAuftragChat.ts`
- Query: Laedt Nachrichten fuer eine `auftrag_id` via REST API (thermocheck-Schema)
- Resolve Autor-Namen via `profiles` JOIN
- Mutation: Insert neue Nachricht

**Neue UI-Komponente**: `src/features/chat/ui/AuftragChatSection.tsx`
- Chat-Bubble-UI (eigene rechts, fremde links)
- Eingabefeld unten
- Scrollt automatisch nach unten bei neuen Nachrichten
- Wird in `TechnicianOrderDetail` als neuer Abschnitt eingebaut (nach Beschreibung, vor Arbeitsfortschritt)

**Integration in TechnicianOrderDetail**:
- Neuer Abschnitt "Nachrichten" mit Chat-Icon
- Nur sichtbar wenn `order.auftragId` vorhanden (= zugewiesener Auftrag, nicht Pool)
- Collapsible oder immer sichtbar

### Edge Cases

| Szenario | Verhalten |
|----------|-----------|
| Auftrag ohne zugewiesenen Techniker | Kein Chat moeglich (Pool-Ansicht zeigt keinen Chat) |
| Contractor schreibt in fremden Auftrag | RLS blockiert INSERT → Frontend zeigt kein Chat |
| Admin loescht Nachricht | Verschwindet fuer alle |
| Leere Nachricht | CHECK constraint verhindert INSERT |
| Sehr lange Nachricht | Frontend-Limit (z.B. 2000 Zeichen) |
| Geloeschter User (profiles CASCADE) | Nachrichten bleiben, Autor-Aufloesung: "Ehemaliger Nutzer" |
| Auftrag geloescht | CASCADE loescht alle Nachrichten |

### Daten-Migration

Keine noetig – es gibt keine bestehenden Chat-Daten.

### Prompt fuer Heat Pump Hub

Am Ende der Implementierung wird ein ausfuehrlicher Prompt erstellt, der dem Heat Pump Hub-Projekt erklaert:
- Tabelle `thermocheck.auftrag_nachrichten` existiert bereits
- RLS-Policies erlauben Admin/Manager Zugriff
- Wie der Chat im Auftragsdetail eingebaut werden soll
- Welche Felder und Join-Logik noetig ist

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration SQL | Neue Tabelle, RLS, `is_innendienst()` Funktion |
| `src/components/TechnicianOrderDetail.tsx` | Layout-Fix (pb-40) + Chat-Section einbinden |
| `src/features/chat/hooks/useAuftragChat.ts` | NEU: Query + Mutation Hook |
| `src/features/chat/ui/AuftragChatSection.tsx` | NEU: Chat-UI Komponente |
| `.lovable/validation-auftrag-chat.md` | NEU: Validierungsdokumentation |

