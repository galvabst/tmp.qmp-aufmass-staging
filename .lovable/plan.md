

# Fix: Einheitlicher Header für Nachrichten & Forum

## Problem
Der orange Gradient-Header wurde komplett entfernt statt nur bereinigt. Jetzt fehlt die visuelle Einheitlichkeit mit allen anderen Views (Pool, Buchungen, Aktiv, Prüfung).

## Lösung
Den Standard-Header mit orange Gradient + Galvanek Logo in `MessagesAndForumView.tsx` einbauen -- genau wie bei ReviewView, BookingsView etc. Die Sub-Tabs (Nachrichten/Forum) kommen direkt darunter.

### Änderungen

**`src/features/chat/ui/MessagesAndForumView.tsx`**:
- Orange Gradient-Header oben einfügen: Titel "Nachrichten", Untertitel mit Anzahl, Logo rechts (`GalvanekLogo size="sm" variant="white"`)
- Sub-Tabs bleiben direkt unter dem Header
- Wrapper bekommt `min-h-screen bg-background`

**`src/features/forum/ui/ForumView.tsx`**:
- Bleibt wie jetzt (kompakte Toolbar ohne eigenen Header) -- korrekt als Sub-Tab-Content

Das Logo wird mit `size="sm"` verwendet (wie in ReviewView), was `h-8` ist und problemlos in den Header passt ohne abgeschnitten zu werden.

