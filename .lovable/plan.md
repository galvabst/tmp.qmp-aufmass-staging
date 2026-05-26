
# Subscription-Tracker für Thermo-Checker

## Ziel

Pro aktiver Subscription (nicht pro Bestellung) den vollen Lifecycle inkl. jedes Monats-Events tracken, damit Innendienst & Techniker sehen, wann eine Abbuchung scheitert, und der Zugang automatisch reguliert wird.

## Datenbankstruktur (2 Tabellen, normalisiert)

```text
contractor_subscriptions          (1 Zeile pro Stripe-Subscription)
└── contractor_subscription_events (n Zeilen pro Subscription, je Webhook-Event)
```

### `thermocheck.contractor_subscriptions`
- `id` (uuid, PK)
- `onboarding_id` (FK → contractor_onboarding.id)
- `stripe_subscription_id` (text, unique)
- `stripe_customer_id` (text)
- `produkt_key` (text)
- `status` ENUM `subscription_status`: `active | past_due | unpaid | canceled | incomplete | incomplete_expired | paused | trialing`
- `current_period_start`, `current_period_end` (timestamptz)
- `cancel_at_period_end` (bool)
- `canceled_at` (timestamptz, nullable)
- `latest_invoice_id`, `latest_invoice_status` (text)
- `last_payment_failed_at`, `last_payment_failed_reason` (text)
- `last_payment_succeeded_at` (timestamptz)
- `consecutive_failures` (int, default 0) — wird bei jedem `invoice.paid` resettet
- `access_state` ENUM `subscription_access_state`: `ok | warning | blocked` (abgeleitet, per Trigger gepflegt)
- `erstellt_am`, `aktualisiert_am`

### `thermocheck.contractor_subscription_events`
- `id` (uuid, PK)
- `subscription_id` (FK → contractor_subscriptions.id, cascade)
- `stripe_event_id` (text, unique → Idempotenz)
- `event_type` (text, z. B. `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`)
- `invoice_id`, `invoice_status` (text)
- `amount_brutto` (numeric)
- `failure_reason` (text)
- `period_start`, `period_end` (timestamptz)
- `raw_payload` (jsonb)
- `erstellt_am`

→ Damit ist jeder Monat als eigene Zeile sichtbar (`okay, geklappt / nicht geklappt`), genau wie gewünscht.

### Trigger-Logik
- `on insert event` → setzt parent `contractor_subscriptions.status / consecutive_failures / access_state` neu.
- `access_state`-Mapping:
  - `active` → `ok`
  - `past_due` oder `cancel_at_period_end=true` → `warning`
  - `unpaid | canceled | incomplete_expired` → `blocked`

## Webhook-Erweiterung (`stripe-webhook`)

Neue Event-Handler:
- `customer.subscription.created` → upsert Subscription
- `customer.subscription.updated` → sync Status, Perioden, `cancel_at_period_end`
- `customer.subscription.deleted` → status=`canceled`
- `invoice.paid` → event-row anlegen (success), parent-status auf `active`, `consecutive_failures=0`, `last_payment_succeeded_at`
- `invoice.payment_failed` → event-row anlegen (failure), parent-status auf `past_due/unpaid`, increment `consecutive_failures`

Mapping `onboarding_id`: über bestehende `contractor_bestellungen.stripe_subscription_id` (initialer Kauf).

Idempotenz via `stripe_event_id` Unique-Index.

## Zugangskontrolle (App-Verhalten)

Neuer Hook `useSubscriptionAccess()` liest den aggregierten worst-case `access_state` aller aktiven Subscriptions des Technikers:

| access_state | Verhalten |
|---|---|
| `ok` | nichts |
| `warning` | gelbes Banner im Hub: "Dein Abo läuft am … aus. Bitte verlängern, sonst wird der Account gesperrt." + Button zum Stripe-Customer-Portal |
| `blocked` | Fullscreen-Modal (nicht schließbar) auf allen App-Seiten: "Dein Abo ist abgelaufen / Zahlung fehlgeschlagen. Bitte verlängern, bevor du den nächsten Auftrag machen kannst." + Portal-Button. Pool/Aufträge nicht annehmbar (server-side check in `accept_order` RPC). |

## Admin-Sicht

Neuer Tab/Block im AdminDashboard: **Subscription-Health**
- Tabelle aktiver Techniker mit Subscriptions im Status `past_due/unpaid/canceled/warning/blocked`
- Spalten: Techniker, Produkt, Status, letzter Fehlversuch, `consecutive_failures`, nächste Periode
- Aktionen: Customer-Portal-Link kopieren, manueller Sync-Button
- Drill-down: Klick auf Subscription → Event-Historie (alle Monate mit grünem/rotem Punkt)

## Reconcile (Edge Function erweitern)

`reconcile-stripe-orders` bekommt `mode=subscriptions`:
- Listet alle `contractor_subscriptions` mit `status ∈ {active, past_due, unpaid, trialing, incomplete}`
- Holt `GET /v1/subscriptions/{id}` + `latest_invoice`
- Synct Felder & legt fehlende Events nach
- Schreibt `audit_log`

### pg_cron
Täglich um 03:00 Europe/Berlin → `mode=subscriptions`.
Plus manueller Button im Admin (analog `StripeReconcileButton`).

## Roll-out / Backfill

Einmaliger Backfill-Lauf nach Deploy:
- Für jede `contractor_bestellungen` mit `stripe_subscription_id IS NOT NULL` → Subscription bei Stripe abrufen, Tabelle befüllen, letzte 12 Invoices als Events einlesen.

## Technische Details

- ENUMs nativ in Postgres (`subscription_status`, `subscription_access_state`) gemäß DB-Standard.
- RLS:
  - Techniker: `SELECT` eigene Rows via `onboarding_id` ↔ `profile_id`.
  - Innendienst: voll via `thermocheck.is_innendienst()`.
- SECURITY DEFINER RPCs:
  - `sync_subscription_from_stripe(_subscription_id text)` für manuellen Sync-Button.
  - `block_check_for_order_accept(_onboarding_id uuid)` zur server-seitigen Annahme-Sperre.
- Edge Functions: nur Service-Role, keine Client-Direktinserts.
- Defensive Webhook-Verarbeitung: jedes Event in Try/Catch, Idempotenz via `stripe_event_id`.

## Liefer-Reihenfolge

1. Migration: ENUMs, Tabellen, Trigger, RLS, RPCs
2. `stripe-webhook` Handler-Erweiterung + Idempotenz
3. `reconcile-stripe-orders` `mode=subscriptions` + Backfill-Script
4. `useSubscriptionAccess` Hook + Warning-Banner + Blocked-Modal + accept-order Gate
5. Admin "Subscription-Health" Panel + Event-Historie
6. pg_cron Daily Job
7. Validierungs-Doc `.lovable/validation-subscription-tracker.md`

## Offen / nicht enthalten

- Kein automatisches Mahnwesen / E-Mail-Versand (kann später als separate Edge Function ergänzt werden — sag Bescheid, wenn das mit rein soll).
