

# Stripe Checkout Integration in OrdersStep

## Problem-Analyse

Aktuell gibt es zwei Probleme:

1. **Nicht-existierende Shop-Links**: Der Button "Jetzt bestellen" öffnet `shop.thermocheck.de/tshirt` etc. - diese Domain existiert nicht (DNS_PROBE_FINISHED_NXDOMAIN)

2. **Redundanter Bestätigungs-Dialog**: Nach dem Klick erscheint "Hast du bestellt? Ja/Nein" - das ist überflüssig, weil der Stripe Webhook die Zahlung automatisch in der DB trackt

## Lösung

Die technische Infrastruktur ist bereits vorhanden:
- Edge Function `create-checkout-session` erstellt Stripe Sessions
- Hook `useStripeCheckout` ruft die Edge Function auf
- Webhook `stripe-webhook` aktualisiert den Payment-Status in der DB
- Alle 7 Produkte haben gültige `stripe_price_id` in der DB

Nur die UI-Integration fehlt.

---

## Technischer Ansatz

### Schritt 1: OrdersStep.tsx - Stripe Checkout statt externe Links

**Änderungen:**

| Vorher | Nachher |
|--------|---------|
| `window.open(product.externLink, '_blank')` | `startCheckout(produktKey, groesse)` |
| Nach Klick: AlertDialog "Hast du bestellt?" | Direkter Redirect zu Stripe Checkout |
| Manuelles "Ja, bestellt" klicken | Automatisches Tracking via Webhook |

**Zu entfernen:**
- `confirmingProduct` und `confirmingVariant` State
- Beide `AlertDialog` Komponenten
- Alle Referenzen auf `externLink`

**Zu importieren:**
- `useStripeCheckout` Hook
- Loading-State während Checkout-Erstellung anzeigen

### Schritt 2: OnboardingScreen.tsx - Payment Success Handler

Nach erfolgreicher Zahlung kommt der User zurück mit URL-Parameter:
```
/?payment=success&session_id=cs_xxx
```

**Neuer useEffect:**
1. URL-Parameter `payment=success` erkennen
2. Bestellungen aus DB neu laden (`useContractorOrders`)
3. Bezahlte Produkte in `orderedProducts` State übernehmen
4. Toast "Zahlung erfolgreich!" anzeigen
5. URL-Parameter entfernen (saubere URL)

### Schritt 3: OBERTEIL_VARIANTEN anpassen

Die `externLink` Property wird nicht mehr benötigt - kann entfernt werden da Stripe über `produkt_key` funktioniert:
- `tshirt` -> `useStripeCheckout.startCheckout('tshirt', selectedSize)`
- `poloshirt` -> `useStripeCheckout.startCheckout('poloshirt', selectedSize)`

---

## Dateien die geändert werden

| Datei | Aktion |
|-------|--------|
| `src/components/onboarding/steps/OrdersStep.tsx` | Stripe Integration, AlertDialogs entfernen |
| `src/components/OnboardingScreen.tsx` | Payment Success Handler hinzufügen |
| `src/types/onboarding.ts` | Optional: `externLink` aus ClothingVariant entfernen |

---

## Benutzer-Flow nach Implementierung

```text
1. User wählt Größe (falls erforderlich)
2. User klickt "Jetzt bestellen"
3. Loading-Spinner erscheint
4. Redirect zu Stripe Checkout
5. User zahlt bei Stripe
6. Stripe Webhook → DB Update (paid)
7. Redirect zurück: /?payment=success
8. OnboardingScreen erkennt Parameter
9. Lädt Bestellungen aus DB
10. Produkt als "bezahlt" markiert
11. Nächstes Produkt erscheint automatisch
```

---

## Wichtiger Hinweis zu `useOnboardingSizes`

Die Network-Logs zeigen einen 404-Fehler bei `update_contractor_onboarding_size`:

```
POST /rpc/update_contractor_onboarding_size → 404
"Could not find the function public.update_contractor_onboarding_size"
```

Das ist ein separates Problem - die RPC-Funktion fehlt in der DB. Aber das blockiert nicht die Stripe-Integration, weil die Größe über den `create-checkout-session` Call in die Bestellung geschrieben wird (Parameter `groesse`).

