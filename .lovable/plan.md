

## Fix: "Abmelden"-Button hat keinen onClick-Handler

### Problem

Der "Abmelden"-Button in der Profilansicht ist ein reines `<button>`-Element ohne `onClick`-Handler. Ein Klick darauf tut daher nichts.

### Loesung

Dem Button einen `onClick`-Handler hinzufuegen, der `supabase.auth.signOut()` aufruft und danach die Seite neu laedt (damit der Auth-State zurueckgesetzt wird).

### Technische Aenderung

| Datei | Aenderung |
|---|---|
| `src/components/ProfileView.tsx` | Import von `supabase` hinzufuegen, `onClick`-Handler mit `signOut()` an den Button haengen |

Konkret:
- Import: `import { supabase } from '@/integrations/supabase/client'`
- Handler auf dem Button:

```typescript
onClick={async () => {
  await supabase.auth.signOut();
  toast.info('Abgemeldet');
  window.location.reload();
}}
```

Keine weiteren Aenderungen noetig.

