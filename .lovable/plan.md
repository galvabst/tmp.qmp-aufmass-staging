## Problem
Der Admin-Button und der Cron melden „nichts zu tun", obwohl 17 Bestellungen auf `pending` stehen (T-Shirts, Pullover, Polo, Schlappen, Scanner-Lizenz). Grund:

Die Edge Function `reconcile-stripe-orders` **stürzt sofort beim ersten Stripe-Aufruf ab** mit:
```
event loop error: Error: Deno.core.runMicrotasks() is not supported in this environment
```
Das liegt am Stripe-SDK (`stripe@14.21.0`) — es nutzt Node-Compat-Internas, die in der aktuellen Supabase-Edge-Runtime nicht mehr unterstützt werden. Beim Webhook fällt das nicht auf, weil dort nur `webhooks.constructEventAsync` verwendet wird (rein synchrone Krypto). Sobald aber `stripe.checkout.sessions.retrieve(...)` aufgerufen wird (wie im Reconciler), crasht der Worker — die Function liefert vermutlich noch eine leere/fehlerhafte Antwort, weshalb der Toast nichts zeigt.

## Lösung: Stripe-SDK aus dem Reconciler entfernen

Ich schreibe `supabase/functions/reconcile-stripe-orders/index.ts` so um, dass er **kein Stripe-SDK mehr lädt**, sondern direkt die Stripe-REST-API per `fetch` anspricht. Das ist robust, hat keine Node-Compat-Abhängigkeiten und kann in der Edge-Runtime nicht mehr brechen.

### Konkret
1. Stripe-Import entfernen.
2. Kleine Helper-Funktion `stripeGet(path)`:
   ```ts
   const r = await fetch(`https://api.stripe.com/v1/${path}`, {
     headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
   });
   if (!r.ok) throw new Error(`stripe ${path} → ${r.status} ${await r.text()}`);
   return r.json();
   ```
3. Pro Bestellung:
   - `stripeGet('checkout/sessions/' + session_id + '?expand[]=subscription&expand[]=subscription.latest_invoice')`
   - Wenn `payment_status === 'paid'` → DB auf `paid` updaten (gleiche Felder + Audit-Log wie bisher).
   - Wenn `subscription.latest_invoice.status === 'paid'` (Sammel-Sub) → ebenfalls `paid`.
   - Wenn Session `status === 'expired'` und älter als 24h → `failed`.
4. Die DB-Update-Logik und der Audit-Log-Eintrag bleiben unverändert.
5. Bessere Fehlerausgabe: Pro Bestellung wird der HTTP-Statuscode + Stripe-Fehlertext im JSON-Report mitgeliefert, damit der Admin-Toast aussagekräftig ist.
6. Logs werden mit `[reconciler-v2]` markiert, damit man im Dashboard sofort sieht, dass die neue Version läuft.

### Validierung
- Nach Deploy einmal manuell den Admin-Button drücken bzw. per `curl_edge_functions` triggern.
- Erwartetes Ergebnis: Die 3 frischen Bestellungen vom 06./07. Mai werden auf `paid` gesetzt; ältere expired Sessions auf `failed`.
- Der Edge-Function-Log zeigt **keinen** `runMicrotasks`-Crash mehr.
- DB-Check: `SELECT count(*) FROM contractor_bestellungen WHERE stripe_payment_status='pending' AND created_at > now() - interval '7 days'` → 0.

### Was ich NICHT anfasse
- Den `stripe-webhook` selbst — der funktioniert, weil das neue Webhook-Secret jetzt korrekt ist und keine SDK-Calls passieren, die crashen.
- Den 15-Min-Cron — der ruft denselben Endpoint auf und wird ab Deploy automatisch funktionieren.
- Die Frontend-Komponenten — der Button bleibt wie er ist.
