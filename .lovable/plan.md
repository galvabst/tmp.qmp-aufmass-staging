

## Fix: Intro-Video-Bypass nach Payment absichern

### Problem

Der aktuelle Fix (`!hasPaymentSuccess` in der Gate-Bedingung) hat eine Race Condition:

1. Stripe leitet zurueck mit `?payment=success`
2. `hasPaymentSuccess = true` -> Gate wird uebersprungen (OK)
3. Payment-Handler laeuft, setzt `goToStep('bestellungen')` und **bereinigt die URL** (`setSearchParams({})`)
4. Nach URL-Bereinigung: `hasPaymentSuccess = false` wieder
5. Wenn `introVideoWatched` noch nicht aus der DB hydriert ist -> Gate greift erneut -> **Intro-Video blitzt kurz auf**

### Loesung

Einen `useRef`-Flag einfuehren, das sich merkt, dass ein Payment-Redirect stattgefunden hat. Dieser bleibt fuer die gesamte Lebensdauer der Komponente `true`, auch nachdem die URL bereinigt wurde.

### Technische Aenderung: OnboardingScreen.tsx

**Zeile ~67:** Neuen Ref einfuehren:

```typescript
const hasPaymentSuccess = searchParams.get('payment') === 'success';
const paymentRedirectRef = useRef(hasPaymentSuccess);

// Einmal true, bleibt true fuer die Session
if (hasPaymentSuccess) {
  paymentRedirectRef.current = true;
}
```

**Zeile 376:** Gate-Bedingung anpassen:

```typescript
if (!state.introVideoWatched && !isPreview && !paymentRedirectRef.current) {
  // ... IntroVideo rendern
}
```

So bleibt der Bypass aktiv, auch nachdem die URL-Parameter entfernt wurden. Der Ref ueberlebt Re-Renders ohne die Race Condition.

### Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/OnboardingScreen.tsx` | `paymentRedirectRef` statt direkter URL-Pruefung im Gate |

### Kein weiterer Aenderungsbedarf

Alle anderen Aenderungen (Seekbar-Overlay, Toast-Meldungen) bleiben wie implementiert.

