

# Test-Preise fuer Onboarding-Produkte einpflegen

## Was passiert

Die echten `stripe_price_id` Werte werden in `stripe_test_price_id` gesichert, dann durch die 0-Euro-Test-Preise ersetzt. So kann spaeter mit einem einzigen UPDATE zurueckgewechselt werden.

## Aenderungen (nur Daten-Update, keine Schema-Migration)

| produkt_key | Aktueller Preis | Neuer stripe_price_id (0 EUR) | Alter Wert gesichert in stripe_test_price_id |
|-------------|----------------|-------------------------------|----------------------------------------------|
| schlappen | 23.74 EUR | price_1SxmacLnjPqrEfxxW060yeQC | price_1SvgwYLnjPqrEfxxldTsLr6R |
| poloshirt | 41.59 EUR | price_1Sxmc6LnjPqrEfxxi2Hw0T5P | price_1SvgtgLnjPqrEfxxEneJQgW0 |
| ausweiskarte | 11.84 EUR | price_1Sxmd1LnjPqrEfxxxEDDkR8S | price_1SvgZrLnjPqrEfxx9ByGa0UB |
| pullover | 59.44 EUR | price_1SxmdgLnjPqrEfxxOBY3UmMN | price_1SvgvELnjPqrEfxx4N5BArSC |

T-Shirt hat bereits einen 0-EUR-Testpreis und wird nicht geaendert.

Scanner-Lizenz und Google Workspace bleiben ebenfalls unveraendert (keine Test-Preise genannt).

## Zurueckwechseln auf Live-Preise (spaeter)

Ein einzelner SQL-Befehl genuegt:

```text
UPDATE thermocheck.contractor_produkte
SET stripe_price_id = stripe_test_price_id,
    stripe_test_price_id = NULL
WHERE stripe_test_price_id IS NOT NULL;
```

## Keine Code-Aenderungen noetig

Der Checkout-Flow liest `stripe_price_id` aus der DB - das Frontend und die Edge Function bleiben unveraendert.

