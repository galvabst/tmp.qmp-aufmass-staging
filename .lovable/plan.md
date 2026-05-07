## Was bereits erledigt ist
`STRIPE_WEBHOOK_SECRET` wurde aktualisiert. Neue Stripe-Webhooks ab jetzt werden wieder verifiziert und verarbeitet — die Hauptursache („No signatures found matching the expected signature") ist behoben.

## Ziel
Damit ein abgelaufenes/rotiertes Webhook-Secret oder ein Stripe-Ausfall **nie wieder** dazu führen kann, dass Bestellungen permanent auf `pending` hängen bleiben, baue ich einen **selbstheilenden Reconciler**, der Bestellungen direkt bei Stripe nachprüft.

## Umsetzung

### 1. Neue Edge Function `reconcile-stripe-orders`
- Lädt alle `contractor_bestellungen` mit `stripe_payment_status = 'pending'` aus den letzten 30 Tagen, die eine `stripe_session_id` haben.
- Für jede Bestellung: `stripe.checkout.sessions.retrieve(session_id)` aufrufen.
  - Wenn `payment_status = 'paid'` → Bestellung auf `paid` setzen (mit `paid_at`, `stripe_payment_intent_id`, `stripe_subscription_id`, `stripe_customer_id`).
  - Wenn Session `expired` und älter als 24h → `failed` setzen.
- Zusätzlich: für Subscriptions, deren `stripe_subscription_id` bekannt ist, `stripe.subscriptions.retrieve` und `latest_invoice` prüfen → bei `paid` ebenfalls aktualisieren.
- Identische Update-Logik wie der Webhook (gleiche Felder, gleiche Audit-Log-Einträge mit `actor_name = 'reconciler'`).
- Liefert JSON-Report: `{ checked, updated_to_paid, updated_to_failed, errors }`.

### 2. Automatischer 15-Minuten-Cron
- `pg_cron` + `pg_net` Extensions sicherstellen.
- Cron-Job per `INSERT` (nicht Migration, da projekt­spezifische URL+Anon-Key) registriert die Function alle 15 Min.

### 3. Manueller Admin-Button
- Im Admin-Bereich (`AdminDashboardView` oder Management-Hub) ein kleiner Button **„Stripe-Bestellungen abgleichen"**.
- Ruft `reconcile-stripe-orders` per `supabase.functions.invoke` auf, zeigt das Ergebnis als Toast.
- Sichtbar nur für `is_innendienst()`.

### 4. Einmaliger Initial-Run
- Direkt nach Deployment einmal manuell triggern, damit die 3 aktuell hängenden Bestellungen (T-Shirt/Poloshirt) nachgezogen werden.

## Technische Details
- Function-Name: `supabase/functions/reconcile-stripe-orders/index.ts`
- `verify_jwt = false` in `config.toml` (wird vom Cron ohne User-Kontext aufgerufen). Schutz: Function prüft einen internen Header `x-reconcile-token` (Secret) bei automatischen Aufrufen, oder Service-Role-Key bei Admin-UI-Aufrufen.
- Verwendet `STRIPE_SECRET_KEY` und `SUPABASE_SERVICE_ROLE_KEY` (beide bereits vorhanden).
- Idempotent: Nur Bestellungen mit `stripe_payment_status = 'pending'` werden angefasst — Mehrfach-Runs sind ungefährlich.
- Audit-Log-Eintrag pro Update mit `action_type = 'reconciled_paid'` / `'reconciled_failed'`.

## Ergebnis
- Webhook bleibt der primäre Pfad (sofort, latenzarm).
- Reconciler ist das Sicherheitsnetz: spätestens nach 15 Min landet jede tatsächlich bezahlte Bestellung auf `paid`, auch wenn Webhooks komplett ausfallen.
- Admin kann jederzeit manuell triggern, falls etwas dringend ist.
