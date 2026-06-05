## Problem (Evidence)

Yilmaz Akhan (`profile_id=86429fef…`, onboarding `a2a67f39…`, step `bestellungen`) hat in der DB nur **einen** Scanner-Lizenz-Versuch vom **22.04.** mit Status `failed`, `stripe_subscription_id=NULL`.
Stripe zeigt für denselben Customer (`cus_UGNUqnC9vbb5xX`) am **04.06. 13:34** eine erfolgreiche **„Subscription creation" 236,81 €** (= 199 €/Monat × 1,19 USt).

Der bestehende Reconciler (`reconcile-stripe-orders`) ist **DB-getrieben**: er prüft nur Zeilen, die in `contractor_bestellungen` als pending/failed liegen, und verifiziert sie gegen Stripe. Wenn — wie hier — in Stripe ein **neues** Subscription/PI ohne passende DB-Zeile entsteht (alte Session abgelaufen, User hat über neuen Checkout neu bestellt), bleibt die DB hängen und das Onboarding kommt nicht weiter.

Der jetzt gebaute 24h-Filter in `v_einmalige_order_health` macht das nicht besser, weil die alte `failed`-Zeile von April rausfällt — und keine neue Zeile existiert, die Stripe-Zahlung wird nicht sichtbar.

## Ziel (Definition of Done)

Innendienst klickt **„Stripe Live-Sync (24/48h)"** → Funktion holt **alle** in Stripe in diesem Fenster bezahlten Subscriptions + Einmal-Payment-Intents und gleicht sie gegen `contractor_onboarding` ab. Ergebnis je Treffer:

1. Es existiert eine passende `contractor_bestellungen`-Zeile für den Customer + Produkt → Update auf `paid` inkl. `stripe_subscription_id`, `stripe_payment_intent_id`, `paid_at` (idempotent via Trigger `payment_audit_unique`).
2. Es existiert **keine** passende Zeile (Fall Yilmaz) → Funktion legt eine neue `contractor_bestellungen`-Zeile mit `stripe_payment_status='paid'` an und verknüpft sie über `stripe_customer_id` → `onboarding_id`.
3. Customer kann nicht eindeutig zugeordnet werden → in Response als `unmatched` zurückgeben mit Stripe-Daten (Customer-ID, Email, Betrag, Sub/PI-ID), damit Innendienst manuell entscheiden kann.

Nach Sync läuft die normale Onboarding-Logik (Trigger `auto_advance_after_pflichtprodukte` etc.) und Yilmaz wandert automatisch weiter.

## Plan

### A) Neue Edge Function `stripe-live-sync`
Eigene Function (nicht den bestehenden Reconciler überladen — Separation of Concerns).

Input: `{ hours: 24 | 48 }` (default 24).
Schritt 1 — Stripe pull:
- `GET /v1/subscriptions?status=active&created[gte]=<cutoff>&limit=100&expand[]=data.latest_invoice` (paginieren über `has_more`/`starting_after`).
- `GET /v1/payment_intents?created[gte]=<cutoff>&limit=100` filtern auf `status=succeeded`.

Schritt 2 — Mapping pro Stripe-Objekt:
- Customer-ID extrahieren → `stripe_customer_id`.
- Onboarding finden via `contractor_bestellungen.stripe_customer_id` (häufigster Fall).
- Fallback: Stripe-Customer-Email → `profiles.email` → `contractor_onboarding.profile_id`.
- Produkt-Key ermitteln über `subscription.items.data[0].price.id` bzw. `payment_intent.metadata.produkt_key`, sonst Heuristik über Betrag/Mapping (`thermocheck.contractor_products`).

Schritt 3 — DB-Schreibvorgang (eine **SECURITY DEFINER RPC** `thermocheck.sync_stripe_payment(...)`):
- Versucht zuerst Update einer existierenden pending/failed Zeile (`onboarding_id`, `produkt_key`, ohne `paid_at`) → setzt `paid`, IDs, `paid_at`.
- Wenn keine Zeile existiert → Insert neue Zeile mit `produkt_typ`, Betragsspalten, `idempotency_key = 'live-sync:'||stripe_id`.
- Existiert bereits eine `paid`-Zeile mit derselben Subscription/PI → no-op (idempotent).

Schritt 4 — Audit:
- `contractor_audit_log` Insert mit `action_type='live_sync_paid'`, payload mit Stripe-IDs, matched_reason, hours-Fenster.

Response:
```json
{
  "checked_subscriptions": n, "checked_payment_intents": m,
  "updated": n1, "inserted": n2, "skipped": n3,
  "unmatched": [{ customer_id, email, amount, sub_id|pi_id, reason }]
}
```

### B) Admin-UI
- **Neuer Button im `SubscriptionHealthPanel.tsx`-Header**: „⚡ Stripe Live-Sync" mit Dropdown 24h / 48h.
- Bei Klick: Function-Call → Toast mit Counts.
- Bei `unmatched.length > 0` → Dialog mit Liste der nicht zuordenbaren Stripe-Zahlungen (Customer-ID kopierbar, Stripe-Link), damit Innendienst manuell zuweisen kann.

### C) Bestehende View nicht weiter anfassen
24h-Filter bleibt — er war für die Anzeige korrekt. Die Behebung passiert jetzt über die separate Sync-Funktion.

## Technische Details

| Aspekt | Lösung |
|---|---|
| Idempotenz | `payment_audit_unique`-Trigger + `idempotency_key='live-sync:'||sub_id/pi_id` |
| Race conditions | `SECURITY DEFINER` RPC mit `INSERT … ON CONFLICT (idempotency_key) DO NOTHING` |
| Stripe-Pagination | `has_more` Loop, max 5 Seiten (≤500 Objekte / 24h) |
| Stripe API errors | per-Item try/catch, in `errors[]` sammeln, nicht Gesamtlauf abbrechen |
| Auth | Function nur via `is_innendienst()`-Check (Caller-JWT prüfen) |
| Logging | `console.log` mit Version-Tag `live-sync-v1` für Edge-Logs |
| Onboarding-Folgelogik | bestehende DB-Trigger laufen automatisch nach Insert/Update |

## Was der User danach prüfen soll

1. „Stripe Live-Sync 24h" auf `/admin` klicken.
2. Yilmaz' Scanner-Lizenz erscheint als `inserted` oder `updated→paid` in der Response.
3. Yilmaz-Onboarding-Step springt von `bestellungen` auf den nächsten Schritt (sobald alle Pflichtprodukte paid sind).
4. Edge-Function-Logs zeigen Treffer + ggf. `unmatched` für andere Customer.

## Risiken / Limits

- **Betragsmehrdeutigkeit**: Wenn zwei Onboardings denselben Stripe-Customer teilen (sollte nicht, aber theoretisch möglich), nehmen wir das jüngste Onboarding. Wird im Audit-Log dokumentiert.
- **Produkt-Key-Erkennung** bei Einmal-PIs ohne `metadata`: Fallback über Betragsabgleich gegen `contractor_products` (±1 ct), sonst `unmatched`.
- **Stripe Rate-Limit**: 24h-Fenster ist typ. <50 Objekte, unkritisch.

## Folge-Verbesserung (nicht jetzt)

Cron-Job (alle 30 min) der `stripe-live-sync` mit `hours=2` automatisch laufen lässt → komplettes Webhook-Backup. Erst bauen, wenn der manuelle Button bewährt ist.
