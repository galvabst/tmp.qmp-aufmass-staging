

# Root Cause Fix: DB Trigger blockiert Zahlungsstatus-Update

## Problem-Analyse (verifiziert durch DB-Inspektion)

Der Webhook funktioniert korrekt und empfaengt das Stripe-Event. Aber beim UPDATE auf `contractor_bestellungen` (Zeile `stripe_payment_status = 'paid'`) feuert ein **BEFORE-Trigger** namens `trigger_bestellung_paid`, der die Funktion `thermocheck.on_bestellung_paid()` aufruft.

Diese Trigger-Funktion versucht, in `contractor_admin_tasks` zu schreiben - aber mit **falschen Spaltennamen**:

```text
Trigger schreibt:              Tabelle hat tatsaechlich:
--------------------------------------------------
titel                    -->   task_label
beschreibung             -->   (existiert nicht)
status                   -->   erledigt (boolean)
bestellung_details       -->   (existiert nicht)
NEW.groessen_info        -->   NEW.groesse
```

Da es ein BEFORE-Trigger ist, wird bei Fehler die **gesamte UPDATE-Transaktion zurueckgerollt**. Das bedeutet: Die Bestellung bleibt auf `pending`, obwohl Stripe die Zahlung bestaetigt hat.

**Beweis aus den Logs:**
- `[stripe-webhook] Error updating order: column "titel" of relation "contractor_admin_tasks" does not exist`
- DB zeigt: Beide Bestellungen (T-Shirt + Poloshirt) stehen noch auf `pending`, `paid_at = null`

## Loesung

### Schritt 1: Trigger-Funktion korrigieren (DB-Migration)

Die Funktion `thermocheck.on_bestellung_paid()` wird neu geschrieben mit den **korrekten Spaltennamen** der `contractor_admin_tasks`-Tabelle:

```sql
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
```

### Schritt 2: Bestehende pending-Bestellungen auf "paid" setzen (Daten-Migration)

Die T-Shirt-Bestellung (`cs_live_a1Livloc1Ctu2SOWQLpPHR50QkLft3unclkRpviXy0yDGoxYil7kurqaTg`) wurde tatsaechlich bei Stripe bezahlt, aber der DB-Status haengt auf `pending`. Nach dem Trigger-Fix wird diese manuell korrigiert:

```sql
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = '2026-02-06T10:25:03Z',
    webhook_received_at = now()
WHERE stripe_session_id = 'cs_live_a1Livloc1Ctu2SOWQLpPHR50QkLft3unclkRpviXy0yDGoxYil7kurqaTg'
  AND stripe_payment_status = 'pending';
```

### Schritt 3: Keine Code-Aenderungen noetig

Der Webhook-Code (`stripe-webhook/index.ts`) ist korrekt. Das Polling in `OnboardingScreen.tsx` ist ebenfalls bereits implementiert. Das einzige Problem war der defekte DB-Trigger.

## Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| DB-Migration | Trigger-Funktion `on_bestellung_paid()` korrigieren |
| DB-Migration | Bezahlte T-Shirt-Bestellung auf "paid" setzen |

Kein Frontend- oder Edge-Function-Code wird geaendert.

## Erwartetes Ergebnis nach Fix

1. Webhook empfaengt `checkout.session.completed`
2. UPDATE auf `contractor_bestellungen` setzt Status auf `paid`
3. Trigger erstellt korrekten Admin-Task in `contractor_admin_tasks`
4. Transaktion committed erfolgreich
5. Frontend-Polling erkennt `paid` -> UI springt zum naechsten Produkt

## Validierung

- T-Shirt-Bestellung wird sofort als "paid" erkannt (Daten-Migration)
- Naechster Checkout (Poloshirt/Schlappen) wird den korrekten Trigger durchlaufen
- Admin-Tasks werden korrekt mit `task_label` und `notiz` angelegt

