
# Fix: Stripe Checkout Redirect funktioniert nicht

## Problem-Diagnose

Der User klickt auf "Jetzt bestellen", der Button wird disabled (Loading-State), aber es passiert kein Redirect zu Stripe. Stattdessen erscheint der Login-Screen.

### Ursachen identifiziert:

| Problem | Quelle | Auswirkung |
|---------|--------|------------|
| `window.location.href` im iframe | `useStripeCheckout.ts` | Redirect wird blockiert oder führt zum Login |
| Duplicate Key Error | `create-checkout-session` Edge Function | Re-Checkout für gleiches Produkt schlägt fehl |
| Webhook Audit-Log Schema-Fehler | `stripe-webhook` Edge Function | Insert in contractor_audit_log scheitert |

---

## Lösung

### Schritt 1: useStripeCheckout.ts - Redirect-Methode ändern

**Problem:** `window.location.href` funktioniert nicht zuverlässig in der Lovable Preview.

**Lösung:** `window.open()` mit `_top` Target verwenden, um den gesamten Browser-Tab zu navigieren (nicht nur das iframe):

```typescript
// Vorher:
window.location.href = data.checkout_url;

// Nachher:
window.open(data.checkout_url, '_self');
```

Falls das nicht funktioniert, Alternative mit `_top`:
```typescript
window.top?.location.replace(data.checkout_url) || window.location.replace(data.checkout_url);
```

### Schritt 2: create-checkout-session - Duplicate Key vermeiden

**Problem:** Bei erneutem Checkout für dasselbe Produkt (z.B. User hat Stripe-Seite verlassen ohne zu zahlen) kommt ein Fehler:
```
duplicate key value violates unique constraint "unique_onboarding_product"
```

**Lösung:** Statt `INSERT` ein `UPSERT` verwenden, das die bestehende pending-Bestellung aktualisiert:

```typescript
// Statt .insert() → .upsert() mit onConflict
.upsert({
  onboarding_id: onboarding.id,
  produkt_key: produkt_key,
  // ... andere Felder
}, {
  onConflict: 'onboarding_id,produkt_key',
  ignoreDuplicates: false
})
```

### Schritt 3: stripe-webhook - Audit-Log Schema korrigieren

**Problem:** Der Insert in `contractor_audit_log` verwendet falsche Spaltennamen:
- `action_type` statt `event_type`
- `payload` statt `event_data`
- Fehlend: `stripe_event_id`

**Lösung:** Die Insert-Logik an das tatsächliche Schema anpassen:

```typescript
// Vorher (falsch):
.insert({
  bestellung_id: bestellungId,
  action_type: auditEventType,
  object_type: "stripe_event",
  object_id: bestellungId,
  payload: event.data.object,
  actor_type: "system",
})

// Nachher (korrekt):
.insert({
  bestellung_id: bestellungId,
  event_type: auditEventType, // muss ein gültiger ENUM-Wert sein
  event_data: event.data.object,
  stripe_event_id: event.id,
  actor_type: "system",
})
```

---

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `src/hooks/useStripeCheckout.ts` | `window.location.href` → `window.open(..., '_self')` |
| `supabase/functions/create-checkout-session/index.ts` | `INSERT` → `UPSERT` für Duplicate-Safety |
| `supabase/functions/stripe-webhook/index.ts` | Audit-Log Insert mit korrektem Schema |

---

## Erwartetes Ergebnis nach Fix

1. User klickt "Jetzt bestellen"
2. Loading-Spinner erscheint
3. **Browser navigiert zu Stripe Checkout** (nicht mehr Login-Screen)
4. User zahlt bei Stripe
5. Redirect zurück zur App mit `?payment=success`
6. Toast "Zahlung erfolgreich!" erscheint
7. Nächstes Produkt wird angezeigt

---

## Technischer Hinweis: Webhook-Signatur

Die Logs zeigen auch `StripeSignatureVerificationError`. Das liegt wahrscheinlich daran, dass der Webhook Secret nicht korrekt gesetzt ist oder Stripe das Event anders formatiert als erwartet.

Da der Webhook aber nur nach erfolgreicher Zahlung relevant ist, und wir zuerst den Redirect fixen müssen, ist das ein sekundäres Problem.

