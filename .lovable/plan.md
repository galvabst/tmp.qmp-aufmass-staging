
## Was passiert gerade (warum du “Kein Contractor-Zugang” siehst, obwohl der Datensatz existiert)

- In deiner DB existiert der Datensatz **thermocheck.contractor_onboarding** für die User-ID `e9e3e91a-bf72-4350-b110-8526292fb6a8` (E-Mail `loloy47164@azeriom.com`). Das ist korrekt.
- Die App prüft das aber über eine RPC-Function und ruft aktuell diese URL auf:

  `POST /rest/v1/rpc/get_my_contractor_onboarding`

- **Ohne Schema-Angabe** sucht PostgREST standardmäßig im **public**-Schema nach der Function.
- Deine Function heißt aber **thermocheck.get_my_contractor_onboarding()** (liegt im `thermocheck`-Schema).
- Ergebnis: PostgREST findet in `public` keine Function → **404 / PGRST202** (genau das steht auch in den Logs: „Searched for public.get_my_contractor_onboarding … no matches“).
- Unser Hook interpretiert diesen 404 fälschlich als “kein Datensatz” und zeigt dann die “Contractor Onboarding wurde noch nicht angelegt”-UI.

Kurz: **Der Datensatz ist da – die App fragt nur am falschen Ort nach (public statt thermocheck).**

---

## Ziel (Fix)
- Die App soll den vorhandenen Datensatz zuverlässig finden und dann (da Status aktuell `invited/neu_angelegt`) direkt ins Onboarding gehen.
- Zusätzlich soll die UI nicht mehr “Datensatz fehlt” sagen, wenn in Wahrheit die RPC-Function nur falsch erreichbar ist.

---

## Lösung, die am meisten Sinn macht (robust, ohne Dashboard-Klicks)
Wir machen die RPC-Function im `public`-Schema verfügbar (Wrapper), damit der bestehende Endpoint `/rest/v1/rpc/get_my_contractor_onboarding` funktioniert, ohne dass wir API-Schema-Header setzen oder “Exposed Schemas” im Supabase-Dashboard zwingend brauchen.

### Warum Wrapper besser ist als “Schema-Header + Exposed Schemas”
- Schema-Header (`Content-Profile: thermocheck`) funktionieren nur, wenn `thermocheck` in Supabase “Exposed Schemas” korrekt konfiguriert ist.
- Wrapper in `public` funktioniert **immer**, weil PostgREST standardmäßig `public` kann.
- Wir behalten trotzdem die SSOT-Logik in `thermocheck.get_my_contractor_onboarding()`.

---

## Umsetzung (konkret)

### 1) DB-Migration: Public-Wrapper Function anlegen
Neue SQL-Migration (über Lovable/Supabase Migration Tool), die Folgendes erstellt:

- `public.get_my_contractor_onboarding()` mit identischer Return-Struktur
- intern: `SELECT * FROM thermocheck.get_my_contractor_onboarding();`
- `GRANT EXECUTE` für `authenticated`

Ergebnis: Der bestehende Call auf `/rest/v1/rpc/get_my_contractor_onboarding` findet jetzt eine Function im `public`-Schema.

### 2) Frontend: Hook `useContractorOnboardingStatus` reparieren
Aktuell macht der Hook einen manuellen `fetch()` auf `/rest/v1/rpc/...` und “schluckt” 404/403 als “kein Record”.

Wir ändern den Hook so, dass er:
- entweder direkt `supabase.rpc('get_my_contractor_onboarding')` nutzt (bevorzugt, weil sauberer als hardcoded URL+Key),
- und Fehler sauber unterscheidet:
  - **“kein Record”** = 200 + leeres Ergebnis
  - **“RPC kaputt / nicht erreichbar”** = echte Fehlermeldung (nicht als “kein Onboarding” maskieren)

### 3) UI: Fehlermeldung entkoppeln (damit es nicht mehr verwirrt)
In `Index.tsx` (oder in einem kleinen UI-Screen) unterscheiden wir:
- “Kein Contractor-Onboarding-Datensatz” (echter Fall)
vs.
- “Technischer Fehler: Onboarding-Status konnte nicht geladen werden” (RPC/Misconfig)

Damit bekommst du künftig nicht mehr die falsche Aussage “nicht angelegt”, wenn es in Wahrheit ein API/RPC-Problem ist.

---

## Testplan (End-to-End, Published)
1) Auf `https://quick-measure-pro.lovable.app/login` einloggen
2) Danach auf `/`:
   - Erwartung: **nicht** mehr “Kein Contractor-Zugang”
   - Stattdessen: **OnboardingScreen** (weil Status `invited/neu_angelegt` und nicht `ready`)
3) Browser-Konsole prüfen:
   - Erwartung: keine `PGRST202`/404 “public.get_my_contractor_onboarding not found” mehr
4) (Optional) Direkt-Check:
   - In Network: RPC-Call liefert 200 und enthält `onboarding_status`, `trainer_freigabe`, etc.

---

## Betroffene Dateien / Artefakte
- DB: neue Migration für `public.get_my_contractor_onboarding()`
- Frontend:
  - `src/hooks/useContractorOnboardingStatus.ts` (RPC-Aufruf + Error-Handling)
  - `src/pages/Index.tsx` (UI-Entscheidung: “kein Record” vs “technischer Fehler”)

---

## Risiko / Nebenwirkungen
- Sehr gering: Es ist eine reine Korrektur, damit der existierende Datensatz gefunden wird.
- Sicherheit: Die Funktion liefert nur Daten für `auth.uid()`; ohne Login kommt nichts zurück. Execute bleibt auf `authenticated`.

---

## Optional (später, nicht nötig für den Fix)
- `thermocheck` in Supabase “Exposed Schemas” aufnehmen und dann langfristig schema-spezifische Calls nutzen. Der Wrapper bleibt trotzdem praktisch als stabiler Fallback.
