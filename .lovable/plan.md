
# Webhook-Zuverlaessigkeit absichern

## Problem

Die Edge Function `stripe-webhook` war nicht synchron mit dem Repo-Code deployed. Dadurch hat eine aeltere Version die Ausweiskarte-Zahlung nicht korrekt verarbeitet. Das darf nie wieder passieren.

## Massnahmen

### 1. Sofort: Webhook redeployen + Ausweiskarte fixen

- Edge Function `stripe-webhook` neu deployen (Code ist korrekt, nur nicht live)
- Ausweiskarte-Bestellung manuell auf `paid` setzen (SQL im Supabase Dashboard)

### 2. Webhook-Code absichern: Besseres Logging + Error Recovery

Erweiterungen am `stripe-webhook/index.ts`:

- **Versionskennung**: Eine Konstante `WEBHOOK_VERSION` in die Response einbauen, damit man in Stripe sofort sieht welche Code-Version deployed ist
- **Fallback-Logging**: Wenn die Bestellung nicht gefunden wird, explizite Warnung mit allen relevanten Daten loggen

Konkret:

```text
Response vorher:  { received: true, event_type: "checkout.session.completed" }
Response nachher: { received: true, event_type: "checkout.session.completed", version: "2024-02-06-v2", order_updated: true }
```

So siehst du in Stripe auf einen Blick:
- Welche Version laeuft (`version`)
- Ob die Bestellung gefunden und aktualisiert wurde (`order_updated`)
- Den Event-Type (`event_type`)

### 3. Kein Code-Change am Frontend

Keine Aenderungen noetig.

## Technische Details

### Edge Function Aenderungen (`stripe-webhook/index.ts`)

1. **Versionsstring** als Konstante am Anfang der Datei:
   ```text
   const WEBHOOK_VERSION = "2026-02-06-v2";
   ```

2. **Tracking-Variable** `orderUpdated` die mitlaeuft ob die DB-Operation erfolgreich war

3. **Erweiterte Response** am Ende:
   ```text
   { received: true, event_type: event.type, version: WEBHOOK_VERSION, order_updated: orderUpdated }
   ```

4. **Keine strukturellen Aenderungen** an der Webhook-Logik selbst -- die ist korrekt

### SQL fuer Ausweiskarte-Fix (manuell im Dashboard)

```sql
UPDATE thermocheck.contractor_bestellungen
SET stripe_payment_status = 'paid',
    paid_at = now(),
    webhook_received_at = now()
WHERE produkt_key = 'ausweiskarte'
  AND stripe_session_id = 'cs_live_a1oaUvGnDsTwYM3Jh793diS1oin79vbGKal3LyAtMStH6BtV01WTX9qbRk'
  AND stripe_payment_status = 'pending';
```

## Zusammenfassung

| Aktion | Was | Warum |
|--------|-----|-------|
| Redeploy | `stripe-webhook` neu deployen | Sicherstellen dass aktueller Code live ist |
| DB-Fix | Ausweiskarte auf `paid` setzen | Zahlung war bei Stripe erfolgreich |
| Code | Versionskennung + `order_updated` Flag | Sofort sichtbar welche Version laeuft und ob DB-Update geklappt hat |
