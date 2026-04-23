# Validation: Superadmin Impersonation

**Datum:** 2026-04-23
**Feature:** "Als Techniker einloggen" Button in Admin-Konsole

## Architektur (final)

```
Browser (Admin-UI)
  │ Klick "Als X einloggen"
  ▼
useImpersonation.startImpersonation
  │ supabase.functions.invoke('admin-impersonate', { targetUserId, reason })
  ▼
Edge Function admin-impersonate (verify_jwt = false, manuelle Validierung)
  1. authHeader extrahieren → adminClient.auth.getUser(token)        → adminUserId
  2. adminClient.rpc('is_superadmin', { _user_id: adminUserId })     → 403 wenn false
  3. Body validieren (targetUserId ≠ adminUserId)
  4. adminClient.auth.admin.getUserById(targetUserId)                → targetEmail
  5. adminClient.rpc('log_impersonation', { admin, target, reason }) → audit row
  6. adminClient.auth.admin.generateLink('magiclink', email)         → hashed_token
  7. verifyClient (anon, isolierter Client) .auth.verifyOtp(...)     → session
  8. return { access_token, refresh_token, target_email, log_id }
  ▼
Browser sichert Admin-Session in localStorage, ruft setSession() mit Ziel-Token,
zeigt rotes ImpersonationBanner, redirect "/".
```

## Warum diese Form

| Problem (vorher) | Lösung |
|---|---|
| `userClient.auth.getClaims is not a function` | `getUser(token)` statt `getClaims()` |
| `PGRST106 schema iam not exposed` | `public.is_superadmin()` als SECURITY DEFINER bridge |
| `verifyOtp` überschreibt globale Session des adminClient | `persistSession: false` + separater `verifyClient` (anon) |
| Audit-Log könnte verloren gehen wenn verifyOtp fehlschlägt | Audit ZUERST schreiben, dann Session generieren |
| Audit-Insert braucht Service-Role | Funktion `log_impersonation` ist `SECURITY DEFINER`, GRANT EXECUTE nur für `service_role` |

## DB-Bridge

```sql
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, iam AS $$
  SELECT EXISTS (SELECT 1 FROM iam.user_system_roles WHERE user_id = _user_id AND role = 'superadmin');
$$;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO service_role, authenticated;

CREATE OR REPLACE FUNCTION public.log_impersonation(_admin_user_id uuid, _target_user_id uuid, _reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, iam AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.is_superadmin(_admin_user_id) THEN
    RAISE EXCEPTION 'Forbidden: only superadmins can impersonate';
  END IF;
  INSERT INTO iam.impersonation_log (admin_user_id, target_user_id, reason)
  VALUES (_admin_user_id, _target_user_id, _reason)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_impersonation(uuid, uuid, text) TO service_role;
```

Bestätigt via `pg_proc`: beide Funktionen existieren mit korrekten Signaturen.

## Rollen-Matrix

| Rolle | Sieht Button? | Edge Function akzeptiert? | Audit-Log geschrieben? |
|---|---|---|---|
| superadmin | ✅ via `useHasRole('superadmin')` | ✅ `is_superadmin` true | ✅ |
| admin | ❌ | ❌ 403 | – |
| manager | ❌ | ❌ 403 | – |
| user/techniker | ❌ | ❌ 401 (kein/ungültiges JWT) | – |

## Edge Cases

| Szenario | Verhalten |
|---|---|
| Techniker ohne `profile_id` | Frontend zeigt Toast „Kein verknüpftes Profil" |
| `targetUserId === adminUserId` | 400 „Cannot impersonate yourself" |
| Ziel-User ohne Email | 404 „Target user not found or has no email" |
| `verifyOtp` schlägt fehl | 500 — Audit-Log existiert trotzdem |
| Backup-Session abgelaufen beim „Zurück" | signOut + redirect /login |
| Mehrere Tabs | `storage`-Event hält Banner-State synchron |

## Sicherheits-Garantien

- Service-Role-Key bleibt im Edge-Funktion-Kontext, nie im Browser
- Magic-Link-Token einmalig + kurze Gültigkeit (Supabase Default)
- Banner ist nicht ausblendbar, z-index 9999, sticky top
- Jede Impersonation in `iam.impersonation_log` mit `admin_user_id`, `target_user_id`, `reason`, `started_at`

## Validierungs-Status

- [x] DB-Funktionen existieren (verifiziert via `pg_proc`)
- [x] Edge Function deployed (Version aktualisiert nach `verifyOtp`-Refactor)
- [x] Frontend: Banner global eingehängt, Buttons in List+Detail nur für superadmin
- [ ] **Manuelle UI-Validierung im Browser** durch Superadmin (Klick → Banner → Zurück)

## Known Issues / Workarounds

- Magic-Link-Generierung kann blockiert werden, wenn Auth-Rate-Limits greifen → bei 429 manuell warten
- Wenn der Ziel-User noch nie eingeloggt war, ist das Verhalten abhängig vom Auth-Setup (sollte aber für die Techniker hier alle gelten)
