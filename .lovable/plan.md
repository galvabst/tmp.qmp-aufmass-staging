

## Plan: Stripe Price ID für Scanner-Lizenz aktualisieren

### Aktueller Stand
- **Produkt:** Room Scanner Lizenz (`scanner-lizenz`)
- **Alte Price ID:** `price_1SvhF0LnjPqrEfxxNZn53Ydt`
- **Neue Price ID:** `price_1TENzJLnjPqrEfxxNOAqYggf`

### Änderung
Eine SQL-Migration, die `stripe_price_id` in `thermocheck.contractor_produkte` auf den neuen Wert setzt:

```sql
UPDATE thermocheck.contractor_produkte
SET stripe_price_id = 'price_1TENzJLnjPqrEfxxNOAqYggf'
WHERE produkt_key = 'scanner-lizenz';
```

Danach sende ich dir den Link zum SQL Editor zur Verifizierung.

