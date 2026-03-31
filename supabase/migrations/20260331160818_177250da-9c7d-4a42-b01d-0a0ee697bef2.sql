-- Fix Vincent Heth's tshirt order: first order has paid_at but status is "failed"
-- Stripe confirms payment succeeded (€38.99 on 2026-02-25 20:22)
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    stripe_payment_intent_id = 'pi_3T4oavLnjPqrEfxx1R5sET2D'
WHERE id = '844fb2b6-f481-4919-8173-16bdcb6fbf3c';

-- Remove duplicate pending tshirt order
DELETE FROM thermocheck.contractor_bestellungen
WHERE id = '332fcfe9-6df4-41bd-b738-f8c03f590c0b';