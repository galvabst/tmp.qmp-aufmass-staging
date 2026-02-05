
# Enterprise-Grade Stripe Payment Integration für Contractor-Onboarding

## Kontext & Problemstellung

Du fragst wie Amazon das machen würde - hier ist die Antwort: Mit **Event-Driven Architecture**, **Audit Trails**, **Idempotenz** und **strenger Trennung der Verantwortlichkeiten**.

---

## Kritische Entdeckung: DB-Schema-Fehler

Bei meiner Analyse habe ich einen **kritischen Fehler** gefunden:

Der Trigger `thermocheck.on_bestellung_paid` versucht in Spalten zu schreiben die NICHT existieren:

```sql
-- Trigger versucht:
INSERT INTO thermocheck.contractor_admin_tasks (
  contractor_id, task_key, titel, beschreibung, status, bestellung_details
)
-- Aber die Tabelle hat nur:
-- id, contractor_id, task_key, task_label, erledigt, erledigt_am, erledigt_von, notiz, reihenfolge
```

**Fehlende Spalten in `contractor_admin_tasks`:**
- `titel` (Trigger nutzt diese, Tabelle hat `task_label`)
- `beschreibung`
- `status`
- `bestellung_details`

Dieser Trigger wird beim ersten echten Zahlungseingang crashen.

---

## Enterprise-Architektur (Amazon-Level)

### 1. Event-Driven Payment Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT FLOW (EVENT-DRIVEN)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                            │
│  │   Frontend   │                                                            │
│  │ OrdersStep   │                                                            │
│  └──────┬───────┘                                                            │
│         │ POST {product_key, onboarding_id}                                  │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ Edge Function: create-checkout-session                           │       │
│  │ ──────────────────────────────────────────────────────────────── │       │
│  │ 1. Validate JWT → Extract user_id                                │       │
│  │ 2. Check: onboarding_id belongs to user?                         │       │
│  │ 3. Check: Produkt bereits bezahlt? → Return existing order       │       │
│  │ 4. Create Stripe Checkout Session                                │       │
│  │    - mode: payment | subscription                                │       │
│  │    - metadata: {onboarding_id, produkt_key, user_id}            │       │
│  │ 5. UPSERT contractor_bestellungen (status: pending)              │       │
│  │ 6. Return {checkout_url}                                         │       │
│  └──────────────────────────┬───────────────────────────────────────┘       │
│                             │                                                │
│         ┌───────────────────┼───────────────────┐                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │   Success   │     │   Cancel    │     │   Abandon   │                    │
│  │   Redirect  │     │   Redirect  │     │   (Close)   │                    │
│  └──────┬──────┘     └─────────────┘     └─────────────┘                    │
│         │                                                                    │
│         │ (User sieht UI sofort - aber Status wird erst durch Webhook      │
│         │  definitiv bestätigt. UI pollt oder zeigt "Zahlung wird geprüft") │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ Edge Function: stripe-webhook                                     │       │
│  │ ──────────────────────────────────────────────────────────────── │       │
│  │ 1. Verify Stripe Signature (STRIPE_WEBHOOK_SECRET)               │       │
│  │ 2. Parse Event: checkout.session.completed                       │       │
│  │ 3. Extract metadata: {onboarding_id, produkt_key}                │       │
│  │ 4. Idempotenz-Check: Bereits verarbeitet? → Skip                 │       │
│  │ 5. UPDATE contractor_bestellungen SET status='paid'              │       │
│  │ 6. DB-Trigger erstellt Admin-Task automatisch                    │       │
│  │ 7. Log to contractor_audit_log                                   │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Datenbank-Schema (Amazon-Level)

**Prinzipien die Amazon nutzt:**
- **Idempotenz**: Jede Operation kann mehrfach ausgeführt werden ohne Seiteneffekte
- **Audit Trail**: Jede Statusänderung wird protokolliert
- **Event Sourcing**: Status-History statt nur aktueller Status
- **Stripe als Source of Truth**: Webhook bestätigt, nicht UI

---

## Implementierungsplan

### Schritt 1: DB-Schema korrigieren (KRITISCH!)

**Problem**: `contractor_admin_tasks` hat falsche Spaltenstruktur für den Trigger.

**Lösung**: Migration die fehlende Spalten hinzufügt:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `titel` | text | Task-Titel (Trigger nutzt diese) |
| `beschreibung` | text | Detaillierte Beschreibung |
| `status` | ENUM | 'offen', 'in_bearbeitung', 'erledigt' |
| `bestellung_details` | jsonb | Stripe/Produkt-Metadaten |

**Alternative**: Trigger anpassen um vorhandene Spalten zu nutzen (`task_label` statt `titel`).

### Schritt 2: Bestellungen-Tabelle erweitern

Die `contractor_bestellungen` Tabelle ist bereits gut strukturiert, aber für Enterprise-Level fehlt:

| Neue Spalte | Typ | Zweck |
|-------------|-----|-------|
| `stripe_customer_id` | text | Für wiederkehrende Kunden (Subscriptions) |
| `stripe_subscription_id` | text | Für Abo-Tracking |
| `webhook_received_at` | timestamptz | Wann wurde Webhook verarbeitet? |
| `idempotency_key` | text | Verhindert doppelte Verarbeitung |

### Schritt 3: Edge Function `create-checkout-session`

**Datei**: `supabase/functions/create-checkout-session/index.ts`

**Enterprise-Features:**
- JWT-Validierung mit User-ID Extraktion
- Ownership-Check: Gehört onboarding_id zum User?
- Idempotenz: Pending Session wiederverwenden oder neue erstellen
- Stripe Metadata für Webhook-Zuordnung
- Service-Role für DB-Writes (RLS-bypass)

**Produkt-Mapping (hartkodiert nach deinen Price-IDs):**

| Produkt | Price-ID | Mode |
|---------|----------|------|
| tshirt | price_1SvgcrLnjPqrEfxxgvConSYk | payment |
| poloshirt | price_1SvgtgLnjPqrEfxxEneJQgW0 | payment |
| pullover | price_1SvgvELnjPqrEfxx4N5BArSC | payment |
| schlappen | price_1SvgwYLnjPqrEfxxldTsLr6R | payment |
| ausweiskarte | price_1SvgZrLnjPqrEfxx9ByGa0UB | payment |
| scanner-lizenz | price_1SvhF0LnjPqrEfxxNZn53Ydt | subscription |
| google-workspace | price_1Svh1QLnjPqrEfxxhoLlUgo6 | subscription |

### Schritt 4: Edge Function `stripe-webhook`

**Datei**: `supabase/functions/stripe-webhook/index.ts`

**Enterprise-Features:**
- Signatur-Verifizierung (STRIPE_WEBHOOK_SECRET)
- Event-Type Routing (checkout.session.completed, invoice.payment_failed)
- Idempotenz-Prüfung via `webhook_received_at`
- Audit-Log Eintrag bei jeder Verarbeitung
- Fehler-Handling mit Retry-freundlichen HTTP-Codes

**Events die verarbeitet werden:**
- `checkout.session.completed` → Status 'paid'
- `invoice.payment_failed` → Status 'failed' (für Subscriptions)
- `customer.subscription.deleted` → Optional für Kündigung

### Schritt 5: Frontend-Integration

**Datei**: `src/components/onboarding/steps/OrdersStep.tsx`

**Änderungen:**
1. Neuer Hook `useStripeCheckout` für API-Calls
2. Button "Jetzt bezahlen" statt "Jetzt bestellen"
3. Nach Klick: Loading-State → API-Call → Redirect zu Stripe
4. Nach Rückkehr: URL-Parameter prüfen → Toast anzeigen
5. Status aus DB laden (Realtime oder Polling)

**Kein AlertDialog mehr**: Zahlung wird durch Webhook bestätigt, nicht durch User-Klick.

### Schritt 6: Status-Sync Hook

**Neue Datei**: `src/hooks/useBestellungenStatus.ts`

**Funktionen:**
- Lade bezahlte Produkte aus `contractor_bestellungen`
- Optional: Realtime-Subscription für Live-Updates
- Merge mit lokalem Onboarding-State

---

## Sicherheits-Architektur (LOVABLE_BEHAVIOUR.txt konform)

### RLS-Policies

**contractor_bestellungen:**
- SELECT: User sieht nur eigene Bestellungen (`onboarding_id` in User's onboardings)
- INSERT/UPDATE: Nur via Edge Function (Service-Role)
- DELETE: Nur Admin

### Edge Function Security

**config.toml:**
```toml
[functions.create-checkout-session]
verify_jwt = false  # Validierung im Code

[functions.stripe-webhook]
verify_jwt = false  # Stripe-Signatur statt JWT
```

**Warum `verify_jwt = false`?**
- `create-checkout-session`: Validiert JWT manuell im Code um User-ID zu extrahieren
- `stripe-webhook`: Nutzt Stripe-Signatur statt JWT (Stripe sendet kein JWT)

**Im Code (Regel 197-199):**
```typescript
// create-checkout-session
const authHeader = req.headers.get('Authorization');
if (!authHeader) return new Response('Unauthorized', { status: 401 });
const { data: { user } } = await supabase.auth.getUser(token);
if (!user) return new Response('Unauthorized', { status: 401 });
```

---

## Audit Trail (Amazon-Level)

Jeder Zahlungsvorgang wird protokolliert in `contractor_audit_log`:

| Event | Payload |
|-------|---------|
| `bestellung_created` | {produkt_key, stripe_session_id, betrag} |
| `bestellung_paid` | {stripe_payment_intent_id, paid_at} |
| `bestellung_failed` | {error_message, stripe_error_code} |
| `admin_task_created` | {task_key, assigned_to} |

---

## Fehlerszenarien & Handling

| Szenario | Handling |
|----------|----------|
| User bricht Checkout ab | Bestellung bleibt 'pending', kann erneut gestartet werden |
| Webhook kommt vor UI-Redirect | Idempotenz-Check verhindert Duplikate |
| Webhook kommt nie | Stripe wiederholt bis zu 72h; Admin kann manuell prüfen |
| Doppelter Webhook | `webhook_received_at` Idempotenz-Check |
| Subscription-Zahlung fehlgeschlagen | invoice.payment_failed Event → Status 'failed' |

---

## Dateien die erstellt/geändert werden

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| Migration (DB) | NEU | contractor_admin_tasks Spalten + Trigger-Fix |
| `supabase/functions/create-checkout-session/index.ts` | NEU | Checkout Session erstellen |
| `supabase/functions/stripe-webhook/index.ts` | NEU | Webhook verarbeiten |
| `supabase/config.toml` | ERWEITERN | Function-Config |
| `src/components/onboarding/steps/OrdersStep.tsx` | ÄNDERN | Stripe-Integration |
| `src/hooks/useBestellungenStatus.ts` | NEU | DB-Status laden |
| `src/lib/stripe.ts` | NEU | Stripe-Helper (optional) |

---

## Stripe Dashboard Setup (nach Deployment)

1. **Webhook erstellen**:
   - URL: `https://keplsvhudmfaagixttql.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `invoice.payment_failed`
   
2. **Signing Secret kopieren** → Prüfen ob bereits in Supabase Secrets

3. **Testen** mit Stripe CLI oder Test-Karte `4242 4242 4242 4242`

---

## Zusammenfassung: Was macht das "Enterprise-Level"?

1. **Event-Driven**: Webhook ist Source of Truth, nicht UI-Klick
2. **Idempotenz**: Jede Operation kann sicher wiederholt werden
3. **Audit Trail**: Volle Nachvollziehbarkeit jeder Transaktion
4. **Trennung**: DB-Trigger für Business-Logic, Edge Functions für Integration
5. **Security**: JWT + Stripe-Signatur, RLS für Datenzugriff
6. **Fehlertoleranz**: Graceful Degradation bei Webhook-Problemen
7. **LOVABLE_BEHAVIOUR.txt konform**: ENUMs, Trigger, keine Email-JOINs, saubere Architektur
