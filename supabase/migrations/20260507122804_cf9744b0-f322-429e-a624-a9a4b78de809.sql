
CREATE OR REPLACE FUNCTION thermocheck.enforce_bestellung_status_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = thermocheck, public
AS $$
DECLARE
  v_corrected boolean := false;
  v_old_status text := NEW.stripe_payment_status::text;
  v_reason text := NULL;
BEGIN
  -- Wenn eine PaymentIntent-ID gesetzt ist, darf der Status nicht failed sein
  IF NEW.stripe_payment_intent_id IS NOT NULL
     AND NEW.stripe_payment_status::text IN ('failed', 'pending') THEN
    NEW.stripe_payment_status := 'paid'::thermocheck.stripe_payment_status_enum;
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
    v_corrected := true;
    v_reason := 'has_payment_intent';
  END IF;

  -- Wenn paid_at gesetzt ist, darf der Status nicht failed/pending sein
  IF NEW.paid_at IS NOT NULL
     AND NEW.stripe_payment_status::text IN ('failed', 'pending') THEN
    NEW.stripe_payment_status := 'paid'::thermocheck.stripe_payment_status_enum;
    v_corrected := true;
    v_reason := COALESCE(v_reason, 'has_paid_at');
  END IF;

  IF v_corrected THEN
    BEGIN
      INSERT INTO thermocheck.contractor_audit_log (
        action_type, object_type, object_id, payload, actor_type, actor_name
      ) VALUES (
        'auto_corrected_by_trigger',
        'contractor_bestellung',
        NEW.id,
        jsonb_build_object(
          'old_status', v_old_status,
          'new_status', NEW.stripe_payment_status::text,
          'reason', v_reason,
          'payment_intent_id', NEW.stripe_payment_intent_id,
          'paid_at', NEW.paid_at
        ),
        'system',
        'status_consistency_trigger'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Audit-Log darf den Trigger nie blockieren
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bestellung_status_consistency ON thermocheck.contractor_bestellungen;

CREATE TRIGGER trg_bestellung_status_consistency
BEFORE INSERT OR UPDATE ON thermocheck.contractor_bestellungen
FOR EACH ROW
EXECUTE FUNCTION thermocheck.enforce_bestellung_status_consistency();
