
## Masterplan: Sammel-Checkout + Webhook-Redeployment + ForceReset-Race-Condition

---

### Ursachenanalyse (Reverse Engineering, verifiziert durch DB + Code)

**Verbleibender Bug: ForceReset Race Condition**

In `OnboardingScreen.tsx` (Zeile 155-192) gibt es eine zeitkritische Luecke:

```text
Ablauf:
1. Komponente rendert → dbStatus ist schon da (onboarding_status = 'invited')
2. ForceReset-Effect feuert → dbShowsNoProgress = true
3. DB-Progress-Check (Zeile 161): isOnboardingStateLoaded = FALSE (Query noch nicht fertig!)
4. Check wird uebersprungen → faellt durch zu localStorage-Pruefung
5. localStorage hat Fortschritt → wird als "stale" erkannt → GELOESCHT
6. Spaeter: DB-Query wird fertig → zeigt Fortschritt → aber localStorage ist weg
```

DB beweist das Problem: 3 von 5 Usern haben `onboarding_status = 'invited'` ABER echten Fortschritt (`completed_steps`, `intro_video_watched = true`). Die ForceReset-Logik behandelt das als "stale" wenn sie VOR dem DB-Load feuert.

**Fix**: Eine einzige Zeile: `if (!isOnboardingStateLoaded) return;` als Guard im ForceReset-Effect. Erst wenn die DB geladen ist, kann entschieden werden, ob localStorage stale ist.

---

**Webhook ist veraltet (nicht redeployed)**

Edge-Function-Logs zeigen nur `shutdown` -- kein einziger Log mit dem aktuellen `v${WEBHOOK_VERSION}` Format. Der Code im Repository ist v3, aber die deployed Version ist aelter (basierend auf den Screenshots des Users: nur `{"received": true}` statt der v3-Antwort mit `event_type`, `version`, `lookup_method`).

**Fix**: Redeployment beider Edge Functions.

---

**Kein Sammel-Checkout fuer "beides" (T-Shirt + Poloshirt)**

Aktuell: Jedes Produkt erzeugt eine eigene Stripe-Session. Bei "beides" wird der User ZWEIMAL zu Stripe weitergeleitet -- verwirrend und fehleranfaellig (zweiter Redirect kann durch ForceReset gestoert werden).

Zusaetzlich: `findOrderForSession()` im Webhook nutzt `.maybeSingle()`, was nur EINE Bestellung pro Session findet. Bei einem Sammel-Checkout mit mehreren Bestellungen pro Session wuerden die restlichen nicht aktualisiert.

---

### Loesung: 4 Aenderungen

#### 1. ForceReset Race Condition fixen (OnboardingScreen.tsx)

Zeile 158 erweitern um DB-State-Guard:

```typescript
// VORHER:
if (!profileId || !dbShowsNoProgress || forceReset || isPreview || paymentRedirectRef.current) return;

// NACHHER (eine Zeile ergaenzt):
if (!profileId || !dbShowsNoProgress || forceReset || isPreview || paymentRedirectRef.current) return;
if (!isOnboardingStateLoaded) return; // Warte auf DB bevor stale-Check
```

Damit wird der localStorage-Stale-Check erst ausgefuehrt wenn die DB geladen ist und eine fundierte Entscheidung getroffen werden kann.

#### 2. Edge Functions redeployen

Sofortiges Redeployment von `stripe-webhook` und `create-checkout-session`, damit die aktuelle v3-Logik (Idempotency, Multi-Step-Lookup, Session-Expired-Handling) tatsaechlich live ist.

#### 3. create-checkout-session: Multi-Item Support (Edge Function)

Neues Request-Format mit Abwaertskompatibilitaet:

```text
NEU (Sammel-Checkout):
  body: { items: [{ produkt_key: "tshirt", groesse: "L", menge: 1 }, 
                   { produkt_key: "poloshirt", groesse: "L", menge: 1 }] }

ALT (weiterhin unterstuetzt):
  body: { produkt_key: "tshirt", groesse: "L", menge: 1 }
  → wird intern zu items: [{ produkt_key: "tshirt", groesse: "L", menge: 1 }]
```

Logik-Aenderungen:
- Alle Produkte in einer Schleife aus `contractor_produkte` laden
- Alle als `line_items` in EINE Stripe-Session packen
- Fuer jedes Item eine eigene `contractor_bestellungen`-Zeile mit gleicher `stripe_session_id`
- Metadata: `produkt_keys: "tshirt,poloshirt"` (kommasepariert)
- Validierung: Max 5 Items pro Checkout, alle muessen aktiv sein

#### 4. stripe-webhook: Multi-Order Update (Edge Function)

`findOrderForSession` aendern:
- `.maybeSingle()` ersetzen durch `.select()` (gibt Array zurueck)
- Bei `checkout.session.completed`: ALLE Bestellungen mit gleicher `stripe_session_id` auf "paid" setzen
- Metadata-Fallback: Kommaseparierte `produkt_keys` parsen, alle matchen

```text
VORHER: findOrderForSession() → { order } | null     (ein Ergebnis)
NACHHER: findOrdersForSession() → { orders[] }       (alle Ergebnisse)
```

Update-Schleife statt Einzel-Update:
```text
for each order in matched_orders:
  UPDATE contractor_bestellungen SET stripe_payment_status = 'paid' WHERE id = order.id
```

#### 5. useStripeCheckout: startMultiCheckout (Frontend Hook)

Neue Funktion neben bestehendem `startCheckout`:

```typescript
startMultiCheckout(items: Array<{ produktKey: string; groesse?: string; menge?: number }>)
```

Ruft die Edge Function mit dem neuen `items`-Format auf. `startCheckout` bleibt fuer Einzel-Produkte bestehen (Abwaertskompatibilitaet).

#### 6. OrdersStep: Kombinierte "Beides"-Ansicht (Frontend UI)

Wenn `oberteilAuswahl === 'beides'`:
- Beide Varianten (T-Shirt + Poloshirt) GLEICHZEITIG auf einer Seite anzeigen
- Separate Groessen- und Mengen-Auswahl pro Variante
- EIN gemeinsamer "Jetzt bestellen"-Button
- Button ruft `startMultiCheckout([{ produktKey: 'tshirt', ... }, { produktKey: 'poloshirt', ... }])` auf
- Nach Redirect zurueck: Beide Produkte sind bezahlt, naechstes Produkt (Schlappen) wird angezeigt

---

### Rollen-Matrix & RLS-Validierung

Betroffene Tabellen und Zugriff:

| Tabelle | Operation | Wer | RLS |
|---|---|---|---|
| `contractor_bestellungen` | INSERT | Edge Function (service-role) | Kein RLS noetig (service-role) |
| `contractor_bestellungen` | UPDATE | Edge Function (service-role) | Kein RLS noetig (service-role) |
| `contractor_bestellungen` | SELECT | Contractor (anon + JWT) | Via `Accept-Profile: thermocheck` Header + RLS |
| `contractor_produkte` | SELECT | Edge Function (service-role) | Kein RLS noetig |
| `contractor_audit_log` | INSERT | Edge Function (service-role) | Kein RLS noetig |

Beide Edge Functions nutzen `SUPABASE_SERVICE_ROLE_KEY` fuer DB-Writes -- RLS wird korrekt umgangen. Der `create-checkout-session` validiert JWT manuell via `getUser()`. Der `stripe-webhook` validiert via Stripe-Signatur (kein JWT noetig). `verify_jwt = false` in `config.toml` ist korrekt fuer beide.

Keine Aenderung an RLS-Policies noetig -- alle DB-Operationen laufen ueber service-role.

---

### Edge Cases

1. **Leeres items-Array**: Validierung in Edge Function → 400 Bad Request
2. **Gemischte payment/subscription**: Stripe erlaubt keine gemischten Modes in einer Session. T-Shirt + Poloshirt sind beide `payment` → kein Problem. Lizenz-Produkte (`subscription`) muessen weiterhin einzeln bestellt werden.
3. **Teilweise bezahlt**: Wenn ein Item in der Session scheitert, scheitert die gesamte Stripe-Session. Alle oder keine Bestellungen werden "paid".
4. **Race Condition Webhook vs. Redirect**: Webhook kann vor dem Redirect ankommen → Bestellungen sind schon "paid" wenn der User zurueckkommt → Polling erkennt das korrekt.
5. **Doppel-Webhook**: Idempotency via `stripe_event_id` in `contractor_audit_log` → bereits geloest.
6. **User bricht Checkout ab**: Session expired → Webhook setzt Status auf "failed" → Bestellungen werden als "pending" angezeigt und koennen erneut bestellt werden.

---

### Post-Migration Check

**Stale pending Bestellungen**: DB zeigt 2 T-Shirt-Bestellungen mit `stripe_payment_status: pending` (Session IDs `cs_live_a1FgN...` und `cs_live_a1CVM...`). Diese sind von abgebrochenen/abgelaufenen Checkouts. Nach Webhook-Redeployment werden zukuenftige `checkout.session.expired` Events korrekt verarbeitet. Bestehende stale Orders beeinflussen die Logik nicht (sie werden beim naechsten Checkout per upsert ueberschrieben, da `erlaubt_mehrfach = true` fuer tshirt).

Keine Daten-Migration noetig -- alle Aenderungen sind additiv und abwaertskompatibel.

---

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/OnboardingScreen.tsx` | ForceReset Guard: 1 Zeile |
| `supabase/functions/create-checkout-session/index.ts` | Multi-Item Support |
| `supabase/functions/stripe-webhook/index.ts` | Multi-Order Update |
| `src/hooks/useStripeCheckout.ts` | `startMultiCheckout` Funktion |
| `src/components/onboarding/steps/OrdersStep.tsx` | Kombinierte "Beides"-Ansicht |

