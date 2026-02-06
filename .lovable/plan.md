

# Fix: Webhook DB-Fehler + Polling fuer Zahlungsstatus

## Problem-Analyse

Der Webhook empfaengt das Event korrekt, aber scheitert an **zwei DB-Schema-Fehlern**:

1. `contractor_admin_tasks.titel` existiert nicht - der Webhook oder ein Trigger versucht dort zu schreiben
2. `contractor_audit_log.bestellung_id` existiert nicht - der Insert in die Audit-Tabelle nutzt einen falschen Spaltennamen

Zusaetzlich: Da Stripe jetzt in einem neuen Tab laeuft, erkennt die App im Hintergrund nicht, dass gezahlt wurde. Es fehlt ein **Polling-Mechanismus**.

## Schritt 1: DB-Schema pruefen und fixen

Zuerst muss ich die tatsaechlichen Spalten der betroffenen Tabellen pruefen und dann:

- `contractor_audit_log`: Den Webhook-Code anpassen, damit er die korrekten Spaltennamen nutzt (kein `bestellung_id`, stattdessen den richtigen FK-Namen)
- `contractor_admin_tasks`: Pruefen ob ein DB-Trigger existiert der bei Zahlungseingang automatisch einen Admin-Task anlegt - dort stimmt der Spaltenname `titel` nicht

## Schritt 2: Webhook Edge Function korrigieren

In `supabase/functions/stripe-webhook/index.ts`:
- Audit-Log Insert mit korrekten Spaltennamen

## Schritt 3: Polling nach Checkout-Start

Da der Stripe-Tab separat laeuft, muss die App aktiv pruefen:

**`src/hooks/useStripeCheckout.ts`:**
- Neuer State `isWaitingForPayment` + `waitingForProductKey`
- Nach `window.open()` den Warte-Modus aktivieren

**`src/components/OnboardingScreen.tsx`:**
- Polling-Intervall (alle 3 Sekunden) das `refetchOrders()` aufruft wenn `isWaitingForPayment` aktiv ist
- Sobald das Produkt als "paid" erkannt wird, Polling stoppen und UI aktualisieren

## Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| DB-Migration | `contractor_audit_log` und `contractor_admin_tasks` Schema-Fix |
| `supabase/functions/stripe-webhook/index.ts` | Audit-Log Insert mit korrekten Spalten |
| `src/hooks/useStripeCheckout.ts` | `isWaitingForPayment` State hinzufuegen |
| `src/components/OnboardingScreen.tsx` | Polling-Intervall nach Checkout-Start |

## Erwartetes Ergebnis

1. User klickt "Jetzt bestellen" -> neuer Tab mit Stripe
2. App zeigt "Warte auf Zahlung..." im Hintergrund
3. User zahlt -> Webhook verarbeitet korrekt -> DB auf "paid"
4. App-Polling erkennt "paid" -> naechstes Produkt wird angezeigt
5. Alle Produkte bezahlt -> "Weiter zu Equipment" wird aktiv
