

## Fix: Public Wrapper fuer book_coaching_ride erstellen

### Problem
Die Fehlermeldung sagt alles: **"Could not find the function public.book_coaching_ride(p_auftrag_id) in the schema cache"**

Die Funktion `book_coaching_ride` existiert nur im `thermocheck`-Schema. Das Frontend ruft aber `supabase.rpc('book_coaching_ride')` auf, was im `public`-Schema sucht. Es fehlt ein Public Wrapper -- genau wie er fuer `accept_pool_order` existiert.

### Loesung
Eine neue SQL-Migration mit einem Public Wrapper nach dem gleichen Muster wie `accept_pool_order`:

```sql
CREATE OR REPLACE FUNCTION public.book_coaching_ride(p_auftrag_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN thermocheck.book_coaching_ride(p_auftrag_id);
END;
$$;
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Neue SQL-Migration | Public Wrapper `public.book_coaching_ride` der an `thermocheck.book_coaching_ride` delegiert |

### Keine Frontend-Aenderung noetig
Der Hook `useCoachingSlots.ts` ruft bereits `supabase.rpc('book_coaching_ride', ...)` auf -- das ist korrekt und funktioniert sobald der Public Wrapper existiert.

