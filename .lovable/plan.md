

# T-Shirt Test-Preis (0 EUR) temporaer setzen

## Aenderung

Ein einfaches SQL-Update in der Datenbank: Die `stripe_price_id` des T-Shirt-Produkts wird auf den kostenlosen Test-Preis geaendert.

```sql
UPDATE thermocheck.contractor_produkte
SET stripe_price_id = 'price_1SxlelLnjPqrEfxxwdrSMrZ6'
WHERE produkt_key = 'tshirt';
```

## Was sich aendert

- Beim Klick auf "Jetzt bestellen" fuer das T-Shirt wird die Stripe Checkout Session mit dem 0-EUR-Preis erstellt
- Der gesamte Flow (Checkout, Webhook, Bestellstatus-Update) wird identisch durchlaufen - nur eben kostenlos
- Kein Code wird geaendert, nur ein DB-Wert

## Spaeter zuruecksetzen

Wenn der Test abgeschlossen ist, wird der originale Stripe Price-ID (`price_1SvgcrLnjPqrEfxxgvConSYk`) wieder eingesetzt:

```sql
UPDATE thermocheck.contractor_produkte
SET stripe_price_id = 'price_1SvgcrLnjPqrEfxxgvConSYk'
WHERE produkt_key = 'tshirt';
```

## Betroffene Dateien

Keine Code-Aenderungen noetig - nur eine Datenbank-Migration.

