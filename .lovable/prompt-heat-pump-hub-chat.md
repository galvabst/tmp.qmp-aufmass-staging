# Heat Pump Hub: Auftragschat-Integration

## Kontext

Im Contractor-Portal (Quick Measure Pro) wurde ein auftragsbezogener Chat implementiert. Contractors können pro Auftrag Nachrichten/Rückfragen schreiben. Diese Nachrichten müssen im Heat Pump Hub sichtbar und beantwortbar sein.

## Datenbank (bereits vorhanden!)

Die Tabelle existiert bereits im `thermocheck`-Schema:

```sql
thermocheck.auftrag_nachrichten
├── id              uuid PK
├── auftrag_id      uuid FK → thermocheck_auftraege(id) ON DELETE CASCADE
├── autor_id        uuid FK → profiles(id) — auth.uid() des Absenders
├── inhalt          text NOT NULL
├── erstellt_am     timestamptz DEFAULT now()
├── aktualisiert_am timestamptz DEFAULT now()
```

### RLS-Policies

- **SELECT**: `is_innendienst()` sieht alle Nachrichten (admin, superadmin, manager)
- **INSERT**: `autor_id = auth.uid()` UND `is_innendienst()` → Admins können in jeden Auftrag schreiben
- **UPDATE**: Nur eigene Nachrichten (`autor_id = auth.uid()`)
- **DELETE**: Nur `is_innendienst()` kann löschen

### Helper-Funktion

`is_innendienst()` prüft ob der User die Rolle `admin`, `superadmin` oder `manager` in `iam.user_system_roles` hat.

## Frontend-Implementierung (Heat Pump Hub)

### 1. Query: Nachrichten laden

```typescript
// Über den thermocheck-Schema-Client oder REST API
const { data } = await supabaseTC
  .from('auftrag_nachrichten')
  .select('id, auftrag_id, autor_id, inhalt, erstellt_am')
  .eq('auftrag_id', auftragId)
  .order('erstellt_am', { ascending: true });

// Autor-Namen aus profiles (public schema) resolven
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, vorname, nachname')
  .in('id', autorIds);
```

### 2. Mutation: Nachricht senden

```typescript
const { error } = await supabaseTC
  .from('auftrag_nachrichten')
  .insert({
    auftrag_id: auftragId,
    autor_id: user.id, // auth.uid()
    inhalt: text.trim(),
  });
```

### 3. UI-Integration

Im Auftragsdetail (wo der Innendienst den Thermocheck-Auftrag sieht):
- Chat-Bereich mit Nachrichten-Bubbles (chronologisch)
- Eigene Nachrichten rechts, Contractor-Nachrichten links
- Eingabefeld zum Antworten
- Autor-Name über jeder fremden Nachricht anzeigen
- Zeitstempel unter jeder Nachricht

### 4. Wichtige Hinweise

- `autor_id` muss IMMER `auth.uid()` sein (RLS erzwingt das)
- Der thermocheck-Schema-Client muss verwendet werden (nicht der public-Client)
- Nachrichten haben ein CHECK constraint: `char_length(inhalt) > 0`
- Frontend-Limit: max. 2000 Zeichen empfohlen
- Polling (z.B. alle 30s) oder Realtime-Subscription für neue Nachrichten
