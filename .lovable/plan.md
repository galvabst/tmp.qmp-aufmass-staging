

# Stripe Webhook Robustheit - Nachhaltige Loesung

## Problem-Zusammenfassung

Bei Single-Order-Produkten (Ausweiskarte, Scanner-Lizenz, Google Workspace) wird bei erneutem Klick auf "Kaufen" die `stripe_session_id` im bestehenden DB-Eintrag ueberschrieben. Trifft dann der Webhook fuer die alte Session ein, findet er keinen Eintrag und meldet `order_updated: false`.

Bei Multi-Quantity-Produkten (T-Shirt etc.) gibt es dieses Problem nicht, da jeder Klick eine neue Zeile erzeugt.

Zusaetzlich: Stripe SDK v17.7.0 verursacht `Deno.core.runMicrotasks()`-Fehler in Edge Functions.

## Loesung in 3 Schritten

### Schritt 1: Stripe SDK Downgrade (beide Edge Functions)

Downgrade von `stripe@17.7.0` auf `stripe@14.21.0` - die letzte stabile Version mit nativer Deno-Unterstuetzung ohne Node.js-Polyfills.

Betrifft:
- `supabase/functions/stripe-webhook/index.ts` (Zeile 2)
- `supabase/functions/create-checkout-session/index.ts` (Zeile 2)

### Schritt 2: Webhook - Metadata-Fallback bei Session-ID-Miss

Wenn die Suche via `stripe_session_id` fehlschlaegt, soll der Webhook NICHT sofort einen neuen Eintrag erstellen, sondern zuerst via Metadata (`onboarding_id` + `produkt_key`) nach einem existierenden pending-Eintrag suchen und diesen updaten.

Ablauf im Webhook bei `checkout.session.completed`:

```text
1. Suche via stripe_session_id
   |
   +-- Gefunden? -> Update auf "paid" (wie bisher)
   |
   +-- Nicht gefunden?
       |
       2. Suche via Metadata: onboarding_id + produkt_key + status "pending"
          |
          +-- Gefunden? -> Update auf "paid" + session_id korrigieren
          |              (lookup_method: "metadata_fallback")
          |
          +-- Nicht gefunden?
              |
              3. 2 Sekunden warten, dann Schritt 1+2 wiederholen
                 |
                 +-- Immer noch nicht gefunden?
                     |
                     4. Neuen Eintrag aus Metadata erstellen (bestehender Fallback)
```

Aenderung in: `supabase/functions/stripe-webhook/index.ts`

### Schritt 3: Verbessertes Response-Logging

Jeder Webhook-Response enthaelt `lookup_method` und `order_id`, damit in Stripe sofort sichtbar ist, welcher Pfad gegriffen hat:

```text
{
  "received": true,
  "event_type": "checkout.session.completed",
  "version": "2026-02-06-v3",
  "order_updated": true,
  "lookup_method": "session_id" | "metadata_fallback" | "retry_session_id" | "created_from_metadata",
  "order_id": "uuid..."
}
```

## Warum KEIN DB-Write-First?

Die urspruenglich geplante Umkehrung (erst DB schreiben, dann Stripe-Session erstellen) wird NICHT umgesetzt, weil:
- Multi-Quantity-Produkte brauchen es nicht (eigene Zeile pro Klick)
- Single-Produkte: Der Metadata-Fallback loest das Problem einfacher
- Weniger Komplexitaet = weniger Fehlerquellen

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/stripe-webhook/index.ts` | SDK Downgrade + Multi-Step Lookup + Retry + Logging |
| `supabase/functions/create-checkout-session/index.ts` | SDK Downgrade |

## Erwartetes Ergebnis

- Kein `Deno.core.runMicrotasks()`-Fehler mehr (SDK Fix)
- `order_updated: true` auch bei Mehrfach-Klicks (Metadata-Fallback)
- `order_updated: true` auch bei 0-EUR-Preisen (Retry-Logik)
- Transparentes Logging zeigt exakt den Lookup-Pfad in Stripe

