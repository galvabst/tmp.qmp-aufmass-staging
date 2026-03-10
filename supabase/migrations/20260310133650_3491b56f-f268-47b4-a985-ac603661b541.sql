-- Fix trigger to handle duplicate admin tasks (ON CONFLICT)
CREATE OR REPLACE FUNCTION thermocheck.on_bestellung_paid()
RETURNS TRIGGER AS $$
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
    )
    ON CONFLICT (contractor_id, task_key) DO UPDATE SET
      notiz = EXCLUDED.notiz,
      task_label = EXCLUDED.task_label;
    
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Now set the T-shirt order to paid
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now()
WHERE id = '9e929b79-7316-495f-8779-b289d1ac63ca';