

## Forum fuer ThermoCheck-Contractor

### Zusammenfassung

Ein neuer "Forum"-Tab in der BottomNav, in dem alle freigeschalteten Contractor (onboarding_status = 'ready') Fragen stellen und beantworten koennen. Antworten von Trainern (is_trainer = true) werden visuell hervorgehoben und koennen als "akzeptierte Antwort" markiert werden.

---

### 1. Datenbank-Aenderungen (thermocheck-Schema)

**1a. Neues Feld in contractor_onboarding:**

```sql
ALTER TABLE thermocheck.contractor_onboarding
  ADD COLUMN is_trainer BOOLEAN NOT NULL DEFAULT false;
```

Trainer-Status wird manuell von Admins gesetzt (z.B. ueber die Admin-Oberflaeche oder direkt in der DB).

**1b. Neue Tabelle: contractor_forum_threads**

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | Thread-ID |
| autor_profile_id | uuid FK profiles | Wer hat die Frage gestellt |
| titel | text NOT NULL | Kurzer Titel der Frage |
| inhalt | text NOT NULL | Ausfuehrliche Beschreibung |
| erstellt_am | timestamptz | Erstellungszeitpunkt |
| aktualisiert_am | timestamptz | Letzte Aenderung |
| ist_geloest | boolean | Wurde die Frage beantwortet/geloest |
| akzeptierte_antwort_id | uuid FK | Verweis auf die Trainer-Antwort, die als Loesung markiert wurde |

**1c. Neue Tabelle: contractor_forum_antworten**

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | Antwort-ID |
| thread_id | uuid FK | Zugehoeriger Thread |
| autor_profile_id | uuid FK profiles | Wer hat geantwortet |
| inhalt | text NOT NULL | Antworttext |
| ist_trainer_antwort | boolean | true wenn Autor zum Zeitpunkt der Antwort Trainer war |
| erstellt_am | timestamptz | Erstellungszeitpunkt |
| aktualisiert_am | timestamptz | Letzte Aenderung |

**1d. RLS-Policies:**

- SELECT: Alle authentifizierten User mit contractor_onboarding-Eintrag und onboarding_status = 'ready' koennen lesen
- INSERT: Gleiches Kriterium -- nur freigeschaltete Contractor koennen schreiben
- UPDATE: Nur eigene Beitraege oder Admins
- DELETE: Nur Admins

**1e. ENUM fuer spaetere Erweiterung (optional):**

Aktuell kein ENUM noetig -- die Struktur ist ein einfacher Q&A-Feed ohne Kategorien.

---

### 2. Navigation anpassen

**BottomNav erweitern:**

- Neuer Tab-Typ `'forum'` zum `Tab`-Union-Type hinzufuegen
- Icon: `MessageCircle` aus lucide-react
- Label: "Forum"
- Badge: Anzahl ungelesener/neuer Threads (optional, Phase 2)
- Position: Zwischen "Pruefung" und "Profil" einfuegen

Da 6 Tabs auf Mobile eng werden: Icons leicht verkleinern und Labels auf 9px reduzieren, damit alles passt.

---

### 3. UI-Komponenten (Feature-basiert)

Neue Dateien unter `src/features/forum/`:

```text
src/features/forum/
  ui/
    ForumView.tsx          -- Hauptansicht (Thread-Liste)
    ForumThreadCard.tsx    -- Vorschau-Karte pro Frage
    ForumThreadDetail.tsx  -- Detailansicht mit Antworten
    ForumNewThread.tsx     -- Formular: Neue Frage stellen
    ForumAntwortCard.tsx   -- Einzelne Antwort (mit Trainer-Badge)
    TrainerBadge.tsx       -- Visuelles Badge "Trainer"
  hooks/
    useForumThreads.ts     -- Threads laden (React Query)
    useForumAntworten.ts   -- Antworten laden
    useCreateThread.ts     -- Neuen Thread erstellen
    useCreateAntwort.ts    -- Antwort schreiben
```

**Trainer-Antworten visuell hervorgehoben:**
- Gruener Rahmen / farbiger Hintergrund
- Badge "ThermoCheck-Trainer" neben dem Namen
- Wenn vom Thread-Ersteller oder Admin als "akzeptierte Antwort" markiert: Gruener Haken + "Akzeptierte Antwort" Label, wird an die Spitze der Antworten gepinnt

**Nicht-Trainer-Antworten:**
- Normales Styling ohne besondere Hervorhebung

---

### 4. Index.tsx anpassen

- `activeTab` State um `'forum'` erweitern
- Neue View `ForumView` einbinden, wenn `activeTab === 'forum'`
- Forum ist nur sichtbar fuer freigeschaltete Contractor (nach Onboarding)

---

### 5. Trainer-Inbox / Benachrichtigung

Phase 1 (jetzt): Trainer sehen im Forum-Tab einen Filter "Unbeantwortete Fragen", der Threads ohne Trainer-Antwort anzeigt.

Phase 2 (spaeter): Push-Benachrichtigungen oder Realtime-Subscriptions, wenn neue Fragen gestellt werden.

---

### Technische Details

- Alle Queries ueber `supabase` Client mit Schema-Prefix `thermocheck`
- React Query fuer Caching und Optimistic Updates
- `is_trainer`-Feld wird beim Erstellen einer Antwort serverseitig geprueft (nicht nur im Frontend)
- Markdown-Support fuer Fragen und Antworten (react-markdown ist bereits installiert)
- Sortierung: Neueste Fragen zuerst, Trainer-Antworten innerhalb eines Threads oben gepinnt

