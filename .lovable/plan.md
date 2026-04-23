

## „Impersonate"-Button für Superadmins (Login als Techniker)

### Was du bekommst

In der Admin-Konsole (Techniker-Liste und Techniker-Detailansicht) erscheint für **Superadmins** ein neuer Button **„Als dieser Techniker einloggen"**. Ein Klick → du bist sofort in der App in der Sicht dieses Technikers, siehst genau das, was er sieht (Aufträge, Boni, Onboarding-Stand, Praxistest etc.). Oben in der App erscheint ein **persistentes rotes Banner**:

> 🔴 Eingeloggt als **Max Mustermann** (Impersonation aktiv) — [Zurück zu Admin]

Ein Klick auf „Zurück zu Admin" → du bist wieder dein eigener Superadmin-Account. Kein Passwort-Tanz, keine zweiten Browser, keine Inkognito-Fenster mehr.

### So funktioniert es technisch (sicher!)

Wir können **nicht** einfach das Passwort des Users umgehen — Supabase erlaubt das nicht client-seitig. Stattdessen nutzen wir das offizielle Pattern: eine **Edge Function generiert per Service-Role-Key ein Magic-Link / Session-Token** für den Ziel-User, und wir signen den Browser direkt damit ein. Das ist die einzige saubere Methode und wird genau so von Tools wie Linear, Stripe, Vercel etc. genutzt.

```text
[Superadmin im Admin-UI]
        │
        │ Klick „Als X einloggen"
        ▼
[Edge Function: admin-impersonate]
   - prüft: Aufrufer ist superadmin (via JWT + iam-Tabelle)
   - logt Audit-Eintrag (wer, wen, wann, warum)
   - generiert magic-link Token für Ziel-User
   - speichert Original-Refresh-Token verschlüsselt zurück
        │
        ▼
[Frontend]
   - sichert die aktuelle (Admin-) Session in sessionStorage
   - setzt neue Session mit dem Token vom Edge
   - zeigt rotes Impersonation-Banner
   - bei „Zurück": stellt Admin-Session wieder her
```

### Schritte im Detail

**1. Audit-Log-Tabelle (DB-Migration)**
Neue Tabelle `iam.impersonation_log` mit: `admin_user_id`, `target_user_id`, `started_at`, `ended_at`, `reason` (optional). RLS: nur Superadmins dürfen lesen, Schreiben passiert via SECURITY DEFINER Edge-Function. Damit ist nachvollziehbar wer wann auf wen geschaltet hat — wichtig für DSGVO und interne Compliance.

**2. Edge Function `admin-impersonate`**
- Eingang: `{ targetUserId: uuid, reason?: string }`
- Validiert das JWT des Aufrufers
- Prüft via Service-Role: `iam.user_system_roles` → muss `superadmin` enthalten (nur Superadmin, NICHT admin/manager — bewusst restriktiv)
- Schreibt Audit-Eintrag
- Erzeugt via `supabase.auth.admin.generateLink({ type: 'magiclink', email: targetEmail })` einen einmaligen Token
- Gibt `{ access_token, refresh_token }` für den Ziel-User zurück (über `verifyOtp` extrahiert), **niemals direkt das Passwort**

**3. Frontend-Hook `useImpersonation`**
- `startImpersonation(targetUserId, reason)`: ruft Edge Function, sichert aktuelle Session in `sessionStorage` unter `__admin_session_backup`, setzt neue Session mit `supabase.auth.setSession(...)`, redirect auf `/`
- `stopImpersonation()`: liest Backup, setzt zurück, redirect auf `/admin`
- `useImpersonationState()`: Boolean ob aktuell impersoniert wird + Original-Admin-Email für Banner-Anzeige

**4. UI-Komponenten**
- `ImpersonationBanner.tsx` — global in `App.tsx` eingehängt, sticky oben, rote Hintergrundfarbe (destructive token), zeigt Ziel-Username + Original-Admin-Email + „Zurück"-Button
- Button **„Als Techniker einloggen"** (Icon: `UserCog` von lucide) in:
  - `ContractorListView` Karten (kleines Icon rechts neben „Status")
  - `ContractorDetailView` Header
- Sichtbar nur wenn `useHasRole('superadmin') === true`
- Optional: Dialog mit Pflicht-Eingabefeld „Grund" (z. B. „Support-Ticket #123") — landet im Audit-Log

**5. Sicherheits-Garantien**
- Nur **superadmin** darf impersonieren (admin/manager sehen den Button gar nicht erst und Edge Function lehnt sie ab)
- Magic-Link-Token läuft nach kurzer Zeit ab (Supabase default, nicht verlängerbar)
- Jede Impersonation wird geloggt — der Audit-Log ist später für ein Admin-Sub-Page sichtbar
- Banner ist **nicht ausblendbar** und nutzt z-index der höchsten Ebene, damit du nie versehentlich vergisst, dass du fremd unterwegs bist
- Bei Schreib-Aktionen passiert nichts Besonderes — du agierst als der Techniker, also wird auch alles dem Techniker zugerechnet (das ist gewollt für Tests; durch das Audit-Log ist es trotzdem rückverfolgbar)

### Was es NICHT ist

- Kein „Vorschau-Modus" mit gefakten Daten — du bist wirklich der User. Das ist genau, was du willst, aber: schreib nicht versehentlich Mist in echte Auftragsfelder.
- Keine Passwort-Anzeige oder -Änderung. Wir umgehen Passwörter, brechen sie nicht.
- Funktioniert nicht für Aufrufer ohne `superadmin` — auch normale Admins können sich nicht einloggen, nur du.

### Technisch betroffen

- **DB-Migration**: `iam.impersonation_log` Tabelle + RLS + Audit-Funktion
- **Neue Edge Function**: `supabase/functions/admin-impersonate/index.ts`
- **Frontend neu**:
  - `src/hooks/useImpersonation.ts`
  - `src/components/ImpersonationBanner.tsx`
- **Frontend angepasst**:
  - `src/App.tsx` — Banner global einbinden
  - `src/features/contractors/ui/ContractorListView.tsx` — Button pro Karte
  - `src/features/contractors/ui/ContractorDetailView.tsx` — Button im Header

### Was ich brauche bevor's losgeht

Eine kurze Bestätigung dass der Button **nur** für `superadmin` (nicht für `admin` / `manager`) erscheinen soll — das ist mein default, aber sag Bescheid falls du das anders willst.

