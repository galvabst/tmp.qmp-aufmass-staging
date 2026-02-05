

# Fix: get_contractor_address verwendet falsches Schema für is_admin()

## Problem

Die RPC-Funktion `public.get_contractor_address` schlägt fehl mit:
```
function thermocheck.is_admin() does not exist
```

### Root Cause
Die Funktion referenziert `thermocheck.is_admin()`, aber `is_admin()` existiert nur in:
- `public.is_admin(user_id uuid DEFAULT auth.uid())` 
- `iam.is_admin()` / `iam.is_admin(_user_id uuid)`

Es gibt **keine** `thermocheck.is_admin()` Funktion!

## Lösung

### Migration: Funktion korrigieren

Die Zeile in `get_contractor_address` ändern von:
```sql
IF auth.uid() != p_profile_id AND NOT thermocheck.is_admin() THEN
```

zu:
```sql
IF auth.uid() != p_profile_id AND NOT public.is_admin() THEN
```

Vollständige korrigierte Funktion:
```sql
CREATE OR REPLACE FUNCTION public.get_contractor_address(p_profile_id uuid)
RETURNS TABLE(
  anschrift_strasse text,
  anschrift_plz text,
  anschrift_ort text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, thermocheck
AS $$
BEGIN
  -- Nur eigene Adresse oder Admin darf andere sehen
  IF auth.uid() != p_profile_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    co.anschrift_strasse,
    co.anschrift_plz,
    co.anschrift_ort
  FROM thermocheck.contractor_onboarding co
  WHERE co.profile_id = p_profile_id
  LIMIT 1;
END;
$$;

-- Sicherstellen dass authenticated-User die Funktion aufrufen können
GRANT EXECUTE ON FUNCTION public.get_contractor_address(uuid) TO authenticated;
```

## Datenfluss nach Fix

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Frontend ruft: supabase.rpc('get_contractor_address', { p_profile_id }) │
│ 2. DB prüft: auth.uid() == p_profile_id? → JA → Zugriff erlaubt            │
│ 3. DB holt: SELECT aus thermocheck.contractor_onboarding                   │
│ 4. Rückgabe: { anschrift_strasse, anschrift_plz, anschrift_ort }           │
│ 5. Frontend: Parst Straße/Hausnummer, merged in State                      │
│ 6. UI: Adressfelder sind gefüllt ✓                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Neue Migration | `thermocheck.is_admin()` → `public.is_admin()` + GRANT EXECUTE |

## Warum der Fehler passiert ist

In der Migration habe ich fälschlicherweise angenommen, dass `is_admin()` im `thermocheck`-Schema existiert – aber laut BEHAVIOUR-Regeln und DB-Struktur ist `public.is_admin()` die korrekte Helper-Funktion für Admin-Checks.

