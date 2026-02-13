

## Forum fuer ThermoCheck-Contractor

### Status: IMPLEMENTIERT ✅

### Zusammenfassung

Ein neuer "Forum"-Tab in der BottomNav, in dem alle freigeschalteten Contractor (onboarding_status = 'ready') Fragen stellen und beantworten koennen. Antworten von Trainern (is_trainer = true) werden visuell hervorgehoben und koennen als "akzeptierte Antwort" markiert werden.

### Implementierte Komponenten

**Datenbank:**
- `thermocheck.contractor_onboarding.is_trainer` (boolean, default false)
- `thermocheck.contractor_forum_threads` -- Fragen/Threads
- `thermocheck.contractor_forum_antworten` -- Antworten
- RLS: Nur ready Contractors + Admins, serverseitige Trainer-Pruefung
- Helper-Funktionen: `thermocheck.is_ready_contractor()`, `thermocheck.is_trainer()`

**Frontend:**
- `src/features/forum/ui/ForumView.tsx` -- Hauptansicht mit Filter (Alle/Unbeantwortete)
- `src/features/forum/ui/ForumThreadCard.tsx` -- Thread-Vorschau
- `src/features/forum/ui/ForumThreadDetail.tsx` -- Detailansicht + Antwort-Eingabe
- `src/features/forum/ui/ForumNewThread.tsx` -- Neue Frage erstellen
- `src/features/forum/ui/ForumAntwortCard.tsx` -- Antwort-Karte (Trainer hervorgehoben)
- `src/features/forum/ui/TrainerBadge.tsx` -- Visuelles Badge
- `src/features/forum/hooks/useForumThreads.ts`
- `src/features/forum/hooks/useForumAntworten.ts`
- `src/features/forum/hooks/useCreateThread.ts`
- `src/features/forum/hooks/useCreateAntwort.ts`

**Navigation:**
- BottomNav: 6 Tabs (Pool, Buchungen, Aktiv, Pruefung, Forum, Profil)
- Icons auf 18px, Labels auf 9px fuer Mobile-Kompatibilitaet

### Phase 2 (spaeter)
- Push-Benachrichtigungen bei neuen Fragen
- Akzeptierte Antwort markieren (UI-Button)
- Realtime-Subscriptions
