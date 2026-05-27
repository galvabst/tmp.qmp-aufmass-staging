# Subscription-Health: Live-Stripe-Abgleich pro Techniker

## Problem
`v_subscription_health` zeigt nur das, was in `contractor_subscriptions` liegt. Wenn ein Techniker in Stripe längst neue/andere Subscriptions hat (Re-Checkout, manueller Eingriff, weiterer Customer-Datensatz), bleibt unser Bild veraltet:

- **Thorsten Lauschke**: DB kennt nur 2 alte canceled Subs (period_end 17.04. / 17.05.). User bestätigt erfolgreiche Abrechnung am 01.05. → **In Stripe existiert eine neuere Sub, die nie in unsere DB synchronisiert wurde.**
- **Brian Maina**: DB sagt beide Subs active/paid. User vermutet ein Problem → **vermutlich gibt es in Stripe einen zweiten Customer oder eine failed Sub, die wir nicht kennen.**

Der bestehende `reconcile-stripe-orders` arbeitet nur über die in unserer DB hinterlegten `stripe_subscription_id`s — er findet keine *zusätzlichen* Subs am gleichen Customer und keine alternativen Customer-Records.

## Lösung

### 1. Edge Function `stripe-sync-contractor` (neu)
Pro Techniker (`onboarding_id`) wird ein vollständiger Pull aus Stripe ausgelöst:

1. Alle bekannten `stripe_customer_id`s für diesen Onboarding-Eintrag sammeln (aus `contractor_subscriptions` + `contractor_bestellungen`).
2. Zusätzlich per `stripe.customers.search` nach E-Mail (Profil-E-Mail **und** `ag_domain_email`) suchen, um vergessene/parallele Customer-Records zu finden.
3. Für jeden gefundenen Customer **alle** `stripe.subscriptions.list({ customer, status: 'all' })` ziehen.
4. Pro Subscription: Upsert in `contractor_subscriptions` (Schlüssel: `stripe_subscription_id`), inkl. `latest_invoice_status`, `current_period_start/end`, `canceled_at`, `cancel_at_period_end`.
5. Für jede Subscription die **letzten 3 Invoices** ziehen (`stripe.invoices.list({ subscription })`) und in `contractor_bestellungen` als `produkt_typ='subscription'` upserten (idempotent über `stripe_payment_intent_id` / `idempotency_key=invoice.id`).
6. Audit-Log-Eintrag (`action_type='stripe_sync_contractor'`) mit Zusammenfassung (neue/aktualisierte Subs, neue Invoices, gefundene Customer-IDs).

Erreichbar als RPC-Call via `supabase.functions.invoke('stripe-sync-contractor', { body: { onboarding_id } })`, Innendienst-only über JWT-Check.

### 2. UI: „Live mit Stripe abgleichen" pro Techniker
In `TechnicianDetailDialog` (SubscriptionHealthPanel) ein zweiter Button neben „In Stripe öffnen":
- **„Live abgleichen"** → ruft Edge Function, zeigt Spinner, danach Toast mit „X Subs aktualisiert, Y neue gefunden", invalidiert `admin-subscription-health`.
- Ergebnis-Detail in Dialog nachladen (neuer Block „Letzter Sync: vor X min · gefundene Customer-IDs · gefundene Subs").

### 3. Globaler „Alle problematischen abgleichen"-Button
Im Header von `SubscriptionHealthPanel` (neben dem bestehenden „Stripe-Bestellungen abgleichen"):
- **„Alle Problem-Techniker live syncen"** → ruft `stripe-sync-contractor` parallel (max. 5 gleichzeitig) für jeden Techniker, der gerade `attention` oder `action_required` ist.
- Fortschritt als kleine Counter-Toast („3 / 12 …").

### 4. Stripe-Customer-ID auf Onboarding pinnen
Damit künftige Sync-Läufe nicht jedes Mal per E-Mail suchen müssen: neues Feld `contractor_onboarding.stripe_customer_ids text[]` (Array, da Realität mehrere Customer pro Person erlaubt), beim Sync upgedatet.

## Technische Notizen
- Stripe-Secret ist bereits in den Edge-Function-Secrets vorhanden (genutzt von `reconcile-stripe-orders`).
- Die existierende `reconcile-stripe-orders` bleibt für den globalen Bestellungs-Replay erhalten — die neue Function ist ein **gezielter Tiefen-Sync pro Techniker**.
- Idempotenz: alle Upserts laufen über `onConflict` auf `stripe_subscription_id` bzw. invoice-basierte `idempotency_key`. Keine Duplikate.
- Beim Customer-Match per E-Mail wird der Treffer nur akzeptiert, wenn `customer.metadata.onboarding_id` fehlt oder mit unserem Datensatz übereinstimmt — verhindert Cross-Mapping bei gleicher E-Mail.

## Validierung
1. Edge Function lokal/remote gegen Thorsten Lauschke laufen lassen → erwartete Erkennung der neuen Sub vom 01.05. → in der View danach `health_level='ok'` für die aktuelle Sub, alte canceled Sub bleibt sichtbar aber als `attention/historisch` markiert.
2. Gegen Brian Maina laufen lassen → wenn Stripe wirklich ein Problem hat, taucht es jetzt mit `action_required` in der View auf; wenn nicht, bleibt er korrekt ausgeschlossen und wir haben Evidence in den Sync-Logs.
3. Audit-Log-Eintrag prüfen, dass alle gefundenen Customer-IDs/Subs protokolliert sind.
4. Beide Techniker im Panel-Dialog gegenchecken — Sync-Zeitstempel und Customer-IDs sichtbar.

## Out of scope (bewusst nicht jetzt)
- Webhook-Recovery (verlorene Events nachträglich auslösen) — Sync deckt das pragmatisch ab.
- Auto-Sync-Schedule (Cron) — erst nach erfolgreichem manuellen Sync sinnvoll.