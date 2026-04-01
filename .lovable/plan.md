

# Stripe Price ID Update: Hausschlappen

## Änderung
Eine SQL-Migration, die die `stripe_price_id` für das Produkt `schlappen` in `thermocheck.contractor_produkte` auf den neuen Wert `price_1THJ70LnjPqrEfxx1sQ3sHQH` aktualisiert.

## Technische Details

```sql
UPDATE thermocheck.contractor_produkte 
SET stripe_price_id = 'price_1THJ70LnjPqrEfxx1sQ3sHQH' 
WHERE produkt_key = 'schlappen';
```

Einzelne Migration, keine Code-Änderungen nötig.

