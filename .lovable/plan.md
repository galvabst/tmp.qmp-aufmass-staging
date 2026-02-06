

# Stripe Checkout in neuem Tab öffnen

## Änderung

Eine kleine Anpassung in `src/hooks/useStripeCheckout.ts`: Statt die aktuelle Seite zu Stripe zu navigieren, wird ein **neuer Browser-Tab** geöffnet.

```typescript
// Vorher (navigiert weg von der App):
if (window.top) {
  window.top.location.href = data.checkout_url;
} else {
  window.location.replace(data.checkout_url);
}

// Nachher (öffnet neuen Tab):
window.open(data.checkout_url, '_blank');
```

## Was passiert danach

- User klickt "Jetzt bestellen" -> neuer Tab öffnet sich mit Stripe Checkout
- Die App bleibt im Hintergrund geöffnet
- Nach Zahlung leitet Stripe den neuen Tab zurück zur App mit `?payment=success`
- Der Payment-Success-Handler in `OnboardingScreen.tsx` erkennt das und aktualisiert den Status

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/hooks/useStripeCheckout.ts` | `window.top.location.href` zu `window.open(url, '_blank')` |

