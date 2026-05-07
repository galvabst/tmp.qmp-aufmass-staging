## Ziel
Stripe-Bestellungen dürfen nie mehr falsch auf `pending`/`failed` stehen, wenn in Wirklichkeit bezahlt wurde. Drei Schutzschichten + einmalige Backlog-Korrektur.

## 1. Backlog jetzt aufräumen (einmalig)
- Reconciler-Funktion mit neuem Modus `?backfill=90d` aufrufen, der **alle** Bestellungen der letzten 90 Tage mit `stripe_payment_status IN ('pending','failed')` prüft — nicht nur die, die noch im Cron-Window sind.
- Für jede prüfen:
  1. Checkout Session retrieven (falls vorhanden)
  2. Wenn Session unpaid: Customer-PaymentIntents (succeeded, gleicher Betrag, ±24h Toleranz) suchen
  3. Match → DB auf `paid` setzen + `stripe_payment_intent_id` + `paid_at` + Audit-Log
- Speziell die 6 inkonsistenten Bestellungen vom 17.02. (Customer `cus_TzlsdQHJluoc3V`, ~420 €, alle `paid_at` gesetzt aber `status=failed`) werden so geprüft und korrigiert.

## 2. Reconciler robuster (Edge Function)
Aktuell prüft `reconcile-stripe-orders` nur Bestellungen aus einem engen Zeitfenster. Änderungen:
- Default-Window auf 7 Tage erhöhen (statt aktuell wenige Stunden)
- Customer-PI-Fallback (gestern eingebaut) bleibt
- **Neu**: Inkonsistenz-Check — wenn `paid_at IS NOT NULL` aber `status <> 'paid'`, immer mit Stripe abgleichen
- Logging pro Bestellung (warum gematched / warum nicht), damit du im Edge-Function-Log nachvollziehen kannst, was passiert ist

## 3. Dauerhafte DB-Integrität (Migration)
Trigger `trg_bestellung_status_consistency` BEFORE INSERT/UPDATE auf `thermocheck.contractor_bestellungen`:
- Wenn `stripe_payment_intent_id IS NOT NULL` → `stripe_payment_status` darf nicht `failed` sein, wird automatisch auf `paid` korrigiert
- Wenn `paid_at IS NOT NULL` → status darf nicht `failed`/`pending` sein, wird auf `paid` korrigiert
- Korrekturen werden in `audit_log` protokolliert (Reason: `auto_corrected_by_trigger`)

So kann ein fehlerhafter Webhook oder manuelles SQL die Daten nie wieder in einen widersprüchlichen Zustand bringen.

## 4. Admin-Sichtbarkeit
Im Admin-Dashboard (Zahlungen-Übersicht): kleiner Badge **„Inkonsistent"** für Bestellungen mit `paid_at IS NOT NULL AND status <> 'paid'` + Button „Jetzt mit Stripe abgleichen", der die Reconciler-Funktion gezielt für eine ID auslöst.

## Technische Details
- Migration: Trigger-Funktion + Trigger auf `thermocheck.contractor_bestellungen`
- Edge Function `reconcile-stripe-orders`: neuer `mode`-Parameter (`recent` | `backfill` | `single`)
- Frontend: Komponente unter `src/components/admin/payments/` (Inkonsistenz-Badge + Refresh-Button)
- Audit-Log-Einträge mit Reason-Codes: `customer_pi_amount_match`, `auto_corrected_by_trigger`, `manual_admin_recheck`
