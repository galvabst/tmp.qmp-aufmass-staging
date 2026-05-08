## Befund

Die Ausweiskarte ist nicht „einfach wieder pending“, sondern der aktuelle Abgleich kann diese Zahlung nicht zuverlässig zuordnen:

- Supabase-Bestellung: `ausweiskarte`, Martin Eigl, Status `pending`, Betrag `21,99 €`, Session `cs_live_a1ZOWS1y...`
- Dein Screenshot/Stripe zeigt für dieselbe Zahlung offenbar `26,17 €` und einen Payment Intent `pi_3TUXti...`
- Der Reconciler sucht aktuell beim Fallback nach einem succeeded PaymentIntent mit exakt dem DB-Bruttobetrag (`21,99 €`). Wenn Stripe wegen `automatic_tax` tatsächlich `26,17 €` berechnet, matcht er nicht.
- Zusätzlich sehe ich im Stripe-Webhook aktuell Signaturfehler. Dadurch ist der Webhook als erste Schutzschicht gerade nicht verlässlich, der Reconciler muss es also auffangen.

## Plan

1. **Reconciler robuster machen**
   - Beim Checkout-Session-Abruf `payment_intent` expanden.
   - Wenn die Session selbst einen `payment_intent` enthält, diesen direkt abrufen und bei `succeeded` auf `paid` setzen — unabhängig vom DB-Betrag.
   - Erst wenn keine Session-PI vorhanden ist, den Customer-PI-Fallback nutzen.

2. **Betragslogik tax-sicher machen**
   - Beim Customer-PI-Fallback nicht nur exakt `betrag_brutto` matchen.
   - Zusätzlich erlauben: Stripe-Betrag entspricht Checkout-Session-Total oder Amount Details aus Stripe, damit `automatic_tax` keine legitime Zahlung blockiert.
   - Audit-Reason sauber unterscheiden, z. B. `session_payment_intent_verified` vs. `customer_pi_amount_match`.

3. **Pending/Failed-Schleife stoppen**
   - Beim Reconciler `failed` nur protokollieren, wenn der Status wirklich von `pending` auf `failed` geändert wurde.
   - Damit entstehen nicht alle 15 Minuten doppelte `reconciled_failed` Audit-Logs für dieselbe bereits fehlgeschlagene Bestellung.

4. **Akute Ausweiskarte gezielt neu abgleichen**
   - Nach der Änderung die einzelne Bestellung `40f85cbd-97bd-4d97-98e1-85229c360993` über den `single`-Modus prüfen.
   - Erwartung: Wenn Stripe die Zahlung wirklich als bezahlt bestätigt, wird sie auf `paid` gesetzt und `stripe_payment_intent_id` gespeichert.

5. **Webhook-Konfiguration separat sichtbar machen**
   - Ich prüfe danach nochmal die `stripe-webhook` Logs.
   - Wenn weiterhin Signaturfehler kommen, ist sehr wahrscheinlich der falsche `STRIPE_WEBHOOK_SECRET` gesetzt oder Stripe sendet an einen anderen Endpoint/Secret. Dann ist das kein Codeproblem, sondern eine Stripe-Dashboard-Konfiguration, die korrigiert werden muss.

## Technische Details

Betroffene Datei:
- `supabase/functions/reconcile-stripe-orders/index.ts`

Kein Schemawechsel nötig. Keine Tabellenänderung nötig.