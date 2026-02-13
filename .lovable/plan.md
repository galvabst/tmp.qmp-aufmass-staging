

## Stripe 0-Euro-Bug beheben: Falsche Price ID wird verwendet

### Problem

Die Edge Function `create-checkout-session` liest `stripe_price_id` aus der Datenbank. Diese Spalte enthaelt aber die **0-Euro-Preis-IDs**. Die richtigen Preis-IDs (mit den echten Betraegen wie 38.99, 47.99 usw.) stehen in der Spalte `extern_link`.

### Daten-Uebersicht

| Produkt | stripe_price_id (0 EUR - FALSCH) | extern_link (RICHTIG) |
|---------|----------------------------------|----------------------|
| T-Shirt | price_1SxlelLnjPqrEfxxwdrSMrZ6 | price_1SvgcrLnjPqrEfxxgvConSYk |
| Poloshirt | price_1Sxmc6LnjPqrEfxxi2Hw0T5P | price_1SvgtgLnjPqrEfxxEneJQgW0 |
| Schlappen | price_1SxmacLnjPqrEfxxW060yeQC | price_1SvgwYLnjPqrEfxxldTsLr6R |
| Pullover | price_1SxmdgLnjPqrEfxxOBY3UmMN | price_1SvgvELnjPqrEfxx4N5BArSC |
| Ausweiskarte | price_1Sxmd1LnjPqrEfxxxEDDkR8S | price_1SvgZrLnjPqrEfxx9ByGa0UB |
| Scanner-Lizenz | price_1SxpvhLnjPqrEfxxdZVQTgLm | price_1SvhF0LnjPqrEfxxNZn53Ydt |
| Google Workspace | price_1SxpwOLnjPqrEfxxWYh27lg2 | price_1Svh1QLnjPqrEfxxhoLlUgo6 |

### Loesung

Ein einziger SQL-Befehl: Die `stripe_price_id`-Spalte mit den korrekten Werten aus `extern_link` ueberschreiben.

```
UPDATE thermocheck.contractor_produkte
SET stripe_price_id = extern_link
WHERE ist_aktiv = true;
```

### Warum kein Code-Change noetig ist

Die Edge Function `create-checkout-session` liest bereits `stripe_price_id` korrekt aus. Sobald die DB-Werte stimmen, werden automatisch die richtigen Preise an Stripe uebergeben. Kein Code muss geaendert werden.

### Risiko-Check

- Die alten 0-Euro-IDs gehen verloren (werden ueberschrieben) -- das ist gewuenscht
- `stripe_test_price_id` bleibt unberuehrt als Backup
- Alle 7 Produkte haben einen gueltigen `extern_link`-Wert

