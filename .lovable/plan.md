

# Florian Striebe: scanner-lizenz auf paid setzen

## Aktion
Ein einzelnes UPDATE auf `thermocheck.contractor_bestellungen`:

```sql
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now()
WHERE id = '9a500253-73d0-4596-91d1-58f04dc382e8'
  AND produkt_key = 'scanner-lizenz'
  AND stripe_payment_status = 'pending';
```

## Umsetzung
- Supabase Insert-Tool verwenden (Daten-Update, keine Schema-Änderung)
- Danach per SELECT verifizieren, dass der Status korrekt gesetzt wurde

## Auswirkung
- Florians Onboarding-Ansicht zeigt die Scanner-Lizenz sofort als bezahlt
- Admin-Dashboard zeigt keine fehlende Lizenz mehr an

