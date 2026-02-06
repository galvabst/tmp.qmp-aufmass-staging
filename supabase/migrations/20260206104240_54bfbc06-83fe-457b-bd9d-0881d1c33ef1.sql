
-- Schritt 1: Trigger-Funktion mit korrekten Spaltennamen neu erstellen
CREATE OR REPLACE FUNCTION thermocheck.on_bestellung_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'thermocheck'
AS $$
DECLARE
  v_task_label text;
BEGIN
  IF NEW.stripe_payment_status = 'paid' 
     AND (OLD.stripe_payment_status IS NULL OR OLD.stripe_payment_status != 'paid') THEN
    
    CASE NEW.produkt_typ
      WHEN 'kleidung' THEN v_task_label := 'Kleidung versenden: ' || NEW.produkt_key;
      WHEN 'lizenz' THEN v_task_label := 'Lizenz einrichten: ' || NEW.produkt_key;
      WHEN 'coaching' THEN v_task_label := 'Coaching koordinieren';
      ELSE v_task_label := 'Bestellung: ' || NEW.produkt_key;
    END CASE;
    
    INSERT INTO thermocheck.contractor_admin_tasks (
      contractor_id,
      task_key,
      task_label,
      notiz,
      erledigt,
      reihenfolge
    ) VALUES (
      NEW.onboarding_id,
      'bestellung_' || NEW.produkt_key,
      v_task_label,
      'Bezahlt am ' || to_char(COALESCE(NEW.paid_at, now()), 'DD.MM.YYYY HH24:MI')
        || CASE WHEN NEW.groesse IS NOT NULL THEN ' | Groesse: ' || NEW.groesse ELSE '' END,
      false,
      0
    );
    
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Schritt 2: Bezahlte T-Shirt-Bestellung reparieren (Stripe hat bezahlt, DB hängt auf pending)
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = '2026-02-06T10:25:03Z',
    webhook_received_at = now()
WHERE stripe_session_id = 'cs_live_a1Livloc1Ctu2SOWQLpPHR50QkLft3unclkRpviXy0yDGoxYil7kurqaTg'
  AND stripe_payment_status = 'pending';
