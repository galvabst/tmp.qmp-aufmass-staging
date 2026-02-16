
## Fix: Onboarding-State wird nach Stripe-Redirect zurueckgesetzt

### Ursachenanalyse (3 zusammenhaengende Bugs)

**Bug 1 (HAUPTURSACHE): ForceReset loescht localStorage nach Stripe-Redirect**

In `OnboardingScreen.tsx` (Zeile 81-109) gibt es eine "ForceReset"-Logik, die prueft, ob der DB-Status `invited` ist, aber localStorage Fortschritt enthaelt. In diesem Fall wird localStorage geloescht und der State komplett zurueckgesetzt.

Das Problem: `onboarding_status` bleibt waehrend des GESAMTEN Onboardings auf `invited`! (Bestaetigt durch DB-Abfrage: alle User ausser dem manuell auf "ready" gesetzten Test-User haben Status "invited".) Die Logik behandelt also JEDEN normalen Onboarding-Fortschritt als "stale" und loescht ihn.

Es gibt zwar einen Payment-Bypass (Zeile 83: `hasPaymentSuccess`), aber der ist fehlerhaft:

```
// Zeile 70: wird bei jedem Render NEU ausgewertet
const hasPaymentSuccess = searchParams.get('payment') === 'success';

// Zeile 83: Guard im ForceReset-Effect
if (!profileId || !dbShowsNoProgress || ... || hasPaymentSuccess) return;

// Zeile 109: hasPaymentSuccess ist in den Dependencies!
}, [dbShowsNoProgress, forceReset, isPreview, dbStatus?.profileId, hasPaymentSuccess]);
```

**Ablauf:**
1. Render 1: `hasPaymentSuccess = true` -- ForceReset wird uebersprungen (korrekt)
2. Payment-Handler-Effect laeuft, ruft `setSearchParams({}, { replace: true })` auf (loescht URL-Parameter)
3. Render 2: `hasPaymentSuccess = false` -- Effect re-evaluiert weil `hasPaymentSuccess` in den Dependencies ist
4. ForceReset-Guard greift NICHT MEHR -- localStorage wird geloescht!
5. State wird komplett zurueckgesetzt (introVideoWatched: false, currentStep: 'profil')

**Bug 2: Loading-Gate hat Race Condition**

```typescript
// Zeile 354:
const isHydrationPending = !isPreview && !hasHydratedOnboardingStateRef.current && !isOnboardingStateLoaded;
```

Die Bedingung nutzt AND (`&&`) fuer beide Checks. Wenn `isOnboardingStateLoaded` auf `true` wechselt, wird die Loading-Screen entfernt, aber der Hydration-Effect hat noch nicht gefeuert (Effects laufen NACH dem Render). Fuer einen einzigen Render-Frame ist `introVideoWatched` noch `false`.

**Bug 3: Hydration laeuft nicht erneut nach ForceReset**

`hasHydratedOnboardingStateRef` wird einmal auf `true` gesetzt und nie zurueckgesetzt. Wenn ForceReset NACH der Hydration triggert (Bug 1), wird der State zurueckgesetzt, aber die DB-Hydration laeuft kein zweites Mal. Der User bleibt mit frischem State stecken.

---

### Loesung

#### 1. ForceReset-Logik entschaerfen (`OnboardingScreen.tsx`)

- `paymentRedirectRef.current` statt `hasPaymentSuccess` im Guard verwenden (ueberlebt URL-Bereinigung)
- `hasPaymentSuccess` aus den Effect-Dependencies entfernen
- Zusaetzlich: ForceReset nur bei echtem User-Mismatch triggern, nicht bei normalem 'invited'-Status. Pruefung ob bezahlte Bestellungen existieren (`bestellungen_bezahlt > 0`) als Safety-Check.

```typescript
// VORHER (Zeile 83):
if (!profileId || !dbShowsNoProgress || forceReset || isPreview || hasPaymentSuccess) return;

// NACHHER:
if (!profileId || !dbShowsNoProgress || forceReset || isPreview || paymentRedirectRef.current) return;

// Dependencies: hasPaymentSuccess ENTFERNEN
}, [dbShowsNoProgress, forceReset, isPreview, dbStatus?.profileId]);
```

Zusaetzlich: Stale-Check absichern -- wenn die DB bezahlte Bestellungen zeigt (`dbStatus` hat ein Feld dafuer ueber `onboardingRecord`), ist der User definitiv NICHT stale:

```typescript
// Zusaetzliche Pruefung: Wenn DB echten Fortschritt zeigt, NIEMALS resetten
const dbHasRealProgress = (onboardingRecord?.bestellungen_bezahlt ?? 0) > 0 
  || (onboardingRecord?.lektionen_abgeschlossen ?? 0) > 0;

if (dbHasRealProgress) return; // Definitiv kein Stale-State
```

#### 2. Loading-Gate fixen (`OnboardingScreen.tsx`)

```typescript
// VORHER (Zeile 354):
const isHydrationPending = !isPreview && !hasHydratedOnboardingStateRef.current && !isOnboardingStateLoaded;

// NACHHER:
const isHydrationPending = !isPreview && !hasHydratedOnboardingStateRef.current;
```

So wird die Loading-Screen gezeigt bis die Hydration tatsaechlich ausgefuehrt wurde -- nicht nur bis die Daten geladen sind.

#### 3. Hydration-Ref nach ForceReset zuruecksetzen (`OnboardingScreen.tsx`)

Wenn `forceReset` triggert, muss `hasHydratedOnboardingStateRef` zurueckgesetzt werden, damit die DB-Hydration erneut laufen kann:

```typescript
useEffect(() => {
  if (forceReset) {
    hasHydratedOnboardingStateRef.current = false;
  }
}, [forceReset]);
```

### Betroffene Dateien

- **`src/components/OnboardingScreen.tsx`**: ForceReset-Guard, Loading-Gate, Hydration-Ref-Reset (3 gezielte Aenderungen, keine neuen Dateien)

### Warum das den Redirect-Bug endgueltig behebt

Die Kausalkette war: Stripe-Redirect -- URL-Params werden geloescht -- ForceReset-Guard faellt weg -- localStorage wird geloescht -- State startet von vorne. Durch den persistenten `paymentRedirectRef` und die zusaetzliche DB-Fortschritts-Pruefung kann der ForceReset nach einem Stripe-Redirect nicht mehr faelschlicherweise triggern.
