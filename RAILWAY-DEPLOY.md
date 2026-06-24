# Railway-Test-Deploy ("Bruder") — qmp-Aufmaß

Separater Live-Test des **gehärteten Aufmaß-Stands**, getrennt vom Lovable-Prod-Betrieb.
Lovable deployt nur **`main`** → dieser Branch/dieses Repo wird von Lovable **NICHT** angefasst.

## Was drin ist
- Vite-React-SPA. `Dockerfile` baut (`npm run build`) und serviert `dist/` statisch
  mit SPA-Fallback (für Client-Routen wie `/thermocheck/aufmass/:auftragId`).
- Supabase-URL + anon-Key sind im Client **hardcodiert** (öffentlich) → **kein Build-Secret nötig**.
- Prod-Build → der KI-Foto-Check läuft **immer echt** (kein Dev-Mock).

## Railway einrichten (einmalig)
1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Repo **`quick-measure-pro`** wählen → bei **Branch** den Test-Branch
   (z. B. `railway-staging`) auswählen — **NICHT `main`**.
3. Railway erkennt das `Dockerfile` automatisch (Builder = Dockerfile).
4. Deploy starten. Railway vergibt eine `*.up.railway.app`-URL.

## Wichtig
- **Backend bleibt dasselbe Supabase** (`keplsvhudmfaagixttql`) wie Prod — der Test-Deploy
  schreibt also in dieselbe DB. Zum Spielen den Test-Auftrag `9ca62e24…` nutzen,
  **keinen echten Final-Submit** auf Kunden-Aufträge (irreversibel + autarc-Patch).
- Edge-Functions/Migrationen laufen serverseitig (Supabase) — sind unabhängig vom
  Frontend-Deploy. Für den scharfen Foto-Check muss `aufmass-foto-check` deployt +
  `GEMINI_API_KEY` (pay-as-you-go) gesetzt sein (ist es).
- `verify_jwt=true` der Functions → der Nutzer muss in der App eingeloggt sein.

## Updaten
Neue Commits auf den Test-Branch pushen → Railway re-deployt automatisch.
