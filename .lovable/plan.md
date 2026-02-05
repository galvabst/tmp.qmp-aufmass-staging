
# Stripe Enterprise-Integration: LOVABLE_BEHAVIOUR-konformer Plan

## Multi-Agent Deliberation (Regel 16)

```text
┌── ARCHITECT ──────────────────────────────────────────────┐
│ Vorschlag: Enterprise Stripe mit Webhook-SSoT, Audit-Log │
│ Annahmen:  - contractor_bestellungen hat groesse-Spalte  │
│            - stripe_payment_status_enum existiert bereits│
│            - thermocheck-Schema ist korrekt exponiert    │
└───────────────────────────────────────────────────────────┘
           ↓
┌── CRITIC ─────────────────────────────────────────────────┐
│ Bedenken 1: event_type als TEXT geplant = REGEL 4 VERLETZT│
│ Bedenken 2: GROESSEN_SPALTEN_MAP nutzt alte Spalten die  │
│             laut .lovable/plan.md entfernt wurden!       │
│ Bedenken 3: groesse-Spalte fehlt in contractor_bestellungen │
│ Gegenfrage: Sind Test-Price-IDs in DB? (stripe_test_price_id) │
└───────────────────────────────────────────────────────────┘
           ↓
┌── INTEGRATOR (Finale Entscheidung) ───────────────────────┐
│ Entscheidung:                                             │
│ 1. ENUM für audit_event_type erstellen                   │
│ 2. groesse-Spalte zu contractor_bestellungen hinzufügen  │
│ 3. useOnboardingSizes.ts anpassen auf neue Struktur      │
│ 4. Edge Functions gemäß Regel 8 implementieren           │
└───────────────────────────────────────────────────────────┘
```

---

## Status-Check: Was existiert bereits

| Komponente | Status | Aktion |
|------------|--------|--------|
| STRIPE_SECRET_KEY | Vorhanden | - |
| STRIPE_WEBHOOK_SECRET | FEHLT | Hinzufuegen |
| contractor_produkte | 7 Produkte | OK |
| stripe_payment_status_enum | paid, pending, failed, refunded | OK |
| contractor_bestellung_produkt_typ_enum | kleidung, lizenz, coaching | OK |
| groesse-Spalte in contractor_bestellungen | FEHLT | Migration |
| contractor_audit_log | FEHLT | Erstellen |
| audit_event_type ENUM | FEHLT | Erstellen (Regel 4!) |

---

## Phase 1: Secret + DB-Migration

### 1.1 STRIPE_WEBHOOK_SECRET speichern

Secret `whsec_BD3KpmnYZeiHe4mBcr4S309Uw6iDSRfQ` in Supabase Secrets speichern.

### 1.2 ENUM erstellen (Regel 4: PFLICHT!)

```sql
-- ENUM fuer Audit-Log Event-Typen (NICHT TEXT!)
CREATE TYPE thermocheck.contractor_audit_event_type AS ENUM (
  'checkout_created',
  'checkout_completed',
  'checkout_expired',
  'payment_succeeded',
  'payment_failed',
  'subscription_created',
  'subscription_renewed',
  'subscription_cancelled',
  'refund_processed',
  'admin_action'
);
```

### 1.3 contractor_bestellungen erweitern

Fehlende Spalten hinzufuegen:

| Spalte | Typ | Zweck |
|--------|-----|-------|
| groesse | TEXT | Groessenauswahl fuer Kleidung (frei, da viele Varianten) |
| stripe_customer_id | TEXT | Stripe Customer ID |
| stripe_subscription_id | TEXT | Fuer Abos |
| webhook_received_at | TIMESTAMPTZ | Idempotency-Marker |
| idempotency_key | TEXT UNIQUE | Stripe Event ID |

Index auf idempotency_key fuer schnelle Duplikat-Pruefung.

### 1.4 contractor_audit_log erstellen (Regel 15.1 Checkliste)

```text
Checkliste neue Tabelle:
□ Schema: thermocheck (korrekt!)
□ Standard-Felder: id, created_at (ja), updated_at (nein - Audit ist immutable)
□ ENUMs: contractor_audit_event_type (neu erstellt)
□ Foreign Keys: bestellung_id -> contractor_bestellungen
□ Indexes: stripe_event_id (UNIQUE), bestellung_id (FK)
□ RLS: Admin-only lesen (Regel 8: sensible Daten!)
```

Tabellenstruktur:

| Spalte | Typ | Zweck |
|--------|-----|-------|
| id | UUID PK | gen_random_uuid() |
| bestellung_id | UUID FK | Referenz (nullable fuer System-Events) |
| event_type | contractor_audit_event_type | ENUM (Regel 4!) |
| event_data | JSONB | Raw Stripe Event (Regel 13.2: JA fuer API-Responses!) |
| stripe_event_id | TEXT UNIQUE | Idempotency |
| actor_type | audit_actor_type_enum | system/admin/contractor (existiert!) |
| actor_id | UUID | User-ID falls bekannt |
| created_at | TIMESTAMPTZ | Timestamp |

RLS Policy:
- SELECT: `is_admin()` (nur Admins duerfen Audit lesen)
- INSERT: Service-Role only (Edge Functions)

---

## Phase 2: Edge Functions (Regel 8: Sicherheit)

### 2.1 supabase/config.toml erweitern

```toml
[functions.create-checkout-session]
verify_jwt = false  # Manuelle Validierung mit getClaims()

[functions.stripe-webhook]
verify_jwt = false  # Webhook-Signatur statt JWT
```

### 2.2 create-checkout-session

Datei: `supabase/functions/create-checkout-session/index.ts`

Ablauf:
1. CORS Headers setzen (OPTIONS handling)
2. JWT validieren mit getClaims() (Regel 8)
3. User-ID aus claims.sub extrahieren
4. Onboarding-ID des Users laden
5. Produkt aus contractor_produkte laden (inkl. stripe_price_id)
6. Stripe Checkout Session erstellen mit:
   - customer_email aus profiles
   - metadata: { user_id, onboarding_id, produkt_key, groesse }
   - success_url / cancel_url
7. Bestellung in contractor_bestellungen anlegen (status: pending)
8. checkout_url zurueckgeben

Sicherheit:
- getClaims() fuer User-Authentifizierung
- Service-Role Key fuer DB-Writes
- Keine user_id Annahmen ohne Validierung

### 2.3 stripe-webhook

Datei: `supabase/functions/stripe-webhook/index.ts`

Ablauf:
1. Raw Body lesen (WICHTIG: vor JSON.parse!)
2. Signatur validieren mit STRIPE_WEBHOOK_SECRET
3. Idempotency Check: stripe_event_id bereits in audit_log?
4. Event-Typ verarbeiten:

| Stripe Event | Aktion |
|--------------|--------|
| checkout.session.completed | status -> paid, paid_at setzen |
| checkout.session.expired | (optional: status -> expired) |
| invoice.paid | Abo-Zahlung tracken |
| invoice.payment_failed | (optional: Benachrichtigung) |

5. contractor_bestellungen aktualisieren
6. Audit-Log schreiben (IMMER, auch bei Duplikat!)
7. HTTP 200 zurueckgeben (Stripe erwartet dies)

Sicherheit:
- Webhook-Signatur-Validierung (NICHT JWT!)
- Service-Role fuer alle DB-Operationen
- Keine User-Sessions, nur Event-Daten

---

## Phase 3: Frontend-Anpassungen

### 3.1 useContractorProducts.ts (NEU)

Hook zum Laden der Produkte aus DB statt MOCK_PRODUCTS:

```typescript
export function useContractorProducts() {
  return useQuery({
    queryKey: ['contractor-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('thermocheck')
        .from('contractor_produkte')
        .select('*')
        .eq('ist_aktiv', true)
        .order('reihenfolge');
      
      if (error) throw error;
      return data;
    }
  });
}
```

### 3.2 useStripeCheckout.ts (NEU)

Hook fuer Stripe Checkout Integration:

```typescript
export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  
  const startCheckout = async (produktKey: string, groesse?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { produkt_key: produktKey, groesse } }
      );
      
      if (error) throw error;
      
      // Redirect zu Stripe
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('[Stripe] Checkout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { startCheckout, isLoading };
}
```

### 3.3 useOnboardingSizes.ts anpassen

Aktueller Code nutzt GROESSEN_SPALTEN_MAP mit alten Spalten (tshirt_groesse etc.) die entfernt wurden!

Neue Logik:
- Groesse wird mit Bestellung in contractor_bestellungen.groesse gespeichert
- NICHT mehr in contractor_onboarding (alte Spalten entfernt laut plan.md)
- RPC `update_bestellung_groesse` existiert bereits

### 3.4 OrdersStep.tsx umbauen

Aenderungen:
1. MOCK_PRODUCTS durch useContractorProducts() ersetzen
2. Bei Klick: useStripeCheckout.startCheckout() statt externem Link
3. Bestaetigungs-Dialog entfernen (Stripe uebernimmt)
4. Loading-State waehrend Checkout-Erstellung

### 3.5 onboarding-config.ts bereinigen

- MOCK_PRODUCTS entfernen
- Nur noch Konfigurations-Konstanten behalten

---

## Phase 4: Payment Success Handling

### 4.1 URL-Parameter nach Redirect

Nach erfolgreicher Zahlung:
```
/?payment=success&session_id=cs_xxx
```

### 4.2 OnboardingScreen erweitern

useEffect fuer payment-Parameter:
1. Pruefen ob `payment=success` in URL
2. Bestellungen aus DB neu laden
3. orderedProducts-State mit DB synchronisieren
4. Toast-Nachricht anzeigen
5. URL-Parameter entfernen (clean URL)

---

## Dateiuebersicht

| Datei | Aktion | Layer |
|-------|--------|-------|
| Migration: ENUM + Spalten + Tabelle | Neu | Infrastructure |
| supabase/config.toml | Erweitern | Infrastructure |
| supabase/functions/create-checkout-session/index.ts | Neu | Infrastructure |
| supabase/functions/stripe-webhook/index.ts | Neu | Infrastructure |
| src/hooks/useContractorProducts.ts | Neu | Application |
| src/hooks/useStripeCheckout.ts | Neu | Application |
| src/hooks/useOnboardingSizes.ts | Anpassen | Application |
| src/components/onboarding/steps/OrdersStep.tsx | Anpassen | Presentation |
| src/lib/onboarding-config.ts | Bereinigen | Domain |
| src/components/OnboardingScreen.tsx | Erweitern | Presentation |

---

## Implementierungs-Reihenfolge (Modular - Regel 9.3)

### Schritt 1: Secret + DB
1. STRIPE_WEBHOOK_SECRET speichern
2. DB-Migration (ENUM, Spalten, Tabelle, RLS, Indexes)

### Schritt 2: Edge Functions
3. supabase/config.toml erweitern
4. create-checkout-session implementieren
5. stripe-webhook implementieren
6. Deployment + Test mit Stripe CLI

### Schritt 3: Frontend Hooks
7. useContractorProducts.ts erstellen
8. useStripeCheckout.ts erstellen
9. useOnboardingSizes.ts anpassen

### Schritt 4: UI Integration
10. OrdersStep.tsx umbauen
11. onboarding-config.ts bereinigen
12. OnboardingScreen.tsx Payment-Success-Handling

### Schritt 5: E2E Test
13. Test mit Stripe Test-Karten (4242...)
14. Webhook-Verarbeitung verifizieren
15. Audit-Log pruefen

---

## Risiken & Mitigationen

| Risiko | Mitigation |
|--------|------------|
| Webhook kommt vor DB-Bestellung | Session-ID als Fallback fuer Matching |
| Doppelte Webhook-Events | idempotency_key (UNIQUE Constraint) |
| User-Session expired bei Redirect | Onboarding-State aus DB laden |
| Stripe API Fehler | Error Handling + Audit-Log |

---

## Technische Details

### Secrets

| Secret | Status |
|--------|--------|
| STRIPE_SECRET_KEY | Vorhanden |
| STRIPE_WEBHOOK_SECRET | Hinzuzufuegen: whsec_BD3KpmnYZeiHe4mBcr4S309Uw6iDSRfQ |

### Price IDs (aus contractor_produkte)

| Produkt | Price ID | Typ |
|---------|----------|-----|
| tshirt | price_1SvgcrLnjPqrEfxxgvConSYk | Einmalig |
| poloshirt | price_1SvgtgLnjPqrEfxxEneJQgW0 | Einmalig |
| schlappen | price_1SvgwYLnjPqrEfxxldTsLr6R | Einmalig |
| pullover | price_1SvgvELnjPqrEfxx4N5BArSC | Einmalig |
| ausweiskarte | price_1SvgZrLnjPqrEfxx9ByGa0UB | Einmalig |
| scanner-lizenz | price_1SvhF0LnjPqrEfxxNZn53Ydt | Abo (monatlich) |
| google-workspace | price_1Svh1QLnjPqrEfxxhoLlUgo6 | Abo (monatlich) |

### Existierende ENUMs (wiederverwendet)

- stripe_payment_status_enum: pending, paid, failed, refunded
- audit_actor_type_enum: system, admin, contractor
- contractor_bestellung_produkt_typ_enum: kleidung, lizenz, coaching
