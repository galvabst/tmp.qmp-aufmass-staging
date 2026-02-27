

# Plan: Stripe Checkout — Rechnungsadresse + MwSt-Ausweisung

## Problem
1. Keine Rechnungsadresse wird abgefragt — Stripe-Rechnungen haben keine Kundenadresse
2. Keine MwSt wird auf der Rechnung ausgewiesen — Stripe zeigt keinen Steuersatz

## Loesung

### Schritt 1: `billing_address_collection` hinzufuegen

**Datei:** `supabase/functions/create-checkout-session/index.ts` (Zeile 211)

Beim `stripe.checkout.sessions.create()` den Parameter `billing_address_collection: 'required'` hinzufuegen. Damit muss der Kunde im Checkout seine Rechnungsadresse eingeben. Stripe speichert diese automatisch am Customer-Objekt.

### Schritt 2: MwSt automatisch berechnen lassen

Stripe bietet dafuer `automatic_tax: { enabled: true }`. Das setzt voraus:

1. **Im Stripe Dashboard**: Tax-Einstellungen aktivieren unter *Settings > Tax*. Dort Herkunftsadresse (eure Firmenadresse) hinterlegen und den deutschen Steuersatz (19% MwSt) konfigurieren.
2. **Bei den Produkten/Preisen in Stripe**: Die Preise muessen als `tax_behavior: 'inclusive'` (MwSt enthalten) oder `'exclusive'` (MwSt wird aufgeschlagen) markiert sein. Das muss im Stripe Dashboard bei jedem Preis gesetzt werden.
3. **Im Code**: `automatic_tax: { enabled: true }` zur Session hinzufuegen.

**Alternativ** (einfacher, kein Tax-Setup noetig): Einen festen `tax_rate` in Stripe anlegen (19% MwSt, inclusive) und diesen bei jedem `line_item` als `tax_rates` mitgeben. Das ist weniger flexibel, aber sofort einsetzbar ohne Dashboard-Konfiguration.

### Code-Aenderung

**Datei:** `supabase/functions/create-checkout-session/index.ts`

```typescript
// Zeile 211-228: Session-Erstellung erweitern
const session = await stripe.checkout.sessions.create({
  mode,
  customer: customerId,
  customer_email: !customerId ? userEmail : undefined,
  line_items,
  billing_address_collection: 'required',    // NEU
  automatic_tax: { enabled: true },           // NEU — MwSt
  success_url: successUrl,
  cancel_url: cancelUrl,
  metadata: { ... },
  locale: "de",
});
```

### Voraussetzung im Stripe Dashboard

Damit `automatic_tax` funktioniert, muss **einmalig** im Stripe Dashboard konfiguriert werden:

1. **Settings > Tax > Tax registrations**: Deutsche USt-Registrierung hinzufuegen (USt-ID eintragen)
2. **Settings > Tax > Origin address**: Eure Firmenadresse als Herkunftsadresse
3. **Produkte/Preise**: Bei jedem Preis `tax_behavior` auf `inclusive` oder `exclusive` setzen

Falls das zu aufwaendig ist, gibt es die manuelle Alternative mit festem Steuersatz — dann muss ich einen `tax_rate` im Code referenzieren.

## Dateien

| Aktion | Datei |
|---|---|
| Aendern | `supabase/functions/create-checkout-session/index.ts` (2 Zeilen) |
| Dashboard | Stripe Tax-Einstellungen konfigurieren (einmalig) |

