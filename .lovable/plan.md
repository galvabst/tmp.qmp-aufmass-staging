

# T-Shirt Bestellung auf "paid" setzen

## Situation
Für `onboarding_id = b8b6296a-af68-411f-bb96-0236adcacc34` gibt es 4 T-Shirt-Bestellungen:
- 3x `failed` (alte Versuche)
- 1x `pending` (ID: `9e929b79-7316-495f-8779-b289d1ac63ca`, XL, neueste)

Bereits bezahlt: Schlappen, Pullover, Ausweiskarte (3 Stück `paid`).

## Was zu tun ist

**Daten-Update** (kein Schema-Change, kein Migration nötig):

```sql
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now()
WHERE id = '9e929b79-7316-495f-8779-b289d1ac63ca';
```

## Warum das reicht

- `bestellungen_bezahlt` wird **live berechnet** im `get_my_contractor_onboarding` RPC via `COUNT(*) WHERE stripe_payment_status = 'paid'` — kein Cache, kein Trigger nötig
- Der Onboarding-Flow prüft nur diesen Count → nach dem Update zählt das T-Shirt automatisch als bezahlt
- Der Contractor kann sofort weitermachen

## Kein Code-Change nötig
Die Logik funktioniert bereits korrekt — es war nur ein Webhook-Problem (Stripe hat den Status nicht korrekt zurückgemeldet).

