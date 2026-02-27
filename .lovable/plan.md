

# Fix: `customer_tax_location_invalid` — `customer_update` hinzufuegen

## Analyse

Der Fehler ist eindeutig: Stripe verlangt bei `automatic_tax: { enabled: true }` eine Adresse am Customer-Objekt. Da bestehende Kunden keine haben, muss `customer_update: { address: 'auto' }` gesetzt werden — aber **nur** wenn `customer` (nicht `customer_email`) uebergeben wird.

## Validierung

**User Flow:** User klickt "Bestellen" → `useStripeCheckout` ruft Edge Function → Edge Function erstellt Stripe Customer (falls neu) → erstellt Checkout Session → Redirect zu `checkout.stripe.com`.

**Edge Cases geprueft:**

1. **Neuer Kunde (kein `customerId`)**: `customer_email` wird verwendet, `customer_update` = `undefined` → Stripe erstellt neuen Customer mit Adresse aus Checkout. Korrekt.
2. **Bestehender Kunde ohne Adresse**: `customer` wird gesetzt, `customer_update: { address: 'auto' }` → Stripe uebernimmt Adresse aus Checkout auf Customer. **Das ist der Fix.**
3. **Bestehender Kunde mit Adresse**: `customer_update: { address: 'auto' }` ueberschreibt mit neuer Eingabe → Akzeptabel, User kann Adresse korrigieren.
4. **Subscription-Modus**: `customer_update` funktioniert identisch fuer `mode: 'subscription'`. Kein Unterschied.
5. **Multi-Item Checkout**: Kein Einfluss — `customer_update` ist session-level, nicht item-level.

**RLS/IAM**: Nicht betroffen — die Aenderung ist rein Stripe-API-seitig, keine DB-Aenderung.

**Keine Migration noetig**: Kein Schema-Change, keine Datenbereinigung fuer diesen Fix.

## Aenderung

**Datei:** `supabase/functions/create-checkout-session/index.ts`

Zeile 217, nach `automatic_tax`:

```typescript
// Zeilen 211-229 ersetzen mit:
const session = await stripe.checkout.sessions.create({
  mode,
  customer: customerId,
  customer_email: !customerId ? userEmail : undefined,
  line_items,
  billing_address_collection: 'required',
  automatic_tax: { enabled: true },
  customer_update: customerId ? { address: 'auto' } : undefined,
  success_url: successUrl,
  cancel_url: cancelUrl,
  metadata: {
    user_id: userId,
    onboarding_id: onboarding.id,
    produkt_keys: produktKeys.join(","),
    produkt_key: produktKeys[0],
    groesse: items[0].groesse || "",
    menge: String(items[0].menge || 1),
  },
  locale: "de",
});
```

Einzige Aenderung: Eine Zeile hinzufuegen (`customer_update`). Danach Edge Function deployen.

