
## Zielbild (was du danach hast)
- Eine saubere **Login-Seite in dieser App** (E-Mail + Passwort), ohne Zwangs-Redirect zu Sales OS.
- Ein sauberer Flow für **“Passwort festlegen”** (Invite/Recovery-Link) → danach automatisch in die App → Onboarding starten.
- Der bisherige Sales-OS-Session-Transfer über `/auth#access_token=…` bleibt als Option bestehen, aber blockiert niemanden mehr.

## Warum es aktuell “beschissen” wirkt (Root Cause)
1. **Du bist auf `quick-measure-pro.lovable.app` nicht eingeloggt**, daher zeigt die App `AuthRequiredScreen`.
2. `AuthRequiredScreen` schickt dich aktuell stumpf zu **Sales OS (`salesos.lovable.app`)**.
3. Dein Account hat dort **keine Module** → du kommst nicht weiter (Screenshot “Ihnen wurden noch keine Module zugewiesen.”).  
   Das ist kein Onboarding-Problem in dieser App, sondern ein falscher Login-Kanal für Contractors.

Kurz: **Onboarding-Record vorhanden ≠ Browser ist eingeloggt**. Ohne Session kann die App auch nicht “wissen”, dass du berechtigt bist.

## Lösung: “App-eigener Login” + “Passwort-festlegen”-Flow

### A) Neue Seiten (Frontend)
1) **`/login` (neu)**: Login-Formular
- Felder: E-Mail, Passwort
- Button: “Anmelden”
- Link/Button: “Passwort vergessen?” → sendet Reset-Mail (Supabase)
- Optional (zweiter Button, unauffällig): “Mit Sales OS anmelden” (nur als Alternative für interne User)

2) **`/set-password` (neu)**: Passwort festlegen / ändern
- Wird genutzt für Invite/Recovery-Links (wenn User über einen Mail-Link kommt).
- Felder: neues Passwort + Bestätigung
- Aktion: `supabase.auth.updateUser({ password })`
- Danach Redirect nach `/` (App startet Onboarding automatisch)

### B) `/auth` robuster machen (bestehende Seite erweitern)
Aktuell verarbeitet `/auth` nur **Hash-Token** (`#access_token=…&refresh_token=…`).

Wir erweitern `/auth` so, dass es **alle relevanten Supabase-Callback-Fälle** sauber kann:

1) **Hash Flow** (bereits drin):
- `access_token` + `refresh_token` → `setSession()`

2) **PKCE Code Flow** (häufig bei neueren Supabase Email Links):
- Wenn URL `?code=...` hat → `supabase.auth.exchangeCodeForSession(code)`

3) **Typen sauber behandeln**:
- Wenn `type` in Hash/Params `recovery` oder `invite` ist:
  - Session setzen → Redirect zu **`/set-password`**
- Sonst:
  - Session setzen → Redirect zu **`/`**

4) Wenn **keine Tokens/kein Code** vorhanden ist:
- Nicht mehr “geh zu Sales OS”
- Stattdessen: **Hinweis + Button “Zum Login”** (`/login`)

### C) AuthRequiredScreen ändern (bestehende UI)
- Primär: Button “Einloggen” → `/login`
- Sekundär: optional “Mit Sales OS fortfahren” (falls ihr es für interne Rollen weiterhin braucht)
- Text anpassen: “Du bist in dieser App nicht angemeldet …”

### D) Routen ergänzen (App Router)
In `src/App.tsx`:
- `/login` → neue Login Page
- `/set-password` → neue SetPassword Page
- `/auth` bleibt bestehen (erweitert)

### E) Supabase Auth Dashboard: Redirect-URLs korrekt setzen (wichtig!)
Damit Invite/Recovery-Links wirklich auf **diese App** zeigen und nicht “irgendwohin”:
- Supabase Dashboard → Authentication → URL Configuration
- Sicherstellen:
  - **Site URL**: `https://quick-measure-pro.lovable.app`
  - **Additional Redirect URLs** enthalten mindestens:
    - `https://quick-measure-pro.lovable.app/auth`
    - `https://quick-measure-pro.lovable.app/set-password`
    - (optional) `https://quick-measure-pro.lovable.app/login`

Ohne diese Einstellung kann Supabase Links blocken oder auf falsche Domains leiten.

## Umsetzungsschritte (konkret im Repo)

### 1) Neue Pages anlegen
- `src/pages/Login.tsx` (neu)
  - UI mit shadcn Input/Button/Form (react-hook-form + zod)
  - `supabase.auth.signInWithPassword({ email, password })`
  - Fehlerhandling (falsches Passwort, user not found, etc.)
  - “Passwort vergessen?” → `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth' })`

- `src/pages/SetPassword.tsx` (neu)
  - Prüft ob Session vorhanden (sonst “Link abgelaufen → zurück zu Login”)
  - `supabase.auth.updateUser({ password })`
  - Danach `navigate('/')`

### 2) `src/pages/Auth.tsx` erweitern
- Unterstützt:
  - Hash tokens → `setSession`
  - `?code=` → `exchangeCodeForSession`
- Routing-Entscheidung:
  - `type in ['recovery','invite']` → `/set-password`
  - sonst → `/`

### 3) `src/components/ui/AuthRequiredScreen.tsx` ändern
- Entfernt “zwingend Sales OS”
- Button zu `/login`

### 4) `src/App.tsx` Routen erweitern
- Neue Routes: `/login`, `/set-password`

### 5) (Optional, aber empfohlen) Index-Verhalten verfeinern
- Statt nur Screen anzeigen: wenn `!session`, kann direkt `navigate('/login')` passieren (mit `replace: true`)  
  oder Screen mit Button beibehalten (UX-Entscheidung).

## Testplan (End-to-End)
1) **Frischer Browser / Inkognito**
2) `https://quick-measure-pro.lovable.app/login`
3) Mit Contractor-Email + Passwort einloggen
4) Erwartung:
   - Redirect nach `/`
   - OnboardingScreen erscheint (solange DB nicht `ready` + `trainer_freigabe=true`)
5) “Passwort vergessen?” testen:
   - Email eingeben → Reset-Mail kommt
   - Link führt zu `/auth?...` oder `/auth#...`
   - Erwartung: Redirect nach `/set-password`
   - Passwort setzen → Redirect nach `/` → eingeloggt
6) (Falls weiterhin genutzt) Sales-OS-Redirect testen:
   - Sales OS redirect zu `/auth#access_token=…`
   - Erwartung: Session gesetzt → `/`

## Risiken / Edge Cases
- Manche Supabase Links liefern **`code`** statt Hash Tokens → deshalb `exchangeCodeForSession` ergänzen.
- Mobile Browser (iOS) können Storage/Redirects zickig haben → deshalb klare `/login` Fallback-Route.
- Falls Invite/Recovery-Link auf falsche Domain zeigt → Supabase “Redirect URLs” müssen korrigiert werden.

## Sicherheits-Notiz (separat, nicht Blocker für Login)
- Aktuell sind die RLS Policies für `thermocheck.contractor_onboarding` extrem permissiv (SELECT/UPDATE = `true`).  
  Das ist langfristig kritisch und sollte nach dem Login-Fix gehärtet werden (Row Ownership via `profile_id = auth.uid()` + Admin-Ausnahmen über IAM).
