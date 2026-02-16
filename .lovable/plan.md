
## Masterplan: Sammel-Checkout + Webhook-Redeployment + ForceReset-Race-Condition

**Status: IMPLEMENTIERT (2026-02-16)**

---

### Umgesetzte Aenderungen

#### 1. ForceReset Race Condition (OnboardingScreen.tsx) ✅
- Guard `if (!isOnboardingStateLoaded) return;` hinzugefuegt
- Verhindert localStorage-Loeschung bevor DB geladen ist

#### 2. Edge Functions redeployed ✅
- `create-checkout-session` und `stripe-webhook` neu deployed
- Webhook Version: `2026-02-16-v4`

#### 3. create-checkout-session: Multi-Item Support ✅
- Akzeptiert `items: Array<{ produkt_key, groesse, menge }>`
- Abwaertskompatibel: Legacy `produkt_key` wird intern konvertiert
- Alle Items in EINE Stripe-Session, separate DB-Bestellungen pro Item
- Validierung: Max 5 Items, keine gemischten Modes (payment/subscription)

#### 4. stripe-webhook: Multi-Order Update ✅
- `findOrdersForSession()` ersetzt `findOrderForSession()`
- Gibt Array zurueck, updated ALLE Bestellungen pro Session
- `checkout.session.expired` markiert ebenfalls alle als "failed"
- Metadata-Fallback parst kommaseparierte `produkt_keys`

#### 5. useStripeCheckout: startMultiCheckout ✅
- Neue Funktion neben bestehendem `startCheckout`
- Sendet `items`-Array an Edge Function

#### 6. OrdersStep: Kombinierte "Beides"-Ansicht ✅
- Bei "Beides": Beide Varianten auf einer Seite
- Separate Groessen- und Mengenauswahl pro Variante
- EIN "Beide jetzt bestellen"-Button fuer Sammel-Checkout
